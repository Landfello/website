import os
import sys
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent

# Prisma/Supabase copy-paste often adds these; psycopg rejects them.
_UNSUPPORTED_PG_QUERY_KEYS = frozenset({"pgbouncer", "connection_limit", "pool_timeout"})


def _sqlite_allowed() -> bool:
    """SQLite is only for automated tests — never for local/prod app data."""
    return os.environ.get("ALLOW_SQLITE") == "1" or "pytest" in sys.modules


def _normalize_database_url(url: str) -> str:
    """Driver prefix + drop query options psycopg does not accept."""
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and "+psycopg" not in url.split("://", 1)[0]:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]

    parts = urlsplit(url)
    if not parts.query:
        return url
    kept = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if k.lower() not in _UNSUPPORTED_PG_QUERY_KEYS
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(kept), parts.fragment))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Landfello API"
    secret_key: str = "landfello-dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    # Required: Supabase Postgres (session pooler). SQLite is not used for app data.
    database_url: str = ""
    frontend_url: str = "https://website-zk2l.vercel.app"
    cors_origins: str = (
        "https://website-zk2l.vercel.app,"
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173"
    )
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_public_base_url: str = ""

    @field_validator(
        "supabase_url",
        "supabase_anon_key",
        "supabase_service_role_key",
        "supabase_jwt_secret",
        "frontend_url",
        "cors_origins",
        "secret_key",
        "database_url",
        mode="before",
    )
    @classmethod
    def strip_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url.strip()
        if not url:
            raise RuntimeError(
                "DATABASE_URL is required. Use your Supabase Postgres URI "
                "(postgresql+psycopg://...). SQLite is no longer supported."
            )
        if url.startswith("sqlite") and not _sqlite_allowed():
            raise RuntimeError(
                "SQLite is no longer supported for Landfello. "
                "Set DATABASE_URL to the Supabase Postgres connection string "
                "(Render → Environment, or Supabase → Connect → Transaction pooler)."
            )
        return _normalize_database_url(url)

    @property
    def uses_supabase_auth(self) -> bool:
        return bool(self.supabase_url and self.supabase_jwt_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
