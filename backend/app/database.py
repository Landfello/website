from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from .config import get_settings


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    account_type = Column(String, nullable=False, default="investor")  # investor | agent
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    properties = relationship("Property", back_populates="owner")
    purchases = relationship("Purchase", back_populates="buyer")


class Property(Base):
    __tablename__ = "properties"

    property_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    listing_type = Column(String, nullable=False, default="sale")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False, default="")
    country = Column(String, nullable=False)
    city = Column(String, nullable=False)
    neighborhood = Column(String, nullable=True)
    property_type = Column(String, nullable=False, default="Residential")  # user purpose
    category = Column(String, nullable=False, default="Land")  # Land | House
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area_acres = Column(Float, nullable=False, default=0)
    tenure = Column(String, nullable=True, default="Freehold")
    lease_term = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    monthly_rent = Column(Float, nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    images = Column(JSON, nullable=False, default=list)
    contact_name = Column(String, nullable=False, default="")
    contact_phone = Column(String, nullable=False, default="")
    contact_email = Column(String, nullable=False, default="")
    verified = Column(Boolean, default=True)
    days_on_market = Column(Integer, default=0)
    status = Column(String, nullable=False, default="available")  # available | sold | reserved
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="properties")
    purchases = relationship("Purchase", back_populates="property")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(String, primary_key=True, index=True)
    property_id = Column(String, ForeignKey("properties.property_id"), nullable=False, index=True)
    buyer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount_usd = Column(Float, nullable=False)
    amount_local = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="NGN")
    reference = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, nullable=False, default="pending")  # pending | success | failed
    paystack_access_code = Column(String, nullable=True)
    authorization_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    paid_at = Column(DateTime, nullable=True)

    property = relationship("Property", back_populates="purchases")
    buyer = relationship("User", back_populates="purchases")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_sqlite_columns() -> None:
    """Add new columns on existing SQLite databases (create_all does not alter)."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(properties)").fetchall()
        existing = {row[1] for row in rows}
        alterations = [
            ("category", "ALTER TABLE properties ADD COLUMN category VARCHAR DEFAULT 'Land'"),
            ("bedrooms", "ALTER TABLE properties ADD COLUMN bedrooms INTEGER"),
            ("bathrooms", "ALTER TABLE properties ADD COLUMN bathrooms INTEGER"),
        ]
        for name, sql in alterations:
            if name not in existing:
                conn.exec_driver_sql(sql)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()
