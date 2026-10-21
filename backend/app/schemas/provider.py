import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.ledger import TransactionResponse
from app.schemas.network import PaginationMeta


class ProviderHealthResponse(BaseModel):
    provider_id: str
    provider_name: str
    status: str
    active_mode: str
    live_banking_enabled: bool
    supported_rails: List[str]
    timestamp: str


class ProviderListResponse(BaseModel):
    providers: List[ProviderHealthResponse]
    active_mode: str
    live_banking_enabled: bool


class DiscrepancyRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reconciliation_batch_id: str
    transaction_id: Optional[uuid.UUID] = None
    provider_transaction_id: str
    provider_status: str
    platform_status: Optional[str] = None
    discrepancy_detected: bool
    discrepancy_type: Optional[str] = None
    expected_amount: Optional[Decimal] = None
    settled_amount: Optional[Decimal] = None
    discrepancy_details: Optional[str] = None
    resolved: bool
    resolution_notes: Optional[str] = None
    reconciled_at: datetime


class ResolveDiscrepancyRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=3, max_length=500, description="Notes documenting operational resolution")


class ManualEscalateRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Audit reason for manual review escalation")


class TriggerReconciliationResponse(BaseModel):
    unresolved_reconciled: Dict[str, Any]
    refunds_reconciled: Dict[str, Any]
    executed_at: datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    actor_role: Optional[str] = None
    actor_login_id: Optional[str] = None
    action: str
    target_id: Optional[uuid.UUID] = None
    target_type: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime


class OperationalMonitoringOverview(BaseModel):
    timestamp: datetime
    kyc_review_backlog: Dict[str, int]
    transactions_unresolved: Dict[str, int]
    refunds_pending: Dict[str, int]
    reconciliation_discrepancies: Dict[str, int]
    banking_providers: List[ProviderHealthResponse]
    system_health: str
