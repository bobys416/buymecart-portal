import json
import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import desc, select
from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.ledger import (
    AccountType,
    EntryDirection,
    FinancialAccount,
    IncomingWebhookEvent,
    JournalEntry,
    NotificationEventType,
    NotificationOutbox,
    PaymentRail,
    ProviderReconciliationRecord,
    Transaction,
    TransactionState,
    TransactionType,
)
from app.models.user import User, UserRole
from app.services.ledger_service import LedgerService
from app.services.payment_provider import (
    MockBankingProviderAdapter,
    ProviderPaymentResult,
    ProviderRegistry,
    get_payment_provider,
)
from app.services.payment_service import PaymentService


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(autouse=True)
def reset_provider_state():
    """Resets the mock provider adapter before each test."""
    provider = get_payment_provider()
    provider.simulation_mode = "SUCCESS"
    provider._external_ledger.clear()
    provider._external_refunds.clear()
    provider._processed_webhook_ids.clear()
    provider._ref_map.clear()


# ==============================================================================
# 1. Successful payment
# ==============================================================================
def test_01_successful_payment(client: TestClient, db_session):
    """
    Validates end-to-end successful payment:
    - Active caller check.
    - Internal funds reservation.
    - Provider invocation with stable reference.
    - Reservation committed and balanced double-entry ledger posted.
    - Customer notification queued.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    # Topup merchant wallet
    topup_res = client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-01"},
    )
    assert topup_res.status_code == 201

    provider = get_payment_provider()
    provider.set_simulation_mode("SUCCESS")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-01"},
        json={
            "amount": 250.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Test Merchant Store",
            "beneficiary_account": "merchant@okaxis",
            "beneficiary_ifsc": "UTIB0000001",
        },
    )
    assert pay_res.status_code == 201
    data = pay_res.json()
    assert data["state"] == "SUCCESS"
    assert data["provider_id"] == "mock_switch"
    assert data["provider_transaction_id"] is not None

    txn_id = uuid.UUID(data["id"])
    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    assert txn.reservation.is_committed is True

    # Check balanced journal entry
    journals = list(db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == txn_id)).all())
    assert len(journals) == 1
    assert journals[0].is_balanced is True

    # Verify notification queued
    notif = db_session.scalar(
        select(NotificationOutbox).where(
            NotificationOutbox.transaction_id == txn_id,
            NotificationOutbox.event_type == NotificationEventType.PAYMENT_SUCCESS,
        )
    )
    assert notif is not None


# ==============================================================================
# 2. Confirmed payment failure
# ==============================================================================
def test_02_confirmed_payment_failure(client: TestClient, db_session):
    """
    Payment failure without external debit:
    - Provider rejects transaction before debit.
    - Internal funds reservation is released immediately.
    - Transaction marked FAILED, no debited ledger postings created.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 500.0, "idempotency_key": "topup-test-p5-02"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("FAIL_NO_DEBIT")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-02"},
        json={
            "amount": 200.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Declined Beneficiary",
            "beneficiary_account": "999888777",
            "beneficiary_ifsc": "SBIN0000001",
        },
    )
    assert pay_res.status_code == 201
    data = pay_res.json()
    assert data["state"] == "FAILED"
    assert data["provider_failure_code"] == "INSUFFICIENT_CUSTOMER_FUNDS"

    txn_id = uuid.UUID(data["id"])
    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    assert txn.reservation.is_released is True
    assert txn.reservation.is_committed is False

    # Ensure no postings created
    journals = list(db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == txn_id)).all())
    assert len(journals) == 0


