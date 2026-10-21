import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.banking_provider import ProviderCategory, ProviderEnvironment, ProviderStatus


class BankingProviderConfigCreate(BaseModel):
    provider_id: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-z0-9_-]+$")
    provider_name: str = Field(..., min_length=3, max_length=100)
    category: ProviderCategory = ProviderCategory.BANKING_RAIL
    base_url: str = Field(..., max_length=255)
    credential_vault_ref: str = Field(..., min_length=5, max_length=255, description="AWS KMS or HashiCorp Vault ARN reference (kms://vault/...)")
    webhook_secret_ref: Optional[str] = Field(None, max_length=255)
    environment: ProviderEnvironment = ProviderEnvironment.SANDBOX
    status: ProviderStatus = ProviderStatus.ACTIVE
    supported_rails: List[str] = Field(default_factory=list)
    capabilities: List[str] = Field(default_factory=list)
    routing_priority: int = Field(default=1, ge=1, le=100)
    timeout_ms: int = Field(default=15000, ge=1000, le=60000)
    max_retries: int = Field(default=3, ge=0, le=10)


class BankingProviderConfigUpdate(BaseModel):
    provider_name: Optional[str] = None
    category: Optional[ProviderCategory] = None
    base_url: Optional[str] = None
    credential_vault_ref: Optional[str] = None
    webhook_secret_ref: Optional[str] = None
    environment: Optional[ProviderEnvironment] = None
    status: Optional[ProviderStatus] = None
    supported_rails: Optional[List[str]] = None
    capabilities: Optional[List[str]] = None
    routing_priority: Optional[int] = None
    timeout_ms: Optional[int] = None
    max_retries: Optional[int] = None
    is_production_approved: Optional[bool] = None


class BankingProviderConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider_id: str
    provider_name: str
    category: ProviderCategory
    base_url: str
    credential_vault_ref: str
    webhook_secret_ref: Optional[str] = None
    environment: ProviderEnvironment
    status: ProviderStatus
    supported_rails: List[str]
    capabilities: List[str]
    routing_priority: int
    timeout_ms: int
    max_retries: int
    is_production_approved: bool
    approved_by: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime


class TestConnectionRequest(BaseModel):
    provider_id: str = Field(..., min_length=3, max_length=50)
    environment: ProviderEnvironment = ProviderEnvironment.SANDBOX


class TestConnectionResponse(BaseModel):
    provider_id: str
    provider_name: str
    status: str
    http_status_code: int
    latency_ms: int
    is_ssrf_safe: bool
    tls_cipher: str
    verdict: str
    sanitized_error: Optional[str] = None
    tested_at: datetime


class ApiProductCreate(BaseModel):
    product_code: str = Field(..., min_length=3, max_length=50, pattern=r"^[A-Z0-9_-]+$")
    name: str = Field(..., min_length=3, max_length=100)
    version: str = Field(default="v1", max_length=20)
    category: str = Field(..., min_length=3, max_length=50)
    base_fee: Decimal = Field(default=Decimal("0.0000"), ge=Decimal("0.0000"))
    is_active: bool = True
    rate_limit_per_minute: int = Field(default=60, ge=1)
    documentation_url: Optional[str] = None


class ApiProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_code: str
    name: str
    version: str
    category: str
    base_fee: Decimal
    is_active: bool
    rate_limit_per_minute: int
    documentation_url: Optional[str] = None
    created_at: datetime


class ApiClientCredentialCreate(BaseModel):
    client_name: str = Field(..., min_length=3, max_length=100)
    allowed_product_codes: List[str] = Field(default_factory=list)
    rate_limit_per_minute: int = Field(default=120, ge=1, le=5000)
    daily_quota: int = Field(default=10000, ge=100)


class ApiClientCreatedResponse(BaseModel):
    client_id: str
    client_name: str
    client_secret_plaintext: str = Field(..., description="Displayed once upon creation. Store securely.")
    status: str
    allowed_product_codes: List[str]
    rate_limit_per_minute: int
    daily_quota: int
    created_at: datetime


class ApiClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_id: str
    client_name: str
    status: str
    allowed_product_codes: List[str]
    rate_limit_per_minute: int
    daily_quota: int
    created_at: datetime
    expires_at: Optional[datetime] = None


class BeneficiaryVerificationRequest(BaseModel):
    account_number: str = Field(..., min_length=8, max_length=30)
    ifsc: str = Field(..., min_length=4, max_length=20)
    account_holder_name: Optional[str] = Field(None, max_length=255)


class BeneficiaryVerificationResponse(BaseModel):
    status: str
    account_holder_name: Optional[str] = None
    account_number: str
    ifsc: str
    bank_name: Optional[str] = None
    reference_id: Optional[str] = None
    failure_reason: Optional[str] = None
    verified_at: datetime
