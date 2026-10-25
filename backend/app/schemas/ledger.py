import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.ledger import (
    AccountType,
    EntryDirection,
    NotificationEventType,
    OutboxStatus,
    PaymentRail,
    TransactionState,
    TransactionType,
)
from app.schemas.network import PaginationMeta


class WalletBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account_number: str
    account_type: AccountType
    currency: str
    current_balance: Decimal
    reserved_balance: Decimal
    available_balance: Decimal


class PaymentInitiateRequest(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Transaction amount in INR")
    idempotency_key: Optional[str] = Field(None, min_length=8, max_length=128, description="Unique client idempotency key")
    payment_rail: PaymentRail = Field(default=PaymentRail.WALLET)
    beneficiary_name: Optional[str] = Field(None, max_length=255)
    beneficiary_account: Optional[str] = Field(None, max_length=50)
    beneficiary_ifsc: Optional[str] = Field(None, max_length=20)
    remarks: Optional[str] = Field(None, max_length=255)


class WalletTopupRequest(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Deposit amount in INR")
    idempotency_key: str = Field(..., min_length=8, max_length=128, description="Unique topup idempotency key")


class RefundRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Audit reason for refund/reversal")
    idempotency_key: str = Field(..., min_length=8, max_length=128, description="Unique refund idempotency key")
    amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"), description="Optional partial refund amount in INR. If omitted, full remaining refundable balance is refunded.")


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transaction_reference: str
    idempotency_key: str
    user_id: uuid.UUID
    account_id: uuid.UUID
    amount: Decimal
    fee: Decimal
    net_amount: Decimal
    currency: str
    transaction_type: TransactionType
    payment_rail: PaymentRail
    state: TransactionState
    provider_id: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    provider_failure_code: Optional[str] = None
    provider_failure_reason: Optional[str] = None
    original_transaction_id: Optional[uuid.UUID] = None
    reversal_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class PaginatedTransactionResponse(BaseModel):
    items: List[TransactionResponse]
    meta: PaginationMeta


class LedgerPostingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    journal_entry_id: uuid.UUID
    account_id: uuid.UUID
    direction: EntryDirection
    amount: Decimal
    balance_after: Decimal
    created_at: datetime


class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transaction_id: uuid.UUID
    journal_number: str
    description: str
    is_balanced: bool
    posted_at: datetime
    created_at: datetime
    postings: List[LedgerPostingResponse] = []


class NotificationOutboxResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transaction_id: uuid.UUID
    event_type: NotificationEventType
    recipient: str
    status: OutboxStatus
    delivery_attempts: int
    payload_json: str
    created_at: datetime
    delivered_at: Optional[datetime] = None


class BatchReconciliationResponse(BaseModel):
    batch_id: str
    total_checked: int
    discrepancies_found: int
    status: str


class WebhookPayload(BaseModel):
    event_id: str = Field(..., description="Unique provider event ID for replay prevention")
    provider_transaction_id: str
    status: str  # "SUCCESS", "FAILED"
    amount: Optional[Decimal] = None


# ---------------------------------------------------------
# Phase 6: Production Ledger & Reconciliation Hardening Schemas
# ---------------------------------------------------------

class TrialBalanceResponse(BaseModel):
    total_debit: Decimal
    total_credit: Decimal
    imbalance_delta: Decimal
    is_mathematically_balanced: bool
    total_journal_entries: int
    total_postings: int
    assets_inr: Decimal
    liabilities_inr: Decimal
    equity_and_revenue_inr: Decimal
    verified_at: str


class AccountIntegrityResponse(BaseModel):
    account_id: uuid.UUID
    account_number: str
    account_type: AccountType
    recorded_balance: Decimal
    calculated_balance: Decimal
    difference: Decimal
    is_integrity_valid: bool
    total_postings_audited: int
    last_posting_at: Optional[datetime] = None


class SettlementBatchItem(BaseModel):
    provider_transaction_id: str
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    status: str = Field(..., description="Provider settlement status: SUCCESS, FAILED")
    transaction_reference: Optional[str] = None


class SettlementBatchReconcileRequest(BaseModel):
    batch_id: str = Field(..., min_length=4, max_length=64, description="Unique settlement batch ID (e.g. BATCH-2026-10-22-01)")
    settlement_items: List[SettlementBatchItem]


class SettlementDiscrepancyItem(BaseModel):
    provider_transaction_id: str
    discrepancy_type: str
    platform_status: Optional[str] = None
    provider_status: str
    expected_amount: Optional[Decimal] = None
    settled_amount: Optional[Decimal] = None
    details: str


class SettlementBatchReconcileResponse(BaseModel):
    batch_id: str
    total_processed: int
    matched_count: int
    discrepancy_count: int
    discrepancies: List[SettlementDiscrepancyItem]
    reconciled_at: str


class DatabaseHealthResponse(BaseModel):
    status: str
    dialect: str
    is_sqlite: bool
    pool_size: int
    checked_in_connections: int
    checked_out_connections: int
    overflow_connections: int
    query_latency_ms: float
    database_target: str
