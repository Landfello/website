from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
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
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Supabase Auth JWTs when configured, otherwise local API tokens (tests and local dev)."""
    supabase_secret = getattr(settings, "supabase_jwt_secret", "") or ""
    try:
        if supabase_secret:
            return jwt.decode(
                token,
                supabase_secret,
                algorithms=[ALGORITHM],
                audience="authenticated",
            )
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def ensure_user_from_claims(db: Session, payload: dict[str, Any]) -> User:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user

    email = (payload.get("email") or "").lower()
    if email:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email:
            return by_email

    meta = payload.get("user_metadata") or {}
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = decode_access_token(credentials.credentials)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if getattr(settings, "supabase_jwt_secret", ""):
        return ensure_user_from_claims(db, payload)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_agent(user: User = Depends(get_current_user)) -> User:
    if user.account_type != "agent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agent account required")
    return user
