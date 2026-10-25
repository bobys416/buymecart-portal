import uuid
from typing import List, Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import (
    get_current_jti,
    get_current_user,
    get_token_from_request,
    rate_limiter,
    require_admin,
    require_area_distributor,
    require_mfa_enforced,
    require_retailer,
    require_super_distributor,
)
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    is_token_revoked,
    revoke_token,
)
from app.db.session import get_db
from app.models.otp_challenge import OtpChannel
from app.models.security import (
    AlertSeverity,
    LoginEvent,
    LoginEventResult,
    SecurityAlert,
)
from app.models.user import User, UserStatus
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.security import (
    LoginEventResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    SecurityAlertResolveRequest,
    SecurityAlertResponse,
    SessionRevokeResponse,
    UserSessionResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.network_service import NetworkService
from app.services.security_service import SecurityService
from app.services.session_service import SessionService

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login with Encrypted Credentials & Session Tracking",
    dependencies=[Depends(rate_limiter)],
)
def login(
    login_data: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticates user login credentials against secure password hashes.
    Records immutable login audit event and creates an active device session.
    Issues cryptographically signed JWT access & refresh tokens,
    and sets HttpOnly secure session cookies for web browsers.
    Returns 401 with a generic error if credentials do not match.
    """
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    try:
        user = AuthService.authenticate(db, login_data.login_id, login_data.password)
    except HTTPException as e:
        # Determine failure category for security auditing
        result = LoginEventResult.FAILED_CREDENTIALS
        if e.status_code == 403:
            if "locked" in str(e.detail).lower():
                result = LoginEventResult.FAILED_LOCKOUT
            elif "inactive" in str(e.detail).lower() or "suspended" in str(e.detail).lower():
                result = LoginEventResult.FAILED_INACTIVE

        attempted_user = AuthService.get_by_login_id(db, login_data.login_id)
        SecurityService.log_login_event(
            db=db,
            login_id_attempted=login_data.login_id,
            result=result,
            auth_method="password",
            ip_address=ip_addr,
            user_agent=user_agent,
            user=attempted_user,
            failure_reason=str(e.detail),
        )
        raise e

    # Check upstream distributor lineage status (cascade block)
    is_lineage_ok, blocking_msg = NetworkService.check_upstream_lineage_active(db, user)
    if not is_lineage_ok:
        SecurityService.log_login_event(
            db=db,
            login_id_attempted=login_data.login_id,
            result=LoginEventResult.FAILED_INACTIVE,
            auth_method="password",
            ip_address=ip_addr,
            user_agent=user_agent,
            user=user,
            failure_reason=blocking_msg,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account access blocked: {blocking_msg}",
        )

    # Generate access and refresh tokens
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        extra_claims={
            "login_id": user.login_id,
            "full_name": user.full_name,
        },
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    # Extract JTI from refresh token for session lifecycle binding
    ref_payload = decode_token(refresh_token)
    refresh_jti = ref_payload.get("jti", str(uuid.uuid4()))

    # Create persistent UserSession record
    session = SessionService.create_session(
        db=db,
        user=user,
        refresh_jti=refresh_jti,
        request=request,
        auth_method="password",
    )

    # Log successful login event
    SecurityService.log_login_event(
        db=db,
        login_id_attempted=login_data.login_id,
        result=LoginEventResult.SUCCESS,
        auth_method="password",
        ip_address=ip_addr,
        user_agent=user_agent,
        user=user,
        session_id=session.id,
    )

    # Set secure HttpOnly cookies for web browsers
    cookie_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=cookie_max_age,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=cookie_max_age,
        user=UserResponse.from_user(user),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renew Expired Access Token",
)
def refresh_session(
    refresh_req: Optional[RefreshTokenRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Validates a cryptographic refresh token and issues a fresh access token.
    Enforces token blacklist verification and updates session activity timestamp.
    """
    token_str = (refresh_req.refresh_token if refresh_req else None) or refresh_token_cookie
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token_str)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for session renewal.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = AuthService.get_by_id(db, user_uuid)
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account inactive or deleted.",
        )

    # Touch session activity in database
    if jti:
        SessionService.touch_session(db, jti)

    # Issue new access token
    new_access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        extra_claims={
            "login_id": user.login_id,
            "full_name": user.full_name,
        },
    )

    cookie_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    if response:
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            max_age=cookie_max_age,
            httponly=True,
            secure=settings.is_production,
            samesite="lax",
        )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=token_str,
        token_type="bearer",
        expires_in=cookie_max_age,
        user=UserResponse.from_user(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout & Revoke Active Session",
)
def logout(
    response: Response,
    logout_data: Optional[LogoutRequest] = None,
    token: str = Depends(get_token_from_request),
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db),
):
    """
    Revokes the current access token and refresh token,
    blacklisting their cryptographic JTIs, deactivating the database session,
    and clearing browser cookies.
    """
    current_user_id = None

    # Revoke access token
    try:
        access_payload = decode_token(token)
        access_jti = access_payload.get("jti")
        access_exp = access_payload.get("exp")
        sub_str = access_payload.get("sub")
        if sub_str:
            current_user_id = uuid.UUID(sub_str)
        if access_jti:
            revoke_token(access_jti, access_exp)
    except Exception:
        pass

    # Revoke refresh token and associated database session if provided
    ref_token = (logout_data.refresh_token if logout_data else None) or refresh_token_cookie
    if ref_token:
        try:
            ref_payload = decode_token(ref_token)
            ref_jti = ref_payload.get("jti")
            ref_exp = ref_payload.get("exp")
            if ref_jti:
                revoke_token(ref_jti, ref_exp)
                # Deactivate database session
                if current_user_id:
                    session = db.scalar(
                        select(UserSession).where(
                            UserSession.refresh_jti == ref_jti,
                            UserSession.user_id == current_user_id,
                        )
                    )
                    if session:
                        SessionService.revoke_session(
                            db=db,
                            user_id=current_user_id,
                            session_id=session.id,
                            reason="logout",
                        )
        except Exception:
            pass

    # Clear cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return MessageResponse(
        message="Successfully logged out and session revoked.",
        detail="Token JTI added to server-side revocation list.",
    )


