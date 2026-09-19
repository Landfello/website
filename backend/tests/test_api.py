import os
import sys

# Must set env before importing app modules (engine binds at import time)
os.environ["DATABASE_URL"] = "sqlite:///./test_landfello.db"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["PAYSTACK_SECRET_KEY"] = ""
os.environ["PAYSTACK_PUBLIC_KEY"] = ""

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.seed import SEED_AGENT_EMAIL, SEED_BUYER_EMAIL, SEED_PASSWORD, seed_demo_data


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def auth_headers(client: TestClient, email: str, password: str = SEED_PASSWORD):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_list_seeded_properties(client):
    resp = client.get("/api/properties")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 3
    assert all(p["status"] == "available" for p in data)


def test_agent_can_create_listing(client):
    headers = auth_headers(client, SEED_AGENT_EMAIL)
    payload = {
        "listingType": "sale",
        "title": "Test Plot — 2 acres",
        "description": "Test listing",
        "country": "Ghana",
        "city": "Accra",
        "neighborhood": "East Legon",
        "propertyType": "Residential",
        "areaAcres": 2,
        "tenure": "Freehold",
        "price": 25000,
        "tags": ["Test"],
        "images": [
            "https://example.com/land.jpg",
            "https://example.com/land-2.jpg",
        ],
        "contactName": "Ama Mensah",
        "contactPhone": "+233200000001",
        "contactEmail": SEED_AGENT_EMAIL,
    }
    resp = client.post("/api/properties", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["title"] == payload["title"]
    assert body["status"] == "available"


def test_create_listing_requires_two_images(client):
    headers = auth_headers(client, SEED_AGENT_EMAIL)
    payload = {
        "listingType": "sale",
        "title": "Needs more photos",
        "description": "Test listing",
        "country": "Ghana",
        "city": "Accra",
        "propertyType": "Residential",
        "areaAcres": 2,
        "tenure": "Freehold",
        "price": 25000,
        "tags": ["Test"],
        "images": ["https://example.com/land.jpg"],
        "contactName": "Ama Mensah",
        "contactPhone": "+233200000001",
        "contactEmail": SEED_AGENT_EMAIL,
    }
    resp = client.post("/api/properties", json=payload, headers=headers)
    assert resp.status_code == 400


def test_buyer_cannot_create_listing(client):
    headers = auth_headers(client, SEED_BUYER_EMAIL)
    payload = {
        "listingType": "sale",
        "title": "Should Fail",
        "description": "x",
        "country": "Ghana",
        "city": "Accra",
        "propertyType": "Residential",
        "areaAcres": 1,
        "price": 1000,
        "tags": [],
        "images": [],
        "contactName": "Buyer",
        "contactPhone": "+233200000002",
        "contactEmail": SEED_BUYER_EMAIL,
    }
    resp = client.post("/api/properties", json=payload, headers=headers)
    assert resp.status_code == 403


def test_property_detail_is_public(client):
    listings = client.get("/api/properties").json()
    property_id = listings[0]["propertyID"]
    resp = client.get(f"/api/properties/{property_id}")
    assert resp.status_code == 200
    assert resp.json()["propertyID"] == property_id


def test_signup_agent_and_investor(client):
    agent = client.post(
        "/api/auth/signup",
        json={
            "email": "newagent@test.com",
            "password": "password123",
            "accountType": "agent",
            "firstName": "Ada",
            "companyName": "Ada Lands",
        },
    )
    assert agent.status_code == 200
    assert agent.json()["user"]["profile"]["accountType"] == "agent"

    buyer = client.post(
        "/api/auth/signup",
        json={
            "email": "newbuyer@test.com",
            "password": "password123",
            "accountType": "investor",
            "firstName": "Ben",
        },
    )
    assert buyer.status_code == 200
    assert buyer.json()["user"]["profile"]["accountType"] == "investor"
