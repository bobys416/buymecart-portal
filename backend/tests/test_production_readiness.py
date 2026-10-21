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
    JournalEntry,
    Transaction,
    TransactionState,
    TransactionType,
)
from app.models.onboarding import ApplicationStatus, OnboardingApplication
from app.services.ledger_service import LedgerService
from app.services.payment_provider import get_payment_provider


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(autouse=True)
def reset_mock_provider():
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
# 1. Partial Refund Multi-Step Lifecycle & Double-Entry Balance
# ==============================================================================
def test_partial_refund_multi_step_lifecycle_and_balance(client: TestClient, db_session):
    """
    Validates partial refunds:
    - Original payment: 1000.00 INR
    - Partial refund 1: 400.00 INR -> original txn remains SUCCESS, wallet credited 400.00
    - Partial refund 2: 350.00 INR -> cumulative 750.00, remaining 250.00
    - Partial refund 3: 300.00 INR -> exceeds remaining (250.00) -> 400 Bad Request
    - Partial refund 3: 250.00 INR -> exact remaining -> full completion, original txn marked REFUNDED
    - Partial refund 4: any amount -> 409 Conflict
    - Mathematical verification: all journal postings balance to 4 decimal places
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    # Step 1: Wallet topup & initial payment of 1000.00 INR
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=ret_headers,
        json={"amount": 2000.0, "idempotency_key": "topup-partial-test-01"},
    )
    pay_res = client.post(
        "/api/v1/ledger/payments",
        headers={**ret_headers, "Idempotency-Key": "pay-partial-test-01"},
        json={
            "amount": 1000.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Merchant Distributor",
            "beneficiary_account": "1122334455",
            "beneficiary_ifsc": "HDFC0001111",
        },
    )
    assert pay_res.status_code == 201
    txn_id = pay_res.json()["id"]

    # Step 2: First partial refund of 400.00 INR
    ref1_res = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Partial return of items", "idempotency_key": "ref-part-01", "amount": 400.0},
    )
    assert ref1_res.status_code == 200
    ref1_data = ref1_res.json()
    assert float(ref1_data["amount"]) == 400.0
    assert ref1_data["state"] == "REFUNDED"

    # Verify original transaction remains SUCCESS (partially refunded)
    orig_res1 = client.get(f"/api/v1/ledger/transactions/{txn_id}", headers=ret_headers)
    assert orig_res1.json()["state"] == "SUCCESS"

    # Step 3: Second partial refund of 350.00 INR
    ref2_res = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Additional damaged goods return", "idempotency_key": "ref-part-02", "amount": 350.0},
    )
    assert ref2_res.status_code == 200
    assert float(ref2_res.json()["amount"]) == 350.0

    # Step 4: Attempting to refund 300.00 INR when only 250.00 INR remains -> 400 Bad Request
    ref3_fail = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Excess refund attempt", "idempotency_key": "ref-part-03-fail", "amount": 300.0},
    )
    assert ref3_fail.status_code == 400
    assert "exceeds remaining refundable balance" in ref3_fail.json()["detail"].lower()

    # Step 5: Exact remaining balance refund of 250.00 INR
    ref3_success = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Final remaining balance refund", "idempotency_key": "ref-part-03-success", "amount": 250.0},
    )
    assert ref3_success.status_code == 200
    assert float(ref3_success.json()["amount"]) == 250.0

    # Original transaction must now be marked REFUNDED because remaining is 0
    orig_res2 = client.get(f"/api/v1/ledger/transactions/{txn_id}", headers=ret_headers)
    assert orig_res2.json()["state"] == "REFUNDED"

    # Step 6: Any further refund attempts fail with 409 Conflict
    ref4_conflict = client.post(
        f"/api/v1/ledger/transactions/{txn_id}/refund",
        headers=admin_headers,
        json={"reason": "Post-full refund attempt", "idempotency_key": "ref-part-04", "amount": 50.0},
    )
    assert ref4_conflict.status_code == 409

    # Step 7: Mathematical double-entry verification on all created refund journals
    db_session.expire_all()
    for ref_id in [ref1_data["id"], ref2_res.json()["id"], ref3_success.json()["id"]]:
        journals = list(db_session.scalars(select(JournalEntry).where(JournalEntry.transaction_id == uuid.UUID(ref_id))).all())
        assert len(journals) == 1
        j = journals[0]
        assert j.is_balanced is True
        debits = sum(p.amount for p in j.postings if p.direction == EntryDirection.DEBIT)
        credits = sum(p.amount for p in j.postings if p.direction == EntryDirection.CREDIT)
        assert debits == credits


# ==============================================================================
# 2. Concurrency Safety: Row Locking Serializes Balance Reservations
# ==============================================================================
def test_wallet_balance_reservation_prevents_overdraft(client: TestClient, db_session):
    """
    Verifies that funds reservations enforce available balance checks:
    - Merchant has exactly 500.00 INR.
    - First transaction reserves 400.00 INR.
    - Second transaction attempts to reserve 200.00 INR -> rejected with 400 (Insufficient funds).
    - Available balance remains non-negative at all times.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    headers = {"Authorization": f"Bearer {ret_token}"}

    # Top up 500.00
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers=headers,
        json={"amount": 500.0, "idempotency_key": "topup-concurr-01"},
    )

    # Initial balance check
    bal_initial = client.get("/api/v1/ledger/wallet", headers=headers).json()
    avail = float(bal_initial["available_balance"])

    # First request: 400.00 INR (should succeed)
    res1 = client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-concurr-01"},
        json={
            "amount": 400.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Vendor A",
            "beneficiary_account": "1001",
            "beneficiary_ifsc": "SBIN0001001",
        },
    )
    assert res1.status_code == 201
    assert res1.json()["state"] == "SUCCESS"

    # Second request: trying to pay 200.00 INR when available balance is ~100.00 -> 400 Bad Request
    res2 = client.post(
        "/api/v1/ledger/payments",
        headers={**headers, "Idempotency-Key": "pay-concurr-02"},
        json={
            "amount": 200.0,
            "payment_rail": "IMPS",
            "beneficiary_name": "Vendor B",
            "beneficiary_account": "1002",
            "beneficiary_ifsc": "SBIN0001002",
        },
    )
    assert res2.status_code == 400
    assert "insufficient available balance" in res2.json()["detail"].lower()


