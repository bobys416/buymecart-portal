import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ProviderCategory(str, enum.Enum):
    PAYMENT_GATEWAY = "PAYMENT_GATEWAY"
    BANKING_RAIL = "BANKING_RAIL"
    KYC_VERIFICATION = "KYC_VERIFICATION"
    BBPS_BILLER = "BBPS_BILLER"


class ProviderEnvironment(str, enum.Enum):
    SANDBOX = "SANDBOX"
    PRODUCTION = "PRODUCTION"


class ProviderStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"


class BankingProviderConfig(Base):
    """
    Upstream banking provider & gateway configuration.
    Enforces KMS/Vault reference patterns for credentials (zero plaintext in DB).
    """
    __tablename__ = "banking_provider_configs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4, nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[ProviderCategory] = mapped_column(
        Enum(ProviderCategory, native_enum=False, length=50),
        default=ProviderCategory.BANKING_RAIL,
        nullable=False,
    )
    base_url: Mapped[str] = mapped_column(String(255), nullable=False)
    credential_vault_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    webhook_secret_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    environment: Mapped[ProviderEnvironment] = mapped_column(
        Enum(ProviderEnvironment, native_enum=False, length=20),
        default=ProviderEnvironment.SANDBOX,
        nullable=False,
    )
    status: Mapped[ProviderStatus] = mapped_column(
        Enum(ProviderStatus, native_enum=False, length=20),
        default=ProviderStatus.ACTIVE,
        nullable=False,
    )
    supported_rails_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    capabilities_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    routing_priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    timeout_ms: Mapped[int] = mapped_column(Integer, default=15000, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    is_production_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approved_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ApiProduct(Base):
    """Admin-controlled catalogue for BSpark commercial and internal API services."""
    __tablename__ = "api_products"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4, nullable=False)
    product_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    base_fee: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0000"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    documentation_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ApiClientCredential(Base):
    """
    External and internal API consumer credentials.
    Stores cryptographically hashed client secret (SHA-256) - raw secret is returned once on generation.
    """
    __tablename__ = "api_client_credentials"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4, nullable=False)
    client_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    client_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_client_secret: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False)
    allowed_product_codes_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    daily_quota: Mapped[int] = mapped_column(Integer, default=10000, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
