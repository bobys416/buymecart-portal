"""
Extended authentication schemas for Microsoft Entra OIDC and OTP flows.
"""
import uuid
from typing import Optional
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════
# Microsoft Entra ID (OIDC) Schemas
# ═══════════════════════════════════════════════════════════════════════

class MicrosoftAuthUrlResponse(BaseModel):
    """Response with the Microsoft login redirect URL."""
    authorization_url: str = Field(..., description="Full Microsoft Entra authorization URL with PKCE")
    state: str = Field(..., description="CSRF state token for callback validation")


class MicrosoftCallbackRequest(BaseModel):
    """Request body for the Microsoft OAuth callback."""
    code: str = Field(..., description="Authorization code from Microsoft")
    state: str = Field(..., description="CSRF state token from the initial request")


class ExternalIdentityResponse(BaseModel):
    """Response showing an external identity link."""
    provider: str = Field(..., description="Identity provider name")
    provider_subject: str = Field(..., description="Provider-side user subject ID")
    display_name: Optional[str] = None
    email: Optional[str] = None
    linked_at: Optional[str] = None

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════
# OTP Challenge Schemas
# ═══════════════════════════════════════════════════════════════════════

class OtpSendRequest(BaseModel):
    """Request to send an OTP code."""
    channel: str = Field(
        ...,
        description="OTP channel: EMAIL or SMS",
        examples=["EMAIL", "SMS"],
    )
    purpose: str = Field(
        ...,
        description="OTP purpose: LOGIN_MFA, EMAIL_VERIFY, PHONE_VERIFY, PASSWORD_RESET",
        examples=["EMAIL_VERIFY"],
    )
    destination: Optional[str] = Field(
        None,
        description="Override destination (email/phone). If omitted, uses user's registered contact.",
    )


class OtpSendResponse(BaseModel):
    """Response after sending an OTP code."""
    challenge_id: str = Field(..., description="Unique OTP challenge identifier")
    channel: str = Field(..., description="Channel used (EMAIL/SMS)")
    destination: str = Field(..., description="Masked destination for display")
    expires_at: str = Field(..., description="ISO 8601 expiry timestamp")
    ttl_seconds: int = Field(..., description="Time-to-live in seconds")


class OtpVerifyRequest(BaseModel):
    """Request to verify an OTP code."""
    challenge_id: str = Field(..., description="The OTP challenge ID returned from the send endpoint")
    code: str = Field(
        ...,
        min_length=4,
        max_length=8,
        description="The OTP code received by the user",
    )


class OtpVerifyResponse(BaseModel):
    """Response after successful OTP verification."""
    verified: bool = Field(True, description="Whether verification succeeded")
    purpose: str = Field(..., description="The purpose of the verified OTP")
    channel: str = Field(..., description="The channel used")
    message: str = Field(default="OTP verified successfully.")


# ═══════════════════════════════════════════════════════════════════════
# MFA Status Schemas
# ═══════════════════════════════════════════════════════════════════════

class MfaStatusResponse(BaseModel):
    """Current MFA enrollment and verification status for a user."""
    mfa_enrolled: bool = Field(..., description="Whether MFA is enrolled")
    email_verified: bool = Field(..., description="Whether email is verified")
    phone_verified: bool = Field(..., description="Whether phone is verified")
    mfa_required: bool = Field(..., description="Whether MFA is required for this role")
    has_microsoft_link: bool = Field(..., description="Whether a Microsoft Entra identity is linked")
