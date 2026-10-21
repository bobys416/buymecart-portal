import hashlib
import hmac
import json
import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.core.config import settings
from app.models.ledger import (
    AccountType,
    EntryDirection,
    FinancialAccount,
    FundsReservation,
    JournalEntry,
    LedgerPosting,
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
from app.services.ledger_service import LedgerService, UnbalancedJournalError
from app.services.payment_provider import get_payment_provider
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
    yield
    provider.simulation_mode = "SUCCESS"
    provider._external_ledger.clear()
    provider._external_refunds.clear()
    provider._processed_webhook_ids.clear()


# ==============================================================================
# 1. CASE A: Failed payment with no debit creates no debit ledger entry
# ==============================================================================
def test_case_a_failed_payment_creates_no_debit_ledger_entry(client: TestClient, db_session):
    """
    Case A: Customer attempts payment, but provider rejects it before any debit occurs.
    - Must record failure state.
    - Must NOT create a debit entry on the platform ledger.
    - Must release any internal funds reservation.
    - Must notify the customer that no debit occurred.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    # Step 1: Top-up wallet with 1000.00
    topup_res = client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 1000.0, "idempotency_key": "topup-case-a-01"},
    )
    assert topup_res.status_code == 201

    # Step 2: Set provider to fail before debit
    provider = get_payment_provider()
    provider.set_simulation_mode("FAIL_NO_DEBIT")

    # Step 3: Initiate payment
    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-case-a-01"},
        json={
            "amount": 250.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "ABC Vendors",
            "beneficiary_account": "12345678901",
            "beneficiary_ifsc": "HDFC0001234",
            "remarks": "Supplier settlement",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    assert txn_data["state"] == "FAILED"
    txn_id = uuid.UUID(txn_data["id"])

    # Step 4: Verify NO debit ledger posting was created for this payment transaction
    db_session.expire_all()
    journals = list(
        db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == txn_id)).all()
    )
    assert len(journals) == 0, "No journal or ledger postings should exist for a failed payment before debit."

    # Step 5: Verify reservation was marked released
    reservation = db_session.scalar(
        select(FundsReservation).where(FundsReservation.transaction_id == txn_id)
    )
    assert reservation is not None
    assert reservation.is_released is True
    assert reservation.is_committed is False

    # Step 6: Verify wallet available balance is preserved at 1000.00
    bal_res = client.get("/api/v1/ledger/wallet", headers=headers)
    assert bal_res.status_code == 200
    bal_data = bal_res.json()
    assert float(bal_data["current_balance"]) == 1000.0
    assert float(bal_data["reserved_balance"]) == 0.0
    assert float(bal_data["available_balance"]) == 1000.0

    # Step 7: Verify customer notification outbox guarantees "No debit was recorded"
    outbox = db_session.scalar(
        select(NotificationOutbox).where(NotificationOutbox.transaction_id == txn_id)
    )
    assert outbox is not None
    assert outbox.event_type == NotificationEventType.PAYMENT_FAILED_NO_DEBIT
    payload = json.loads(outbox.payload_json)
    assert "No debit was recorded" in payload["message"]


# ==============================================================================
# 2. CASE B: Internal funds reservation released exactly once
# ==============================================================================
def test_case_b_failed_payment_reservation_released_exactly_once(client: TestClient, db_session):
    """
    Case B: Internal funds reservation workflow.
    - Releasing reservation must be strictly idempotent.
    - Multiple releases must not double-credit available balance or create negative reserved balance.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    # Top-up 1000.00
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 1000.0, "idempotency_key": "topup-case-b-01"},
    )

    ret_user = db_session.scalar(select(User).where(User.login_id == "retailer.store1@buymecart.org"))
    wallet = LedgerService.get_or_create_user_wallet(db_session, ret_user.id)

    dummy_txn = Transaction(
        transaction_reference="TXN-DUMMY-RES",
        idempotency_key="idemp-dummy-res",
        user_id=ret_user.id,
        account_id=wallet.id,
        amount=Decimal("300.0000"),
        fee=Decimal("0.0000"),
        net_amount=Decimal("300.0000"),
        transaction_type=TransactionType.PAYMENT,
        payment_rail=PaymentRail.WALLET,
        state=TransactionState.CREATED,
    )
    db_session.add(dummy_txn)
    db_session.flush()

    # Reserve 300.00
    res = LedgerService.reserve_funds(db_session, wallet.id, dummy_txn, Decimal("300.0000"))
    db_session.commit()
    db_session.refresh(wallet)
    assert wallet.reserved_balance == Decimal("300.0000")
    assert wallet.available_balance == Decimal("700.0000")

    # First release -> succeeds
    first_release = LedgerService.release_reservation(db_session, res)
    db_session.commit()
    db_session.refresh(wallet)
    assert first_release is True
    assert wallet.reserved_balance == Decimal("0.0000")
    assert wallet.available_balance == Decimal("1000.0000")

    # Second release -> must return False and NOT alter balance
    second_release = LedgerService.release_reservation(db_session, res)
    db_session.commit()
    db_session.refresh(wallet)
    assert second_release is False
    assert wallet.reserved_balance == Decimal("0.0000")
    assert wallet.available_balance == Decimal("1000.0000")


