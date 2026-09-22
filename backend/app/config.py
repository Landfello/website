from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Landfello API"
    secret_key: str = "landfello-dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    # Token required for GET /api/admin/backup-db (set DB_BACKUP_TOKEN in production)
    db_backup_token: str = "landfello-backup-dev-token"
    database_url: str = f"sqlite:///{(BASE_DIR / 'landfello.db').as_posix()}"
    frontend_url: str = "https://website-zk2l.vercel.app"
    cors_origins: str = (
        "https://website-zk2l.vercel.app,"
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def sqlite_db_path(self) -> Path | None:
        """Resolve the on-disk SQLite file from DATABASE_URL, if applicable."""
        url = self.database_url
        if not url.startswith("sqlite"):
            return None
        # sqlite:////absolute/path or sqlite:///relative/path
        raw = url.split("sqlite:///", 1)[-1]
        if raw.startswith("/"):
            return Path(raw)
        # sqlite:///./file.db style (three slashes + relative)
        if url.startswith("sqlite:////"):
            return Path("/" + url.removeprefix("sqlite:////"))
        return (BASE_DIR / raw).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
