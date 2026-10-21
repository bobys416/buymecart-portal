import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_permission
from app.core.config import settings
from app.core.permissions import Permission
from app.models.audit_log import AuditLog
from app.models.ledger import (
    ProviderReconciliationRecord,
    Transaction,
    TransactionState,
    TransactionType,
)
from app.models.onboarding import ApplicationStatus, OnboardingApplication
from app.models.user import User, UserRole
from app.schemas.ledger import PaginatedTransactionResponse, TransactionResponse
from app.schemas.network import PaginationMeta
from app.schemas.provider import (
    AuditLogResponse,
    DiscrepancyRecordResponse,
    ManualEscalateRequest,
    OperationalMonitoringOverview,
    ProviderHealthResponse,
    ProviderListResponse,
    ResolveDiscrepancyRequest,
    TriggerReconciliationResponse,
)
from app.services.payment_provider import ProviderRegistry, get_payment_provider
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/providers", tags=["Banking Providers & Reconciliation Operations"])


@router.get(
    "/status",
    response_model=ProviderListResponse,
    summary="Get Banking Providers Health and Configuration Status",
    description="Returns public health checks and configuration status for registered providers without exposing secrets.",
)
def get_providers_status(
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
):
    providers_info = ProviderRegistry.list_providers()
    return ProviderListResponse(
        providers=[ProviderHealthResponse(**p) for p in providers_info],
        active_mode=settings.PAYMENT_PROVIDER_MODE,
        live_banking_enabled=settings.ENABLE_LIVE_BANKING,
    )


@router.get(
    "/monitoring/overview",
    response_model=OperationalMonitoringOverview,
    summary="Operational Monitoring Overview & Backlog Metrics",
    description="Provides real-time telemetry on KYC review backlog, unresolved transactions, pending refunds, and reconciliation discrepancies without exposing sensitive PII.",
)
def get_monitoring_overview(
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    # KYC review backlog metrics
    submitted_kyc = db.scalar(
        select(func.count(OnboardingApplication.id)).where(OnboardingApplication.status == ApplicationStatus.SUBMITTED)
    ) or 0
    under_review_kyc = db.scalar(
        select(func.count(OnboardingApplication.id)).where(OnboardingApplication.status == ApplicationStatus.UNDER_REVIEW)
    ) or 0

    # Transaction unresolved metrics
    unknown_txns = db.scalar(
        select(func.count(Transaction.id)).where(Transaction.state == TransactionState.UNKNOWN)
    ) or 0
    pending_txns = db.scalar(
        select(func.count(Transaction.id)).where(Transaction.state == TransactionState.PENDING)
    ) or 0
    manual_review_txns = db.scalar(
        select(func.count(Transaction.id)).where(Transaction.state == TransactionState.MANUAL_REVIEW)
    ) or 0

    # Pending refunds
    refund_pending = db.scalar(
        select(func.count(Transaction.id)).where(Transaction.state == TransactionState.REFUND_PENDING)
    ) or 0
    reversal_pending = db.scalar(
        select(func.count(Transaction.id)).where(Transaction.state == TransactionState.REVERSAL_PENDING)
    ) or 0

    # Reconciliation discrepancies
    unresolved_discrepancies = db.scalar(
        select(func.count(ProviderReconciliationRecord.id)).where(
            ProviderReconciliationRecord.discrepancy_detected == True,
            ProviderReconciliationRecord.resolved == False,
        )
    ) or 0
    total_discrepancies = db.scalar(
        select(func.count(ProviderReconciliationRecord.id)).where(
            ProviderReconciliationRecord.discrepancy_detected == True
        )
    ) or 0

    providers_info = ProviderRegistry.list_providers()

    total_unresolved = unknown_txns + pending_txns + manual_review_txns
    is_degraded = (total_unresolved > 50) or (unresolved_discrepancies > 10)
    system_health = "DEGRADED" if is_degraded else "HEALTHY"

    return OperationalMonitoringOverview(
        timestamp=datetime.now(timezone.utc),
        kyc_review_backlog={
            "submitted": submitted_kyc,
            "under_review": under_review_kyc,
            "total_backlog": submitted_kyc + under_review_kyc,
        },
        transactions_unresolved={
            "unknown": unknown_txns,
            "pending": pending_txns,
            "manual_review": manual_review_txns,
            "total": total_unresolved,
        },
        refunds_pending={
            "refund_pending": refund_pending,
            "reversal_pending": reversal_pending,
            "total": refund_pending + reversal_pending,
        },
        reconciliation_discrepancies={
            "unresolved": unresolved_discrepancies,
            "total_recorded": total_discrepancies,
        },
        banking_providers=[ProviderHealthResponse(**p) for p in providers_info],
        system_health=system_health,
    )


@router.get(
    "/lookup",
    response_model=TransactionResponse,
    summary="Lookup Transaction by Platform or Provider Reference",
    description="Searches for transactions using stable internal reference or external provider reference.",
)
def lookup_transaction(
    reference: Optional[str] = Query(None, description="Internal platform reference (e.g. TXN-PAY-XXXX)"),
    provider_reference: Optional[str] = Query(None, description="External provider transaction reference"),
    current_user: User = Depends(require_permission(Permission.VIEW_LEDGER)),
    db: Session = Depends(get_db),
):
    if not reference and not provider_reference:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either 'reference' or 'provider_reference' for lookup.",
        )

    query = select(Transaction)
    if reference:
        query = query.where(Transaction.transaction_reference == reference)
    elif provider_reference:
        query = query.where(Transaction.provider_transaction_id == provider_reference)

    txn = db.scalar(query)
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    # Scoping check for non-admin users
    if current_user.role != UserRole.ADMIN and txn.user_id != current_user.id:
        owner = db.scalar(select(User).where(User.id == txn.user_id))
        if not owner or owner.parent_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    return TransactionResponse.model_validate(txn)