# ==============================================================================
# Phase 3: Active Session Management Endpoints
# ==============================================================================

@router.get(
    "/sessions",
    response_model=List[UserSessionResponse],
    summary="List Active User Sessions",
)
def list_sessions(
    current_user: User = Depends(get_current_user),
    raw_token: str = Depends(get_token_from_request),
    db: Session = Depends(get_db),
):
    """
    Returns all active authenticated sessions and registered devices for the current user.
    """
    current_jti = get_current_jti(raw_token)
    sessions = SessionService.list_active_sessions(
        db=db,
        user_id=current_user.id,
        current_jti=current_jti,
    )
    return [UserSessionResponse(**s) for s in sessions]


@router.delete(
    "/sessions/{session_id}",
    response_model=MessageResponse,
    summary="Revoke Specific Device Session",
)
def revoke_specific_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revokes an active device session by session ID.
    Immediately invalidates its refresh token.
    """
    revoked = SessionService.revoke_session(
        db=db,
        user_id=current_user.id,
        session_id=session_id,
        reason="user_revoked_device",
    )
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or already inactive.",
        )
    return MessageResponse(
        message="Device session revoked successfully.",
        detail=f"Session {session_id} has been invalidated.",
    )


@router.post(
    "/sessions/revoke-all",
    response_model=SessionRevokeResponse,
    summary="Revoke All User Sessions",
)
def revoke_all_user_sessions(
    current_user: User = Depends(get_current_user),
    raw_token: str = Depends(get_token_from_request),
    db: Session = Depends(get_db),
):
    """
    Revokes all active sessions across all devices for the current user.
    """
    count = SessionService.revoke_all_sessions(
        db=db,
        user_id=current_user.id,
        reason="user_revoked_all",
    )
    return SessionRevokeResponse(
        revoked_count=count,
        message=f"All {count} active session(s) have been revoked.",
    )


# ==============================================================================
# Phase 3: OTP-Based Password Reset Endpoints
# ==============================================================================

@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    summary="Request Password Reset OTP",
    dependencies=[Depends(rate_limiter)],
)
def request_password_reset(
    req: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """
    Initiates an OTP verification challenge for password reset.
    Returns generic message to prevent account enumeration.
    """
    try:
        channel = OtpChannel(req.channel.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid channel. Must be EMAIL or SMS.",
        )

    result = SecurityService.request_password_reset(
        db=db,
        login_id=req.login_id,
        channel=channel,
    )
    return MessageResponse(
        message=result["message"],
        detail=str(result.get("challenge_id")) if result.get("challenge_id") else None,
    )


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    summary="Confirm Password Reset with OTP",
    dependencies=[Depends(rate_limiter)],
)
def confirm_password_reset(
    req: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verifies OTP, sets new password hash, invalidates all existing sessions,
    and logs an audit trail event.
    """
    ip_addr = request.client.host if request.client else None
    result = SecurityService.confirm_password_reset(
        db=db,
        challenge_id=req.challenge_id,
        code=req.code,
        new_password=req.new_password,
        ip_address=ip_addr,
    )
    return MessageResponse(
        message=result["message"],
        detail=f"Revoked {result['revoked_sessions']} active session(s).",
    )


