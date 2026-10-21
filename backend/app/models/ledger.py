import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.user import User


class TransactionState(str, enum.Enum):
    CREATED = "CREATED"
    PENDING = "PENDING"
    FUNDS_RESERVED = "FUNDS_RESERVED"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    UNKNOWN = "UNKNOWN"
    REVERSAL_PENDING = "REVERSAL_PENDING"
    REVERSED = "REVERSED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class TransactionType(str, enum.Enum):
    PAYMENT = "PAYMENT"
    WALLET_TOPUP = "WALLET_TOPUP"
    REFUND = "REFUND"
    REVERSAL = "REVERSAL"
    COMMISSION_PAYOUT = "COMMISSION_PAYOUT"


class PaymentRail(str, enum.Enum):
    WALLET = "WALLET"
    UPI = "UPI"
    IMPS = "IMPS"
    NEFT = "NEFT"
    RTGS = "RTGS"
    RAZORPAY = "RAZORPAY"
    BANK_TRANSFER = "BANK_TRANSFER"


class AccountType(str, enum.Enum):
    MERCHANT_WALLET = "MERCHANT_WALLET"
    PLATFORM_CASH = "PLATFORM_CASH"
    GATEWAY_CLEARING = "GATEWAY_CLEARING"
    PLATFORM_COMMISSION = "PLATFORM_COMMISSION"
    FUNDS_RESERVED_ESCROW = "FUNDS_RESERVED_ESCROW"
    REFUND_CLEARING = "REFUND_CLEARING"


class EntryDirection(str, enum.Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class NotificationEventType(str, enum.Enum):
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED_NO_DEBIT = "PAYMENT_FAILED_NO_DEBIT"
    PAYMENT_PENDING_VERIFICATION = "PAYMENT_PENDING_VERIFICATION"
    REFUND_INITIATED = "REFUND_INITIATED"
    REFUND_COMPLETED = "REFUND_COMPLETED"
    REFUND_DELAYED = "REFUND_DELAYED"
    TRANSACTION_REQUIRES_REVIEW = "TRANSACTION_REQUIRES_REVIEW"


class OutboxStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"


class FinancialAccount(Base):
    """
    Financial Account representing balance tracking entities (merchant wallets,
    escrow, clearing, platform cash, and commission revenue).
    """
    __tablename__ = "financial_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    account_number: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    account_type: Mapped[AccountType] = mapped_column(
        Enum(AccountType, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        default=Decimal("0.0000"),
        nullable=False,
    )
    reserved_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        default=Decimal("0.0000"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])
    postings: Mapped[List["LedgerPosting"]] = relationship("LedgerPosting", back_populates="account")

    @property
    def available_balance(self) -> Decimal:
        return self.current_balance - self.reserved_balance

    def __repr__(self) -> str:
        return f"<FinancialAccount num={self.account_number} type={self.account_type.value} bal={self.current_balance}>"


class Transaction(Base):
    """
    Transaction tracking state machine, amounts, idempotency keys, and provider linkages.
    """
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    transaction_reference: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("financial_accounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
    )
    fee: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        default=Decimal("0.0000"),
        nullable=False,
    )
    net_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    payment_rail: Mapped[PaymentRail] = mapped_column(
        Enum(PaymentRail, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    state: Mapped[TransactionState] = mapped_column(
        Enum(TransactionState, native_enum=False, length=50),
        default=TransactionState.CREATED,
        nullable=False,
        index=True,
    )
    provider_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    provider_transaction_id: Mapped[Optional[str]] = mapped_column(
        String(128),
        index=True,
        nullable=True,
    )
    provider_failure_code: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    provider_failure_reason: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    original_transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reversal_reason: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    metadata_json: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    retry_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    max_retries: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False,
    )
    next_retry_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    last_inquiry_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    account: Mapped["FinancialAccount"] = relationship("FinancialAccount", foreign_keys=[account_id])
    original_transaction: Mapped[Optional["Transaction"]] = relationship(
        "Transaction",
        remote_side=[id],
        back_populates="reversals",
    )
    reversals: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        back_populates="original_transaction",
    )
    journal_entries: Mapped[List["JournalEntry"]] = relationship(
        "JournalEntry",
        back_populates="transaction",
    )
    reservation: Mapped[Optional["FundsReservation"]] = relationship(
        "FundsReservation",
        back_populates="transaction",
        uselist=False,
    )
    notifications: Mapped[List["NotificationOutbox"]] = relationship(
        "NotificationOutbox",
        back_populates="transaction",
    )

    def __repr__(self) -> str:
        return f"<Transaction ref={self.transaction_reference} state={self.state.value} amt={self.amount}>"