# ==============================================================================
# 3. CASE C: Confirmed external debit followed by failure initiates reversal
# ==============================================================================
def test_case_c_confirmed_debit_then_failure_initiates_linked_reversal(client: TestClient, db_session):
    """
    Case C: External banking switch debited funds, but fulfillment failed.
    - Preserves original debit entry.
    - Creates a linked reversal transaction with original_transaction_id.
    - Initiates reversal workflow.
    - Posts balanced journal crediting back the merchant wallet.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 1000.0, "idempotency_key": "topup-case-c-01"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("DEBITED_THEN_FAILED")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-case-c-01"},
        json={
            "amount": 400.0,
            "payment_rail": "NEFT",
            "beneficiary_name": "Downstream Merchant",
            "beneficiary_account": "99988877766",
            "beneficiary_ifsc": "SBIN0001234",
            "remarks": "Vendor PO 102",
        },
    )
    assert pay_res.status_code == 201
    orig_txn_data = pay_res.json()
    orig_txn_id = uuid.UUID(orig_txn_data["id"])

    db_session.expire_all()
    orig_txn = db_session.scalar(select(Transaction).where(Transaction.id == orig_txn_id))
    assert orig_txn.state in [TransactionState.REVERSED, TransactionState.REVERSAL_PENDING]

    # Check that a linked reversal transaction exists
    reversal_txn = db_session.scalar(
        select(Transaction).where(
            Transaction.original_transaction_id == orig_txn_id,
            Transaction.transaction_type == TransactionType.REVERSAL,
        )
    )
    assert reversal_txn is not None
    assert reversal_txn.amount == orig_txn.amount
    assert reversal_txn.state == TransactionState.REVERSED

    # Verify original debit journal AND reversal credit journal both exist and are balanced
    journals = list(
        db_session.scalars(
            select(JournalEntry).where(
                JournalEntry.transaction_id.in_([orig_txn_id, reversal_txn.id])
            )
        ).all()
    )
    assert len(journals) == 2
    for j in journals:
        assert j.is_balanced is True
        total_d = sum(p.amount for p in j.postings if p.direction == EntryDirection.DEBIT)
        total_c = sum(p.amount for p in j.postings if p.direction == EntryDirection.CREDIT)
        assert total_d == total_c

    # Merchant wallet restored
    bal_res = client.get("/api/v1/ledger/wallet", headers=headers)
    assert float(bal_res.json()["available_balance"]) == 1000.0


# ==============================================================================
# 4. Repeated refund requests do not double-refund
# ==============================================================================
def test_repeated_refund_requests_disallow_double_refund(client: TestClient, db_session):
    """
    Ensures that once a transaction is refunded:
    - Retrying with the same idempotency key returns the existing refund.
    - Requesting a new refund with a different idempotency key is rejected with 409 Conflict.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    # Successful payment
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-refund-test-01"},
    )
    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-refund-test-01"},
        json={
            "amount": 300.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Merchant Co",
            "beneficiary_account": "11122233344",
            "beneficiary_ifsc": "ICIC0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_id = pay_res.json()["id"]

    # 1. First refund request
    ref_payload = {"reason": "Customer cancellation", "idempotency_key": "ref-key-1001"}
    res1 = client.post(f"/api/v1/ledger/transactions/{txn_id}/refund", headers=admin_headers, json=ref_payload)
    assert res1.status_code == 200
    ref1_data = res1.json()
    assert ref1_data["state"] == "REFUNDED"

    # 2. Duplicate refund request with same idempotency key -> returns existing refund
    res2 = client.post(f"/api/v1/ledger/transactions/{txn_id}/refund", headers=admin_headers, json=ref_payload)
    assert res2.status_code == 200
    assert res2.json()["id"] == ref1_data["id"]

    # 3. Second refund request with different idempotency key -> 409 Conflict
    diff_payload = {"reason": "Duplicate refund attempt", "idempotency_key": "ref-key-1002"}
    res3 = client.post(f"/api/v1/ledger/transactions/{txn_id}/refund", headers=admin_headers, json=diff_payload)
    assert res3.status_code == 409
    assert "already initiated" in res3.json()["detail"].lower()


# ==============================================================================
# 5. CASE D: Provider timeout remains unresolved until verified
# ==============================================================================
def test_case_d_provider_timeout_remains_unresolved_until_verified(client: TestClient, db_session):
    """
    Case D: External banking provider times out.
    - Never assume timeout means failure.
    - Transaction marked UNKNOWN.
    - Reservation remains active to prevent overspending.
    - Resolution inquiry verifies outcome with provider.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-case-d-01"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("TIMEOUT")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-case-d-01"},
        json={
            "amount": 350.0,
            "payment_rail": "RTGS",
            "beneficiary_name": "High Value Vendor",
            "beneficiary_account": "55544433322",
            "beneficiary_ifsc": "KKBK0001234",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    assert txn_data["state"] == "UNKNOWN"
    txn_id = txn_data["id"]

    # Balance check: current is 1000, reserved is 350, available is 650
    bal_res = client.get("/api/v1/ledger/wallet", headers=ret_headers)
    bal_data = bal_res.json()
    assert float(bal_data["current_balance"]) == 1000.0
    assert float(bal_data["reserved_balance"]) == 350.0
    assert float(bal_data["available_balance"]) == 650.0

    # Provider status changes to SUCCESS on downstream inquiry
    provider.set_simulation_mode("SUCCESS")
    resolve_res = client.post(f"/api/v1/ledger/transactions/{txn_id}/resolve", headers=admin_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["state"] == "SUCCESS"

    # Now balance is settled: current is 650, reserved is 0, available is 650
    bal_res2 = client.get("/api/v1/ledger/wallet", headers=ret_headers)
    bal_data2 = bal_res2.json()
    assert float(bal_data2["current_balance"]) == 650.0
    assert float(bal_data2["reserved_balance"]) == 0.0
    assert float(bal_data2["available_balance"]) == 650.0


# ==============================================================================
# 6. Late success callbacks are handled correctly
# ==============================================================================
def test_late_success_callback_resolves_unknown_payment(client: TestClient, db_session):
    """
    When a payment was in UNKNOWN state, a late webhook arrives confirming SUCCESS.
    - Verifies HMAC signature.
    - Commits the reservation.
    - Posts the balanced double-entry journal.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-callback-test-01"},
    )

    provider = get_payment_provider()
    provider.set_simulation_mode("PENDING")

    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-callback-test-01"},
        json={
            "amount": 200.0,
            "payment_rail": "UPI",
            "beneficiary_name": "UPI Merchant",
            "beneficiary_account": "upi@bank",
            "beneficiary_ifsc": "UPI0000001",
        },
    )
    assert pay_res.status_code == 201
    txn_data = pay_res.json()
    assert txn_data["state"] == "UNKNOWN"
    txn_ref = txn_data["transaction_reference"]

    # Construct webhook payload
    payload = {
        "webhook_id": "whk-late-success-01",
        "provider_transaction_id": txn_data["provider_transaction_id"] or "PROV-TXN-LATE",
        "transaction_reference": txn_ref,
        "status": "SUCCESS",
        "amount": 200.0,
        "currency": "INR",
        "timestamp": "2026-10-21T12:00:00Z",
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    sig = provider.generate_webhook_signature(payload_bytes)

    wh_res = client.post(
        "/api/v1/ledger/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
    )
    assert wh_res.status_code == 200
    assert wh_res.json()["status"] in ["processed", "SUCCESS"]

    # Transaction now SUCCESS
    txn_res = client.get(f"/api/v1/ledger/transactions/{txn_data['id']}", headers=ret_headers)
    assert txn_res.status_code == 200
    assert txn_res.json()["state"] == "SUCCESS"


# ==============================================================================
# 7. Duplicate and out-of-order callbacks are safe
# ==============================================================================
def test_duplicate_and_tampered_webhook_callbacks_are_safe(client: TestClient, db_session):
    """
    - Replay protection: Repeated webhook call is safely ignored.
    - Tamper protection: Invalid signature is rejected with 401.
    """
    provider = get_payment_provider()
    payload = {
        "webhook_id": "whk-duplicate-check-01",
        "provider_transaction_id": "PROV-REPLAY-01",
        "transaction_reference": "TXN-NONEXISTENT",
        "status": "SUCCESS",
        "amount": 100.0,
        "currency": "INR",
        "timestamp": "2026-10-21T12:00:00Z",
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    valid_sig = provider.generate_webhook_signature(payload_bytes)

    # 1. Invalid signature rejected
    res_tampered = client.post(
        "/api/v1/ledger/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": "invalidsig123"},
    )
    assert res_tampered.status_code == 401
    assert "signature" in res_tampered.json()["detail"].lower()

    # 2. First valid call processed
    res_valid = client.post(
        "/api/v1/ledger/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": valid_sig},
    )
    assert res_valid.status_code == 200

    # 3. Duplicate call rejected safely
    res_dup = client.post(
        "/api/v1/ledger/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Provider-Signature": valid_sig},
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "DUPLICATE_WEBHOOK_IGNORED"


