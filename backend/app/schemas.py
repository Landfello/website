from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


AccountType = Literal["investor", "agent"]
ListingType = Literal["sale", "rent"]
PropertyType = Literal["Residential", "Commercial", "Agricultural", "Mixed Use"]
PropertyCategory = Literal["Land", "House"]
Tenure = Literal["Freehold", "Leasehold"]
LeaseTerm = Literal["Short-term", "Long-term", "Flexible"]


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    accountType: AccountType
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phoneNumber: Optional[str] = None
    licenseNumber: Optional[str] = None
    companyName: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    accountType: AccountType
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phoneNumber: Optional[str] = None
    licenseNumber: Optional[str] = None
    companyName: Optional[str] = None
    photoURL: Optional[str] = None


class UserOut(BaseModel):
    uid: str
    email: str
    photoURL: Optional[str] = None
    profile: UserProfile


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class PropertyIn(BaseModel):
    listingType: ListingType = "sale"
    title: str
    description: str = ""
    country: str
    city: str
    neighborhood: Optional[str] = None
    propertyType: PropertyType = "Residential"
    category: PropertyCategory = "Land"
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    areaAcres: float
    tenure: Optional[Tenure] = "Freehold"
    leaseTerm: Optional[LeaseTerm] = None
    price: Optional[float] = None
    monthlyRent: Optional[float] = None
    tags: List[str] = []
    images: List[str] = []
    contactName: str
    contactPhone: str
    contactEmail: EmailStr
    verified: Optional[bool] = True
    daysOnMarket: Optional[int] = 0


class PropertyOut(BaseModel):
    propertyID: str
    userId: str
    listingType: ListingType
    title: str
    description: str
    country: str
    city: str
    neighborhood: Optional[str] = None
    propertyType: str
    category: str = "Land"
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    areaAcres: float
    tenure: Optional[str] = None
    leaseTerm: Optional[str] = None
    price: Optional[float] = None
    monthlyRent: Optional[float] = None
    tags: List[str] = []
    images: List[str] = []
    contactName: str
    contactPhone: str
    contactEmail: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    verified: bool = True
    daysOnMarket: Optional[int] = 0
    status: str = "available"
    agentName: Optional[str] = None
    agentCompany: Optional[str] = None


class PhotoUpdateRequest(BaseModel):
    photoURL: str = Field(min_length=1)


class PaymentInitRequest(BaseModel):
    propertyId: str


class PaymentInitResponse(BaseModel):
    reference: str
    authorizationUrl: str
    accessCode: Optional[str] = None
    publicKey: Optional[str] = None
    amountLocal: float
    currency: str
    email: str
    mock: bool = False


class PaymentVerifyResponse(BaseModel):
    status: str
    reference: str
    propertyId: str
    amountUsd: float
    message: str


class PurchaseOut(BaseModel):
    id: str
    propertyId: str
    propertyTitle: str
    amountUsd: float
    amountLocal: float
    currency: str
    reference: str
    status: str
    paidAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None


def property_to_out(prop: Any, agent: Any = None) -> PropertyOut:
    agent_name = None
    agent_company = None
    if agent:
        parts = [agent.first_name or "", agent.last_name or ""]
        agent_name = " ".join(p for p in parts if p).strip() or None
        agent_company = agent.company_name

    return PropertyOut(
        propertyID=prop.property_id,
        userId=prop.user_id,
        listingType=prop.listing_type,
        title=prop.title,
        description=prop.description or "",
        country=prop.country,
        city=prop.city,
        neighborhood=prop.neighborhood,
        propertyType=prop.property_type,
        category=getattr(prop, "category", None) or "Land",
        bedrooms=getattr(prop, "bedrooms", None),
        bathrooms=getattr(prop, "bathrooms", None),
        areaAcres=prop.area_acres,
        tenure=prop.tenure,
        leaseTerm=prop.lease_term,
        price=prop.price,
        monthlyRent=prop.monthly_rent,
        tags=prop.tags or [],
        images=prop.images or [],
        contactName=prop.contact_name,
        contactPhone=prop.contact_phone,
        contactEmail=prop.contact_email,
        createdAt=prop.created_at,
        updatedAt=prop.updated_at,
        verified=bool(prop.verified),
        daysOnMarket=prop.days_on_market or 0,
        status=prop.status or "available",
        agentName=agent_name,
        agentCompany=agent_company,
    )


def user_to_out(user: Any) -> UserOut:
    return UserOut(
        uid=user.id,
        email=user.email,
        photoURL=user.photo_url,
        profile=UserProfile(
            accountType=user.account_type,
            firstName=user.first_name,
            lastName=user.last_name,
            phoneNumber=user.phone_number,
            licenseNumber=user.license_number,
            companyName=user.company_name,
            photoURL=user.photo_url,
        ),
    )
