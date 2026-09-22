import uuid

from sqlalchemy.orm import Session

from .auth import hash_password
from .database import Property, User


SEED_AGENT_EMAIL = "agent@landfello.example"
SEED_BUYER_EMAIL = "buyer@landfello.example"
SEED_PASSWORD = "password123"


def seed_demo_data(db: Session) -> None:
    agent = db.query(User).filter(User.email == SEED_AGENT_EMAIL).first()
    if not agent:
        agent = User(
            id=str(uuid.uuid4()),
            email=SEED_AGENT_EMAIL,
            hashed_password=hash_password(SEED_PASSWORD),
            account_type="agent",
            first_name="Ama",
            last_name="Mensah",
            phone_number="+233200000001",
            license_number="GH-RE-2048",
            company_name="Savanna Lands Realty",
        )
        db.add(agent)
        db.flush()

    buyer = db.query(User).filter(User.email == SEED_BUYER_EMAIL).first()
    if not buyer:
        buyer = User(
            id=str(uuid.uuid4()),
            email=SEED_BUYER_EMAIL,
            hashed_password=hash_password(SEED_PASSWORD),
            account_type="investor",
            first_name="Kwame",
            last_name="Owusu",
            phone_number="+233200000002",
        )
        db.add(buyer)

    existing = db.query(Property).count()
    if existing == 0:
        listings = [
            {
                "title": "Beachfront Parcel — 0.9 acres",
                "description": "Verified freehold plot with ocean views and road access near Cape Coast.",
                "country": "Ghana",
                "city": "Cape Coast",
                "neighborhood": "Ola",
                "property_type": "Residential",
                "category": "Land",
                "area_acres": 0.9,
                "price": 52000,
                "tags": ["Ocean view", "Road access", "Verified title"],
                "images": [
                    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80"
                ],
            },
            {
                "title": "Agricultural Block — 12 acres",
                "description": "Fertile farmland with borehole access, ideal for cash crops.",
                "country": "Nigeria",
                "city": "Ibadan",
                "neighborhood": "Moniya",
                "property_type": "Agricultural",
                "category": "Land",
                "area_acres": 12,
                "price": 38000,
                "tags": ["Borehole", "Farm ready"],
                "images": [
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80"
                ],
            },
            {
                "title": "Commercial Corner Lot — 0.4 acres",
                "description": "Prime commercial land near a growing business corridor.",
                "country": "Kenya",
                "city": "Nairobi",
                "neighborhood": "Ruiru",
                "property_type": "Commercial",
                "category": "Land",
                "area_acres": 0.4,
                "price": 95000,
                "tags": ["Corner lot", "High traffic"],
                "images": [
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
                ],
            },
            {
                "title": "4-Bed Family House in Accra",
                "description": "Spacious family home with modern finishes and gated compound.",
                "country": "Ghana",
                "city": "Accra",
                "neighborhood": "East Legon",
                "property_type": "Residential",
                "category": "House",
                "bedrooms": 4,
                "bathrooms": 3,
                "area_acres": 0.25,
                "price": 185000,
                "tags": ["Gated", "Parking"],
                "images": [
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80"
                ],
            },
        ]
        for i, item in enumerate(listings):
            db.add(
                Property(
                    property_id=f"seed-{i+1}",
                    user_id=agent.id,
                    listing_type="sale",
                    title=item["title"],
                    description=item["description"],
                    country=item["country"],
                    city=item["city"],
                    neighborhood=item["neighborhood"],
                    property_type=item["property_type"],
                    category=item.get("category", "Land"),
                    bedrooms=item.get("bedrooms"),
                    bathrooms=item.get("bathrooms"),
                    area_acres=item["area_acres"],
                    tenure="Freehold",
                    price=item["price"],
                    tags=item["tags"],
                    images=item["images"],
                    contact_name="Ama Mensah",
                    contact_phone="+233200000001",
                    contact_email=SEED_AGENT_EMAIL,
                    verified=True,
                    days_on_market=3 + i,
                    status="available",
                )
            )

    db.commit()
