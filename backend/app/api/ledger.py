import uuid
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Query,
    Request,
    status,
)
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_permission
from app.core.permissions import Permission
from app.models.ledger import (
    AccountType,
    NotificationOutbox,
    PaymentRail,
    ProviderReconciliationRecord,
    Transaction,
    TransactionState,
    TransactionType,
)
from app.models.user import User, UserRole
from app.schemas.ledger import (
    BatchReconciliationResponse,
    JournalEntryResponse,
    NotificationOutboxResponse,
    PaginatedTransactionResponse,
    PaymentInitiateRequest,
    RefundRequest,
    TransactionResponse,
    WalletBalanceResponse,
    WalletTopupRequest,
    WebhookPayload,
)
from app.schemas.network import PaginationMeta
from app.services.ledger_service import LedgerService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/ledger", tags=["Financial Ledger & Payments"])


@router.get(
    "/wallet",
    response_model=WalletBalanceResponse,
    summary="Get User Wallet Balance",
    description="Returns current, reserved, and available balance for authenticated user.",
)
def get_wallet_balance(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    wallet = LedgerService.get_or_create_user_wallet(db, current_user.id)
    return WalletBalanceResponse(
        account_number=wallet.account_number,
        account_type=wallet.account_type,
        currency=wallet.currency,
        current_balance=wallet.current_balance,
        reserved_balance=wallet.reserved_balance,
        available_balance=wallet.available_balance,
    )


@router.post(
    "/wallet/topup",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Top-Up Wallet Funds",
    description="Deposits funds into merchant wallet from external platform cash. Idempotent.",
)
def topup_wallet(
    data: WalletTopupRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    transaction = PaymentService.topup_wallet(
        actor=current_user,
        amount=data.amount,
        idempotency_key=data.idempotency_key,
        db=db,
        client_ip=client_ip,
    )
    return TransactionResponse.model_validate(transaction)


@router.post(
    "/payments",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate Payment Outflow",
    description="Executes funds reservation, contacts banking switch, and posts balanced double-entry ledger.",
)
def initiate_payment(
    data: PaymentInitiateRequest,
    request: Request,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(require_permission(Permission.INITIATE_PAYMENT)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    idemp_key = idempotency_key_header or data.idempotency_key
    if not idemp_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency key is required either in the Idempotency-Key header or request body.",
        )

    beneficiary = {
        "beneficiary_name": data.beneficiary_name,
        "beneficiary_account": data.beneficiary_account,
        "beneficiary_ifsc": data.beneficiary_ifsc,
        "remarks": data.remarks,
    }

    transaction = PaymentService.execute_payment_with_reservation(
        actor=current_user,
        amount=data.amount,
        idempotency_key=idemp_key,
        rail=data.payment_rail,
        beneficiary_info=beneficiary,
        db=db,
        client_ip=client_ip,
    )
    return TransactionResponse.model_validate(transaction)


@router.get(
    "/transactions",
    response_model=PaginatedTransactionResponse,
    summary="List Transactions",
    description="Returns scoped transaction history based on organizational role.",
)
def list_transactions(
    state_filter: Optional[TransactionState] = Query(None, alias="state"),
    type_filter: Optional[TransactionType] = Query(None, alias="type"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(Permission.VIEW_LEDGER)),
    db: Session = Depends(get_db),
):
    query = select(Transaction)

    # Scoped permissions
    if current_user.role == UserRole.ADMIN:
        pass
    elif current_user.role == UserRole.SUPER_DISTRIBUTOR:
        sub_users = select(User.id).where(or_(User.id == current_user.id, User.parent_id == current_user.id))
        query = query.where(Transaction.user_id.in_(sub_users))
    elif current_user.role == UserRole.AREA_DISTRIBUTOR:
        sub_users = select(User.id).where(or_(User.id == current_user.id, User.parent_id == current_user.id))
        query = query.where(Transaction.user_id.in_(sub_users))
    elif current_user.role == UserRole.RETAILER:
        query = query.where(Transaction.user_id == current_user.id)

    if state_filter:
        query = query.where(Transaction.state == state_filter)
    if type_filter:
        query = query.where(Transaction.transaction_type == type_filter)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    total_pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit

    txns = list(
        db.scalars(
            query.order_by(desc(Transaction.created_at))
            .offset(offset)
            .limit(limit)
        ).all()
    )

    meta = PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )
    return PaginatedTransactionResponse(
        items=[TransactionResponse.model_validate(t) for t in txns],
        meta=meta,
    )


@router.get(
    "/transactions/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get Transaction Details",
    description="Retrieves a single transaction. Returns 404 if out of authorized scope.",
)
def get_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permission.VIEW_LEDGER)),
    db: Session = Depends(get_db),
):
    txn = db.scalar(select(Transaction).where(Transaction.id == transaction_id))
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    # Scoping check
    if current_user.role != UserRole.ADMIN and txn.user_id != current_user.id:
        # Check hierarchy
        owner = db.scalar(select(User).where(User.id == txn.user_id))
        if not owner or owner.parent_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    return TransactionResponse.model_validate(txn)


