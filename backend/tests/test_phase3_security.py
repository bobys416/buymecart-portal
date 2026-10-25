"""
Tests for Phase 3: Security Hardening, Session Lifecycle, Anomaly Detection & Password Recovery.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.models.security import (
    AlertSeverity,
    LoginEvent,
    LoginEventResult,
    SecurityAlert,
    UserSession,
)
from app.models.user import User, UserRole, UserStatus
from app.models.otp_challenge import OtpChallenge, OtpPurpose
from app.services.auth_service import AuthService
from app.services.security_service import SecurityService


def test_login_creates_session_and_login_event(client: TestClient, db_session):
    """
    Verifies that a successful login creates a UserSession and a LoginEvent.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": "RetailerPass#2026"},
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
    )
    assert response.status_code == 200
    data = response.json()
    user_id = uuid.UUID(data["user"]["id"])

    # Check UserSession was created in DB
    session = db_session.scalar(
        select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        ).order_by(UserSession.created_at.desc())
    )
    assert session is not None
    assert "Chrome on Windows" in session.device_name
    assert session.device_type == "web"
    assert session.auth_method == "password"

    # Check LoginEvent was recorded
    event = db_session.scalar(
        select(LoginEvent).where(
            LoginEvent.user_id == user_id,
            LoginEvent.result == LoginEventResult.SUCCESS,
        ).order_by(LoginEvent.created_at.desc())
    )
    assert event is not None
    assert event.session_id == session.id


