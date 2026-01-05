"""Configuration settings for the trading API."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str = "https://rfmbhdgfovnglegqxjnj.supabase.co"
    supabase_key: str = ""

    # IB Client Portal Gateway
    ib_gateway_url: str = "https://localhost:5000"
    ib_gateway_timeout: int = 30

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # App settings
    debug: bool = True

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
