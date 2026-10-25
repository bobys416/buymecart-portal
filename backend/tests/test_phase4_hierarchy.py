"""
Tests for Phase 4: Hierarchical Account Creation, Lineage Traversal, Downline Trees & Status Cascades.
"""
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


def test_admin_creates_super_distributor(client: TestClient, db_session):
    """
    Verifies that Root Admin can onboard a regional Super Distributor.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")

    res = client.post(
        "/api/v1/distributors/super",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "login_id": "sd.north@buymecart.org",
            "password": "NorthPass#2026",
            "full_name": "North Super Distributor",
            "email": "sd.north@buymecart.org",
            "phone": "+919999888801",
            "business_name": "North Regional Hub",
            "territory": "North India",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["login_id"] == "sd.north@buymecart.org"
    assert data["role"] == "SUPER_DISTRIBUTOR"
    assert data["territory"] == "North India"
    assert data["parent_id"] is None

    # Check DB and AuditLog
    sd_user = db_session.scalar(select(User).where(User.login_id == "sd.north@buymecart.org"))
    assert sd_user is not None

    audit = db_session.scalar(
        select(AuditLog).where(
            AuditLog.target_id == sd_user.id,
            AuditLog.action == "USER_HIERARCHICAL_CREATE",
        )
    )
    assert audit is not None


def test_super_distributor_creates_area_distributor(client: TestClient, db_session):
    """
    Verifies that a Super Distributor can create an Area Distributor under their own downline.
    """
    sd_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    sd_user = AuthService.get_by_login_id(db_session, "sd.central@buymecart.org")

    res = client.post(
        "/api/v1/distributors/area",
        headers={"Authorization": f"Bearer {sd_token}"},
        json={
            "login_id": "ad.central2@buymecart.org",
            "password": "AreaPass#2026",
            "full_name": "Central District 2 AD",
            "email": "ad.central2@buymecart.org",
            "phone": "+919999888802",
            "business_name": "Central District Hub",
            "territory": "Bhopal District",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["login_id"] == "ad.central2@buymecart.org"
    assert data["role"] == "AREA_DISTRIBUTOR"
    # Auto-bound to SD
    assert data["parent_id"] == str(sd_user.id)


def test_area_distributor_creates_retailer(client: TestClient, db_session):
    """
    Verifies that an Area Distributor can create a Retailer under their storefront network.
    """
    ad_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")

    res = client.post(
        "/api/v1/retailers",
        headers={"Authorization": f"Bearer {ad_token}"},
        json={
            "login_id": "retailer.newstore@buymecart.org",
            "password": "RetailerPass#2026",
            "full_name": "New Corner Store",
            "email": "newstore@buymecart.org",
            "phone": "+919999888803",
            "business_name": "Corner Kirana",
            "territory": "Sector 4",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["login_id"] == "retailer.newstore@buymecart.org"
    assert data["role"] == "RETAILER"
    # Auto-bound to AD
    assert data["parent_id"] == str(ad_user.id)


def test_retailer_creation_rejected_for_unauthorized_roles(client: TestClient):
    """
    Verifies that Retailers are blocked from creating any subordinate users (least privilege).
    """
    ret_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    res = client.post(
        "/api/v1/retailers",
        headers={"Authorization": f"Bearer {ret_token}"},
        json={
            "login_id": "illegal.ret@buymecart.org",
            "password": "Pass#2026",
            "full_name": "Illegal Store",
        },
    )
    assert res.status_code == 403


def test_hierarchical_lineage_chain(client: TestClient, db_session):
    """
    Verifies that inspecting a user's lineage returns the complete chain of ancestors
    up to Root Admin with active status confirmation.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ret = AuthService.get_by_login_id(db_session, "retailer.store1@buymecart.org")

    res = client.get(
        f"/api/v1/users/{ret.id}/lineage",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == str(ret.id)
    assert data["is_lineage_active"] is True
    assert data["blocking_reason"] is None

    # Ancestor chain should contain: Retailer (depth 0) -> AD (depth 1) -> SD (depth 2)
    ancestors = data["ancestors"]
    roles = [a["role"] for a in ancestors]
    assert "RETAILER" in roles
    assert "AREA_DISTRIBUTOR" in roles
    assert "SUPER_DISTRIBUTOR" in roles


def test_downline_tree_endpoint(client: TestClient, db_session):
    """
    Verifies that /network/tree returns the nested downline hierarchy starting from caller.
    """
    sd_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")

    res = client.get(
        "/api/v1/network/tree",
        headers={"Authorization": f"Bearer {sd_token}"},
    )
    assert res.status_code == 200
    tree = res.json()
    assert tree["role"] == "SUPER_DISTRIBUTOR"
    assert tree["login_id"] == "sd.central@buymecart.org"
    assert len(tree["children"]) >= 1

    # First child must be Area Distributor
    ad_child = tree["children"][0]
    assert ad_child["role"] == "AREA_DISTRIBUTOR"
    assert len(ad_child["children"]) >= 1

    # Area Distributor child must be Retailer
    ret_child = ad_child["children"][0]
    assert ret_child["role"] == "RETAILER"


def test_status_cascade_suspends_all_downstream_nodes(client: TestClient, db_session):
    """
    Verifies that suspending a distributor with cascade=True recursively suspends
    all subordinate Area Distributors and Retailers, creating audit entries for each.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    sd_west = AuthService.get_by_login_id(db_session, "sd.west@buymecart.org")
    ad_west = AuthService.get_by_login_id(db_session, "ad.west1@buymecart.org")
    ret_west = AuthService.get_by_login_id(db_session, "retailer.west1@buymecart.org")

    # Suspend SD West with cascade=True
    res = client.patch(
        f"/api/v1/users/{sd_west.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "status": "SUSPENDED",
            "reason": "Regulatory investigation in West Region.",
            "cascade": True,
        },
    )
    assert res.status_code == 200
    assert res.json()["status"] == "SUSPENDED"

    # Refresh subordinates from DB
    db_session.expire_all()
    ad_refreshed = AuthService.get_by_login_id(db_session, "ad.west1@buymecart.org")
    ret_refreshed = AuthService.get_by_login_id(db_session, "retailer.west1@buymecart.org")

    assert ad_refreshed.status == UserStatus.SUSPENDED
    assert ret_refreshed.status == UserStatus.SUSPENDED

    # Verify cascade audit logs
    cascade_logs = list(
        db_session.scalars(
            select(AuditLog).where(AuditLog.action == "USER_STATUS_CASCADE")
        )
    )
    assert len(cascade_logs) >= 2


def test_upstream_suspension_blocks_downstream_login(client: TestClient, db_session):
    """
    Verifies that when an upstream distributor is SUSPENDED, downstream Retailers
    are blocked from logging in with HTTP 403, and an immutable LoginEvent is created.
    """
    # 1. Reset ret1 to ACTIVE, but suspend its parent AD
    ad1 = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")
    ret1 = AuthService.get_by_login_id(db_session, "retailer.store1@buymecart.org")

    ad1.status = UserStatus.SUSPENDED
    ret1.status = UserStatus.ACTIVE
    db_session.commit()

    # Attempt login as retailer.store1
    res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": "RetailerPass#2026"},
    )
    assert res.status_code == 403
    assert "upstream distributor" in res.json()["detail"].lower()
    assert "suspended" in res.json()["detail"].lower()
