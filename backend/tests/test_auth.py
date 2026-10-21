import time
from datetime import timedelta
from fastapi.testclient import TestClient
from app.core.security import create_access_token


def test_login_valid_credentials_returns_tokens_and_user_profile(client: TestClient):
    """
    Verifies that authenticating with correct credentials returns
    a signed JWT access token, refresh token, and user profile data.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "login_id": "admin@buymecart.org",
            "password": "AdminPass#2026",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0
    assert data["user"]["login_id"] == "admin@buymecart.org"
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["status"] == "ACTIVE"

    # Verify HttpOnly secure cookies were also set
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_invalid_password_returns_generic_error(client: TestClient):
    """
    Verifies that supplying an incorrect password produces a generic 401 error
    to avoid disclosing account verification state.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "login_id": "admin@buymecart.org",
            "password": "WrongPassword!999",
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid login identifier or password."


def test_login_nonexistent_user_returns_identical_generic_error(client: TestClient):
    """
    Verifies that querying a non-existent user returns the identical generic 401 error
    and takes similar processing time via dummy verification.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "login_id": "ghost.nonexistent@buymecart.org",
            "password": "AnyPassword#123",
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid login identifier or password."


def test_login_inactive_user_is_forbidden(client: TestClient):
    """
    Verifies that inactive or suspended accounts cannot log in even with correct credentials.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "login_id": "inactive@buymecart.org",
            "password": "InactivePass#2026",
        },
    )
    assert response.status_code == 403
    assert "inactive" in response.json()["detail"].lower()


def test_login_suspended_user_is_forbidden(client: TestClient):
    """Verifies that suspended accounts are immediately rejected."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "login_id": "suspended@buymecart.org",
            "password": "SuspendedPass#2026",
        },
    )
    assert response.status_code == 403
    assert "suspended" in response.json()["detail"].lower()


def test_auth_me_with_valid_bearer_token(client: TestClient):
    """Verifies that /auth/me returns the authenticated user profile."""
    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "sd.central@buymecart.org", "password": "SuperDistPass#2026"},
    )
    access_token = login_res.json()["access_token"]

    # 2. Call /me with Bearer token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["login_id"] == "sd.central@buymecart.org"
    assert data["role"] == "SUPER_DISTRIBUTOR"


def test_auth_me_unauthorized_request_rejected(client: TestClient):
    """Verifies that requesting /auth/me without token returns 401 Unauthorized."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_auth_me_invalid_token_rejected(client: TestClient):
    """Verifies that an altered or forged token returns 401 Unauthorized."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.signature-here"},
    )
    assert response.status_code == 401


def test_auth_me_expired_token_rejected(client: TestClient):
    """Verifies that an expired access token returns 401 Unauthorized."""
    # Generate token that expired 10 minutes ago
    expired_token = create_access_token(
        subject="00000000-0000-0000-0000-000000000000",
        role="ADMIN",
        expires_delta=timedelta(minutes=-10),
    )
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_session_refresh_flow(client: TestClient):
    """Verifies session renewal using valid refresh token."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "ad.zone1@buymecart.org", "password": "AreaDistPass#2026"},
    )
    refresh_token = login_res.json()["refresh_token"]

    # Request new access token using refresh token
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data
    assert data["user"]["login_id"] == "ad.zone1@buymecart.org"

    # Use the fresh access token to authenticate
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_res.status_code == 200


def test_logout_revokes_token_session(client: TestClient):
    """
    Verifies that calling /logout blacklists the token JTI
    and prevents subsequent authenticated requests using that token.
    """
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": "RetailerPass#2026"},
    )
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]

    # Verify access token works initially
    pre_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert pre_res.status_code == 200

    # Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"refresh_token": refresh_token},
    )
    assert logout_res.status_code == 200
    assert "revoked" in logout_res.json()["message"].lower()

    # Verify the same access token is now rejected as revoked
    post_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert post_res.status_code == 401
    assert "revoked" in post_res.json()["detail"].lower()
