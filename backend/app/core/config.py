from functools import lru_cache

from pydantic import AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "LegalReview API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://legalreview:legalreview@postgres:5432/legalreview"
    secret_key: str = "change-me-for-local-demo"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    backend_cors_origins: str = "http://localhost:3000"
    frontend_base_url: AnyUrl | str = "http://localhost:3000"
    n8n_webhook_url: str = "http://n8n:5678/webhook/document-reviewed"
    n8n_webhook_timeout_seconds: float = 10.0
    upload_dir: str = "uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024
    openai_api_key: str | None = None
    openai_review_model: str = "gpt-4o-mini"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