class JournalEntry(Base):
    """
    Immutable double-entry journal entry header linking balanced ledger postings to a transaction.
    """
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("transactions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    journal_number: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    is_balanced: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    posted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="journal_entries")
    postings: Mapped[List["LedgerPosting"]] = relationship("LedgerPosting", back_populates="journal_entry")

    def __repr__(self) -> str:
        return f"<JournalEntry num={self.journal_number} txn={self.transaction_id}>"


class LedgerPosting(Base):
    """
    Atomic double-entry ledger line item (Debit or Credit) with balance checkpoint.
    """
    __tablename__ = "ledger_postings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    journal_entry_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("journal_entries.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("financial_accounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    direction: Mapped[EntryDirection] = mapped_column(
        Enum(EntryDirection, native_enum=False, length=20),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
    )
    balance_after: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="postings")
    account: Mapped["FinancialAccount"] = relationship("FinancialAccount", back_populates="postings")

    def __repr__(self) -> str:
        return f"<LedgerPosting acct={self.account_id} {self.direction.value}={self.amount}>"


class FundsReservation(Base):
    """
    Tracks temporary hold on account funds before settlement/completion.
    """
    __tablename__ = "funds_reservations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("transactions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("financial_accounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
    )
    is_released: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_committed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    released_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    committed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="reservation")
    account: Mapped["FinancialAccount"] = relationship("FinancialAccount")

    def __repr__(self) -> str:
        return f"<FundsReservation txn={self.transaction_id} amt={self.amount} released={self.is_released}>"


class NotificationOutbox(Base):
    """
    Transactional notification outbox table guaranteeing state changes and notifications do not diverge.
    """
    __tablename__ = "notification_outbox"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[NotificationEventType] = mapped_column(
        Enum(NotificationEventType, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    recipient: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    payload_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[OutboxStatus] = mapped_column(
        Enum(OutboxStatus, native_enum=False, length=20),
        default=OutboxStatus.QUEUED,
        nullable=False,
        index=True,
    )
    delivery_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    last_error: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<NotificationOutbox id={self.id} event={self.event_type.value} status={self.status.value}>"


class ProviderReconciliationRecord(Base):
    """
    Tracks batch reconciliation entries and discrepancies between platform and provider reports.
    """
    __tablename__ = "provider_reconciliation_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    reconciliation_batch_id: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
    )
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    provider_transaction_id: Mapped[str] = mapped_column(
        String(128),
        index=True,
        nullable=False,
    )
    provider_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    platform_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    discrepancy_detected: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    discrepancy_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    expected_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(18, 4),
        nullable=True,
    )
    settled_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(18, 4),
        nullable=True,
    )
    discrepancy_details: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    resolved: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    reconciled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    transaction: Mapped[Optional["Transaction"]] = relationship("Transaction")

    def __repr__(self) -> str:
        return f"<ReconciliationRecord batch={self.reconciliation_batch_id} disc={self.discrepancy_detected}>"


class IncomingWebhookEvent(Base):
    """
    Persisted log of incoming provider webhook notifications to enforce durable,
    database-backed replay protection and auditability across all server nodes.
    """
    __tablename__ = "incoming_webhook_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    provider_id: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    event_id: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    payload_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    signature: Mapped[Optional[str]] = mapped_column(
        String(256),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )  # "PROCESSED", "DUPLICATE_IGNORED", "FORGED", "FAILED"
    error_details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<IncomingWebhookEvent id={self.id} event_id={self.event_id} status={self.status}>"
