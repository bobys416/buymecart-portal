import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.permissions import Permission, has_permission
from app.models.audit_log import AuditLog
from app.models.ledger import (
    AccountType,
    EntryDirection,
    FinancialAccount,
    FundsReservation,
    IncomingWebhookEvent,
    NotificationEventType,
    NotificationOutbox,
    OutboxStatus,
    PaymentRail,
    ProviderReconciliationRecord,
    Transaction,
    TransactionState,
    TransactionType,
)
from app.models.user import User, UserRole
from app.schemas.network import PaginationMeta
from app.services.ledger_service import LedgerService
from app.services.payment_provider import (
    MockBankingProviderAdapter,
    ProviderNetworkError,
    ProviderTimeoutError,
    get_payment_provider,
)


class InvalidStateTransitionError(HTTPException):
    def __init__(self, from_state: str, to_state: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal transaction state transition from '{from_state}' to '{to_state}'.",
        )


class PaymentService:
    """
    Core Financial Transaction & Payment Failure Engine:
    Guarantees funds reservation, atomic balanced journals, idempotent retries,
    case-specific failure handling, and transactional notification outbox dispatch.
    """

    VALID_TRANSITIONS: Dict[TransactionState, Set] = {
        TransactionState.CREATED: {
            TransactionState.PENDING,
            TransactionState.FUNDS_RESERVED,
            TransactionState.FAILED,
        },
        TransactionState.PENDING: {
            TransactionState.FUNDS_RESERVED,
            TransactionState.PROCESSING,
            TransactionState.FAILED,
            TransactionState.UNKNOWN,
        },
        TransactionState.FUNDS_RESERVED: {
            TransactionState.PROCESSING,
            TransactionState.FAILED,
            TransactionState.UNKNOWN,
        },
        TransactionState.PROCESSING: {
            TransactionState.SUCCESS,
            TransactionState.FAILED,
            TransactionState.UNKNOWN,
            TransactionState.REVERSAL_PENDING,
            TransactionState.MANUAL_REVIEW,
        },
        TransactionState.UNKNOWN: {
            TransactionState.SUCCESS,
            TransactionState.FAILED,
            TransactionState.REVERSAL_PENDING,
            TransactionState.MANUAL_REVIEW,
        },
        TransactionState.SUCCESS: {
            TransactionState.REFUND_PENDING,
            TransactionState.REVERSAL_PENDING,
        },
        TransactionState.REVERSAL_PENDING: {
            TransactionState.REVERSED,
            TransactionState.MANUAL_REVIEW,
            TransactionState.FAILED,
        },
        TransactionState.REFUND_PENDING: {
            TransactionState.REFUNDED,
            TransactionState.MANUAL_REVIEW,
            TransactionState.FAILED,
        },
        TransactionState.MANUAL_REVIEW: {
            TransactionState.SUCCESS,
            TransactionState.REVERSED,
            TransactionState.REFUNDED,
            TransactionState.FAILED,
        },
        TransactionState.REVERSED: set(),  # Terminal
        TransactionState.REFUNDED: set(),  # Terminal
        TransactionState.FAILED: set(),    # Terminal
    }

    @classmethod
    def _assert_valid_transition(cls, from_state: TransactionState, to_state: TransactionState) -> None:
        allowed = cls.VALID_TRANSITIONS.get(from_state, set())
        if to_state not in allowed:
            raise InvalidStateTransitionError(from_state.value, to_state.value)

    @classmethod
    def _validate_payment_limits(cls, amount: Decimal, rail: PaymentRail) -> None:
        """
        Validates transaction limits according to banking rail rules and platform configuration.
        """
        if amount < settings.MIN_TRANSACTION_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction amount must be at least INR {settings.MIN_TRANSACTION_AMOUNT}.",
            )
        if rail == PaymentRail.UPI and amount > settings.MAX_UPI_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction amount exceeds UPI limit of INR {settings.MAX_UPI_AMOUNT}.",
            )
        elif rail == PaymentRail.IMPS and amount > settings.MAX_IMPS_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction amount exceeds IMPS limit of INR {settings.MAX_IMPS_AMOUNT}.",
            )
        elif rail == PaymentRail.NEFT and amount > settings.MAX_NEFT_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction amount exceeds NEFT limit of INR {settings.MAX_NEFT_AMOUNT}.",
            )
        elif rail == PaymentRail.RTGS:
            if (settings.ENABLE_LIVE_BANKING or settings.is_production) and amount < settings.MIN_RTGS_AMOUNT:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"RTGS transactions require a minimum amount of INR {settings.MIN_RTGS_AMOUNT}.",
                )
            if amount > settings.MAX_RTGS_AMOUNT:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Transaction amount exceeds RTGS limit of INR {settings.MAX_RTGS_AMOUNT}.",
                )

    @classmethod
    def _queue_notification(
        cls,
        db: Session,
        transaction: Transaction,
        event_type: NotificationEventType,
        recipient: str,
        safe_payload: Dict[str, Any],
    ) -> NotificationOutbox:
        """
        Transactional notification queueing: written in the SAME database transaction
        as state changes, ensuring zero divergence. Never logs credentials/PINs.
        """
        outbox = NotificationOutbox(
            transaction_id=transaction.id,
            event_type=event_type,
            recipient=recipient,
            payload_json=json.dumps(safe_payload),
            status=OutboxStatus.QUEUED,
            delivery_attempts=0,
        )
        db.add(outbox)
        db.flush()
        return outbox

    @classmethod
    def topup_wallet(
        cls,
        actor: User,
        amount: Decimal,
        idempotency_key: str,
        db: Session,
        client_ip: Optional[str] = None,
    ) -> Transaction:
        """Credits merchant wallet from external funds (Debit: PLATFORM_CASH, Credit: MERCHANT_WALLET)."""
        # Idempotency check
        existing = db.scalar(select(Transaction).where(Transaction.idempotency_key == idempotency_key))
        if existing:
            return existing

        wallet = LedgerService.get_or_create_user_wallet(db, actor.id)
        cash_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_CASH)

        ref = f"TXN-TOPUP-{uuid.uuid4().hex[:8].upper()}"
        transaction = Transaction(
            transaction_reference=ref,
            idempotency_key=idempotency_key,
            user_id=actor.id,
            account_id=wallet.id,
            amount=amount,
            fee=Decimal("0.0000"),
            net_amount=amount,
            transaction_type=TransactionType.WALLET_TOPUP,
            payment_rail=PaymentRail.WALLET,
            state=TransactionState.CREATED,
        )
        db.add(transaction)
        db.flush()

        # Advance to SUCCESS and post balanced journal
        transaction.state = TransactionState.SUCCESS
        transaction.completed_at = datetime.now(timezone.utc)

        LedgerService.post_balanced_journal(
            db=db,
            transaction=transaction,
            description=f"Wallet top-up for {actor.login_id}",
            postings_spec=[
                (cash_account.id, EntryDirection.DEBIT, amount),
                (wallet.id, EntryDirection.CREDIT, amount),
            ],
        )

        cls._queue_notification(
            db=db,
            transaction=transaction,
            event_type=NotificationEventType.PAYMENT_SUCCESS,
            recipient=actor.email or actor.phone or actor.login_id,
            safe_payload={
                "transaction_reference": ref,
                "amount": float(amount),
                "status": "SUCCESS",
                "message": "Wallet top-up credited successfully.",
            },
        )

        audit = AuditLog(
            actor_id=actor.id,
            actor_role=actor.role.value,
            actor_login_id=actor.login_id,
            action="WALLET_TOPUP_SUCCESS",
            target_id=transaction.id,
            target_type="TRANSACTION",
            actor_ip=client_ip,
            metadata_json=json.dumps({"amount": float(amount), "reference": ref}),
        )
        db.add(audit)

        db.commit()
        db.refresh(transaction)
        return transaction

    @classmethod
    def execute_payment_with_reservation(
        cls,
        actor: User,
        amount: Decimal,
        idempotency_key: str,
        rail: PaymentRail,
        beneficiary_info: Optional[Dict[str, Any]],
        db: Session,
        client_ip: Optional[str] = None,
    ) -> Transaction:
        """
        Executes payment workflow with internal reservation, provider adapter invocation,
        and failure handling across Cases A, B, C, and D.
        """
        # 1. Caller account status verification
        if not actor.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive or suspended.",
            )

        # 2. Dynamic limits and banking rail validation
        cls._validate_payment_limits(amount, rail)

        # 3. Idempotency Check
        existing = db.scalar(select(Transaction).where(Transaction.idempotency_key == idempotency_key))
        if existing:
            return existing

        wallet = LedgerService.get_or_create_user_wallet(db, actor.id)
        gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
        commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)

        fee = (amount * Decimal(str(settings.DEFAULT_COMMISSION_PERCENT / 100))).quantize(Decimal("0.0001"))
        net_amount = amount - fee
        ref = f"TXN-PAY-{uuid.uuid4().hex[:8].upper()}"

        transaction = Transaction(
            transaction_reference=ref,
            idempotency_key=idempotency_key,
            user_id=actor.id,
            account_id=wallet.id,
            amount=amount,
            fee=fee,
            net_amount=net_amount,
            transaction_type=TransactionType.PAYMENT,
            payment_rail=rail,
            state=TransactionState.CREATED,
            max_retries=settings.RECONCILIATION_MAX_RETRIES,
            metadata_json=json.dumps(beneficiary_info) if beneficiary_info else None,
        )
        db.add(transaction)
        db.flush()

        # 4. Reserve Funds (Locking & Availability Verification)
        reservation = LedgerService.reserve_funds(db, wallet.id, transaction, amount)
        transaction.state = TransactionState.FUNDS_RESERVED
        db.flush()

        # 5. Call Banking Provider Adapter
        provider = get_payment_provider()
        transaction.state = TransactionState.PROCESSING
        transaction.provider_id = provider.provider_id
        db.flush()

        recipient = actor.email or actor.phone or actor.login_id

        try:
            result = provider.initiate_payment(
                transaction_reference=ref,
                amount=amount,
                currency="INR",
                rail=rail.value,
                beneficiary_info=beneficiary_info,
            )
            transaction.provider_transaction_id = result.provider_transaction_id

            if result.status == "SUCCESS":
                # Commit reservation and post balanced journal
                LedgerService.commit_reservation(db, reservation)
                transaction.state = TransactionState.SUCCESS
                transaction.completed_at = datetime.now(timezone.utc)
                transaction.next_retry_at = None

                LedgerService.post_balanced_journal(
                    db=db,
                    transaction=transaction,
                    description=f"Payment settlement for {ref}",
                    postings_spec=[
                        (wallet.id, EntryDirection.DEBIT, amount),
                        (commission_account.id, EntryDirection.CREDIT, fee),
                        (gateway_clearing.id, EntryDirection.CREDIT, net_amount),
                    ],
                )

                cls._queue_notification(
                    db=db,
                    transaction=transaction,
                    event_type=NotificationEventType.PAYMENT_SUCCESS,
                    recipient=recipient,
                    safe_payload={"reference": ref, "amount": float(amount), "status": "SUCCESS"},
                )

            elif result.status == "FAILED":
                if not result.external_debit_occurred:
                    # CASE A & B: Payment failed, NO funds debited -> Release internal reservation
                    LedgerService.release_reservation(db, reservation)
                    transaction.state = TransactionState.FAILED
                    transaction.completed_at = datetime.now(timezone.utc)
                    transaction.next_retry_at = None
                    transaction.provider_failure_code = result.failure_code
                    transaction.provider_failure_reason = result.failure_reason

                    cls._queue_notification(
                        db=db,
                        transaction=transaction,
                        event_type=NotificationEventType.PAYMENT_FAILED_NO_DEBIT,
                        recipient=recipient,
                        safe_payload={
                            "reference": ref,
                            "amount": float(amount),
                            "status": "FAILED",
                            "message": "Payment failed. No debit was recorded against your account.",
                            "failure_code": result.failure_code,
                        },
                    )
                else:
                    # CASE C: Confirmed external debit occurred then failed -> Commit debit & trigger reversal workflow
                    LedgerService.commit_reservation(db, reservation)
                    LedgerService.post_balanced_journal(
                        db=db,
                        transaction=transaction,
                        description=f"Original debit before reversal for {ref}",
                        postings_spec=[
                            (wallet.id, EntryDirection.DEBIT, amount),
                            (commission_account.id, EntryDirection.CREDIT, fee),
                            (gateway_clearing.id, EntryDirection.CREDIT, net_amount),
                        ],
                    )
                    transaction.state = TransactionState.REVERSAL_PENDING
                    transaction.provider_failure_code = result.failure_code
                    transaction.provider_failure_reason = result.failure_reason

                    cls._trigger_reversal(db, transaction, result.provider_transaction_id, recipient, actor)

            else:
                # Provider returned PENDING
                transaction.state = TransactionState.UNKNOWN
                transaction.retry_count = 0
                transaction.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=settings.RECONCILIATION_BACKOFF_SECONDS)
                transaction.last_inquiry_at = datetime.now(timezone.utc)
                cls._queue_notification(
                    db=db,
                    transaction=transaction,
                    event_type=NotificationEventType.PAYMENT_PENDING_VERIFICATION,
                    recipient=recipient,
                    safe_payload={"reference": ref, "amount": float(amount), "status": "PENDING_VERIFICATION"},
                )

        except (ProviderTimeoutError, ProviderNetworkError) as exc:
            # CASE D: Provider Timeout / Network Error
            # DO NOT mark as failed! Keep funds reserved, set state to UNKNOWN / RECONCILIATION_REQUIRED
            transaction.state = TransactionState.UNKNOWN
            transaction.retry_count = 0
            transaction.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=settings.RECONCILIATION_BACKOFF_SECONDS)
            transaction.last_inquiry_at = datetime.now(timezone.utc)
            transaction.provider_failure_reason = str(exc)

            cls._queue_notification(
                db=db,
                transaction=transaction,
                event_type=NotificationEventType.PAYMENT_PENDING_VERIFICATION,
                recipient=recipient,
                safe_payload={
                    "reference": ref,
                    "amount": float(amount),
                    "status": "UNKNOWN",
                    "message": "Payment is being verified with your bank switch. Please do not retry.",
                },
            )

        db.commit()
        db.refresh(transaction)
        return transaction

    @classmethod
    def _trigger_reversal(
        cls,
        db: Session,
        original_txn: Transaction,
        provider_txn_id: str,
        recipient: str,
        actor: User,
    ) -> Transaction:
        """Handles Case C: initiates reversal/refund workflow and prevents double refunds."""
        # Assert no existing refund/reversal exists for this transaction
        existing_reversal = db.scalar(
            select(Transaction).where(
                Transaction.original_transaction_id == original_txn.id,
                Transaction.transaction_type.in_([TransactionType.REVERSAL, TransactionType.REFUND]),
            )
        )
        if existing_reversal:
            return existing_reversal

        refund_ref = f"TXN-REV-{uuid.uuid4().hex[:8].upper()}"
        reversal_txn = Transaction(
            transaction_reference=refund_ref,
            idempotency_key=f"idemp-rev-{original_txn.id}",
            user_id=original_txn.user_id,
            account_id=original_txn.account_id,
            amount=original_txn.amount,
            fee=original_txn.fee,
            net_amount=original_txn.net_amount,
            transaction_type=TransactionType.REVERSAL,
            payment_rail=original_txn.payment_rail,
            state=TransactionState.REVERSAL_PENDING,
            original_transaction_id=original_txn.id,
            reversal_reason="Automated reversal for confirmed external debit failure",
        )
        db.add(reversal_txn)
        db.flush()

        cls._queue_notification(
            db=db,
            transaction=reversal_txn,
            event_type=NotificationEventType.REFUND_INITIATED,
            recipient=recipient,
            safe_payload={"reference": refund_ref, "amount": float(original_txn.amount), "status": "REVERSAL_INITIATED"},
        )

        # Contact provider for refund
        provider = get_payment_provider()
        wallet = LedgerService.lock_account(db, original_txn.account_id)
        gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
        commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)

        try:
            refund_res = provider.initiate_refund(
                original_provider_txn_id=provider_txn_id,
                refund_amount=original_txn.amount,
                reason="Automatic failure reversal",
            )
            reversal_txn.provider_transaction_id = refund_res.provider_refund_id

            if refund_res.status == "SUCCESS":
                reversal_txn.state = TransactionState.REVERSED
                original_txn.state = TransactionState.REVERSED
                reversal_txn.completed_at = datetime.now(timezone.utc)

                # Balanced reversal journal:
                # Debit Gateway Clearing & Commission, Credit Merchant Wallet
                LedgerService.post_balanced_journal(
                    db=db,
                    transaction=reversal_txn,
                    description=f"Reversal refund for {original_txn.transaction_reference}",
                    postings_spec=[
                        (gateway_clearing.id, EntryDirection.DEBIT, original_txn.net_amount),
                        (commission_account.id, EntryDirection.DEBIT, original_txn.fee),
                        (wallet.id, EntryDirection.CREDIT, original_txn.amount),
                    ],
                )

                cls._queue_notification(
                    db=db,
                    transaction=reversal_txn,
                    event_type=NotificationEventType.REFUND_COMPLETED,
                    recipient=recipient,
                    safe_payload={"reference": refund_ref, "amount": float(original_txn.amount), "status": "REVERSED"},
                )

            else:
                # Escalated to manual review if provider refund failed or delayed
                reversal_txn.state = TransactionState.MANUAL_REVIEW
                cls._queue_notification(
                    db=db,
                    transaction=reversal_txn,
                    event_type=NotificationEventType.REFUND_DELAYED,
                    recipient=recipient,
                    safe_payload={"reference": refund_ref, "status": "REVERSAL_DELAYED_MANUAL_REVIEW"},
                )

        except (ProviderTimeoutError, ProviderNetworkError):
            reversal_txn.state = TransactionState.MANUAL_REVIEW

        db.flush()
        return reversal_txn

    @classmethod
    def request_refund(
        cls,
        actor: User,
        original_transaction_id: uuid.UUID,
        reason: str,
        idempotency_key: str,
        db: Session,
        amount: Optional[Decimal] = None,
        client_ip: Optional[str] = None,
    ) -> Transaction:
        """
        Processes formal refund requests. Only permitted for SUCCESS transactions.
        Idempotent: prevents duplicate refunds.
        Supports full and partial refunds with mathematical double-entry balance.
        """
        # Idempotency check on refund request
        existing_refund = db.scalar(select(Transaction).where(Transaction.idempotency_key == idempotency_key))
        if existing_refund:
            return existing_refund

        original_txn = db.scalar(select(Transaction).where(Transaction.id == original_transaction_id))
        if not original_txn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original transaction not found.")

        # Check existing refunds on original transaction
        prior_refunds = list(
            db.scalars(
                select(Transaction).where(
                    Transaction.original_transaction_id == original_transaction_id,
                    Transaction.transaction_type.in_([TransactionType.REFUND, TransactionType.REVERSAL]),
                    Transaction.state.in_([TransactionState.SUCCESS, TransactionState.REFUNDED, TransactionState.REFUND_PENDING]),
                )
            ).all()
        )
        total_refunded = sum((r.amount for r in prior_refunds), Decimal("0.0000"))
        remaining_refundable = original_txn.amount - total_refunded

        if remaining_refundable <= Decimal("0.0000") or original_txn.state in [TransactionState.REFUNDED, TransactionState.REFUND_PENDING]:
            prior_ref = prior_refunds[0] if prior_refunds else None
            ref_str = f" ({prior_ref.transaction_reference})" if prior_ref else ""
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Refund already initiated for transaction{ref_str}. Duplicate refunds disallowed.",
            )

        if original_txn.state != TransactionState.SUCCESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot refund transaction in status '{original_txn.state.value}'. Must be SUCCESS.",
            )

        # Check permissions: Admin or owner of the transaction
        if actor.role != UserRole.ADMIN and actor.id != original_txn.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to request refund.")

        if amount is not None:
            if amount <= Decimal("0.0000"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Refund amount must be greater than zero.",
                )
            if amount > remaining_refundable:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested refund amount ({amount:.2f} INR) exceeds remaining refundable balance ({remaining_refundable:.2f} INR).",
                )
            target_refund_amount = amount
        else:
            target_refund_amount = remaining_refundable

        # Proportional fee calculation
        if original_txn.amount > Decimal("0.0000"):
            fee_ratio = target_refund_amount / original_txn.amount
            refund_fee = (original_txn.fee * fee_ratio).quantize(Decimal("0.0001"))
            refund_net = target_refund_amount - refund_fee
        else:
            refund_fee = Decimal("0.0000")
            refund_net = target_refund_amount

        refund_ref = f"TXN-REF-{uuid.uuid4().hex[:8].upper()}"
        refund_txn = Transaction(
            transaction_reference=refund_ref,
            idempotency_key=idempotency_key,
            user_id=original_txn.user_id,
            account_id=original_txn.account_id,
            amount=target_refund_amount,
            fee=refund_fee,
            net_amount=refund_net,
            transaction_type=TransactionType.REFUND,
            payment_rail=original_txn.payment_rail,
            state=TransactionState.REFUND_PENDING,
            original_transaction_id=original_txn.id,
            reversal_reason=reason,
        )
        db.add(refund_txn)
        db.flush()

        # Update original transaction state if full refund
        if (total_refunded + target_refund_amount) >= original_txn.amount:
            original_txn.state = TransactionState.REFUND_PENDING

        recipient = original_txn.user.email or original_txn.user.phone or original_txn.user.login_id
        cls._queue_notification(
            db=db,
            transaction=refund_txn,
            event_type=NotificationEventType.REFUND_INITIATED,
            recipient=recipient,
            safe_payload={"reference": refund_ref, "amount": float(target_refund_amount), "status": "REFUND_PENDING"},
        )

        # Provider invocation
        provider = get_payment_provider()
        wallet = LedgerService.lock_account(db, original_txn.account_id)
        gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
        commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)

        try:
            refund_res = provider.initiate_refund(
                original_provider_txn_id=original_txn.provider_transaction_id or "UNKNOWN",
                refund_amount=target_refund_amount,
                reason=reason,
            )
            refund_txn.provider_transaction_id = refund_res.provider_refund_id

            if refund_res.status == "SUCCESS":
                refund_txn.state = TransactionState.REFUNDED
                if (total_refunded + target_refund_amount) >= original_txn.amount:
                    original_txn.state = TransactionState.REFUNDED
                else:
                    original_txn.state = TransactionState.SUCCESS
                refund_txn.completed_at = datetime.now(timezone.utc)

                LedgerService.post_balanced_journal(
                    db=db,
                    transaction=refund_txn,
                    description=f"Approved refund for {original_txn.transaction_reference} ({target_refund_amount:.2f} INR)",
                    postings_spec=[
                        (gateway_clearing.id, EntryDirection.DEBIT, refund_net),
                        (commission_account.id, EntryDirection.DEBIT, refund_fee),
                        (wallet.id, EntryDirection.CREDIT, target_refund_amount),
                    ],
                )

                cls._queue_notification(
                    db=db,
                    transaction=refund_txn,
                    event_type=NotificationEventType.REFUND_COMPLETED,
                    recipient=recipient,
                    safe_payload={"reference": refund_ref, "amount": float(target_refund_amount), "status": "REFUNDED"},
                )
            else:
                refund_txn.state = TransactionState.MANUAL_REVIEW
                cls._queue_notification(
                    db=db,
                    transaction=refund_txn,
                    event_type=NotificationEventType.REFUND_DELAYED,
                    recipient=recipient,
                    safe_payload={"reference": refund_ref, "status": "REFUND_DELAYED"},
                )

        except (ProviderTimeoutError, ProviderNetworkError):
            refund_txn.state = TransactionState.MANUAL_REVIEW


        audit = AuditLog(
            actor_id=actor.id,
            actor_role=actor.role.value,
            actor_login_id=actor.login_id,
            action="REQUEST_REFUND",
            target_id=refund_txn.id,
            target_type="TRANSACTION",
            actor_ip=client_ip,
            metadata_json=json.dumps({"original_txn": str(original_txn.id), "reason": reason}),
        )
        db.add(audit)

        db.commit()
        db.refresh(refund_txn)
        return refund_txn

    @classmethod
    def verify_and_resolve_unknown(
        cls,
        actor: User,
        transaction_id: uuid.UUID,
        db: Session,
        client_ip: Optional[str] = None,
    ) -> Transaction:
        """
        Case D resolution: Queries provider status for UNKNOWN/PENDING transactions,
        committing or releasing funds according to authoritative confirmation.
        """
        transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id))
        if not transaction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

        if transaction.state != TransactionState.UNKNOWN:
            return transaction

        query_ref = transaction.provider_transaction_id or transaction.transaction_reference
        if not query_ref:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No provider or transaction reference to query.")

        provider = get_payment_provider()
        inquiry_res = provider.query_payment_status(query_ref)
        if not transaction.provider_transaction_id and inquiry_res.provider_transaction_id:
            transaction.provider_transaction_id = inquiry_res.provider_transaction_id

        wallet = LedgerService.lock_account(db, transaction.account_id)
        gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
        commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)
        recipient = transaction.user.email or transaction.user.phone or transaction.user.login_id

        if inquiry_res.status == "SUCCESS":
            if transaction.reservation and not transaction.reservation.is_committed:
                LedgerService.commit_reservation(db, transaction.reservation)

            transaction.state = TransactionState.SUCCESS
            transaction.completed_at = datetime.now(timezone.utc)

            LedgerService.post_balanced_journal(
                db=db,
                transaction=transaction,
                description=f"Late resolution settlement for {transaction.transaction_reference}",
                postings_spec=[
                    (wallet.id, EntryDirection.DEBIT, transaction.amount),
                    (commission_account.id, EntryDirection.CREDIT, transaction.fee),
                    (gateway_clearing.id, EntryDirection.CREDIT, transaction.net_amount),
                ],
            )

            cls._queue_notification(
                db=db,
                transaction=transaction,
                event_type=NotificationEventType.PAYMENT_SUCCESS,
                recipient=recipient,
                safe_payload={"reference": transaction.transaction_reference, "status": "SUCCESS"},
            )

        elif inquiry_res.status == "FAILED":
            if transaction.reservation and not transaction.reservation.is_released:
                LedgerService.release_reservation(db, transaction.reservation)

            transaction.state = TransactionState.FAILED
            transaction.provider_failure_code = inquiry_res.failure_code
            transaction.provider_failure_reason = inquiry_res.failure_reason

            cls._queue_notification(
                db=db,
                transaction=transaction,
                event_type=NotificationEventType.PAYMENT_FAILED_NO_DEBIT,
                recipient=recipient,
                safe_payload={"reference": transaction.transaction_reference, "status": "FAILED"},
            )

        db.commit()
        db.refresh(transaction)
        return transaction

    @classmethod
    def process_webhook_callback(
        cls,
        payload_bytes: bytes,
        signature_header: str,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Processes incoming banking switch webhooks idempotently with HMAC-SHA256 signature verification,
        database-backed replay protection, amount-mismatch detection, and out-of-order callback safety.
        """
        provider = get_payment_provider()

        # 1. Cryptographic signature verification
        if not signature_header or not provider.verify_webhook_signature(payload_bytes, signature_header):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature.")

        # 2. Parse payload JSON
        try:
            data = json.loads(payload_bytes.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON in webhook.")

        webhook_id = data.get("event_id") or data.get("webhook_id")
        if not webhook_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing required event_id in webhook.")

        payload_hash = hashlib.sha256(payload_bytes).hexdigest()

        # 3. Persistent database-backed replay protection
        existing_event = db.scalar(
            select(IncomingWebhookEvent).where(IncomingWebhookEvent.event_id == webhook_id)
        )
        if existing_event:
            return {
                "status": "DUPLICATE_WEBHOOK_IGNORED",
                "event_id": webhook_id,
                "detail": "Duplicate webhook event previously processed.",
            }

        # Keep in-memory mock set synced if applicable
        provider.is_webhook_duplicate(webhook_id)

        # 4. Find internal transaction record
        provider_txn_id = data.get("provider_transaction_id")
        txn_ref = data.get("transaction_reference")
        conditions = []
        if provider_txn_id:
            conditions.append(Transaction.provider_transaction_id == provider_txn_id)
        if txn_ref:
            conditions.append(Transaction.transaction_reference == txn_ref)

        if not conditions:
            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="IGNORED_NO_REFERENCE",
                error_details="No provider_transaction_id or transaction_reference in payload.",
            )
            db.add(event_rec)
            db.commit()
            return {"status": "ignored", "detail": "No transaction reference in webhook payload."}

        transaction = db.scalar(select(Transaction).where(or_(*conditions)))
        if not transaction:
            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="IGNORED_TRANSACTION_NOT_FOUND",
                error_details=f"No matching transaction for provider_txn_id={provider_txn_id}, txn_ref={txn_ref}",
            )
            db.add(event_rec)
            db.commit()
            return {"status": "ignored", "detail": "Transaction not found for provider reference."}

        # 5. Amount mismatch validation (reject & escalate to MANUAL_REVIEW)
        raw_amt = data.get("amount")
        if raw_amt is not None:
            reported_amount = Decimal(str(raw_amt))
            if abs(reported_amount - transaction.amount) > Decimal("0.0001"):
                transaction.state = TransactionState.MANUAL_REVIEW
                transaction.provider_failure_reason = (
                    f"Provider webhook amount mismatch: reported={reported_amount}, platform={transaction.amount}"
                )
                event_rec = IncomingWebhookEvent(
                    provider_id=provider.provider_id,
                    event_id=webhook_id,
                    payload_hash=payload_hash,
                    signature=signature_header,
                    status="AMOUNT_MISMATCH",
                    error_details=f"Payload amount {reported_amount} != platform amount {transaction.amount}",
                )
                db.add(event_rec)
                rec = ProviderReconciliationRecord(
                    reconciliation_batch_id=f"WEBHOOK-DISC-{uuid.uuid4().hex[:8].upper()}",
                    transaction_id=transaction.id,
                    provider_transaction_id=provider_txn_id or str(transaction.provider_transaction_id or "UNKNOWN"),
                    provider_status=data.get("status", "UNKNOWN"),
                    platform_status=transaction.state.value,
                    discrepancy_detected=True,
                    discrepancy_type="AMOUNT_MISMATCH",
                    expected_amount=transaction.amount,
                    settled_amount=reported_amount,
                    discrepancy_details=f"Webhook reported amount {reported_amount} does not match transaction amount {transaction.amount}",
                    resolved=False,
                )
                db.add(rec)
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Amount mismatch detected: provider reported {reported_amount}, expected {transaction.amount}. Transaction escalated to MANUAL_REVIEW.",
                )

        # 6. Out-of-order callback protection (Disallow resurrecting reversed/refunded transactions)
        if transaction.state in [TransactionState.REVERSED, TransactionState.REFUNDED]:
            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="OUT_OF_ORDER_IGNORED",
                error_details=f"Callback received for transaction already in terminal state {transaction.state.value}",
            )
            db.add(event_rec)
            db.commit()
            return {
                "status": "ignored",
                "detail": f"Out-of-order callback ignored for transaction in terminal state {transaction.state.value}.",
            }

        # 7. Safe handling of already finalized transactions
        if transaction.state == TransactionState.SUCCESS:
            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="PROCESSED_ALREADY_SUCCESS",
            )
            db.add(event_rec)
            db.commit()
            return {"status": "acknowledged", "detail": "Transaction already finalized as SUCCESS"}

        if transaction.state == TransactionState.FAILED and not transaction.reservation:
            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="PROCESSED_ALREADY_FAILED",
            )
            db.add(event_rec)
            db.commit()
            return {"status": "acknowledged", "detail": "Transaction already finalized as FAILED"}

        # 8. Process state transition and post balanced ledger entries
        wallet = LedgerService.lock_account(db, transaction.account_id)
        gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
        commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)
        recipient = transaction.user.email or transaction.user.phone or transaction.user.login_id
        event_status = data.get("status")

        if event_status == "SUCCESS":
            if transaction.reservation and not transaction.reservation.is_committed:
                LedgerService.commit_reservation(db, transaction.reservation)

            transaction.state = TransactionState.SUCCESS
            transaction.completed_at = datetime.now(timezone.utc)
            transaction.next_retry_at = None

            LedgerService.post_balanced_journal(
                db=db,
                transaction=transaction,
                description=f"Webhook callback settlement for {transaction.transaction_reference}",
                postings_spec=[
                    (wallet.id, EntryDirection.DEBIT, transaction.amount),
                    (commission_account.id, EntryDirection.CREDIT, transaction.fee),
                    (gateway_clearing.id, EntryDirection.CREDIT, transaction.net_amount),
                ],
            )

            cls._queue_notification(
                db=db,
                transaction=transaction,
                event_type=NotificationEventType.PAYMENT_SUCCESS,
                recipient=recipient,
                safe_payload={"reference": transaction.transaction_reference, "status": "SUCCESS"},
            )

            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="PROCESSED",
            )
            db.add(event_rec)

        elif event_status == "FAILED":
            if transaction.reservation and not transaction.reservation.is_released:
                LedgerService.release_reservation(db, transaction.reservation)

            transaction.state = TransactionState.FAILED
            transaction.completed_at = datetime.now(timezone.utc)
            transaction.next_retry_at = None
            transaction.provider_failure_code = data.get("failure_code", "PROVIDER_REPORTED_FAILURE")
            transaction.provider_failure_reason = data.get("failure_reason", "Provider callback confirmed failure")

            cls._queue_notification(
                db=db,
                transaction=transaction,
                event_type=NotificationEventType.PAYMENT_FAILED_NO_DEBIT,
                recipient=recipient,
                safe_payload={"reference": transaction.transaction_reference, "status": "FAILED"},
            )

            event_rec = IncomingWebhookEvent(
                provider_id=provider.provider_id,
                event_id=webhook_id,
                payload_hash=payload_hash,
                signature=signature_header,
                status="PROCESSED",
            )
            db.add(event_rec)

        db.commit()
        return {"status": "processed", "reference": transaction.transaction_reference}

    @classmethod
    def reconcile_unresolved_transactions(
        cls,
        db: Session,
        limit: int = 50,
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Durable background status inquiry and reconciliation job:
        Queries UNKNOWN and PENDING transactions with bounded exponential backoff.
        Escalates retry exhaustion to MANUAL_REVIEW operations queue. Never duplicates ledger postings.
        """
        now = datetime.now(timezone.utc)
        query = select(Transaction).where(
            Transaction.state.in_([TransactionState.UNKNOWN, TransactionState.PENDING])
        )
        if not force:
            query = query.where(
                or_(
                    Transaction.next_retry_at.is_(None),
                    Transaction.next_retry_at <= now,
                )
            )
        query = query.order_by(Transaction.created_at.asc()).limit(limit)
        candidates = list(db.scalars(query).all())

        resolved_success = 0
        resolved_failed = 0
        escalated_manual = 0
        still_pending = 0

        provider = get_payment_provider()

        for txn in candidates:
            # Check for retry exhaustion before calling provider
            if txn.retry_count >= txn.max_retries:
                txn.state = TransactionState.MANUAL_REVIEW
                txn.next_retry_at = None
                txn.provider_failure_reason = (
                    f"Max inquiry retries ({txn.max_retries}) exhausted without definitive provider resolution."
                )
                audit = AuditLog(
                    actor_id=txn.user_id,
                    actor_role="SYSTEM",
                    actor_login_id="RECONCILIATION_JOB",
                    action="RETRY_EXHAUSTION_ESCALATED",
                    target_id=txn.id,
                    target_type="TRANSACTION",
                    metadata_json=json.dumps({
                        "retries": txn.retry_count,
                        "reference": txn.transaction_reference,
                        "amount": float(txn.amount),
                    }),
                )
                db.add(audit)
                escalated_manual += 1
                continue

            query_ref = txn.provider_transaction_id or txn.transaction_reference
            txn.last_inquiry_at = now

            try:
                inquiry = provider.query_payment_status(query_ref)
                if not txn.provider_transaction_id and inquiry.provider_transaction_id:
                    txn.provider_transaction_id = inquiry.provider_transaction_id

                if inquiry.status == "SUCCESS":
                    wallet = LedgerService.lock_account(db, txn.account_id)
                    gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
                    commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)

                    if txn.reservation and not txn.reservation.is_committed:
                        LedgerService.commit_reservation(db, txn.reservation)

                    txn.state = TransactionState.SUCCESS
                    txn.completed_at = now
                    txn.next_retry_at = None

                    LedgerService.post_balanced_journal(
                        db=db,
                        transaction=txn,
                        description=f"Late reconciliation settlement for {txn.transaction_reference}",
                        postings_spec=[
                            (wallet.id, EntryDirection.DEBIT, txn.amount),
                            (commission_account.id, EntryDirection.CREDIT, txn.fee),
                            (gateway_clearing.id, EntryDirection.CREDIT, txn.net_amount),
                        ],
                    )

                    recipient = txn.user.email or txn.user.phone or txn.user.login_id
                    cls._queue_notification(
                        db=db,
                        transaction=txn,
                        event_type=NotificationEventType.PAYMENT_SUCCESS,
                        recipient=recipient,
                        safe_payload={"reference": txn.transaction_reference, "status": "SUCCESS"},
                    )
                    resolved_success += 1

                elif inquiry.status == "FAILED":
                    if txn.reservation and not txn.reservation.is_released:
                        LedgerService.release_reservation(db, txn.reservation)

                    txn.state = TransactionState.FAILED
                    txn.completed_at = now
                    txn.next_retry_at = None
                    txn.provider_failure_code = inquiry.failure_code
                    txn.provider_failure_reason = inquiry.failure_reason

                    recipient = txn.user.email or txn.user.phone or txn.user.login_id
                    cls._queue_notification(
                        db=db,
                        transaction=txn,
                        event_type=NotificationEventType.PAYMENT_FAILED_NO_DEBIT,
                        recipient=recipient,
                        safe_payload={"reference": txn.transaction_reference, "status": "FAILED"},
                    )
                    resolved_failed += 1

                else:
                    # Still pending/unknown from provider
                    txn.retry_count += 1
                    backoff = settings.RECONCILIATION_BACKOFF_SECONDS * (2 ** (txn.retry_count - 1))
                    txn.next_retry_at = now + timedelta(seconds=backoff)

                    if txn.retry_count >= txn.max_retries:
                        txn.state = TransactionState.MANUAL_REVIEW
                        txn.provider_failure_reason = (
                            f"Max inquiry retries ({txn.max_retries}) exhausted without definitive provider resolution."
                        )
                        audit = AuditLog(
                            actor_id=txn.user_id,
                            actor_role="SYSTEM",
                            actor_login_id="RECONCILIATION_JOB",
                            action="RETRY_EXHAUSTION_ESCALATED",
                            target_id=txn.id,
                            target_type="TRANSACTION",
                            metadata_json=json.dumps({
                                "retries": txn.retry_count,
                                "reference": txn.transaction_reference,
                            }),
                        )
                        db.add(audit)
                        escalated_manual += 1
                    else:
                        still_pending += 1

            except (ProviderTimeoutError, ProviderNetworkError) as exc:
                txn.retry_count += 1
                backoff = settings.RECONCILIATION_BACKOFF_SECONDS * (2 ** (txn.retry_count - 1))
                txn.next_retry_at = now + timedelta(seconds=backoff)

                if txn.retry_count >= txn.max_retries:
                    txn.state = TransactionState.MANUAL_REVIEW
                    txn.provider_failure_reason = f"Max inquiry retries exhausted after network error: {str(exc)}"
                    audit = AuditLog(
                        actor_id=txn.user_id,
                        actor_role="SYSTEM",
                        actor_login_id="RECONCILIATION_JOB",
                        action="RETRY_EXHAUSTION_ESCALATED",
                        target_id=txn.id,
                        target_type="TRANSACTION",
                        metadata_json=json.dumps({"error": str(exc), "reference": txn.transaction_reference}),
                    )
                    db.add(audit)
                    escalated_manual += 1
                else:
                    still_pending += 1

        db.commit()
        return {
            "total_candidates": len(candidates),
            "resolved_success": resolved_success,
            "resolved_failed": resolved_failed,
            "escalated_manual": escalated_manual,
            "still_pending": still_pending,
        }

    @classmethod
    def reconcile_pending_refunds(
        cls,
        db: Session,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Durable background reconciliation for pending refunds and reversals.
        Authoritatively confirms status with provider and commits balanced reversal journal.
        """
        now = datetime.now(timezone.utc)
        query = (
            select(Transaction)
            .where(Transaction.state.in_([TransactionState.REFUND_PENDING, TransactionState.REVERSAL_PENDING]))
            .order_by(Transaction.created_at.asc())
            .limit(limit)
        )
        candidates = list(db.scalars(query).all())

        resolved_refunds = 0
        escalated_manual = 0
        still_pending = 0

        provider = get_payment_provider()

        for txn in candidates:
            query_ref = txn.provider_transaction_id or txn.transaction_reference
            try:
                refund_res = provider.query_refund_status(query_ref)
                if refund_res.status == "SUCCESS":
                    wallet = LedgerService.lock_account(db, txn.account_id)
                    gateway_clearing = LedgerService.get_or_create_system_account(db, AccountType.GATEWAY_CLEARING)
                    commission_account = LedgerService.get_or_create_system_account(db, AccountType.PLATFORM_COMMISSION)

                    new_state = (
                        TransactionState.REFUNDED
                        if txn.transaction_type == TransactionType.REFUND
                        else TransactionState.REVERSED
                    )
                    txn.state = new_state
                    txn.completed_at = now

                    if txn.original_transaction:
                        txn.original_transaction.state = new_state

                    LedgerService.post_balanced_journal(
                        db=db,
                        transaction=txn,
                        description=f"Late confirmed refund settlement for {txn.transaction_reference}",
                        postings_spec=[
                            (gateway_clearing.id, EntryDirection.DEBIT, txn.net_amount),
                            (commission_account.id, EntryDirection.DEBIT, txn.fee),
                            (wallet.id, EntryDirection.CREDIT, txn.amount),
                        ],
                    )

                    recipient = txn.user.email or txn.user.phone or txn.user.login_id
                    cls._queue_notification(
                        db=db,
                        transaction=txn,
                        event_type=NotificationEventType.REFUND_COMPLETED,
                        recipient=recipient,
                        safe_payload={
                            "reference": txn.transaction_reference,
                            "amount": float(txn.amount),
                            "status": new_state.value,
                        },
                    )
                    resolved_refunds += 1

                elif refund_res.status == "FAILED":
                    txn.state = TransactionState.MANUAL_REVIEW
                    txn.provider_failure_code = refund_res.failure_code
                    txn.provider_failure_reason = refund_res.failure_reason
                    escalated_manual += 1
                else:
                    still_pending += 1

            except (ProviderTimeoutError, ProviderNetworkError):
                still_pending += 1

        db.commit()
        return {
            "total_candidates": len(candidates),
            "resolved_refunds": resolved_refunds,
            "escalated_manual": escalated_manual,
            "still_pending": still_pending,
        }

    @classmethod
    def reconcile_batch(cls, batch_date: str, db: Session) -> Dict[str, Any]:
        """Runs automated reconciliation against external provider report snapshot."""
        provider = get_payment_provider()
        report_entries = provider.fetch_reconciliation_report(batch_date)

        batch_id = f"REC-BATCH-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        total_checked = 0
        discrepancies = 0

        for entry in report_entries:
            total_checked += 1
            txn = db.scalar(select(Transaction).where(Transaction.provider_transaction_id == entry.provider_transaction_id))

            is_disc = False
            details = None
            disc_type = None
            expected_amt = None
            settled_amt = entry.amount

            if not txn:
                is_disc = True
                disc_type = "MISSING_IN_PLATFORM"
                details = f"Provider transaction {entry.provider_transaction_id} not found in platform database."
            else:
                expected_amt = txn.amount
                if abs(txn.amount - entry.amount) > Decimal("0.0001"):
                    is_disc = True
                    disc_type = "AMOUNT_MISMATCH"
                    details = f"Amount mismatch: Platform={txn.amount}, Provider={entry.amount}."
                elif txn.state.value != entry.status:
                    is_disc = True
                    disc_type = "STATUS_MISMATCH"
                    details = f"Status mismatch: Platform={txn.state.value}, Provider={entry.status}."

            if is_disc:
                discrepancies += 1

            rec = ProviderReconciliationRecord(
                reconciliation_batch_id=batch_id,
                transaction_id=txn.id if txn else None,
                provider_transaction_id=entry.provider_transaction_id,
                provider_status=entry.status,
                platform_status=txn.state.value if txn else None,
                discrepancy_detected=is_disc,
                discrepancy_type=disc_type,
                expected_amount=expected_amt,
                settled_amount=settled_amt,
                discrepancy_details=details,
                resolved=False,
            )
            db.add(rec)

        db.commit()
        return {
            "batch_id": batch_id,
            "total_checked": total_checked,
            "discrepancies_found": discrepancies,
            "status": "COMPLETED",
        }
