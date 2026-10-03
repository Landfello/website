import uuid
from functools import lru_cache

import boto3
from botocore.client import Config
from fastapi import HTTPException

from .config import get_settings


def r2_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.r2_account_id
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_bucket
        and settings.r2_public_base_url
    )


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


def upload_bytes(key: str, data: bytes, content_type: str) -> str:
    if not r2_configured():
        raise HTTPException(
            status_code=503,
            detail="Image storage is not configured. Set the Cloudflare R2 environment variables.",
        )
    settings = get_settings()
    try:
        _client().put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=data,
            ContentType=content_type or "application/octet-stream",
        )
    except Exception as exc:  # noqa: BLE001 - surface storage misconfig clearly
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not upload image to storage. "
                f"Check that R2 bucket '{settings.r2_bucket}' exists and credentials are valid."
            ),
        ) from exc
    return f"{settings.r2_public_base_url.rstrip('/')}/{key}"


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
