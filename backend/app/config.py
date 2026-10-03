import os
import sys
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


def _sqlite_allowed() -> bool:
    """SQLite is only for automated tests — never for local/prod app data."""
    return os.environ.get("ALLOW_SQLITE") == "1" or "pytest" in sys.modules


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
                "(Render env or Supabase → Project Settings → Database)."
            )
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://") :]
        if url.startswith("postgresql://") and "+psycopg" not in url.split("://", 1)[0]:
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url

    @property
    def uses_supabase_auth(self) -> bool:
        return bool(self.supabase_url and self.supabase_jwt_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
