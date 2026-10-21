import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.core.permissions import get_permissions_for_role
from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=100, description="Normalized unique identifier")
    email: Optional[str] = Field(None, max_length=255, description="Contact email address")
    phone: Optional[str] = Field(None, max_length=30, description="Contact mobile number")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name or company representative")
    business_name: Optional[str] = Field(None, max_length=255, description="Trading storefront or company name")
    territory: Optional[str] = Field(None, max_length=100, description="Assigned geographical zone or territory")
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    parent_id: Optional[uuid.UUID] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    permissions: List[str] = Field(default_factory=list)

    @classmethod
    def from_user(cls, user) -> "UserResponse":
        perms = [p.value for p in get_permissions_for_role(user.role)]
        res = cls.model_validate(user)
        res.permissions = perms
        return res


class UserCreateInternal(UserBase):
    """Internal schema for seeding or privileged administrative creation."""
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password to hash")
