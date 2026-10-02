import uuid
from typing import Optional

import httpx
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .auth import create_access_token, ensure_user_from_claims, get_current_user, hash_password, verify_password
from .config import get_settings
from .database import Property, User, get_db, init_db, utcnow
from .schemas import (
    AccountTypeRequest,
    AuthResponse,
    LoginRequest,
    PhotoUpdateRequest,
    PropertyIn,
    PropertyOut,
    SignupRequest,
    UserOut,
    property_to_out,
    user_to_out,
)
from .seed import seed_demo_data
from .storage import new_object_key, upload_bytes

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _checked_images(images: list[str]) -> list[str]:
    for image in images:
        if not image:
            continue
        if image.startswith("data:"):
            raise HTTPException(
                status_code=400,
                detail="Upload images first. Data URLs are not stored.",
            )
        if not image.startswith("http://") and not image.startswith("https://"):
            raise HTTPException(status_code=400, detail="Images must be https URLs")
    return images


def _supabase_headers() -> dict[str, str]:
    if not settings.supabase_anon_key:
        raise HTTPException(status_code=500, detail="SUPABASE_ANON_KEY is required")
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
        "Content-Type": "application/json",
    }


def _supabase_error(resp: httpx.Response) -> str:
    try:
        body = resp.json()
    except Exception:
        return "Authentication failed"
    if isinstance(body, dict):
        return (
            body.get("msg")
            or body.get("error_description")
            or body.get("message")
            or body.get("error")
            or "Authentication failed"
        )
    return "Authentication failed"


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    if not settings.database_url.startswith("sqlite"):
        return
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api")
def api_root():
    return {"message": "Welcome to Landfello API", "status": "running"}


@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if settings.uses_supabase_auth:
        resp = httpx.post(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/signup",
            headers=_supabase_headers(),
            json={
                "email": payload.email.lower(),
                "password": payload.password,
                "data": {
                    "account_type": payload.accountType,
                    "account_type_chosen": True,
                    "first_name": payload.firstName,
                    "last_name": payload.lastName,
                    "phone_number": payload.phoneNumber,
                },
            },
            timeout=20,
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=400, detail=_supabase_error(resp))
        body = resp.json()
        token = body.get("access_token")
        auth_user = body.get("user") or {}
        if not token or not auth_user.get("id"):
            raise HTTPException(status_code=400, detail="Confirm your email, then sign in.")
        user = ensure_user_from_claims(
            db,
            {
                "sub": auth_user["id"],
                "email": payload.email.lower(),
                "user_metadata": auth_user.get("user_metadata") or {},
            },
        )
        user.account_type = payload.accountType
        user.account_type_chosen = True
        user.first_name = payload.firstName
        user.last_name = payload.lastName
        user.phone_number = payload.phoneNumber
        if payload.accountType == "agent":
            user.license_number = payload.licenseNumber or payload.companyName or "pending"
            user.company_name = payload.companyName
        db.add(user)
        db.commit()
        db.refresh(user)
        return AuthResponse(token=token, user=user_to_out(user))

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    license_number = payload.licenseNumber
    if payload.accountType == "agent" and not license_number:
        license_number = payload.companyName or "pending"

    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        account_type=payload.accountType,
        account_type_chosen=True,
        first_name=payload.firstName,
        last_name=payload.lastName,
        phone_number=payload.phoneNumber,
        license_number=license_number if payload.accountType == "agent" else None,
        company_name=payload.companyName if payload.accountType == "agent" else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, {"accountType": user.account_type, "email": user.email})
    return AuthResponse(token=token, user=user_to_out(user))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    if settings.uses_supabase_auth:
        resp = httpx.post(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password",
            headers=_supabase_headers(),
            json={"email": payload.email.lower(), "password": payload.password},
            timeout=20,
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        body = resp.json()
        token = body.get("access_token")
        auth_user = body.get("user") or {}
        if not token or not auth_user.get("id"):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user = ensure_user_from_claims(
            db,
            {
                "sub": auth_user["id"],
                "email": payload.email.lower(),
                "user_metadata": auth_user.get("user_metadata") or {},
            },
        )
        return AuthResponse(token=token, user=user_to_out(user))

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, {"accountType": user.account_type, "email": user.email})
    return AuthResponse(token=token, user=user_to_out(user))


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user_to_out(user)


@app.put("/api/auth/photo", response_model=UserOut)
def update_photo(
    payload: PhotoUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = payload.photoURL.strip()
    if not photo.startswith("https://") and not photo.startswith("http://"):
        raise HTTPException(status_code=400, detail="Profile photo must be an uploaded image URL")
    user.photo_url = photo
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_out(user)


@app.put("/api/auth/account-type", response_model=UserOut)
def set_account_type(
    payload: AccountTypeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.account_type = payload.accountType
    user.account_type_chosen = True
    db.add(user)
    db.commit()
    db.refresh(user)

    if settings.supabase_url and settings.supabase_service_role_key:
        httpx.put(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user.id}",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
            },
            json={
                "user_metadata": {
                    "account_type": payload.accountType,
                    "account_type_chosen": True,
                }
            },
            timeout=20,
        )
    return user_to_out(user)