@router.get(
    "/unresolved",
    response_model=PaginatedTransactionResponse,
    summary="List Unresolved Transactions Queue",
    description="Returns transactions in UNKNOWN, PENDING, or MANUAL_REVIEW states awaiting settlement or manual intervention.",
)
def list_unresolved_queue(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    query = select(Transaction).where(
        Transaction.state.in_([
            TransactionState.UNKNOWN,
            TransactionState.PENDING,
            TransactionState.MANUAL_REVIEW,
        ])
    )

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
        page_size=limit,
        total_items=total,
        total_pages=total_pages,
    )
    return PaginatedTransactionResponse(
        items=[TransactionResponse.model_validate(t) for t in txns],
        meta=meta,
    )


@router.get(
    "/refunds/pending",
    response_model=PaginatedTransactionResponse,
    summary="List Pending Refunds and Reversals",
    description="Monitors refunds and reversals currently awaiting provider confirmation or manual intervention.",
)
def list_pending_refunds(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(Permission.MANAGE_REFUNDS)),
    db: Session = Depends(get_db),
):
    query = select(Transaction).where(
        Transaction.state.in_([
            TransactionState.REFUND_PENDING,
            TransactionState.REVERSAL_PENDING,
        ])
    )

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
        page_size=limit,
        total_items=total,
        total_pages=total_pages,
    )
    return PaginatedTransactionResponse(
        items=[TransactionResponse.model_validate(t) for t in txns],
        meta=meta,
    )


