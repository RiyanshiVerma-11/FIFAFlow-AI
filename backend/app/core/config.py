import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "FIFAFlow AI"
    API_V1_STR: str = "/api"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "fifaflow_ai_jwt_secret_key_2026_super_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days

    # Database & Cache
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/fifaflow")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    # GenAI
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")

    # Environment
    ENV: str = os.getenv("ENV", "development")

    class Config:
        case_sensitive = True

settings = Settings()

# Enforce secure JWT_SECRET in production/non-development environments
if settings.ENV != "development" and settings.JWT_SECRET == "fifaflow_ai_jwt_secret_key_2026_super_secure":
    raise ValueError("CRITICAL SECURITY ERROR: System must not run with default JWT secret in production mode.")