@router.get(
    "/transactions/{transaction_id}/journals",
    response_model=List[JournalEntryResponse],
    summary="Get Transaction Journal Entries",
    description="Returns double-entry balanced postings and audit trail for a transaction.",
)
def get_transaction_journals(
    transaction_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permission.VIEW_LEDGER)),
    db: Session = Depends(get_db),
):
    txn = db.scalar(select(Transaction).where(Transaction.id == transaction_id))
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    if current_user.role != UserRole.ADMIN and txn.user_id != current_user.id:
        owner = db.scalar(select(User).where(User.id == txn.user_id))
        if not owner or owner.parent_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    journals = list(db.scalars(select(JournalEntry).where(JournalEntry.transaction_id == transaction_id)).all())
    return [JournalEntryResponse.model_validate(j) for j in journals]


@router.post(
    "/transactions/{transaction_id}/refund",
    response_model=TransactionResponse,
    summary="Request Transaction Refund",
    description="Initiates linked reversal/refund workflow. Disallows double refunds.",
)
def request_transaction_refund(
    transaction_id: uuid.UUID,
    data: RefundRequest,
    request: Request,
    current_user: User = Depends(require_permission(Permission.MANAGE_REFUNDS)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    refund_txn = PaymentService.request_refund(
        actor=current_user,
        original_transaction_id=transaction_id,
        reason=data.reason,
        idempotency_key=data.idempotency_key,
        db=db,
        amount=data.amount,
        client_ip=client_ip,
    )
    return TransactionResponse.model_validate(refund_txn)


@router.post(
    "/transactions/{transaction_id}/resolve",
    response_model=TransactionResponse,
    summary="Resolve Unknown Transaction (Case D)",
    description="Queries banking switch status for pending/unknown payments, committing or releasing reservations.",
)
def resolve_unknown_transaction(
    transaction_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_permission(Permission.MANAGE_REFUNDS)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    resolved_txn = PaymentService.verify_and_resolve_unknown(
        actor=current_user,
        transaction_id=transaction_id,
        db=db,
        client_ip=client_ip,
    )
    return TransactionResponse.model_validate(resolved_txn)


@router.post(
    "/webhook",
    summary="Banking Provider Webhook Endpoint",
    description="Processes asynchronous status updates with HMAC-SHA256 signature verification and replay protection.",
)
async def handle_provider_webhook(
    request: Request,
    x_provider_signature: Optional[str] = Header(None, alias="X-Provider-Signature"),
    db: Session = Depends(get_db),
):
    body = await request.body()
    result = PaymentService.process_webhook_callback(
        payload_bytes=body,
        signature_header=x_provider_signature or "",
        db=db,
    )
    return result


@router.post(
    "/reconciliation/run",
    response_model=BatchReconciliationResponse,
    summary="Execute Batch Provider Reconciliation",
    description="Audits platform ledger against external banking report snapshot and flags discrepancies.",
)
def run_batch_reconciliation(
    batch_date: str = Query(..., description="Reconciliation report date (YYYY-MM-DD)"),
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    result = PaymentService.reconcile_batch(batch_date=batch_date, db=db)
    return BatchReconciliationResponse(**result)


@router.get(
    "/notifications",
    response_model=List[NotificationOutboxResponse],
    summary="List Transactional Notification Outbox",
    description="Monitors queued and delivered customer notification events.",
)
def list_notification_outbox(
    transaction_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(require_permission(Permission.VIEW_LEDGER)),
    db: Session = Depends(get_db),
):
    query = select(NotificationOutbox)
    if transaction_id:
        query = query.where(NotificationOutbox.transaction_id == transaction_id)

    outbox_entries = list(db.scalars(query.order_by(desc(NotificationOutbox.created_at)).limit(50)).all())
    return [NotificationOutboxResponse.model_validate(n) for n in outbox_entries]
