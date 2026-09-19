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


@lru_cache
def get_settings() -> Settings:
    return Settings()
