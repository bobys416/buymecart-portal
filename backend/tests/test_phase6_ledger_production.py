import hashlib
import json
import uuid
from decimal import Decimal
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.models.ledger import (
    AccountType,
    EntryDirection,
    FinancialAccount,
    IncomingWebhookEvent,
    JournalEntry,
    LedgerPosting,
    PaymentRail,
    ProviderReconciliationRecord,
    Transaction,
    TransactionState,
    TransactionType,
)
from app.models.user import User, UserRole
from app.services.payment_provider import get_payment_provider


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(autouse=True)
def reset_provider():
    provider = get_payment_provider()
    provider.simulation_mode = "SUCCESS"
    provider._external_ledger.clear()
    provider._external_refunds.clear()
    provider._processed_webhook_ids.clear()
    provider._ref_map.clear()
    yield
    provider.simulation_mode = "SUCCESS"
    provider._external_ledger.clear()
    provider._external_refunds.clear()
    provider._processed_webhook_ids.clear()


def test_database_health_telemetry_and_pool_settings(client: TestClient):
    """Verifies production database telemetry endpoint, dialect detection, and connection latency."""
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    res = client.get(
        "/api/v1/ledger/database-health",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["dialect"] in ("sqlite", "postgresql")
    assert data["pool_size"] >= 1
    assert data["query_latency_ms"] >= 0.0
    assert "database_target" in data


def test_double_entry_trial_balance_mathematical_verification(client: TestClient, db_session):
    """
    Verifies the fundamental fintech accounting equation:
    Sum(Debits) == Sum(Credits) across all historic and newly generated transactions.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # 1. Top-up wallet to create balanced double-entry postings
    topup_key = f"IDEMP-TOPUP-{uuid.uuid4().hex[:8]}"
    res_top = client.post(
        "/api/v1/ledger/wallet/topup",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"amount": "5000.00", "idempotency_key": topup_key},
    )
    assert res_top.status_code == status.HTTP_201_CREATED

    # 2. Make a payment outflow
    pay_key = f"IDEMP-PAY-{uuid.uuid4().hex[:8]}"
    res_pay = client.post(
        "/api/v1/ledger/payments",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={
            "amount": "1200.00",
            "idempotency_key": pay_key,
            "payment_rail": "WALLET",
            "beneficiary_name": "Wholesale Distributor",
        },
    )
    assert res_pay.status_code == status.HTTP_201_CREATED

    # 3. Request Trial Balance
    res_tb = client.get(
        "/api/v1/ledger/trial-balance",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_tb.status_code == status.HTTP_200_OK
    tb = res_tb.json()

    assert tb["is_mathematically_balanced"] is True
    assert Decimal(str(tb["imbalance_delta"])) <= Decimal("0.0001")
    assert Decimal(str(tb["total_debit"])) == Decimal(str(tb["total_credit"]))
    assert tb["total_journal_entries"] > 0
    assert tb["total_postings"] > 0


def test_individual_account_posting_integrity_audit(client: TestClient, db_session):
    """Audits an individual account's balance by verifying sum of all historic postings."""
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # Get wallet
    res_wal = client.get("/api/v1/ledger/wallet", headers={"Authorization": f"Bearer {ret_token}"})
    assert res_wal.status_code == status.HTTP_200_OK
    acc_num = res_wal.json()["account_number"]

    account = db_session.query(FinancialAccount).filter(FinancialAccount.account_number == acc_num).first()
    assert account is not None

    # Audit integrity
    res_aud = client.get(
        f"/api/v1/ledger/accounts/{account.id}/integrity",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_aud.status_code == status.HTTP_200_OK
    aud = res_aud.json()

    assert aud["is_integrity_valid"] is True
    assert Decimal(str(aud["difference"])) == Decimal("0.0000")
    assert Decimal(str(aud["recorded_balance"])) == Decimal(str(aud["calculated_balance"]))
    assert aud["total_postings_audited"] >= 0


def test_external_settlement_stream_batch_reconciliation(client: TestClient, db_session):
    """
    Tests automated multi-rail settlement reconciliation:
    Flags MATCHED, AMOUNT_MISMATCH, STATUS_MISMATCH, and MISSING_ON_PLATFORM.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # 1. Top-up wallet and execute two distinct payments
    topup_key = f"IDEMP-RECON-TOP-{uuid.uuid4().hex[:8]}"
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"amount": "10000.00", "idempotency_key": topup_key},
    )

    pay1_key = f"IDEMP-P1-{uuid.uuid4().hex[:8]}"
    res_p1 = client.post(
        "/api/v1/ledger/payments",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"amount": "2500.00", "idempotency_key": pay1_key, "payment_rail": "WALLET"},
    )
    p1_data = res_p1.json()
    p1_ref = p1_data["transaction_reference"]
    p1_prov_id = p1_data.get("provider_transaction_id") or f"PROV-{p1_ref}"

    pay2_key = f"IDEMP-P2-{uuid.uuid4().hex[:8]}"
    res_p2 = client.post(
        "/api/v1/ledger/payments",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"amount": "1500.00", "idempotency_key": pay2_key, "payment_rail": "WALLET"},
    )
    p2_data = res_p2.json()
    p2_ref = p2_data["transaction_reference"]
    p2_prov_id = p2_data.get("provider_transaction_id") or f"PROV-{p2_ref}"

    batch_id = f"BATCH-TEST-{uuid.uuid4().hex[:8].upper()}"

    # Build settlement feed with 4 distinct cases:
    settlement_payload = {
        "batch_id": batch_id,
        "settlement_items": [
            # Case 1: Clean Match
            {
                "provider_transaction_id": p1_prov_id,
                "transaction_reference": p1_ref,
                "amount": "2500.00",
                "status": "SUCCESS",
            },
            # Case 2: Amount Mismatch (Platform expects 1500.00, bank reports 1400.00)
            {
                "provider_transaction_id": p2_prov_id,
                "transaction_reference": p2_ref,
                "amount": "1400.00",
                "status": "SUCCESS",
            },
            # Case 3: Status Mismatch (Platform has SUCCESS, bank reports FAILED)
            {
                "provider_transaction_id": p1_prov_id,
                "transaction_reference": p1_ref,
                "amount": "2500.00",
                "status": "FAILED",
            },
            # Case 4: Missing on platform
            {
                "provider_transaction_id": "PROV-ORPHAN-9999",
                "transaction_reference": "TXN-UNKNOWN-9999",
                "amount": "800.00",
                "status": "SUCCESS",
            },
        ],
    }

    res_recon = client.post(
        "/api/v1/ledger/reconciliation/settlement-batch",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=settlement_payload,
    )
    assert res_recon.status_code == status.HTTP_200_OK
    recon_res = res_recon.json()

    assert recon_res["batch_id"] == batch_id
    assert recon_res["total_processed"] == 4
    assert recon_res["matched_count"] == 1
    assert recon_res["discrepancy_count"] == 3

    types = [d["discrepancy_type"] for d in recon_res["discrepancies"]]
    assert "AMOUNT_MISMATCH" in types
    assert "STATUS_MISMATCH" in types
    assert "MISSING_ON_PLATFORM" in types

    # Verify records persisted in database
    records = db_session.query(ProviderReconciliationRecord).filter(
        ProviderReconciliationRecord.reconciliation_batch_id == batch_id
    ).all()
    assert len(records) == 4


def test_incoming_webhook_replay_attack_prevention(client: TestClient, db_session):
    """Verifies that duplicate webhook event deliveries are idempotent and logged without duplicate processing."""
    from app.core.config import settings
    import hmac

    # Seed transaction
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    top_key = f"IDEMP-WH-{uuid.uuid4().hex[:8]}"
    client.post(
        "/api/v1/ledger/wallet/topup",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"amount": "3000.00", "idempotency_key": top_key},
    )

    pay_key = f"IDEMP-WHPAY-{uuid.uuid4().hex[:8]}"
    res_pay = client.post(
        "/api/v1/ledger/payments",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"amount": "500.00", "idempotency_key": pay_key, "payment_rail": "WALLET"},
    )
    txn_data = res_pay.json()
    prov_id = txn_data.get("provider_transaction_id") or f"PROV-{txn_data['transaction_reference']}"

    event_id = f"EVT-REPLAY-{uuid.uuid4().hex[:8].upper()}"
    webhook_body = json.dumps({
        "event_id": event_id,
        "provider_transaction_id": prov_id,
        "status": "SUCCESS",
        "amount": 500.0,
    }).encode("utf-8")

    sig = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode("utf-8"), webhook_body, hashlib.sha256).hexdigest()

    # Delivery 1: Processed / Acknowledged
    res_d1 = client.post(
        "/api/v1/ledger/webhook",
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
        content=webhook_body,
    )
    assert res_d1.status_code == status.HTTP_200_OK
    assert res_d1.json()["status"] in ("acknowledged", "PROCESSED", "IGNORED")

    # Delivery 2: Replay attack with identical event_id
    res_d2 = client.post(
        "/api/v1/ledger/webhook",
        headers={"Content-Type": "application/json", "X-Provider-Signature": sig},
        content=webhook_body,
    )
    assert res_d2.status_code == status.HTTP_200_OK
    assert res_d2.json()["status"] in ("DUPLICATE_WEBHOOK_IGNORED", "DUPLICATE_IGNORED")

    # Verify event stored in incoming_webhook_events
    evt = db_session.query(IncomingWebhookEvent).filter(IncomingWebhookEvent.event_id == event_id).first()
    assert evt is not None
