import uuid
from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field
from app.models.user import UserRole, UserStatus
from app.schemas.user import UserResponse

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    total_items: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    meta: PaginationMeta


class NetworkSummaryResponse(BaseModel):
    scope: str
    user_id: uuid.UUID
    user_role: UserRole
    territory: Optional[str] = None
    total_super_distributors: int = 0
    total_area_distributors: int = 0
    total_retailers: int = 0
    active_users: int = 0
    inactive_users: int = 0
    suspended_users: int = 0
    pending_review_users: int = 0


class UserStatusUpdateRequest(BaseModel):
    status: UserStatus
    reason: str = Field(..., min_length=4, max_length=500, description="Audit justification for account status transition")


class UserReassignRequest(BaseModel):
    new_parent_id: Optional[uuid.UUID] = Field(None, description="UUID of the new authorized parent distributor")
    reason: str = Field(..., min_length=4, max_length=500, description="Audit justification for distributor reassignment")


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    actor_login_id: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    target_id: Optional[uuid.UUID] = None
    target_type: str
    metadata_json: Optional[str] = None
    actor_ip: Optional[str] = None
    created_at: datetime
