"""
Cấu hình môi trường cho hệ thống CLB
Sử dụng Pydantic BaseSettings để quản lý config từ .env
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 9000
    APP_RELOAD: bool = True

    # Security
    SECRET_KEY: str = ""  # BẮT BUỘC: set qua env/SECRET_KEY, không được để trống ở production
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./data/club_management.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # AI / Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    AI_ENABLED: bool = True

    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@ictu.edu.vn"
    SMTP_TLS: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"

    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB


settings = Settings()

# Fail-fast: SECRET_KEY phải được cung cấp qua env (không được hardcode)
if not settings.SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is not set. Set it via environment variable or .env file. "
        "Generate one with: python -c 'import secrets; print(secrets.token_hex(32))'"
    )