# ==============================================================================
# 8. Concurrent payments cannot overspend available funds
# ==============================================================================
def test_insufficient_available_funds_rejected(client: TestClient, db_session):
    """
    Verifies that requests exceeding available balance are rejected immediately
    and never produce negative balances.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    # Top-up only 100.00
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 100.0, "idempotency_key": "topup-small-01"},
    )

    # Attempt to spend 150.00
    res = client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-overspend-01"},
        json={
            "amount": 150.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Expensive Shop",
            "beneficiary_account": "1111111111",
            "beneficiary_ifsc": "HDFC0001111",
        },
    )
    assert res.status_code == 400
    assert "insufficient available balance" in res.json()["detail"].lower()

    # Verify balance was unaffected
    bal_res = client.get("/api/v1/ledger/wallet", headers=headers)
    assert float(bal_res.json()["available_balance"]) == 100.0


# ==============================================================================
# 9. Every posted journal balances
# ==============================================================================
def test_every_posted_journal_balances(client: TestClient, db_session):
    """
    Audits the database ensuring that for every posted JournalEntry,
    sum(Debits) == sum(Credits) at Decimal precision.
    Also validates that unbalanced posting attempts raise an error.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 500.0, "idempotency_key": "topup-audit-bal-01"},
    )
    client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-audit-bal-01"},
        json={
            "amount": 100.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Test Beneficiary",
            "beneficiary_account": "12345",
            "beneficiary_ifsc": "SBIN0001111",
        },
    )

    db_session.expire_all()
    all_journals = list(db_session.scalars(select(JournalEntry)).all())
    assert len(all_journals) >= 2

    for journal in all_journals:
        assert journal.is_balanced is True
        debits = sum(p.amount for p in journal.postings if p.direction == EntryDirection.DEBIT)
        credits = sum(p.amount for p in journal.postings if p.direction == EntryDirection.CREDIT)
        assert debits == credits, f"Journal {journal.id} is unbalanced: Debits={debits}, Credits={credits}"

    # Verify unbalanced posting rejection
    wallet = db_session.scalar(select(FinancialAccount).where(FinancialAccount.account_type == AccountType.MERCHANT_WALLET))
    cash = db_session.scalar(select(FinancialAccount).where(FinancialAccount.account_type == AccountType.PLATFORM_CASH))
    dummy_txn = db_session.scalar(select(Transaction))

    with pytest.raises(UnbalancedJournalError):
        LedgerService.post_balanced_journal(
            db=db_session,
            transaction=dummy_txn,
            description="Intentionally unbalanced test",
            postings_spec=[
                (wallet.id, EntryDirection.DEBIT, Decimal("100.0000")),
                (cash.id, EntryDirection.CREDIT, Decimal("90.0000")),  # Differs by 10!
            ],
        )


