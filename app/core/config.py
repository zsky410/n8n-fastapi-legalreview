from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LegalDesk AI Microservice"
    app_env: str = "development"
    app_debug: bool = True
    api_v1_prefix: str = "/v1"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:4173,http://localhost:8080"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    enable_llm_calls: bool = False
    llm_max_retries: int = 1
    llm_retry_delay_seconds: float = 0.8
    request_timeout_seconds: int = 30
    healthcheck_timeout_seconds: int = 2

    database_url: str = "postgresql://legaldesk:legaldesk@postgres:5432/legaldesk_ai"
    redis_url: str = "redis://redis:6379/0"
    auth_jwt_secret: str = "legaldesk-dev-jwt-secret"
    auth_jwt_algorithm: str = "HS256"
    auth_access_token_minutes: int = 720

    disclaimer: str = (
        "Kết quả AI chỉ có giá trị tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
