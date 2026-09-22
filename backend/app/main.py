import uuid
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .config import get_settings
from .database import Property, User, get_db, init_db, utcnow
from .schemas import (
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

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.get("/api")
def api_root():
    return {"message": "Welcome to Landfello API", "status": "running"}


@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
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
    if not photo.startswith("data:image/") and not photo.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid image data")
    # Cap base64 payloads (~4MB decoded)
    if photo.startswith("data:image/") and len(photo) > 6_000_000:
        raise HTTPException(status_code=400, detail="Image is too large (max ~4MB)")
    user.photo_url = photo
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_out(user)


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
        images=payload.images or [],
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
    prop.images = payload.images or []
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
