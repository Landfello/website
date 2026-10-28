import uuid
from functools import lru_cache

import boto3
import httpx
from botocore.client import Config
from fastapi import HTTPException

from .config import get_settings

LISTING_IMAGE_BUCKET = "listing-images"


def r2_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.r2_account_id
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_bucket
        and settings.r2_public_base_url
    )


def supabase_storage_configured() -> bool:
    settings = get_settings()
    return bool(settings.supabase_url and settings.supabase_service_role_key)


@lru_cache
def _client():
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def _supabase_storage_headers(json_body: bool = False) -> dict[str, str]:
    settings = get_settings()
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    if json_body:
        headers["Content-Type"] = "application/json"
    return headers


def _ensure_supabase_bucket(bucket: str) -> None:
    settings = get_settings()
    base = settings.supabase_url.rstrip("/")
    headers = _supabase_storage_headers(json_body=True)
    existing = httpx.get(f"{base}/storage/v1/bucket/{bucket}", headers=headers, timeout=20)
    if existing.status_code == 200:
        return
    created = httpx.post(
        f"{base}/storage/v1/bucket",
        headers=headers,
        json={
            "id": bucket,
            "name": bucket,
            "public": True,
            "fileSizeLimit": 5 * 1024 * 1024,
        },
        timeout=20,
    )
    if created.status_code in (200, 201):
        return
    text = (created.text or "").lower()
    if created.status_code in (400, 409) and ("exist" in text or "duplicate" in text):
        return
    raise HTTPException(
        status_code=502,
        detail="Could not prepare image storage. Check SUPABASE_SERVICE_ROLE_KEY.",
    )


def _upload_to_supabase(key: str, data: bytes, content_type: str) -> str:
    settings = get_settings()
    _ensure_supabase_bucket(LISTING_IMAGE_BUCKET)
    base = settings.supabase_url.rstrip("/")
    headers = _supabase_storage_headers()
    headers["Content-Type"] = content_type or "application/octet-stream"
    headers["x-upsert"] = "true"
    resp = httpx.post(
        f"{base}/storage/v1/object/{LISTING_IMAGE_BUCKET}/{key}",
        headers=headers,
        content=data,
        timeout=40,
    )
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail="Could not upload image to storage. Check Supabase Storage is enabled.",
        )
    return f"{base}/storage/v1/object/public/{LISTING_IMAGE_BUCKET}/{key}"


def upload_bytes(key: str, data: bytes, content_type: str) -> str:
    settings = get_settings()
    if r2_configured():
        try:
            _client().put_object(
                Bucket=settings.r2_bucket,
                Key=key,
                Body=data,
                ContentType=content_type or "application/octet-stream",
            )
        except Exception as exc:  # noqa: BLE001 - surface storage misconfig clearly
            if supabase_storage_configured():
                return _upload_to_supabase(key, data, content_type)
            raise HTTPException(
                status_code=502,
                detail=(
                    "Could not upload image to storage. "
                    f"Check that R2 bucket '{settings.r2_bucket}' exists and credentials are valid."
                ),
            ) from exc
        return f"{settings.r2_public_base_url.rstrip('/')}/{key}"

    if supabase_storage_configured():
        return _upload_to_supabase(key, data, content_type)

    raise HTTPException(
        status_code=503,
        detail="Image storage is not configured. Set Cloudflare R2 or Supabase Storage credentials.",
    )


def extension_for(content_type: str, filename: str | None = None) -> str:
    mapping = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    }
    if content_type in mapping:
        return mapping[content_type]
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext in {"jpg", "jpeg", "png", "webp", "gif"}:
            return "jpg" if ext == "jpeg" else ext
    return "jpg"


def new_object_key(prefix: str, content_type: str, filename: str | None = None) -> str:
    ext = extension_for(content_type, filename)
    return f"{prefix}/{uuid.uuid4().hex}.{ext}"