@router.get(
    "/reconciliation/discrepancies",
    response_model=List[DiscrepancyRecordResponse],
    summary="List Reconciliation Discrepancies",
    description="Returns discrepancies detected between internal platform ledger and external provider reports.",
)
def list_discrepancies(
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    query = select(ProviderReconciliationRecord).where(ProviderReconciliationRecord.discrepancy_detected.is_(True))
    if resolved is not None:
        query = query.where(ProviderReconciliationRecord.resolved == resolved)

    records = list(
        db.scalars(query.order_by(desc(ProviderReconciliationRecord.reconciled_at)).limit(100)).all()
    )
    return [DiscrepancyRecordResponse.model_validate(r) for r in records]


@router.post(
    "/reconciliation/discrepancies/{discrepancy_id}/resolve",
    response_model=DiscrepancyRecordResponse,
    summary="Resolve Reconciliation Discrepancy",
    description="Marks a detected settlement mismatch or missing transaction as resolved with audit explanation.",
)
def resolve_discrepancy(
    discrepancy_id: uuid.UUID,
    data: ResolveDiscrepancyRequest,
    request: Request,
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    record = db.scalar(
        select(ProviderReconciliationRecord).where(ProviderReconciliationRecord.id == discrepancy_id)
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reconciliation record not found.")

    record.resolved = True
    record.resolution_notes = data.resolution_notes

    client_ip = request.client.host if request.client else "unknown"
    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        actor_login_id=current_user.login_id,
        action="RESOLVE_RECONCILIATION_DISCREPANCY",
        target_id=record.id,
        target_type="RECONCILIATION_RECORD",
        actor_ip=client_ip,
        metadata_json=json.dumps({"notes": data.resolution_notes, "batch_id": record.reconciliation_batch_id}),
    )
    db.add(audit)
    db.commit()
    db.refresh(record)
    return DiscrepancyRecordResponse.model_validate(record)


@router.post(
    "/transactions/{transaction_id}/inquire",
    response_model=TransactionResponse,
    summary="Authoritative Status Inquiry with Provider",
    description="Queries banking switch status for an unresolved or pending transaction and applies verified state changes.",
)
def inquire_transaction_status(
    transaction_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
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
    "/transactions/{transaction_id}/escalate",
    response_model=TransactionResponse,
    summary="Escalate Transaction to Manual Review Queue",
    description="Operator control to flag an ambiguous or disputed transaction for manual compliance review.",
)
def escalate_to_manual_review(
    transaction_id: uuid.UUID,
    data: ManualEscalateRequest,
    request: Request,
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    txn = db.scalar(select(Transaction).where(Transaction.id == transaction_id))
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    if txn.state in [TransactionState.SUCCESS, TransactionState.REFUNDED, TransactionState.REVERSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot escalate transaction in finalized state '{txn.state.value}'.",
        )

    txn.state = TransactionState.MANUAL_REVIEW
    txn.provider_failure_reason = f"Manually escalated by {current_user.login_id}: {data.reason}"

    client_ip = request.client.host if request.client else "unknown"
    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        actor_login_id=current_user.login_id,
        action="MANUAL_REVIEW_ESCALATION",
        target_id=txn.id,
        target_type="TRANSACTION",
        actor_ip=client_ip,
        metadata_json=json.dumps({"reason": data.reason, "reference": txn.transaction_reference}),
    )
    db.add(audit)
    db.commit()
    db.refresh(txn)
    return TransactionResponse.model_validate(txn)


@router.post(
    "/reconciliation/trigger-auto",
    response_model=TriggerReconciliationResponse,
    summary="Trigger Automated Background Reconciliation",
    description="Durable execution endpoint for status inquiry jobs across pending transactions and refunds.",
)
def trigger_auto_reconciliation(
    current_user: User = Depends(require_permission(Permission.RECONCILE_PAYMENTS)),
    db: Session = Depends(get_db),
):
    unresolved_res = PaymentService.reconcile_unresolved_transactions(db=db)
    refunds_res = PaymentService.reconcile_pending_refunds(db=db)

    return TriggerReconciliationResponse(
        unresolved_reconciled=unresolved_res,
        refunds_reconciled=refunds_res,
        executed_at=datetime.now(timezone.utc),
    )


@router.get(
    "/transactions/{transaction_id}/audit-trail",
    response_model=List[AuditLogResponse],
    summary="Get Transaction Audit Trail",
    description="Returns chronological audit logs and state changes for a transaction.",
)
def get_transaction_audit_trail(
    transaction_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permission.ACCESS_REPORTS)),
    db: Session = Depends(get_db),
):
    logs = list(
        db.scalars(
            select(AuditLog)
            .where(AuditLog.target_id == transaction_id, AuditLog.target_type == "TRANSACTION")
            .order_by(desc(AuditLog.created_at))
        ).all()
    )
    return [AuditLogResponse.model_validate(log) for log in logs]
