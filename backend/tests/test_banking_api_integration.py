import hashlib
import json
import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models.banking_provider import (
    ApiClientCredential,
    ApiProduct,
    BankingProviderConfig,
    ProviderCategory,
    ProviderEnvironment,
    ProviderStatus,
)
from app.services.payment_provider import (
    BSparkGatewayAdapter,
    PaymentProviderAdapter,
    ProviderCapability,
    ProviderCapabilityError,
    ProviderRegistry,
    get_payment_provider,
    validate_provider_host,
)


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# 1. SSRF Outbound Host Whitelist Validation
# ==============================================================================
def test_ssrf_host_whitelist_protection():
    """
    Enforces SSRF defense:
    - Approved banking hosts (ICICI, SBI, BSpark, NPCI) return True.
    - Cloud metadata (169.254.169.254) and arbitrary web hosts return False.
    """
    assert validate_provider_host("https://developer.icicibank.com/api/v2") is True
    assert validate_provider_host("https://bank.sbi/corp/h2h") is True
    assert validate_provider_host("https://gateway.bspark.org/api/v1") is True
    assert validate_provider_host("https://api.npci.org.in/upi") is True

    # Malicious destinations blocked
    assert validate_provider_host("http://169.254.169.254/latest/meta-data/") is False
    assert validate_provider_host("http://metadata.google.internal/computeMetadata") is False
    assert validate_provider_host("https://evil-attacker.com/webhook") is False
    assert validate_provider_host("http://192.168.1.1/admin") is False
    assert validate_provider_host("") is False


# ==============================================================================
# 2. Provider Registration with SSRF and KMS Reference Validation
# ==============================================================================
def test_register_provider_ssrf_and_credential_vault_validation(client: TestClient, db_session):
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Rejected: SSRF destination host not whitelisted
    bad_ssrf = client.post(
        "/api/v1/banking-api/providers",
        headers=admin_headers,
        json={
            "provider_id": "bad_ssrf_bank",
            "provider_name": "Rogue Bank Host",
            "base_url": "https://malicious-host.net/api",
            "credential_vault_ref": "kms://vault/bspark/prod/cert",
        },
    )
    assert bad_ssrf.status_code == 400
    assert "not on the approved banking provider whitelist" in bad_ssrf.json()["detail"]

    # 2. Rejected: Plaintext secret instead of KMS Vault reference
    bad_creds = client.post(
        "/api/v1/banking-api/providers",
        headers=admin_headers,
        json={
            "provider_id": "plaintext_bank",
            "provider_name": "Insecure Bank",
            "base_url": "https://developer.icicibank.com/api",
            "credential_vault_ref": "SuperSecretPassword123",
        },
    )
    assert bad_creds.status_code == 400
    assert "must follow KMS/Vault URI pattern" in bad_creds.json()["detail"]

    # 3. Successful registration with approved host and KMS ARN
    prov_id = f"test_sbi_{uuid.uuid4().hex[:6]}"
    valid_res = client.post(
        "/api/v1/banking-api/providers",
        headers=admin_headers,
        json={
            "provider_id": prov_id,
            "provider_name": "SBI Corporate Treasury Switch",
            "category": "BANKING_RAIL",
            "base_url": "https://bank.sbi/h2h/v1",
            "credential_vault_ref": "kms://vault/bspark/prod/sbi_mTLS_cert",
            "webhook_secret_ref": "kms://vault/bspark/prod/sbi_webhook_key",
            "environment": "SANDBOX",
            "status": "ACTIVE",
            "supported_rails": ["IMPS", "NEFT", "RTGS"],
            "capabilities": ["PAYOUT", "ACCOUNT_VERIFICATION", "STATUS_INQUIRY"],
            "routing_priority": 3,
            "timeout_ms": 12000,
            "max_retries": 3,
        },
    )
    assert valid_res.status_code == 201
    data = valid_res.json()
    assert data["provider_id"] == prov_id
    assert data["credential_vault_ref"] == "kms://vault/bspark/prod/sbi_mTLS_cert"
    assert data["is_production_approved"] is False


# ==============================================================================
# 3. Native BSpark Payment Gateway Priority & Capability Routing
# ==============================================================================
def test_bspark_gateway_priority_and_capability_routing():
    """
    Business constraint validation:
    - BSpark already has its own payment gateway.
    - ProviderRegistry resolves bspark_gateway as primary native rail.
    - Capability-based routing selects providers supporting requested capabilities.
    """
    bspark_adapter = ProviderRegistry.get_provider("bspark_gateway")
    assert isinstance(bspark_adapter, BSparkGatewayAdapter)
    assert bspark_adapter.provider_id == "bspark_gateway"
    assert bspark_adapter.provider_name == "BSpark Universal Payment Gateway"

    # Declares all 7 standard capabilities
    caps = [c.value for c in bspark_adapter.capabilities]
    assert "COLLECTION" in caps
    assert "PAYOUT" in caps
    assert "ACCOUNT_VERIFICATION" in caps
    assert "REFUND" in caps
    assert "STATUS_INQUIRY" in caps

    # Capability-based routing
    routed_collection = ProviderRegistry.select_provider_for_rail("UPI", ProviderCapability.COLLECTION)
    assert routed_collection.provider_id in ["bspark_gateway", "mock_switch"]

    routed_payout = ProviderRegistry.select_provider_for_rail("IMPS", ProviderCapability.PAYOUT)
    assert routed_payout.has_capability(ProviderCapability.PAYOUT) is True

    # Requesting an unsupported rail raises ProviderCapabilityError
    with pytest.raises(ProviderCapabilityError):
        ProviderRegistry.select_provider_for_rail("BITCOIN", ProviderCapability.PAYOUT)


