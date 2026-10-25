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
    cascade: bool = Field(False, description="Whether to cascade status transition down to all subordinate distributors and retailers")


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


# ==============================================================================
# Phase 4: Hierarchical Creation & Lineage Schemas
# ==============================================================================

class SuperDistributorCreateRequest(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    business_name: Optional[str] = Field(None, max_length=255)
    territory: Optional[str] = Field(None, max_length=100, description="Assigned state or geographical region")


class AreaDistributorCreateRequest(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    business_name: Optional[str] = Field(None, max_length=255)
    territory: Optional[str] = Field(None, max_length=100, description="Assigned district or city")
    super_distributor_id: Optional[uuid.UUID] = Field(None, description="Parent Super Distributor UUID (optional if SD caller)")


class RetailerCreateRequest(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    business_name: Optional[str] = Field(None, max_length=255)
    territory: Optional[str] = Field(None, max_length=100, description="Assigned locality or pincode")
    area_distributor_id: Optional[uuid.UUID] = Field(None, description="Parent Area Distributor UUID (optional if AD caller)")


class UserCreateHierarchicalRequest(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    business_name: Optional[str] = Field(None, max_length=255)
    territory: Optional[str] = Field(None, max_length=100)
    parent_id: Optional[uuid.UUID] = Field(None, description="Parent reporting distributor UUID")


class LineageNodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    login_id: str
    full_name: str
    role: UserRole
    status: UserStatus
    territory: Optional[str] = None
    business_name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    depth: int = 0


class LineageChainResponse(BaseModel):
    user_id: uuid.UUID
    ancestors: List[LineageNodeResponse]
    is_lineage_active: bool = True
    blocking_reason: Optional[str] = None


class DownlineTreeNodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    login_id: str
    full_name: str
    role: UserRole
    status: UserStatus
    territory: Optional[str] = None
    business_name: Optional[str] = None
    subordinates_count: int = 0
    children: List["DownlineTreeNodeResponse"] = Field(default_factory=list)