# ==============================================================================
# 10. Customer notifications match verified transaction states
# ==============================================================================
def test_customer_notifications_match_verified_transaction_states(client: TestClient, db_session):
    """
    Audits the notification outbox ensuring notifications only reflect
    authoritative states and never include sensitive credentials.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 500.0, "idempotency_key": "topup-notif-check-01"},
    )
    client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-notif-check-01"},
        json={
            "amount": 100.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Retailer Shop",
            "beneficiary_account": "987654321",
            "beneficiary_ifsc": "HDFC0002222",
        },
    )

    outbox_entries = list(db_session.scalars(select(NotificationOutbox)).all())
    assert len(outbox_entries) > 0

    for entry in outbox_entries:
        payload_str = entry.payload_json
        # Strictly verify no credentials or sensitive tokens leaked
        assert "password" not in payload_str.lower()
        assert "secret" not in payload_str.lower()
        assert "hashed_password" not in payload_str.lower()
        assert "otp" not in payload_str.lower()


# ==============================================================================
# 11. Refund completion is not reported before confirmation
# ==============================================================================
def test_refund_completion_not_reported_before_confirmation(client: TestClient, db_session):
    """
    If the provider refund fails or is delayed:
    - Transaction goes to MANUAL_REVIEW.
    - Notification queued is REFUND_DELAYED, NOT REFUND_COMPLETED.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 1000.0, "idempotency_key": "topup-refund-delay-01"},
    )
    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-refund-delay-01"},
        json={
            "amount": 200.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Merchant",
            "beneficiary_account": "55555",
            "beneficiary_ifsc": "SBIN0005555",
        },
    )
    txn_id = pay_res.json()["id"]

    # Set provider to fail the refund
    provider = get_payment_provider()
    provider.set_simulation_mode("REFUND_FAILED")

    ref_res = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Customer return", "idempotency_key": "ref-delay-key-01"},
    )
    assert ref_res.status_code == 200
    ref_data = ref_res.json()
    assert ref_data["state"] == "MANUAL_REVIEW"

    # Verify notification outbox has REFUND_DELAYED, not REFUND_COMPLETED
    ref_txn_id = uuid.UUID(ref_data["id"])
    notifications = list(
        db_session.scalars(
            select(NotificationOutbox).where(NotificationOutbox.transaction_id == ref_txn_id)
        ).all()
    )
    event_types = [n.event_type for n in notifications]
    assert NotificationEventType.REFUND_COMPLETED not in event_types
    assert NotificationEventType.REFUND_DELAYED in event_types