@app.post("/api/uploads")
async def upload_images(
    files: list[UploadFile] = File(...),
    user: User = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="Choose at least one image")
    urls: list[str] = []
    for upload in files:
        content_type = upload.content_type or ""
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"{upload.filename or 'File'} is not an image")
        data = await upload.read()
        if len(data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Each image must be 5MB or smaller")
        key = new_object_key(f"uploads/{user.id}", content_type, upload.filename)
        urls.append(upload_bytes(key, data, content_type))
    return {"urls": urls}


@app.get("/api/properties", response_model=list[PropertyOut])
def list_properties(
    country: Optional[str] = None,
    propertyType: Optional[str] = None,
    category: Optional[str] = None,
    listingType: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    minBedrooms: Optional[int] = None,
    minBathrooms: Optional[int] = None,
    status: Optional[str] = Query(default="available"),
    db: Session = Depends(get_db),
):
    q = db.query(Property)
    if status:
        q = q.filter(Property.status == status)
    if country:
        q = q.filter(Property.country.ilike(country))
    if propertyType:
        q = q.filter(Property.property_type == propertyType)
    if category:
        q = q.filter(Property.category == category)
    # Sale-only marketplace: ignore rent listings
    if listingType == "rent":
        return []
    q = q.filter(Property.listing_type == "sale")
    if minPrice is not None:
        q = q.filter(Property.price >= minPrice)
    if maxPrice is not None:
        q = q.filter(Property.price <= maxPrice)
    if minBedrooms is not None:
        q = q.filter(Property.bedrooms >= minBedrooms)
    if minBathrooms is not None:
        q = q.filter(Property.bathrooms >= minBathrooms)

    props = q.order_by(Property.created_at.desc()).all()
    results = []
    for prop in props:
        agent = db.query(User).filter(User.id == prop.user_id).first()
        results.append(property_to_out(prop, agent))
    return results


@app.post("/api/properties", response_model=PropertyOut, status_code=201)
def create_property(
    payload: PropertyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.account_type not in ("agent", "investor"):
        raise HTTPException(status_code=403, detail="Sign in to list land for sale")

    prop = Property(
        property_id=str(uuid.uuid4()),
        user_id=user.id,
        listing_type="sale",
        title=payload.title,
        description=payload.description,
        country=payload.country,
        city=payload.city,
        neighborhood=payload.neighborhood,
        property_type=payload.propertyType,
        category=payload.category or "Land",
        bedrooms=payload.bedrooms if payload.category == "House" else None,
        bathrooms=payload.bathrooms if payload.category == "House" else None,
        area_acres=payload.areaAcres,
        tenure=payload.tenure,
        lease_term=payload.leaseTerm,
        price=payload.price,
        monthly_rent=None,
        tags=payload.tags or [],
        images=_checked_images(payload.images or []),
        contact_name=payload.contactName,
        contact_phone=payload.contactPhone,
        contact_email=str(payload.contactEmail),
        verified=True if payload.verified is None else payload.verified,
        days_on_market=payload.daysOnMarket or 0,
        status="available",
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return property_to_out(prop, user)


@app.get("/api/properties/user/{user_id}", response_model=list[PropertyOut])
def user_properties(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource")
    props = db.query(Property).filter(Property.user_id == user_id).order_by(Property.created_at.desc()).all()
    return [property_to_out(p, user) for p in props]


@app.get("/api/properties/{property_id}", response_model=PropertyOut)
def get_property(property_id: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.property_id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    agent = db.query(User).filter(User.id == prop.user_id).first()
    return property_to_out(prop, agent)


@app.put("/api/properties/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: str,
    payload: PropertyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.property_id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this property")

    prop.listing_type = "sale"
    prop.title = payload.title
    prop.description = payload.description
    prop.country = payload.country
    prop.city = payload.city
    prop.neighborhood = payload.neighborhood
    prop.property_type = payload.propertyType
    prop.category = payload.category or "Land"
    prop.bedrooms = payload.bedrooms if payload.category == "House" else None
    prop.bathrooms = payload.bathrooms if payload.category == "House" else None
    prop.area_acres = payload.areaAcres
    prop.tenure = payload.tenure
    prop.lease_term = payload.leaseTerm
    prop.price = payload.price
    prop.monthly_rent = None
    prop.tags = payload.tags or []
    prop.images = _checked_images(payload.images or [])
    prop.contact_name = payload.contactName
    prop.contact_phone = payload.contactPhone
    prop.contact_email = str(payload.contactEmail)
    prop.updated_at = utcnow()
    db.commit()
    db.refresh(prop)
    return property_to_out(prop, user)


@app.delete("/api/properties/{property_id}", status_code=204)
def delete_property(
    property_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.property_id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this property")
    db.delete(prop)
    db.commit()
    return None
