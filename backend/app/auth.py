from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Optional

import httpx
import jwt as pyjwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .config import get_settings
from .database import User, get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)
settings = get_settings()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, extra: Optional[dict[str, Any]] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra:
        payload.update(extra)
    return pyjwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


@lru_cache
def _supabase_jwks_client() -> PyJWKClient | None:
    url = (getattr(settings, "supabase_url", "") or "").strip().rstrip("/")
    if not url:
        return None
    return PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json", cache_keys=True)


def _claims_from_supabase_user_api(token: str) -> dict[str, Any]:
    """Validate the access token via Supabase Auth when local JWT verify fails."""
    base = (getattr(settings, "supabase_url", "") or "").strip().rstrip("/")
    anon = (getattr(settings, "supabase_anon_key", "") or "").strip()
    if not base or not anon:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    try:
        resp = httpx.get(
            f"{base}/auth/v1/user",
            headers={
                "apikey": anon,
                "Authorization": f"Bearer {token}",
            },
            timeout=15,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    body = resp.json()
    user_id = body.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return {
        "sub": user_id,
        "email": body.get("email") or "",
        "role": "authenticated",
        "aud": "authenticated",
        "user_metadata": body.get("user_metadata") or {},
        "app_metadata": body.get("app_metadata") or {},
    }


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Accept:
    - Supabase user JWTs signed with ES256 (JWKS) or legacy HS256 JWT secret
    - Local API tokens signed with SECRET_KEY (tests / offline)
    """
    supabase_secret = (getattr(settings, "supabase_jwt_secret", "") or "").strip()
    supabase_url = (getattr(settings, "supabase_url", "") or "").strip().rstrip("/")
    errors: list[Exception] = []

    try:
        header = pyjwt.get_unverified_header(token)
    except pyjwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    alg = header.get("alg") or ALGORITHM

    # Newer Supabase projects sign user access tokens with asymmetric keys (ES256).
    if supabase_url and alg != "HS256":
        try:
            client = _supabase_jwks_client()
            if client is not None:
                key = client.get_signing_key_from_jwt(token)
                return pyjwt.decode(
                    token,
                    key.key,
                    algorithms=[alg],
                    audience="authenticated",
                    issuer=f"{supabase_url}/auth/v1",
                )
        except Exception as exc:  # noqa: BLE001 - try next verifier
            errors.append(exc)

    if supabase_secret:
        try:
            return pyjwt.decode(
                token,
                supabase_secret,
                algorithms=[ALGORITHM],
                audience="authenticated",
            )
        except pyjwt.PyJWTError as exc:
            errors.append(exc)

    try:
        return pyjwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except pyjwt.PyJWTError as exc:
        errors.append(exc)

    # Last resort: ask Supabase Auth whether this bearer token is still valid.
    if supabase_url:
        try:
            return _claims_from_supabase_user_api(token)
        except HTTPException:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    ) from (errors[-1] if errors else None)


def ensure_user_from_claims(db: Session, payload: dict[str, Any]) -> User:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    meta = payload.get("user_metadata") or {}
    email = (payload.get("email") or meta.get("email") or "").lower()

    if not user and email:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email:
            user = by_email

    if user:
        # Keep Google profile details fresh when missing locally.
        photo = meta.get("avatar_url") or meta.get("picture")
        if photo and not user.photo_url:
            user.photo_url = photo
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    account_type = meta.get("account_type") or "investor"
    if account_type not in ("investor", "agent"):
        account_type = "investor"
    full_name = meta.get("full_name") or meta.get("name") or ""
    parts = [p for p in full_name.split(" ") if p]
    chosen = bool(meta.get("account_type_chosen")) or bool(meta.get("account_type"))

    user = User(
        id=str(user_id),
        email=email or f"{user_id}@users.landfello.local",
        hashed_password=None,
        account_type=account_type,
        account_type_chosen=chosen,
        first_name=meta.get("first_name") or (parts[0] if parts else None),
        last_name=meta.get("last_name") or (parts[1] if len(parts) > 1 else None),
        phone_number=meta.get("phone_number"),
        photo_url=meta.get("avatar_url") or meta.get("picture"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = decode_access_token(credentials.credentials)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if (getattr(settings, "supabase_jwt_secret", "") or "").strip() or (
        getattr(settings, "supabase_url", "") or ""
    ).strip():
        return ensure_user_from_claims(db, payload)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_agent(user: User = Depends(get_current_user)) -> User:
    if user.account_type != "agent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agent account required")
    return user
