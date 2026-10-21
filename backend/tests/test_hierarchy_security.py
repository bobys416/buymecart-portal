import json
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole, UserStatus
from app.services.auth_service import AuthService


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# 1. PROFILE AND EXPLICIT PERMISSION VERIFICATION
# ==============================================================================

def test_users_me_returns_profile_with_permissions(client: TestClient):
    """
    Verifies that /users/me serializes the authenticated user profile
    along with their explicit, role-scoped permission grants.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # Admin profile
    admin_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert admin_data["role"] == "ADMIN"
    assert "CHANGE_ACCOUNT_STATUS" in admin_data["permissions"]
    assert "ASSIGN_DISTRIBUTOR" in admin_data["permissions"]
    assert "VIEW_USERS" in admin_data["permissions"]

    # Retailer profile (least privilege)
    ret_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {ret_token}"})
    assert ret_res.status_code == 200
    ret_data = ret_res.json()
    assert ret_data["role"] == "RETAILER"
    assert "CHANGE_ACCOUNT_STATUS" not in ret_data["permissions"]
    assert "ASSIGN_DISTRIBUTOR" not in ret_data["permissions"]
    assert "VIEW_USERS" in ret_data["permissions"]


# ==============================================================================
# 2. NETWORK SUMMARY SCOPING BY ROLE
# ==============================================================================

def test_network_summary_hierarchical_scoping(client: TestClient):
    """
    Verifies that /network/summary returns strictly scoped counts:
    - Admin: Platform-wide totals (both networks).
    - Super Distributor: Regional tree only (own assigned ADs and subordinate Retailers).
    - Area Distributor: District tree only (own directly assigned Retailers).
    - Retailer: Storefront node status.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    sd1_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ret1_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # Admin: Platform-wide (SD1 + SD2, AD1 + AD2, Ret1 + Ret2)
    admin_res = client.get("/api/v1/network/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    admin_summary = admin_res.json()
    assert admin_summary["scope"] == "PLATFORM_ADMIN"
    assert admin_summary["total_super_distributors"] == 2
    assert admin_summary["total_area_distributors"] == 2
    assert admin_summary["total_retailers"] >= 2

    # SD1: Central Region only (AD1, Ret1) — does NOT see SD2, AD2, Ret2
    sd1_res = client.get("/api/v1/network/summary", headers={"Authorization": f"Bearer {sd1_token}"})
    assert sd1_res.status_code == 200
    sd1_summary = sd1_res.json()
    assert sd1_summary["scope"] == "REGIONAL_SUPER_DISTRIBUTOR"
    assert sd1_summary["total_super_distributors"] == 1
    assert sd1_summary["total_area_distributors"] == 1
    assert sd1_summary["total_retailers"] == 3

    # AD1: Zone-01 only (Ret1)
    ad1_res = client.get("/api/v1/network/summary", headers={"Authorization": f"Bearer {ad1_token}"})
    assert ad1_res.status_code == 200
    ad1_summary = ad1_res.json()
    assert ad1_summary["scope"] == "AREA_DISTRIBUTOR"
    assert ad1_summary["total_area_distributors"] == 1
    assert ad1_summary["total_retailers"] == 3

    # Retailer: Self node
    ret_res = client.get("/api/v1/network/summary", headers={"Authorization": f"Bearer {ret1_token}"})
    assert ret_res.status_code == 200
    ret_summary = ret_res.json()
    assert ret_summary["scope"] == "RETAILER"
    assert ret_summary["total_retailers"] == 1


# ==============================================================================
# 3. DIRECTORY ACCESS & CROSS-DISTRIBUTOR ISOLATION
# ==============================================================================

def test_super_distributor_directory_access_control(client: TestClient):
    """
    Verifies that /distributors/super is accessible only to Admin and Super Distributors.
    AD and Retailer must be rejected with 403 Forbidden.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    sd1_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ret1_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # Admin sees both SD1 and SD2
    admin_res = client.get("/api/v1/distributors/super", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    assert len(admin_res.json()["items"]) == 2

    # SD1 sees only self
    sd1_res = client.get("/api/v1/distributors/super", headers={"Authorization": f"Bearer {sd1_token}"})
    assert sd1_res.status_code == 200
    sd_items = sd1_res.json()["items"]
    assert len(sd_items) == 1
    assert sd_items[0]["login_id"] == "sd.central@buymecart.org"

    # AD and Retailer rejected
    assert client.get("/api/v1/distributors/super", headers={"Authorization": f"Bearer {ad1_token}"}).status_code == 403
    assert client.get("/api/v1/distributors/super", headers={"Authorization": f"Bearer {ret1_token}"}).status_code == 403


def test_area_distributor_cross_network_isolation(client: TestClient):
    """
    Verifies that Super Distributor 1 cannot see Area Distributor 2 (which belongs to SD2).
    """
    sd1_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    sd2_token = get_token(client, "sd.west@buymecart.org", "SuperDistPass#2026")

    # SD1 only sees AD1
    res_sd1 = client.get("/api/v1/distributors/area", headers={"Authorization": f"Bearer {sd1_token}"})
    assert res_sd1.status_code == 200
    sd1_items = res_sd1.json()["items"]
    assert len(sd1_items) == 1
    assert sd1_items[0]["login_id"] == "ad.zone1@buymecart.org"

    # SD2 only sees AD2
    res_sd2 = client.get("/api/v1/distributors/area", headers={"Authorization": f"Bearer {sd2_token}"})
    assert res_sd2.status_code == 200
    sd2_items = res_sd2.json()["items"]
    assert len(sd2_items) == 1
    assert sd2_items[0]["login_id"] == "ad.west1@buymecart.org"


def test_retailer_cross_network_isolation(client: TestClient):
    """
    Verifies that Area Distributor 1 cannot see Retailer 2 (which reports to AD2).
    """
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad2_token = get_token(client, "ad.west1@buymecart.org", "AreaDistPass#2026")

    # AD1 sees only their subordinate retailers, never AD2's
    res_ad1 = client.get("/api/v1/retailers", headers={"Authorization": f"Bearer {ad1_token}"})
    assert res_ad1.status_code == 200
    ad1_rets = res_ad1.json()["items"]
    ad1_login_ids = [r["login_id"] for r in ad1_rets]
    assert "retailer.store1@buymecart.org" in ad1_login_ids
    assert "retailer.west1@buymecart.org" not in ad1_login_ids

    # AD2 sees only their subordinate retailers, never AD1's
    res_ad2 = client.get("/api/v1/retailers", headers={"Authorization": f"Bearer {ad2_token}"})
    assert res_ad2.status_code == 200
    ad2_rets = res_ad2.json()["items"]
    ad2_login_ids = [r["login_id"] for r in ad2_rets]
    assert "retailer.west1@buymecart.org" in ad2_login_ids
    assert "retailer.store1@buymecart.org" not in ad2_login_ids


def test_cross_user_id_substitution_rejected_with_404(client: TestClient, db_session):
    """
    Verifies that cross-user ID substitution (Retailer 1 querying Retailer 2 by UUID)
    is rejected with a consistent 404 Not Found to prevent identity probing.
    """
    ret1_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ret1 = AuthService.get_by_login_id(db_session, "retailer.store1@buymecart.org")
    ret2 = AuthService.get_by_login_id(db_session, "retailer.west1@buymecart.org")

    # 1. Retailer 1 accessing own ID succeeds
    self_res = client.get(f"/api/v1/users/{ret1.id}", headers={"Authorization": f"Bearer {ret1_token}"})
    assert self_res.status_code == 200
    assert self_res.json()["login_id"] == "retailer.store1@buymecart.org"

    # 2. Retailer 1 attempting to access Retailer 2 is rejected with 404
    cross_res = client.get(f"/api/v1/users/{ret2.id}", headers={"Authorization": f"Bearer {ret1_token}"})
    assert cross_res.status_code == 404
    assert "outside authorized network scope" in cross_res.json()["detail"].lower()


# ==============================================================================
# 4. SENSITIVE ACTIONS: STATUS CHANGE & AUDIT LOGGING
# ==============================================================================

def test_status_change_creates_append_only_audit_log(client: TestClient, db_session):
    """
    Verifies that changing a user's account status:
    - Succeeds for authorized administrator.
    - Appends a security audit log with actor, action, target, and safe JSON metadata.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    target_ad = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")

    # Suspend target AD
    suspend_res = client.patch(
        f"/api/v1/users/{target_ad.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "SUSPENDED", "reason": "Compliance review: missing hardware serial verification."},
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "SUSPENDED"

    # Verify audit log was appended
    audit_entry = db_session.scalar(
        select(AuditLog).where(AuditLog.target_id == target_ad.id, AuditLog.action == "USER_STATUS_CHANGE")
    )
    assert audit_entry is not None
    assert audit_entry.actor_role == "ADMIN"
    meta = json.loads(audit_entry.metadata_json)
    assert meta["old_status"] == "ACTIVE"
    assert meta["new_status"] == "SUSPENDED"
    assert "Compliance review" in meta["reason"]


def test_self_status_modification_is_strictly_prohibited(client: TestClient, db_session):
    """
    Verifies that an administrator or operator cannot change their own account status
    or self-approve their own account.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    admin = AuthService.get_by_login_id(db_session, "admin@buymecart.org")

    res = client.patch(
        f"/api/v1/users/{admin.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "SUSPENDED", "reason": "Self suspension attempt"},
    )
    assert res.status_code == 400
    assert "prohibited from changing their own" in res.json()["detail"].lower()


def test_unauthorized_user_cannot_change_status(client: TestClient, db_session):
    """
    Verifies that a user lacking CHANGE_ACCOUNT_STATUS permission (e.g. Retailer)
    cannot modify any account status.
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    ad = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")

    res = client.patch(
        f"/api/v1/users/{ad.id}/status",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={"status": "INACTIVE", "reason": "Unauthorized attempt"},
    )
    assert res.status_code == 403


# ==============================================================================
# 5. DISTRIBUTOR REASSIGNMENT, SELF-PARENTING, & CYCLE PREVENTION
# ==============================================================================

def test_reassign_distributor_admin_workflow(client: TestClient, db_session):
    """
    Verifies that an Admin can reassign an Area Distributor to a new Super Distributor,
    and that an audit log entry is written.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ad1 = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")
    sd2 = AuthService.get_by_login_id(db_session, "sd.west@buymecart.org")

    # Reassign AD1 from SD1 to SD2
    res = client.patch(
        f"/api/v1/users/{ad1.id}/reassign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_parent_id": str(sd2.id), "reason": "Territory restructuring: Central to West transfer."},
    )
    assert res.status_code == 200
    assert res.json()["parent_id"] == str(sd2.id)

    # Check audit log
    audit_entry = db_session.scalar(
        select(AuditLog).where(AuditLog.target_id == ad1.id, AuditLog.action == "DISTRIBUTOR_REASSIGNMENT")
    )
    assert audit_entry is not None
    meta = json.loads(audit_entry.metadata_json)
    assert meta["new_parent_id"] == str(sd2.id)


def test_self_parenting_rejected_with_422(client: TestClient, db_session):
    """
    Verifies that assigning a user as their own parent is rejected.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ad1 = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")

    res = client.patch(
        f"/api/v1/users/{ad1.id}/reassign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_parent_id": str(ad1.id), "reason": "Self-parenting attempt"},
    )
    assert res.status_code == 422
    assert "self-parenting is invalid" in res.json()["detail"].lower()


def test_hierarchy_cycle_rejected_with_422(client: TestClient, db_session):
    """
    Verifies that circular hierarchy relationships are detected and rejected:
    e.g. Trying to assign a parent whose ancestor is the target user.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    sd1 = AuthService.get_by_login_id(db_session, "sd.central@buymecart.org")
    ad1 = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")

    # AD1 currently reports to SD1.
    # Attempt to assign SD1's parent to AD1 (which would create cycle SD1 -> AD1 -> SD1).
    res = client.patch(
        f"/api/v1/users/{sd1.id}/reassign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_parent_id": str(ad1.id), "reason": "Cycle creation attempt"},
    )
    assert res.status_code == 422


# ==============================================================================
# 6. SAFE RESPONSE SERIALIZATION (ZERO LEAKAGE)
# ==============================================================================

def test_safe_response_serialization_never_leaks_secrets(client: TestClient):
    """
    Verifies that no endpoint response serializes hashed passwords, plain passwords,
    or internal security tokens.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")

    endpoints_to_test = [
        "/api/v1/users/me",
        "/api/v1/distributors/super",
        "/api/v1/distributors/area",
        "/api/v1/retailers",
        "/api/v1/network/summary",
    ]

    forbidden_keys = ["password", "hashed_password", "token", "secret", "private_key"]

    for ep in endpoints_to_test:
        res = client.get(ep, headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200, f"Endpoint {ep} failed: {res.text}"
        body_str = res.text.lower()
        for forbidden in forbidden_keys:
            assert f'"{forbidden}"' not in body_str, f"Leaked {forbidden} in {ep}: {res.text}"


def test_audit_log_querying_restricted_to_admin(client: TestClient):
    """
    Verifies that the /audit/logs trail is strictly accessible to Root Admin
    and rejected with 403 Forbidden for Super Distributor, AD, and Retailer.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    sd_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # Admin succeeds
    assert client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 200

    # SD and Retailer rejected
    assert client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {sd_token}"}).status_code == 403
    assert client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {ret_token}"}).status_code == 403
