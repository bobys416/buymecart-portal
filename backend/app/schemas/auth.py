from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    login_id: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Normalized user login identifier, email, or merchant terminal ID",
        examples=["admin@buymecart.org", "sd.central@buymecart.org"],
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Account password",
    )


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="Signed JWT Bearer access token")
    refresh_token: str = Field(..., description="Signed JWT refresh token for session renewal")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration period in seconds")
    user: UserResponse = Field(..., description="Authenticated user profile and role details")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid JWT refresh token")


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Optional refresh token to invalidate")


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