# ==============================================================================
# 4. Beneficiary Verification (Penny Drop Rail)
# ==============================================================================
def test_penny_drop_account_verification(client: TestClient):
    """
    Tests Penny Drop bank account validation:
    - Valid account + valid IFSC returns VERIFIED with bank name and unique reference.
    - Malformed IFSC returns 400 Bad Request.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Valid HDFC Bank account
    res_valid = client.post(
        "/api/v1/banking-api/verify-beneficiary",
        headers=headers,
        json={
            "account_number": "5010022334455",
            "ifsc": "HDFC0001234",
            "account_holder_name": "Sharma Electronics",
        },
    )
    assert res_valid.status_code == 200
    v_data = res_valid.json()
    assert v_data["status"] == "VERIFIED"
    assert v_data["bank_name"] == "HDFC Bank"
    assert v_data["reference_id"].startswith("BSPARK-PENNY-")

    # 2. Invalid IFSC code format
    res_bad_ifsc = client.post(
        "/api/v1/banking-api/verify-beneficiary",
        headers=headers,
        json={
            "account_number": "5010022334455",
            "ifsc": "INVALID_IFSC_123",
        },
    )
    assert res_bad_ifsc.status_code == 400
    assert "Invalid IFSC code format" in res_bad_ifsc.json()["detail"]


# ==============================================================================
# 5. API Product Catalogue & Commercial API Products
# ==============================================================================
def test_api_product_catalogue(client: TestClient, db_session):
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # List products
    res_list = client.get("/api/v1/banking-api/products", headers=admin_headers)
    assert res_list.status_code == 200
    products = res_list.json()
    assert len(products) >= 3

    codes = [p["product_code"] for p in products]
    assert "PROD-IMPS-PAYOUT" in codes
    assert "PROD-PENNY-DROP" in codes
    assert "PROD-COLLECT-UPI" in codes

    # Create new product as Admin
    p_code = f"PROD-BBPS-{uuid.uuid4().hex[:6].upper()}"
    res_create = client.post(
        "/api/v1/banking-api/products",
        headers=admin_headers,
        json={
            "product_code": p_code,
            "name": "Bharat BillPay Electricity Fetch & Pay",
            "version": "v1",
            "category": "Utility Bills",
            "base_fee": 2.00,
            "is_active": True,
            "rate_limit_per_minute": 100,
        },
    )
    assert res_create.status_code == 201
    assert res_create.json()["product_code"] == p_code


# ==============================================================================
# 6. API Client Key Issuance & Cryptographic Hash Storage
# ==============================================================================
def test_api_client_key_issuance_and_hash_storage(client: TestClient, db_session):
    """
    Validates that:
    - Raw API secret is displayed ONCE in creation response.
    - Database stores exclusively the SHA-256 hash.
    - Revoking the client changes status to REVOKED.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_create = client.post(
        "/api/v1/banking-api/clients",
        headers=admin_headers,
        json={
            "client_name": "Apex Fintech Partner",
            "allowed_product_codes": ["PROD-IMPS-PAYOUT", "PROD-PENNY-DROP"],
            "rate_limit_per_minute": 240,
            "daily_quota": 50000,
        },
    )
    assert res_create.status_code == 201
    created_data = res_create.json()

    client_id = created_data["client_id"]
    raw_secret = created_data["client_secret_plaintext"]
    assert raw_secret.startswith("bsp_sec_")

    # Verify database record stores the SHA-256 hash, NOT the raw secret
    db_session.expire_all()
    client_row = db_session.scalar(select(ApiClientCredential).where(ApiClientCredential.client_id == client_id))
    assert client_row is not None
    expected_hash = hashlib.sha256(raw_secret.encode("utf-8")).hexdigest()
    assert client_row.hashed_client_secret == expected_hash
    assert client_row.hashed_client_secret != raw_secret

    # Revoke client credentials
    res_revoke = client.post(f"/api/v1/banking-api/clients/{client_id}/revoke", headers=admin_headers)
    assert res_revoke.status_code == 200
    assert res_revoke.json()["new_status"] == "REVOKED"


# ==============================================================================
# 7. Sandbox Connection Test Without Secret Leaks
# ==============================================================================
def test_sandbox_connection_test_without_secret_leak(client: TestClient):
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.post(
        "/api/v1/banking-api/providers/bspark_gateway/test-connection",
        headers=admin_headers,
        json={"provider_id": "bspark_gateway", "environment": "SANDBOX"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "CONNECTED"
    assert data["http_status_code"] == 200
    assert data["latency_ms"] >= 0
    assert data["is_ssrf_safe"] is True
    assert "tls_cipher" in data

    # Verify zero secrets in test response
    raw_text = res.text.lower()
    assert "password" not in raw_text
    assert "secret" not in raw_text
    assert "kms://" not in raw_text


# ==============================================================================
# 8. RBAC and Role-Based Access Scoping
# ==============================================================================
def test_banking_api_rbac_access_control(client: TestClient):
    """
    Verifies that Retailers and unauthenticated requests cannot access
    Admin Banking API configuration endpoints.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    # 1. Anonymous access -> 401
    client.cookies.clear()
    assert client.get("/api/v1/banking-api/providers").status_code == 401

    # 2. Retailer role -> 403 Forbidden
    assert client.get("/api/v1/banking-api/providers", headers=ret_headers).status_code == 403
    assert client.post("/api/v1/banking-api/clients", headers=ret_headers, json={"client_name": "Hack"}).status_code == 403