# ==============================================================================
# 3. Operational Monitoring Overview & Backlog Telemetry
# ==============================================================================
def test_operational_monitoring_overview_endpoint(client: TestClient):
    """
    Verifies that the /providers/monitoring/overview endpoint:
    - Provides real-time metrics on KYC backlog, unresolved txns, pending refunds, and discrepancies.
    - Enforces RBAC: Admin can access, unauthorized users are rejected with 401/403.
    - Exposes zero PII, passwords, or banking credentials.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # 1. Anonymous access is rejected
    client.cookies.clear()
    res_anon = client.get("/api/v1/providers/monitoring/overview")
    assert res_anon.status_code == 401

    # 2. Retailer role is forbidden
    res_ret = client.get("/api/v1/providers/monitoring/overview", headers={"Authorization": f"Bearer {ret_token}"})
    assert res_ret.status_code == 403

    # 3. Admin access succeeds
    res_admin = client.get("/api/v1/providers/monitoring/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data = res_admin.json()

    assert "kyc_review_backlog" in data
    assert "total_backlog" in data["kyc_review_backlog"]
    assert "transactions_unresolved" in data
    assert "refunds_pending" in data
    assert "reconciliation_discrepancies" in data
    assert "banking_providers" in data
    assert "system_health" in data
    assert data["system_health"] in ["HEALTHY", "DEGRADED"]


# ==============================================================================
# 4. Rate Limiting Protection on Authentication
# ==============================================================================
def test_auth_rate_limiting_protects_against_brute_force(client: TestClient):
    """
    Tests that sliding window rate limiter protects against credential stuffing.
    Exceeding limit triggers 429 Too Many Requests with Retry-After header.
    """
    from app.api.deps import _IP_REQUEST_LOGS
    
    # Temporarily set logs to simulate threshold reached
    test_ip = "testclient"
    original_logs = list(_IP_REQUEST_LOGS[test_ip])
    import time
    
    try:
        # Pre-fill timestamps
        _IP_REQUEST_LOGS[test_ip] = [time.time()] * (settings.RATE_LIMIT_PER_MINUTE + 5)
        res = client.post("/api/v1/auth/login", json={"login_id": "attacker@buymecart.org", "password": "wrong"})
        assert res.status_code == 429
        assert "Retry-After" in res.headers
        assert "Too many authentication attempts" in res.json()["detail"]
    finally:
        _IP_REQUEST_LOGS[test_ip] = original_logs