# ==============================================================================
# 3. Timeout with unknown status
# ==============================================================================
def test_03_timeout_with_unknown_status(client: TestClient, db_session):
    """
    Timeout / Network error during external request:
    - Never assume timeout means failure.
    - State set to UNKNOWN.
    - Funds reservation remains locked to prevent double spending.
    - Retry metadata initialized with exponential backoff.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-03"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("TIMEOUT")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-03"},
        json={
            "amount": 350.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Timeout Beneficiary",
            "beneficiary_account": "timeout@bank",
            "beneficiary_ifsc": "HDFC0000001",
        },
    )
    assert pay_res.status_code == 201
    data = pay_res.json()
    assert data["state"] == "UNKNOWN"

    txn_id = uuid.UUID(data["id"])
    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    assert txn.reservation.is_committed is False
    assert txn.reservation.is_released is False
    assert txn.next_retry_at is not None
    assert txn.retry_count == 0


# ==============================================================================
# 4. Forged callback rejected
# ==============================================================================
def test_04_forged_callback_rejected(client: TestClient, db_session):
    """
    Callback with invalid or tampered HMAC signature is rejected with HTTP 401.
    """
    payload = {
        "event_id": "forged-event-01",
        "provider_transaction_id": "PROV-FORGED-01",
        "status": "SUCCESS",
        "amount": 500.0,
    }
    raw_bytes = json.dumps(payload).encode("utf-8")

    res = client.post(
        "/api/v1/ledger/webhook",
        content=raw_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": "forged_hex_signature_123"},
    )
    assert res.status_code == 401
    assert "Invalid webhook signature" in res.json()["detail"]


# ==============================================================================
# 5. Duplicate callback idempotency
# ==============================================================================
def test_05_duplicate_callback_idempotency(client: TestClient, db_session):
    """
    Replay protection using persistent IncomingWebhookEvent table:
    - First callback processes and transitions transaction.
    - Duplicate callback with identical event_id is ignored idempotently.
    - Ledger is not credited/debited twice.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-05"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("PENDING")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-05"},
        json={
            "amount": 400.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Async Store",
            "beneficiary_account": "store@upi",
            "beneficiary_ifsc": "ICIC0000001",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    assert txn_data["state"] == "UNKNOWN"

    event_id = f"evt-replay-{uuid.uuid4().hex[:8]}"
    payload = {
        "event_id": event_id,
        "provider_transaction_id": txn_data["provider_transaction_id"] or "PROV-TXN-ASYNC",
        "transaction_reference": txn_data["transaction_reference"],
        "status": "SUCCESS",
        "amount": 400.0,
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = provider.generate_webhook_signature(raw_bytes)

    # First callback delivery
    res1 = client.post(
        "/api/v1/ledger/webhook",
        content=raw_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "processed"

    # Second callback delivery (duplicate replay attack/network replay)
    res2 = client.post(
        "/api/v1/ledger/webhook",
        content=raw_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "DUPLICATE_WEBHOOK_IGNORED"

    # Ensure exactly 1 journal entry exists
    db_session.expire_all()
    txn_id = uuid.UUID(txn_data["id"])
    journals = list(db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == txn_id)).all())
    assert len(journals) == 1


# ==============================================================================
# 6. Out-of-order callback safety
# ==============================================================================
def test_06_out_of_order_callback_safety(client: TestClient, db_session):
    """
    Out-of-order callback protection:
    If a callback for a reversed or refunded transaction arrives reporting SUCCESS,
    it must NOT resurrect the transaction or alter the financial ledger.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-06"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("SUCCESS")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-06"},
        json={
            "amount": 300.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Test Beneficiary",
            "beneficiary_account": "111222333",
            "beneficiary_ifsc": "SBIN0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    txn_id = txn_data["id"]

    # Issue refund transitioning to REFUNDED
    ref_res = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Customer cancellation", "idempotency_key": "ref-p5-06"},
    )
    assert ref_res.status_code == 200

    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == uuid.UUID(txn_id)))
    assert txn.state == TransactionState.REFUNDED

    # Now an out-of-order callback arrives reporting SUCCESS
    payload = {
        "event_id": f"evt-out-of-order-{uuid.uuid4().hex[:8]}",
        "provider_transaction_id": txn.provider_transaction_id,
        "transaction_reference": txn.transaction_reference,
        "status": "SUCCESS",
        "amount": 300.0,
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = provider.generate_webhook_signature(raw_bytes)

    res = client.post(
        "/api/v1/ledger/webhook",
        content=raw_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "ignored"

    # Transaction remains in terminal REFUNDED state
    db_session.expire_all()
    txn_after = db_session.scalar(select(Transaction).where(Transaction.id == uuid.UUID(txn_id)))
    assert txn_after.state == TransactionState.REFUNDED


# ==============================================================================
# 7. Provider amount mismatch
# ==============================================================================
def test_07_provider_amount_mismatch(client: TestClient, db_session):
    """
    Amount mismatch between provider payload and internal transaction:
    - Detects switch discrepancy.
    - Rejects webhook with HTTP 400.
    - Escalates transaction to MANUAL_REVIEW.
    - Records entry in ProviderReconciliationRecord.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-07"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("PENDING")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-07"},
        json={
            "amount": 500.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Amount Mismatch Test",
            "beneficiary_account": "mismatch@upi",
            "beneficiary_ifsc": "YESB0000001",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    txn_id = uuid.UUID(txn_data["id"])

    # Callback arrives claiming amount was 400.0 instead of 500.0!
    payload = {
        "event_id": f"evt-mismatch-{uuid.uuid4().hex[:8]}",
        "provider_transaction_id": txn_data["provider_transaction_id"] or "PROV-TXN-PENDING",
        "transaction_reference": txn_data["transaction_reference"],
        "status": "SUCCESS",
        "amount": 400.0,  # MISMATCH!
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = provider.generate_webhook_signature(raw_bytes)

    res = client.post(
        "/api/v1/ledger/webhook",
        content=raw_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
    )
    assert res.status_code == 400
    assert "Amount mismatch detected" in res.json()["detail"]

    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    assert txn.state == TransactionState.MANUAL_REVIEW

    # Discrepancy record persisted
    disc = db_session.scalar(
        select(ProviderReconciliationRecord).where(
            ProviderReconciliationRecord.transaction_id == txn_id,
            ProviderReconciliationRecord.discrepancy_type == "AMOUNT_MISMATCH",
        )
    )
    assert disc is not None
    assert disc.expected_amount == Decimal("500.0000")
    assert disc.settled_amount == Decimal("400.0000")


# ==============================================================================
# 8. Duplicate payment request
# ==============================================================================
def test_08_duplicate_payment_request(client: TestClient, db_session):
    """
    Submitting the same idempotency key returns the original transaction
    without performing double reservation or double debit.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-08"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("SUCCESS")

    idemp_key = "idemp-dup-pay-key-p5"
    payload = {
        "amount": 150.0,
        "payment_rail": "UPI",
        "beneficiary_name": "Idemp Beneficiary",
        "beneficiary_account": "idemp@upi",
        "beneficiary_ifsc": "HDFC0001234",
    }

    res1 = client.post("/api/v1/ledger/payments", headers={**ret_headers, "Idempotency-Key": idemp_key}, json=payload)
    assert res1.status_code == 201
    txn1 = res1.json()

    # Second submission
    res2 = client.post("/api/v1/ledger/payments", headers={**ret_headers, "Idempotency-Key": idemp_key}, json=payload)
    assert res2.status_code == 201
    txn2 = res2.json()

    assert txn1["id"] == txn2["id"]
    assert txn1["transaction_reference"] == txn2["transaction_reference"]


# ==============================================================================
# 9. Refund timeout
# ==============================================================================
def test_09_refund_timeout_escalates_to_manual_review(client: TestClient, db_session):
    """
    Provider timeout during refund initiation:
    - Original transaction remains intact.
    - Refund transaction is created in MANUAL_REVIEW state.
    - Notification queued for manual review.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-09"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("SUCCESS")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-09"},
        json={
            "amount": 200.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Refund Timeout Beneficiary",
            "beneficiary_account": "ref@upi",
            "beneficiary_ifsc": "HDFC0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_id = pay_res.json()["id"]

    # Now set provider to TIMEOUT for refunds
    provider.set_simulation_mode("TIMEOUT")

    ref_res = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Customer cancellation timeout", "idempotency_key": "ref-timeout-p5-09"},
    )
    assert ref_res.status_code == 200
    ref_data = ref_res.json()
    assert ref_data["state"] == "MANUAL_REVIEW"


# ==============================================================================
# 10. Duplicate refund request
# ==============================================================================
def test_10_duplicate_refund_request_rejected(client: TestClient, db_session):
    """
    Duplicate refund requests for the same obligation are rejected with HTTP 409 Conflict.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-10"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("SUCCESS")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-10"},
        json={
            "amount": 220.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Dup Refund Merchant",
            "beneficiary_account": "dupref@upi",
            "beneficiary_ifsc": "HDFC0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_id = pay_res.json()["id"]

    # First refund request succeeds
    ref1 = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "First refund", "idempotency_key": "ref-dup-key-01"},
    )
    assert ref1.status_code == 200

    # Second refund request for the same transaction
    ref2 = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Second refund", "idempotency_key": "ref-dup-key-02"},
    )
    assert ref2.status_code == 409
    assert "Duplicate refunds disallowed" in ref2.json()["detail"]


# ==============================================================================
# 11. Reconciliation after a delayed success
# ==============================================================================
def test_11_reconciliation_after_delayed_success(client: TestClient, db_session):
    """
    When a transaction was left UNKNOWN due to provider timeout,
    the background reconciliation job queries the provider status,
    detects late confirmation, commits the reservation, and posts balanced ledger entries.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-11"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("TIMEOUT")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-11"},
        json={
            "amount": 180.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Delayed Success Vendor",
            "beneficiary_account": "delay@upi",
            "beneficiary_ifsc": "HDFC0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    assert txn_data["state"] == "UNKNOWN"
    txn_id = uuid.UUID(txn_data["id"])

    # Now restore provider mode to normal inquiry SUCCESS
    provider.set_simulation_mode("SUCCESS")

    # Run automated background reconciliation job
    res = PaymentService.reconcile_unresolved_transactions(db=db_session, force=True)
    assert res["resolved_success"] >= 1

    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    assert txn.state == TransactionState.SUCCESS
    assert txn.completed_at is not None

    # Check balanced journal
    journals = list(db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == txn_id)).all())
    assert len(journals) == 1
    assert journals[0].is_balanced is True

    # Re-running reconciliation must NOT duplicate postings
    res2 = PaymentService.reconcile_unresolved_transactions(db=db_session)
    assert res2["resolved_success"] == 0
    journals2 = list(db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == txn_id)).all())
    assert len(journals2) == 1


