import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "BuyMeCart / IBNK API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Security & Tokens
    SECRET_KEY: str = "buymecart-fintech-secure-signing-key-dev-32chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "exp://localhost:8081",
    ]

    # Database URLs
    # Supports SQLite for dev/test and PostgreSQL/Supabase for production
    DATABASE_URL: str = "sqlite:///./buymecart_dev.db"
    TEST_DATABASE_URL: str = "sqlite:///./buymecart_test.db"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    # Storage & KYC Documents
    STORAGE_DIR: str = "./storage"
    MAX_DOCUMENT_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 50
    DOCUMENT_SIGNED_URL_EXPIRE_SECONDS: int = 3600

    # Payment Provider & Ledger Engine
    PAYMENT_WEBHOOK_SECRET: str = "buymecart-provider-webhook-secret-dev-2026"
    PAYMENT_PROVIDER_MODE: str = "sandbox"  # "sandbox" or "production"
    ENABLE_LIVE_BANKING: bool = False  # Explicitly false until approved credentials & contracts
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    ICICI_CORP_ID: str = ""
    ICICI_USER_ID: str = ""
    RECONCILIATION_THRESHOLD_MINUTES: int = 60
    RECONCILIATION_MAX_RETRIES: int = 3
    RECONCILIATION_BACKOFF_SECONDS: int = 300
    DEFAULT_COMMISSION_PERCENT: float = 0.50

    # Banking Rail Limits (INR)
    MIN_TRANSACTION_AMOUNT: float = 1.0
    MAX_UPI_AMOUNT: float = 100000.0
    MAX_IMPS_AMOUNT: float = 500000.0
    MAX_NEFT_AMOUNT: float = 2500000.0
    MIN_RTGS_AMOUNT: float = 200000.0
    MAX_RTGS_AMOUNT: float = 10000000.0

    # Logging
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        # Normalize legacy postgres:// to postgresql:// or postgresql+psycopg://
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://") and "+psycopg" not in v and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
