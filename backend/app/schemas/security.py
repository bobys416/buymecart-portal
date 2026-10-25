"""
Security, session management, and login event schemas.
"""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class UserSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    auth_method: str
    is_active: bool
    last_activity_at: datetime
    expires_at: datetime
    created_at: datetime
    is_current: bool = False


class SessionRevokeResponse(BaseModel):
    revoked_count: int
    message: str


class LoginEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    login_id_attempted: str
    result: str
    auth_method: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: datetime


class SecurityAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    alert_type: str
    severity: str
    message: str
    ip_address: Optional[str] = None
    metadata_json: Optional[str] = None
    is_resolved: bool
    resolved_by: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class SecurityAlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = Field(None, max_length=500)


class PasswordResetRequest(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=100, description="Login ID or registered email")
    channel: str = Field(default="EMAIL", description="Delivery channel: EMAIL or SMS")


class PasswordResetConfirm(BaseModel):
    challenge_id: uuid.UUID = Field(..., description="OTP challenge UUID received during request")
    code: str = Field(..., min_length=4, max_length=8, description="Verification code received")
    new_password: str = Field(..., min_length=8, max_length=128, description="New secure password")


class MfaLoginChallengeResponse(BaseModel):
    mfa_required: bool = True
    mfa_token: str = Field(..., description="Temporary intermediate token for completing MFA step")
    user_id: uuid.UUID
    challenge_id: Optional[uuid.UUID] = None
    channels: List[str] = Field(default_factory=list)
    message: str


class MfaLoginVerifyRequest(BaseModel):
    mfa_token: str = Field(..., description="Temporary MFA token from login step")
    challenge_id: uuid.UUID = Field(..., description="OTP challenge ID to verify")
    code: str = Field(..., min_length=4, max_length=8, description="OTP code")
