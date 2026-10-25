"""
MFA & Identity API Router

Endpoints:
- Microsoft Entra ID: authorize URL, callback, unlink
- OTP: send, verify, resend
- MFA status
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, rate_limiter
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.session import get_db
from app.models.external_identity import ExternalIdentity, IdentityProvider
from app.models.otp_challenge import OtpChannel, OtpPurpose
from app.models.security import LoginEventResult
from app.models.user import User
from app.schemas.auth import MessageResponse, TokenResponse
from app.schemas.mfa import (
    ExternalIdentityResponse,
    MfaStatusResponse,
    MicrosoftAuthUrlResponse,
    MicrosoftCallbackRequest,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
)
from app.schemas.user import UserResponse
from app.services.microsoft_entra_service import MicrosoftEntraService
from app.services.otp_service import OtpService
from app.services.security_service import SecurityService
from app.services.session_service import SessionService

router = APIRouter(prefix="/auth/mfa", tags=["MFA & Identity Verification"])


# ═══════════════════════════════════════════════════════════════════════
# Microsoft Entra ID Endpoints
# ═══════════════════════════════════════════════════════════════════════

@router.get(
    "/microsoft/authorize",
    response_model=MicrosoftAuthUrlResponse,
    summary="Get Microsoft Entra Login URL",
    dependencies=[Depends(rate_limiter)],
)
def microsoft_authorize():
    """
    Returns a Microsoft Entra authorization URL with PKCE.
    Frontend should redirect the user to this URL.
    """
    result = MicrosoftEntraService.create_authorization_url()
    return MicrosoftAuthUrlResponse(**result)


@router.post(
    "/microsoft/callback",
    response_model=TokenResponse,
    summary="Microsoft Entra OAuth Callback",
    dependencies=[Depends(rate_limiter)],
)
async def microsoft_callback(
    callback_data: MicrosoftCallbackRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Exchanges the Microsoft authorization code for tokens,
    validates the identity, links to a local user,
    creates an active device session, records login audit event,
    and issues BuyMeCart JWT access/refresh tokens.
    """
    user, is_new_link = await MicrosoftEntraService.handle_callback(
        code=callback_data.code,
        state=callback_data.state,
        db=db,
    )

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        extra_claims={
            "login_id": user.login_id,
            "full_name": user.full_name,
            "auth_method": "microsoft_entra",
        },
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    ref_payload = decode_token(refresh_token)
    refresh_jti = ref_payload.get("jti", str(uuid.uuid4()))

    # Track session
    session = SessionService.create_session(
        db=db,
        user=user,
        refresh_jti=refresh_jti,
        request=request,
        auth_method="microsoft_entra",
    )

    # Log successful login
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    SecurityService.log_login_event(
        db=db,
        login_id_attempted=user.login_id,
        result=LoginEventResult.SUCCESS,
        auth_method="microsoft_entra",
        ip_address=ip_addr,
        user_agent=user_agent,
        user=user,
        session_id=session.id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.from_user(user),
    )


@router.get(
    "/microsoft/status",
    response_model=ExternalIdentityResponse,
    summary="Check Microsoft Identity Link Status",
)
def microsoft_link_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the Microsoft Entra identity linked to the current user, if any."""
    link = db.scalar(
        select(ExternalIdentity).where(
            ExternalIdentity.user_id == current_user.id,
            ExternalIdentity.provider == IdentityProvider.MICROSOFT_ENTRA,
        )
    )
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Microsoft Entra identity linked to this account.",
        )
    return ExternalIdentityResponse(
        provider=link.provider.value,
        provider_subject=link.provider_subject,
        display_name=link.display_name,
        email=link.email,
        linked_at=link.created_at.isoformat() if link.created_at else None,
    )


@router.delete(
    "/microsoft/unlink",
    response_model=MessageResponse,
    summary="Unlink Microsoft Identity",
)
def microsoft_unlink(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes the Microsoft Entra identity link from the current user."""
    removed = MicrosoftEntraService.unlink_identity(db, current_user.id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Microsoft Entra identity to unlink.",
        )
    return MessageResponse(message="Microsoft Entra identity unlinked successfully.")


# ═══════════════════════════════════════════════════════════════════════
# OTP Endpoints
# ═══════════════════════════════════════════════════════════════════════

@router.post(
    "/otp/send",
    response_model=OtpSendResponse,
    summary="Send OTP Code",
    dependencies=[Depends(rate_limiter)],
)
def send_otp(
    req: OtpSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sends a one-time password to the user's registered email or phone.
    The OTP is bcrypt-hashed before storage for security.
    """
    try:
        channel = OtpChannel(req.channel.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid channel: {req.channel}. Use EMAIL or SMS.",
        )

    try:
        purpose = OtpPurpose(req.purpose.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid purpose: {req.purpose}. Use LOGIN_MFA, EMAIL_VERIFY, PHONE_VERIFY, or PASSWORD_RESET.",
        )

    result = OtpService.create_challenge(
        db=db,
        user=current_user,
        channel=channel,
        purpose=purpose,
        destination=req.destination,
    )

    return OtpSendResponse(**result)


@router.post(
    "/otp/verify",
    response_model=OtpVerifyResponse,
    summary="Verify OTP Code",
    dependencies=[Depends(rate_limiter)],
)
def verify_otp(
    req: OtpVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verifies the submitted OTP code against the stored hash.
    On success, updates user verification flags (email_verified / phone_verified).
    """
    try:
        challenge_uuid = uuid.UUID(req.challenge_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid challenge ID format.",
        )

    challenge = OtpService.verify_challenge(
        db=db,
        challenge_id=challenge_uuid,
        code=req.code,
        user_id=current_user.id,
    )

    # Apply side effects (mark email/phone verified)
    OtpService.apply_verification_result(db, current_user, challenge)

    return OtpVerifyResponse(
        verified=True,
        purpose=challenge.purpose.value,
        channel=challenge.channel.value,
        message=f"{challenge.purpose.value.replace('_', ' ').title()} verified successfully.",
    )


# ═══════════════════════════════════════════════════════════════════════
# MFA Status Endpoint
# ═══════════════════════════════════════════════════════════════════════

@router.get(
    "/status",
    response_model=MfaStatusResponse,
    summary="Get MFA & Verification Status",
)
def mfa_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the current MFA enrollment and identity verification status
    for the authenticated user.
    """
    has_ms_link = db.scalar(
        select(ExternalIdentity).where(
            ExternalIdentity.user_id == current_user.id,
            ExternalIdentity.provider == IdentityProvider.MICROSOFT_ENTRA,
        )
    ) is not None

    mfa_required = current_user.role.value in settings.MFA_REQUIRED_ROLES

    return MfaStatusResponse(
        mfa_enrolled=current_user.mfa_enrolled,
        email_verified=current_user.email_verified,
        phone_verified=current_user.phone_verified,
        mfa_required=mfa_required,
        has_microsoft_link=has_ms_link,
    )
