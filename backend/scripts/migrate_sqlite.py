"""Copy a local SQLite database into Supabase Postgres and Cloudflare R2.

Run from the backend directory after the Supabase schema.sql trigger is applied:

  DATABASE_URL=postgresql+psycopg://... \\
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co \\
  SUPABASE_SERVICE_ROLE_KEY=... \\
  R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \\
  R2_BUCKET=... R2_PUBLIC_BASE_URL=https://... \\
  SQLITE_PATH=./landfello.db \\
  python -m scripts.migrate_sqlite
"""

from __future__ import annotations

import base64
import json
import os
import sqlite3
import sys
import uuid
from pathlib import Path

import httpx

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config import get_settings  # noqa: E402
from app.database import Property, Purchase, SessionLocal, User, init_db  # noqa: E402
from app.storage import new_object_key, r2_configured, upload_bytes  # noqa: E402


def _loads(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def _upload_data_url(owner_id: str, value: str) -> str:
    if not value.startswith("data:"):
        return value
    header, _, b64 = value.partition(",")
    content_type = header.split(";")[0].replace("data:", "") or "image/jpeg"
    raw = base64.b64decode(b64)
    key = new_object_key(f"migrated/{owner_id}", content_type)
    return upload_bytes(key, raw, content_type)


def _import_auth_user(row: sqlite3.Row) -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to import logins.")

    body = {
        "id": row["id"],
        "email": row["email"],
        "email_confirm": True,
        "user_metadata": {
            "account_type": row["account_type"] or "investor",
            "account_type_chosen": True,
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "phone_number": row["phone_number"],
        },
    }
    hashed = row["hashed_password"]
    if hashed:
        body["password_hash"] = hashed
    else:
        body["password"] = uuid.uuid4().hex

    resp = httpx.post(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users",
        headers={
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        },
        json=body,
        timeout=30,
    )
    if resp.status_code >= 400 and resp.status_code != 422:
        raise SystemExit(f"Could not import {row['email']}: {resp.text}")


def main() -> None:
    sqlite_path = Path(os.environ.get("SQLITE_PATH", str(BACKEND_DIR / "landfello.db")))
    if not sqlite_path.is_file():
        raise SystemExit(f"SQLite file not found: {sqlite_path}")

    settings = get_settings()
    if settings.database_url.startswith("sqlite"):
        raise SystemExit("DATABASE_URL must be the Supabase Postgres URI, not SQLite.")

    source = sqlite3.connect(sqlite_path)
    source.row_factory = sqlite3.Row
    users = source.execute("select * from users").fetchall()
    properties = source.execute("select * from properties").fetchall()
    purchases = []
    tables = {row[0] for row in source.execute("select name from sqlite_master where type='table'")}
    if "purchases" in tables:
        purchases = source.execute("select * from purchases").fetchall()

    blob_count = 0
    for row in users:
        photo = row["photo_url"] if "photo_url" in row.keys() else None
        if isinstance(photo, str) and photo.startswith("data:"):
            blob_count += 1
    for row in properties:
        for img in _loads(row["images"], []):
            if isinstance(img, str) and img.startswith("data:"):
                blob_count += 1
    if blob_count and not r2_configured():
        raise SystemExit("Set Cloudflare R2 variables before migrating stored images.")

    for row in users:
        _import_auth_user(row)

    init_db()
    db = SessionLocal()
    try:
        for row in users:
            photo = row["photo_url"] if "photo_url" in row.keys() else None
            if isinstance(photo, str) and photo.startswith("data:"):
                photo = _upload_data_url(row["id"], photo)
            user = db.get(User, row["id"])
            if user is None:
                user = User(id=row["id"], email=row["email"])
                db.add(user)
            user.email = row["email"]
            user.hashed_password = None
            user.account_type = row["account_type"] or "investor"
            user.account_type_chosen = True
            user.first_name = row["first_name"]
            user.last_name = row["last_name"]
            user.phone_number = row["phone_number"]
            user.license_number = row["license_number"]
            user.company_name = row["company_name"]
            user.photo_url = photo
        db.commit()

        for row in properties:
            images = []
            for img in _loads(row["images"], []):
                if isinstance(img, str) and img.startswith("data:"):
                    images.append(_upload_data_url(row["user_id"], img))
                elif img:
                    images.append(img)
            prop = db.get(Property, row["property_id"])
            if prop is None:
                prop = Property(property_id=row["property_id"], user_id=row["user_id"], title=row["title"])
                db.add(prop)
            prop.user_id = row["user_id"]
            prop.listing_type = row["listing_type"] or "sale"
            prop.title = row["title"]
            prop.description = row["description"] or ""
            prop.country = row["country"]
            prop.city = row["city"]
            prop.neighborhood = row["neighborhood"]
            prop.property_type = row["property_type"] or "Residential"
            prop.category = row["category"] if "category" in row.keys() and row["category"] else "Land"
            prop.bedrooms = row["bedrooms"] if "bedrooms" in row.keys() else None
            prop.bathrooms = row["bathrooms"] if "bathrooms" in row.keys() else None
            prop.area_acres = row["area_acres"] or 0
            prop.tenure = row["tenure"]
            prop.lease_term = row["lease_term"]
            prop.price = row["price"]
            prop.monthly_rent = row["monthly_rent"]
            prop.tags = _loads(row["tags"], [])
            prop.images = images
            prop.contact_name = row["contact_name"] or ""
            prop.contact_phone = row["contact_phone"] or ""
            prop.contact_email = row["contact_email"] or ""
            prop.verified = bool(row["verified"])
            prop.days_on_market = row["days_on_market"] or 0
            prop.status = row["status"] or "available"
        db.commit()

        for row in purchases:
            purchase = db.get(Purchase, row["id"])
            if purchase is None:
                purchase = Purchase(
                    id=row["id"],
                    property_id=row["property_id"],
                    buyer_id=row["buyer_id"],
                    amount_usd=row["amount_usd"],
                    amount_local=row["amount_local"],
                    reference=row["reference"],
                )
                db.add(purchase)
            purchase.currency = row["currency"] or "NGN"
            purchase.status = row["status"] or "pending"
            purchase.paystack_access_code = row["paystack_access_code"]
            purchase.authorization_url = row["authorization_url"]
        db.commit()
    finally:
        db.close()
        source.close()

    print(f"Imported {len(users)} users, {len(properties)} properties, {len(purchases)} purchases.")


if __name__ == "__main__":
    main()