def test_failed_login_creates_login_event(client: TestClient, db_session):
    """
    Verifies that a failed login attempt creates an immutable LoginEvent.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": "WrongPassword999!"},
    )
    assert response.status_code == 401

    event = db_session.scalar(
        select(LoginEvent).where(
            LoginEvent.login_id_attempted == "retailer.store1@buymecart.org",
            LoginEvent.result == LoginEventResult.FAILED_CREDENTIALS,
        ).order_by(LoginEvent.created_at.desc())
    )
    assert event is not None


def test_list_and_revoke_user_sessions(client: TestClient, db_session):
    """
    Verifies viewing active sessions and revoking an individual device session.
    """
    # 1. Login to obtain access token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "ad.zone1@buymecart.org", "password": "AreaDistPass#2026"},
        headers={"User-Agent": "PostmanRuntime/7.32.3"},
    )
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]

    # 2. List sessions
    sessions_res = client.get(
        "/api/v1/auth/sessions",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    assert len(sessions) >= 1
    session_id = sessions[0]["id"]

    # 3. Revoke that session
    revoke_res = client.delete(
        f"/api/v1/auth/sessions/{session_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert revoke_res.status_code == 200
    assert "revoked" in revoke_res.json()["message"].lower()

    # 4. Attempting refresh with that revoked token must be rejected
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 401
    assert "revoked" in refresh_res.json()["detail"].lower()


def test_revoke_all_sessions(client: TestClient, db_session):
    """
    Verifies revoking all sessions across all devices for a user.
    """
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": "RetailerPass#2026"},
    )
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]

    # Revoke all
    res = client.post(
        "/api/v1/auth/sessions/revoke-all",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["revoked_count"] >= 1

    # Refresh must fail
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 401


def test_password_reset_flow(client: TestClient, db_session):
    """
    Verifies OTP-based password recovery flow and subsequent login with new credentials.
    """
    # 1. Request password reset
    req_res = client.post(
        "/api/v1/auth/password-reset/request",
        json={"login_id": "retailer.store1@buymecart.org", "channel": "EMAIL"},
    )
    assert req_res.status_code == 200
    challenge_id_str = req_res.json().get("detail")
    assert challenge_id_str is not None

    challenge_id = uuid.UUID(challenge_id_str)
    # Read the challenge directly to get user
    challenge = db_session.scalar(select(OtpChallenge).where(OtpChallenge.id == challenge_id))
    assert challenge is not None
    assert challenge.purpose == OtpPurpose.PASSWORD_RESET

    # Manually verify or use fixed OTP in dev/test
    # We can set a known bcrypt hash or verify challenge
    from app.core.security import get_password_hash
    test_code = "123456"
    challenge.hashed_code = get_password_hash(test_code)
    db_session.commit()

    # 2. Confirm reset
    new_password = "BrandNewPass#2026"
    confirm_res = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_id": str(challenge_id),
            "code": test_code,
            "new_password": new_password,
        },
    )
    assert confirm_res.status_code == 200
    assert "successfully updated" in confirm_res.json()["message"].lower()

    # 3. Old password must fail
    old_login = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": "RetailerPass#2026"},
    )
    assert old_login.status_code == 401

    # 4. New password succeeds
    new_login = client.post(
        "/api/v1/auth/login",
        json={"login_id": "retailer.store1@buymecart.org", "password": new_password},
    )
    assert new_login.status_code == 200


def test_user_login_events_history(client: TestClient):
    """
    Verifies that authenticated users can inspect their own login history.
    """
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login_id": "admin@buymecart.org", "password": "AdminPass#2026"},
    )
    access_token = login_res.json()["access_token"]

    events_res = client.get(
        "/api/v1/auth/security/login-events",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert events_res.status_code == 200
    events = events_res.json()
    assert isinstance(events, list)
    assert len(events) >= 1
    assert events[0]["result"] == "SUCCESS"


def test_security_alerts_admin_only(client: TestClient, db_session):
    """
    Verifies that security alerts can only be viewed and resolved by administrators.
    """
    # 1. Trigger an alert directly
    alert = SecurityService.create_alert(
        db=db_session,
        alert_type="TEST_SUSPICIOUS_IP",
        severity=AlertSeverity.HIGH,
        message="Simulated threat alert for test",
        ip_address="192.168.1.99",
    )

    admin_login = client.post(
        "/api/v1/auth/login",
        json={"login_id": "admin@buymecart.org", "password": "AdminPass#2026"},
    )
    admin_token = admin_login.json()["access_token"]

    # Non-admin login
    sd_login = client.post(
        "/api/v1/auth/login",
        json={"login_id": "sd.central@buymecart.org", "password": "SuperDistPass#2026"},
    )
    sd_token = sd_login.json()["access_token"]

    # 2. Non-admin rejected with 403
    sd_res = client.get(
        "/api/v1/auth/security/alerts",
        headers={"Authorization": f"Bearer {sd_token}"},
    )
    assert sd_res.status_code == 403

    # 3. Admin can list alerts
    admin_res = client.get(
        "/api/v1/auth/security/alerts",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_res.status_code == 200
    alerts = admin_res.json()
    assert any(a["id"] == str(alert.id) for a in alerts)

    # 4. Admin resolves alert
    resolve_res = client.post(
        f"/api/v1/auth/security/alerts/{alert.id}/resolve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"resolution_note": "Investigated and verified false positive."},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["is_resolved"] is True


def test_privileged_role_mfa_enforcement(client: TestClient, db_session):
    """
    Verifies that privileged roles (ADMIN, SUPER_DISTRIBUTOR) are rejected by
    require_mfa_enforced when MFA is not enrolled, and authorized once enrolled.
    """
    # 1. Admin login (by default mfa_enrolled is False in seeded data)
    admin_user = AuthService.get_by_login_id(db_session, "admin@buymecart.org")
    admin_user.mfa_enrolled = False
    db_session.commit()

    admin_login = client.post(
        "/api/v1/auth/login",
        json={"login_id": "admin@buymecart.org", "password": "AdminPass#2026"},
    )
    admin_token = admin_login.json()["access_token"]

    # Attempt privileged MFA gate without MFA -> 403 Forbidden
    res = client.get(
        "/api/v1/auth/privileged-mfa-gate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 403
    assert "requires mfa" in res.json()["detail"].lower()

    # 2. Now enroll admin in MFA
    admin_user.mfa_enrolled = True
    db_session.commit()

    # Attempt privileged MFA gate with MFA enrolled -> 200 Authorized
    res_enrolled = client.get(
        "/api/v1/auth/privileged-mfa-gate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_enrolled.status_code == 200
    assert res_enrolled.json()["status"] == "authorized"
    assert res_enrolled.json()["mfa_enrolled"] is True
