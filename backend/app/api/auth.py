import uuid
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.api.deps import (
    get_current_user,
    get_token_from_request,
    rate_limiter,
    require_admin,
    require_area_distributor,
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
from app.models.user import User, UserStatus
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login with Encrypted Credentials",
    dependencies=[Depends(rate_limiter)],
)
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticates user login credentials against secure password hashes.
    Issues cryptographically signed JWT access & refresh tokens,
    and sets HttpOnly secure session cookies for web browsers.
    Returns 401 with a generic error if credentials do not match.
    """
    user = AuthService.authenticate(db, login_data.login_id, login_data.password)

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        extra_claims={
            "login_id": user.login_id,
            "full_name": user.full_name,
        },
    )
    refresh_token = create_refresh_token(subject=str(user.id))

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
    Enforces token blacklist verification.
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
):
    """
    Revokes the current access token and refresh token,
    blacklisting their cryptographic JTIs, and clears browser cookies.
    """
    # Revoke access token
    try:
        access_payload = decode_token(token)
        access_jti = access_payload.get("jti")
        access_exp = access_payload.get("exp")
        if access_jti:
            revoke_token(access_jti, access_exp)
    except Exception:
        pass

    # Revoke refresh token if provided
    ref_token = (logout_data.refresh_token if logout_data else None) or refresh_token_cookie
    if ref_token:
        try:
            ref_payload = decode_token(ref_token)
            ref_jti = ref_payload.get("jti")
            ref_exp = ref_payload.get("exp")
            if ref_jti:
                revoke_token(ref_jti, ref_exp)
        except Exception:
            pass

    # Clear cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return MessageResponse(
        message="Successfully logged out and session revoked.",
        detail="Token JTI added to server-side revocation list.",
    )


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
