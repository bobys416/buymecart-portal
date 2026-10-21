import uuid
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreateInternal
from app.services.auth_service import AuthService


def get_token_for(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


def test_admin_portal_role_gate(client: TestClient):
    """
    Verifies that only users with the ADMIN role can access the /admin-only endpoint.
    Other roles (SD, AD, Retailer) must be rejected with 403 Forbidden.
    """
    admin_token = get_token_for(client, "admin@buymecart.org", "AdminPass#2026")
    sd_token = get_token_for(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    ret_token = get_token_for(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    # 1. Admin succeeds
    res_admin = client.get("/api/v1/auth/admin-only", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "ADMIN"

    # 2. Super Distributor rejected with 403
    res_sd = client.get("/api/v1/auth/admin-only", headers={"Authorization": f"Bearer {sd_token}"})
    assert res_sd.status_code == 403
    assert "required permissions" in res_sd.json()["detail"].lower()

    # 3. Retailer rejected with 403
    res_ret = client.get("/api/v1/auth/admin-only", headers={"Authorization": f"Bearer {ret_token}"})
    assert res_ret.status_code == 403


def test_super_distributor_role_gate(client: TestClient):
    """
    Verifies that Super Distributor and Admin can access SD operations,
    while AD and Retailer are rejected.
    """
    admin_token = get_token_for(client, "admin@buymecart.org", "AdminPass#2026")
    sd_token = get_token_for(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    ad_token = get_token_for(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")

    # Admin and SD can access
    assert client.get("/api/v1/auth/super-distributor-only", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 200
    assert client.get("/api/v1/auth/super-distributor-only", headers={"Authorization": f"Bearer {sd_token}"}).status_code == 200

    # Area Distributor rejected with 403
    res_ad = client.get("/api/v1/auth/super-distributor-only", headers={"Authorization": f"Bearer {ad_token}"})
    assert res_ad.status_code == 403


def test_area_distributor_role_gate(client: TestClient):
    """
    Verifies that Area Distributor, SD, and Admin can access AD operations,
    while Retailer is rejected.
    """
    ad_token = get_token_for(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ret_token = get_token_for(client, "retailer.store1@buymecart.org", "RetailerPass#2026")

    assert client.get("/api/v1/auth/area-distributor-only", headers={"Authorization": f"Bearer {ad_token}"}).status_code == 200

    # Retailer cannot access AD endpoint
    res_ret = client.get("/api/v1/auth/area-distributor-only", headers={"Authorization": f"Bearer {ret_token}"})
    assert res_ret.status_code == 403


def test_retailer_role_gate(client: TestClient):
    """
    Verifies that Retailer can access retailer-only endpoint.
    Other roles cannot impersonate a retailer directly.
    """
    ret_token = get_token_for(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    sd_token = get_token_for(client, "sd.central@buymecart.org", "SuperDistPass#2026")

    assert client.get("/api/v1/auth/retailer-only", headers={"Authorization": f"Bearer {ret_token}"}).status_code == 200

    res_sd = client.get("/api/v1/auth/retailer-only", headers={"Authorization": f"Bearer {sd_token}"})
    assert res_sd.status_code == 403


def test_reporting_hierarchy_governance(db_session):
    """
    Validates model-level reporting hierarchy invariants:
    - Area Distributor must report to a Super Distributor.
    - Retailer must report to an Area Distributor.
    - Super Distributor may only report to an Admin or None.
    - Admin cannot report to another user.
    """
    # 1. Fetch existing seeded users
    admin = AuthService.get_by_login_id(db_session, "admin@buymecart.org")
    sd = AuthService.get_by_login_id(db_session, "sd.central@buymecart.org")
    ad = AuthService.get_by_login_id(db_session, "ad.zone1@buymecart.org")
    ret = AuthService.get_by_login_id(db_session, "retailer.store1@buymecart.org")

    assert admin and sd and ad and ret

    # 2. Check Area Distributor with valid parent (SD)
    valid_ad_user = User(
        login_id="new.ad@bspark.org",
        full_name="New AD",
        hashed_password="hash",
        role=UserRole.AREA_DISTRIBUTOR,
        parent_id=sd.id,
    )
    is_valid, err = valid_ad_user.validate_hierarchy(parent_user=sd)
    assert is_valid is True
    assert err is None

    # 3. Check Area Distributor with INVALID parent (Retailer)
    invalid_ad_user = User(
        login_id="bad.ad@bspark.org",
        full_name="Bad AD",
        hashed_password="hash",
        role=UserRole.AREA_DISTRIBUTOR,
        parent_id=ret.id,
    )
    is_valid, err = invalid_ad_user.validate_hierarchy(parent_user=ret)
    assert is_valid is False
    assert "Super Distributor" in err

    # 4. Check Retailer with INVALID parent (Super Distributor directly, skipping AD)
    invalid_ret_user = User(
        login_id="bad.ret@bspark.org",
        full_name="Bad Retailer",
        hashed_password="hash",
        role=UserRole.RETAILER,
        parent_id=sd.id,
    )
    is_valid, err = invalid_ret_user.validate_hierarchy(parent_user=sd)
    assert is_valid is False
    assert "Area Distributor" in err

    # 5. Check Admin with a parent (Invalid)
    invalid_admin = User(
        login_id="bad.admin@bspark.org",
        full_name="Bad Admin",
        hashed_password="hash",
        role=UserRole.ADMIN,
        parent_id=sd.id,
    )
    is_valid, err = invalid_admin.validate_hierarchy(parent_user=sd)
    assert is_valid is False
    assert "Admin cannot report" in err


def test_service_level_creation_blocks_hierarchy_violation(db_session):
    """
    Verifies that AuthService.create_internal_user rejects hierarchy violations
    with HTTP 422 Unprocessable Entity.
    """
    ret = AuthService.get_by_login_id(db_session, "retailer.store1@buymecart.org")

    # Attempt to create an Area Distributor reporting to a Retailer
    with pytest.raises(HTTPException) as exc_info:
        AuthService.create_internal_user(
            db_session,
            UserCreateInternal(
                login_id="illegal.ad@buymecart.org",
                full_name="Illegal AD",
                password="SecurePassword#2026",
                role=UserRole.AREA_DISTRIBUTOR,
                status=UserStatus.ACTIVE,
                parent_id=ret.id,
            ),
        )
    assert exc_info.value.status_code == 422
    assert "Hierarchy violation" in exc_info.value.detail