# ==============================================================================
# Phase 3: Security Auditing & Alerts Endpoints
# ==============================================================================

@router.get(
    "/security/login-events",
    response_model=List[LoginEventResponse],
    summary="View Recent Login Events",
)
def get_user_login_events(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns recent login audit trail records for the authenticated user.
    """
    events = list(
        db.scalars(
            select(LoginEvent)
            .where(LoginEvent.user_id == current_user.id)
            .order_by(LoginEvent.created_at.desc())
            .limit(min(limit, 100))
        )
    )
    return [LoginEventResponse.model_validate(e) for e in events]


@router.get(
    "/security/alerts",
    response_model=List[SecurityAlertResponse],
    summary="List Security Alerts (Admin Only)",
)
def list_security_alerts(
    unresolved_only: bool = False,
    severity: Optional[str] = None,
    limit: int = 50,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns suspicious activity and lockout alerts across the platform.
    """
    sev_enum = None
    if severity:
        try:
            sev_enum = AlertSeverity(severity.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity level: {severity}",
            )

    alerts = SecurityService.list_alerts(
        db=db,
        severity=sev_enum,
        unresolved_only=unresolved_only,
        limit=limit,
    )
    return [SecurityAlertResponse.model_validate(a) for a in alerts]


@router.post(
    "/security/alerts/{alert_id}/resolve",
    response_model=SecurityAlertResponse,
    summary="Resolve Security Alert (Admin Only)",
)
def resolve_security_alert(
    alert_id: uuid.UUID,
    req: Optional[SecurityAlertResolveRequest] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Marks a security alert as reviewed and resolved.
    """
    note = req.resolution_note if req else None
    resolved = SecurityService.resolve_alert(
        db=db,
        alert_id=alert_id,
        admin_user=admin_user,
        note=note,
    )
    return SecurityAlertResponse.model_validate(resolved)


@router.get(
    "/privileged-mfa-gate",
    summary="Privileged Action Gate with MFA Enforcement",
)
def verify_privileged_mfa_gate(
    current_user: User = Depends(require_mfa_enforced),
):
    """
    Demonstrates enforcement of MFA for privileged roles (ADMIN, SUPER_DISTRIBUTOR).
    Rejects users in privileged roles who have not enrolled in MFA or linked Microsoft Entra.
    """
    return {
        "status": "authorized",
        "user_id": str(current_user.id),
        "role": current_user.role.value,
        "mfa_enrolled": current_user.mfa_enrolled,
        "portal": "Privileged Gate (MFA Verified)",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Authenticated User Profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the server-side identity and verified permissions of the authenticated user.
    """
    return UserResponse.from_user(current_user)


# ==============================================================================
# Role-Specific Guard Verification Endpoints
# ==============================================================================

@router.get("/admin-only", summary="Admin Portal Gate")
def verify_admin_access(current_user: User = Depends(require_admin)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "portal": "Admin Portal",
        "user_id": str(current_user.id),
    }


@router.get("/super-distributor-only", summary="Super Distributor Portal Gate")
def verify_super_distributor_access(current_user: User = Depends(require_super_distributor)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "portal": "Super Distributor Portal",
        "user_id": str(current_user.id),
    }


@router.get("/area-distributor-only", summary="Area Distributor Portal Gate")
def verify_area_distributor_access(current_user: User = Depends(require_area_distributor)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "portal": "Area Distributor Portal",
        "user_id": str(current_user.id),
    }


@router.get("/retailer-only", summary="Retailer Portal Gate")
def verify_retailer_access(current_user: User = Depends(require_retailer)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "portal": "Retailer Portal",
        "user_id": str(current_user.id),
    }