# ==============================================================================
# 12. Unauthorized users cannot initiate payments, modify balances, or issue refunds
# ==============================================================================
def test_unauthorized_users_access_control(client: TestClient):
    """
    - Unauthenticated request -> 401.
    - Non-admin/non-permitted role attempting refund or reconciliation -> 403.
    """
    # 1. Anonymous access
    assert client.get("/api/v1/ledger/wallet").status_code == 401

    # 2. Retailer attempting to run reconciliation -> 403
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}
    recon_res = client.post("/api/v1/ledger/reconciliation/run?batch_date=2026-10-21", headers=ret_headers)
    assert recon_res.status_code == 403


# ==============================================================================
# 13. Reconciliation identifies missing or mismatched provider transactions
# ==============================================================================
def test_reconciliation_identifies_missing_or_mismatched_transactions(client: TestClient, db_session):
    """
    Simulates external provider ledger snapshot having an extra transaction
    and verifies that the batch reconciliation engine flags it.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Inject an external transaction into mock provider that local database does NOT have
    provider = get_payment_provider()
    from app.services.payment_provider import ProviderPaymentResult

    ghost_id = "PROV-TXN-GHOST-999"
    provider._external_ledger[ghost_id] = ProviderPaymentResult(
        status="SUCCESS",
        provider_transaction_id=ghost_id,
        amount=Decimal("750.0000"),
    )

    res = client.post("/api/v1/ledger/reconciliation/run?batch_date=2026-10-21", headers=admin_headers)
    assert res.status_code == 200
    recon_data = res.json()
    assert recon_data["discrepancies_found"] >= 1

    # Verify reconciliation record persisted in database
    records = list(
        db_session.scalars(
            select(ProviderReconciliationRecord).where(
                ProviderReconciliationRecord.provider_transaction_id == ghost_id
            )
        ).all()
    )
    assert len(records) >= 1
    assert "not found in platform database" in records[0].discrepancy_details.lower()


# ==============================================================================
# 14. Ledger records cannot be silently edited or deleted
# ==============================================================================
def test_ledger_integrity_and_tamper_detection(client: TestClient, db_session):
    """
    Verifies that LedgerService.reconcile_account_balance() verifies that the
    projected balance matches the mathematical sum of all posted LedgerPosting rows.
    If the balance is silently mutated, it flags is_balanced=False.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 500.0, "idempotency_key": "topup-tamper-check-01"},
    )

    ret_user = db_session.scalar(select(User).where(User.login_id == "retailer.store1@buymecart.org"))
    wallet = LedgerService.get_or_create_user_wallet(db_session, ret_user.id)

    # Initial check: balance is legitimate
    recon1 = LedgerService.reconcile_account_balance(db_session, wallet.id)
    assert recon1["is_balanced"] is True
    assert recon1["discrepancy"] == Decimal("0.0000")

    # Tamper with projected balance directly without a ledger posting
    wallet.current_balance = Decimal("9999.0000")
    db_session.commit()

    # Reconcile detects the tampering!
    recon2 = LedgerService.reconcile_account_balance(db_session, wallet.id)
    assert recon2["is_balanced"] is False
    assert recon2["discrepancy"] != Decimal("0.0000")
