import math
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.api.deps import (
    get_current_active_user,
    require_admin,
    require_permission,
)
from app.core.permissions import Permission
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole, UserStatus
from app.schemas.network import (
    AreaDistributorCreateRequest,
    AuditLogResponse,
    DownlineTreeNodeResponse,
    LineageChainResponse,
    NetworkSummaryResponse,
    PaginatedResponse,
    PaginationMeta,
    RetailerCreateRequest,
    SuperDistributorCreateRequest,
    UserCreateHierarchicalRequest,
    UserReassignRequest,
    UserStatusUpdateRequest,
)
from app.schemas.user import UserResponse
from app.services.network_service import NetworkService

router = APIRouter(tags=["Distributor Network & Hierarchy"])


@router.get(
    "/users/me",
    response_model=UserResponse,
    summary="Get Current User Profile & Scoped Permissions",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the authenticated user's profile, including their verified business role,
    reporting parent relationship, and explicit permission grants.
    """
    return UserResponse.from_user(current_user)


@router.get(
    "/network/summary",
    response_model=NetworkSummaryResponse,
    summary="Get Scoped Network Operational Metrics",
)
def get_network_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns hierarchical network operational telemetry:
    - Admin: Platform-wide counts.
    - Super Distributor: Regional tree counts (assigned ADs & subordinate Retailers).
    - Area Distributor: District tree counts (assigned Retailers).
    - Retailer: Storefront node status.
    """
    return NetworkService.get_network_summary(db, current_user)


@router.get(
    "/distributors/super",
    response_model=PaginatedResponse[UserResponse],
    summary="List Super Distributors",
    dependencies=[Depends(require_permission(Permission.VIEW_USERS))],
)
def list_super_distributors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[UserStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists Super Distributors within authorized scope:
    - Admin: All Super Distributors across the platform.
    - Super Distributor: Self.
    - Area Distributor / Retailer: 403 Forbidden.
    """
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_DISTRIBUTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Super Distributor directory requires regional or platform administrative role.",
        )

    users, meta = NetworkService.get_scoped_users(
        db=db,
        actor=current_user,
        target_role=UserRole.SUPER_DISTRIBUTOR,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search_query=search,
    )
    return PaginatedResponse(
        items=[UserResponse.from_user(u) for u in users],
        meta=meta,
    )


@router.get(
    "/distributors/area",
    response_model=PaginatedResponse[UserResponse],
    summary="List Area Distributors",
    dependencies=[Depends(require_permission(Permission.VIEW_USERS))],
)
def list_area_distributors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[UserStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    super_distributor_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists Area Distributors within authorized scope:
    - Admin: All Area Distributors, optionally filtered by Super Distributor.
    - Super Distributor: Assigned Area Distributors under their management.
    - Area Distributor: Self.
    - Retailer: Assigned parent Area Distributor.
    """
    users, meta = NetworkService.get_scoped_users(
        db=db,
        actor=current_user,
        target_role=UserRole.AREA_DISTRIBUTOR,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search_query=search,
        parent_filter_id=super_distributor_id,
    )
    return PaginatedResponse(
        items=[UserResponse.from_user(u) for u in users],
        meta=meta,
    )


@router.get(
    "/retailers",
    response_model=PaginatedResponse[UserResponse],
    summary="List Retailer Merchants",
    dependencies=[Depends(require_permission(Permission.VIEW_USERS))],
)
def list_retailers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[UserStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    area_distributor_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists Retailer Storefront Merchants within authorized scope:
    - Admin: All Retailers across the network.
    - Super Distributor: Retailers subordinate to their assigned Area Distributors.
    - Area Distributor: Retailers directly assigned to their district node.
    - Retailer: Self.
    """
    users, meta = NetworkService.get_scoped_users(
        db=db,
        actor=current_user,
        target_role=UserRole.RETAILER,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search_query=search,
        parent_filter_id=area_distributor_id,
    )
    return PaginatedResponse(
        items=[UserResponse.from_user(u) for u in users],
        meta=meta,
    )


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get User by ID (Scoped)",
    dependencies=[Depends(require_permission(Permission.VIEW_USERS))],
)
def get_user_by_id(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Fetches a user profile by UUID.
    Returns 404 if the user does not exist or falls outside the requester's authorized network scope.
    """
    user = NetworkService.get_user_by_id_scoped(db, current_user, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or outside authorized network scope.",
        )
    return UserResponse.from_user(user)


@router.patch(
    "/users/{user_id}/status",
    response_model=UserResponse,
    summary="Update User Account Lifecycle Status",
    dependencies=[Depends(require_permission(Permission.CHANGE_ACCOUNT_STATUS))],
)
def update_user_status(
    user_id: uuid.UUID,
    update_req: UserStatusUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Transitions a user account status (e.g. ACTIVE -> SUSPENDED).
    Requires explicit CHANGE_ACCOUNT_STATUS permission.
    Prevents self-modification, self-approval, or unauthorized privilege escalation.
    Records an append-only audit log entry.
    """
    client_ip = request.client.host if request.client else None
    updated_user = NetworkService.change_user_status(
        db=db,
        actor=current_user,
        user_id=user_id,
        new_status=update_req.status,
        reason=update_req.reason,
        cascade=update_req.cascade,
        actor_ip=client_ip,
    )
    return UserResponse.from_user(updated_user)


@router.patch(
    "/users/{user_id}/reassign",
    response_model=UserResponse,
    summary="Reassign Distributor Parent Relationship",
    dependencies=[Depends(require_permission(Permission.ASSIGN_DISTRIBUTOR))],
)
def reassign_distributor(
    user_id: uuid.UUID,
    reassign_req: UserReassignRequest,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Reassigns an Area Distributor to a new Super Distributor, or Retailer to an Area Distributor.
    Only Root Administrators may execute structural reassignments.
    Strictly prevents self-parenting and hierarchy cycles.
    """
    client_ip = request.client.host if request.client else None
    updated_user = NetworkService.reassign_distributor(
        db=db,
        actor=current_user,
        user_id=user_id,
        new_parent_id=reassign_req.new_parent_id,
        reason=reassign_req.reason,
        actor_ip=client_ip,
    )
    return UserResponse.from_user(updated_user)


@router.get(
    "/audit/logs",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="List Privileged Audit Logs",
    dependencies=[Depends(require_admin)],
)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Lists security and organizational audit trail entries.
    Append-only records available strictly to platform administrators.
    """
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)

    total_items = db.scalar(select(func.count(AuditLog.id))) or 0
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 0

    offset = (page - 1) * page_size
    logs = list(db.scalars(query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)))

    return PaginatedResponse(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )


# ==============================================================================
# Phase 4: Hierarchical Account Creation & Lineage Endpoints
# ==============================================================================

@router.post(
    "/distributors/super",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Super Distributor (Admin Only)",
    dependencies=[Depends(require_admin)],
)
def create_super_distributor(
    req: SuperDistributorCreateRequest,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Onboards a regional Super Distributor.
    Only platform Administrators may execute top-level distributor onboarding.
    """
    client_ip = request.client.host if request.client else None
    hierarchical_req = UserCreateHierarchicalRequest(
        login_id=req.login_id,
        password=req.password,
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        business_name=req.business_name,
        territory=req.territory,
        role=UserRole.SUPER_DISTRIBUTOR,
        parent_id=None,
    )
    new_user = NetworkService.create_hierarchical_user(
        db=db,
        actor=current_user,
        req=hierarchical_req,
        actor_ip=client_ip,
    )
    return UserResponse.from_user(new_user)


@router.post(
    "/distributors/area",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Area Distributor",
    dependencies=[Depends(require_permission(Permission.CREATE_USER))],
)
def create_area_distributor(
    req: AreaDistributorCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Onboards a district Area Distributor.
    - Super Distributors automatically become the parent distributor.
    - Administrators must supply an active Super Distributor UUID as parent.
    """
    client_ip = request.client.host if request.client else None
    parent_id = current_user.id if current_user.role == UserRole.SUPER_DISTRIBUTOR else req.super_distributor_id

    hierarchical_req = UserCreateHierarchicalRequest(
        login_id=req.login_id,
        password=req.password,
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        business_name=req.business_name,
        territory=req.territory,
        role=UserRole.AREA_DISTRIBUTOR,
        parent_id=parent_id,
    )
    new_user = NetworkService.create_hierarchical_user(
        db=db,
        actor=current_user,
        req=hierarchical_req,
        actor_ip=client_ip,
    )
    return UserResponse.from_user(new_user)


@router.post(
    "/retailers",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Retailer Merchant",
    dependencies=[Depends(require_permission(Permission.CREATE_USER))],
)
def create_retailer(
    req: RetailerCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Onboards a storefront Retailer node.
    - Area Distributors automatically become the direct reporting parent.
    - Super Distributors and Admins must specify a valid subordinate Area Distributor.
    """
    client_ip = request.client.host if request.client else None
    parent_id = current_user.id if current_user.role == UserRole.AREA_DISTRIBUTOR else req.area_distributor_id

    hierarchical_req = UserCreateHierarchicalRequest(
        login_id=req.login_id,
        password=req.password,
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        business_name=req.business_name,
        territory=req.territory,
        role=UserRole.RETAILER,
        parent_id=parent_id,
    )
    new_user = NetworkService.create_hierarchical_user(
        db=db,
        actor=current_user,
        req=hierarchical_req,
        actor_ip=client_ip,
    )
    return UserResponse.from_user(new_user)


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Unified Hierarchical User Creation",
    dependencies=[Depends(require_permission(Permission.CREATE_USER))],
)
def create_user_hierarchical(
    req: UserCreateHierarchicalRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Unified endpoint for hierarchical account provisioning.
    Enforces server-side parentage validation, territory scoping, and audit logs.
    """
    client_ip = request.client.host if request.client else None
    new_user = NetworkService.create_hierarchical_user(
        db=db,
        actor=current_user,
        req=req,
        actor_ip=client_ip,
    )
    return UserResponse.from_user(new_user)


@router.get(
    "/users/{user_id}/lineage",
    response_model=LineageChainResponse,
    summary="Get User Lineage Chain & Upstream Status",
    dependencies=[Depends(require_permission(Permission.VIEW_USERS))],
)
def get_user_lineage(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Traverses the ancestor hierarchy from the target user up to Root Admin.
    Reports whether all upstream distributors are active or if any ancestor node is suspended.
    """
    return NetworkService.get_user_lineage(
        db=db,
        actor=current_user,
        user_id=user_id,
    )


@router.get(
    "/users/{user_id}/downline",
    response_model=DownlineTreeNodeResponse,
    summary="Get Downline Subordinate Tree (Scoped)",
    dependencies=[Depends(require_permission(Permission.VIEW_USERS))],
)
def get_user_downline(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Recursively returns all subordinate distributors and retailers under target node.
    Enforces authorized network scope.
    """
    return NetworkService.get_downline_tree(
        db=db,
        actor=current_user,
        root_user_id=user_id,
    )


@router.get(
    "/network/tree",
    response_model=DownlineTreeNodeResponse,
    summary="Get Current User's Downline Tree",
)
def get_my_network_tree(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns the complete hierarchical downline tree starting from the authenticated user.
    """
    return NetworkService.get_downline_tree(
        db=db,
        actor=current_user,
        root_user_id=current_user.id,
    )