# ==============================================================================
# 12. Ledger and provider settlement mismatch
# ==============================================================================
def test_12_ledger_and_provider_settlement_mismatch(client: TestClient, db_session):
    """
    Reconciliation batch detects:
    - Missing transactions in platform.
    - Amount mismatch between provider and internal ledger.
    - Status mismatch.
    - Discrepancy resolution API works with audit notes.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    provider = get_payment_provider()
    ghost_id = f"PROV-GHOST-{uuid.uuid4().hex[:6]}"
    provider._external_ledger[ghost_id] = ProviderPaymentResult(
        status="SUCCESS",
        provider_transaction_id=ghost_id,
        amount=Decimal("999.0000"),
    )

    recon_res = client.post("/api/v1/ledger/reconciliation/run?batch_date=2026-10-21", headers=admin_headers)
    assert recon_res.status_code == 200
    data = recon_res.json()
    assert data["discrepancies_found"] >= 1

    # Fetch discrepancies through admin API
    disc_list_res = client.get("/api/v1/providers/reconciliation/discrepancies", headers=admin_headers)
    assert disc_list_res.status_code == 200
    discrepancies = disc_list_res.json()
    assert len(discrepancies) >= 1

    target_disc = next((d for d in discrepancies if d["provider_transaction_id"] == ghost_id), None)
    assert target_disc is not None
    assert target_disc["discrepancy_type"] == "MISSING_IN_PLATFORM"
    assert target_disc["resolved"] is False

    # Resolve discrepancy
    resolve_res = client.post(
        f"/api/v1/providers/reconciliation/discrepancies/{target_disc['id']}/resolve",
        headers=admin_headers,
        json={"resolution_notes": "Audited with bank relationship manager: ghost entry was test ping."},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["resolved"] is True


# ==============================================================================
# 13. Retry exhaustion and manual escalation
# ==============================================================================
def test_13_retry_exhaustion_and_manual_escalation(client: TestClient, db_session):
    """
    When maximum inquiry retries are exhausted without authoritative confirmation:
    - Automatically transitions to MANUAL_REVIEW.
    - Records AuditLog with RETRY_EXHAUSTION_ESCALATED.
    - Escalates to operations queue (/api/v1/providers/unresolved).
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-test-p5-13"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("TIMEOUT")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-test-p5-13"},
        json={
            "amount": 290.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Exhaustion Beneficiary",
            "beneficiary_account": "exhaust@upi",
            "beneficiary_ifsc": "HDFC0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_id = uuid.UUID(pay_res.json()["id"])

    # Manually simulate retries reaching max_retries
    db_session.expire_all()
    txn = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    txn.retry_count = 3
    txn.max_retries = 3
    txn.next_retry_at = None
    db_session.commit()

    # Trigger reconciliation
    res = PaymentService.reconcile_unresolved_transactions(db=db_session)
    assert res["escalated_manual"] >= 1

    db_session.expire_all()
    txn_after = db_session.scalar(select(Transaction).where(Transaction.id == txn_id))
    assert txn_after.state == TransactionState.MANUAL_REVIEW

    # Check AuditLog entry
    audit = db_session.scalar(
        select(AuditLog).where(
            AuditLog.target_id == txn_id,
            AuditLog.action == "RETRY_EXHAUSTION_ESCALATED",
        )
    )
    assert audit is not None

    # Check that transaction is present in unresolved operations queue
    unres_res = client.get("/api/v1/providers/unresolved", headers=admin_headers)
    assert unres_res.status_code == 200
    queue_items = unres_res.json()["items"]
    assert any(item["id"] == str(txn_id) for item in queue_items)


# ==============================================================================
# 14. Provider Admin Operations & Security
# ==============================================================================
def test_14_provider_admin_operations_and_security(client: TestClient, db_session):
    """
    Validates admin APIs:
    - Provider health and configuration without secrets.
    - Transaction lookup by internal or provider reference.
    - Operator-triggered manual escalation.
    - Audit trail retrieval.
    - Role permissions enforcement.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    # 1. Provider health and config status
    status_res = client.get("/api/v1/providers/status", headers=admin_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["active_mode"] == "sandbox"
    assert status_data["live_banking_enabled"] is False

    providers_map = {p["provider_id"]: p for p in status_data["providers"]}
    assert "mock_switch" in providers_map
    assert "razorpay" in providers_map
    assert "icici_cib" in providers_map
    assert providers_map["mock_switch"]["status"] == "HEALTHY"
    assert "DISABLED" in providers_map["razorpay"]["status"]
    assert "DISABLED" in providers_map["icici_cib"]["status"]

    # Verify no credentials leaked
    raw_text = status_res.text
    assert "secret" not in raw_text.lower()
    assert "password" not in raw_text.lower()
    assert "key_secret" not in raw_text.lower()

    # 2. Retailer forbidden from accessing provider health
    ret_denied = client.get("/api/v1/providers/status", headers=ret_headers)
    assert ret_denied.status_code == 403

    # 3. Create a transaction and lookup by reference and provider reference
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 500.0, "idempotency_key": "topup-p5-14"},
    )
    provider = get_payment_provider()
    provider.set_simulation_mode("SUCCESS")
    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-p5-14"},
        json={
            "amount": 100.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Lookup Vendor",
            "beneficiary_account": "lookup@upi",
            "beneficiary_ifsc": "HDFC0001234",
        },
    )
    txn_info = pay_res.json()
    ref = txn_info["transaction_reference"]
    prov_ref = txn_info["provider_transaction_id"]

    # Lookup by internal reference
    lookup1 = client.get(f"/api/v1/providers/lookup?reference={ref}", headers=admin_headers)
    assert lookup1.status_code == 200
    assert lookup1.json()["id"] == txn_info["id"]

    # Lookup by provider reference
    lookup2 = client.get(f"/api/v1/providers/lookup?provider_reference={prov_ref}", headers=admin_headers)
    assert lookup2.status_code == 200
    assert lookup2.json()["id"] == txn_info["id"]

    # 4. Operator manual escalation on pending/unknown
    provider.set_simulation_mode("TIMEOUT")
    pending_pay = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-p5-14-esc"},
        json={
            "amount": 120.0,
            "payment_rail": "UPI",
            "beneficiary_name": "Pending Vendor",
            "beneficiary_account": "pen@upi",
            "beneficiary_ifsc": "HDFC0001234",
        },
    )
    pending_id = pending_pay.json()["id"]

    esc_res = client.post(
        f"/api/v1/providers/transactions/{pending_id}/escalate",
        headers=admin_headers,
        json={"reason": "Customer called reporting disputed debit with bank"},
    )
    assert esc_res.status_code == 200
    assert esc_res.json()["state"] == "MANUAL_REVIEW"

    # 5. Check audit trail
    audit_res = client.get(f"/api/v1/providers/transactions/{pending_id}/audit-trail", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert any(log["action"] == "MANUAL_REVIEW_ESCALATION" for log in logs)
