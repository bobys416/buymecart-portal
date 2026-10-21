import json
import math
import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from app.api.deps import is_in_network_scope
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole, UserStatus
from app.schemas.network import NetworkSummaryResponse, PaginationMeta


class NetworkService:
    """Organizational hierarchy management, scoped data querying, and audit logging."""

    @staticmethod
    def get_network_summary(db: Session, actor: User) -> NetworkSummaryResponse:
        """Calculates scoped network operational metrics based on actor's hierarchy position."""
        if actor.role == UserRole.ADMIN:
            # Platform-wide aggregation
            total_sds = db.scalar(select(func.count(User.id)).where(User.role == UserRole.SUPER_DISTRIBUTOR)) or 0
            total_ads = db.scalar(select(func.count(User.id)).where(User.role == UserRole.AREA_DISTRIBUTOR)) or 0
            total_rets = db.scalar(select(func.count(User.id)).where(User.role == UserRole.RETAILER)) or 0

            active = db.scalar(select(func.count(User.id)).where(User.status == UserStatus.ACTIVE)) or 0
            inactive = db.scalar(select(func.count(User.id)).where(User.status == UserStatus.INACTIVE)) or 0
            suspended = db.scalar(select(func.count(User.id)).where(User.status == UserStatus.SUSPENDED)) or 0
            pending = db.scalar(select(func.count(User.id)).where(User.status == UserStatus.PENDING_REVIEW)) or 0

            return NetworkSummaryResponse(
                scope="PLATFORM_ADMIN",
                user_id=actor.id,
                user_role=actor.role,
                territory="Global Platform",
                total_super_distributors=total_sds,
                total_area_distributors=total_ads,
                total_retailers=total_rets,
                active_users=active,
                inactive_users=inactive,
                suspended_users=suspended,
                pending_review_users=pending,
            )

        elif actor.role == UserRole.SUPER_DISTRIBUTOR:
            # Regional Super Distributor aggregation
            ad_ids = list(db.scalars(select(User.id).where(User.role == UserRole.AREA_DISTRIBUTOR, User.parent_id == actor.id)))
            total_ads = len(ad_ids)
            total_rets = 0
            if ad_ids:
                total_rets = db.scalar(select(func.count(User.id)).where(User.role == UserRole.RETAILER, User.parent_id.in_(ad_ids))) or 0

            # Active/Inactive within SD descendant tree + self
            scoped_user_ids = [actor.id] + ad_ids
            if ad_ids:
                ret_ids = list(db.scalars(select(User.id).where(User.role == UserRole.RETAILER, User.parent_id.in_(ad_ids))))
                scoped_user_ids.extend(ret_ids)

            active = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.ACTIVE)) or 0
            inactive = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.INACTIVE)) or 0
            suspended = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.SUSPENDED)) or 0
            pending = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.PENDING_REVIEW)) or 0

            return NetworkSummaryResponse(
                scope="REGIONAL_SUPER_DISTRIBUTOR",
                user_id=actor.id,
                user_role=actor.role,
                territory=actor.territory or "Assigned Region",
                total_super_distributors=1,
                total_area_distributors=total_ads,
                total_retailers=total_rets,
                active_users=active,
                inactive_users=inactive,
                suspended_users=suspended,
                pending_review_users=pending,
            )

        elif actor.role == UserRole.AREA_DISTRIBUTOR:
            # Area Distributor aggregation
            ret_ids = list(db.scalars(select(User.id).where(User.role == UserRole.RETAILER, User.parent_id == actor.id)))
            total_rets = len(ret_ids)
            scoped_user_ids = [actor.id] + ret_ids

            active = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.ACTIVE)) or 0
            inactive = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.INACTIVE)) or 0
            suspended = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.SUSPENDED)) or 0
            pending = db.scalar(select(func.count(User.id)).where(User.id.in_(scoped_user_ids), User.status == UserStatus.PENDING_REVIEW)) or 0

            return NetworkSummaryResponse(
                scope="AREA_DISTRIBUTOR",
                user_id=actor.id,
                user_role=actor.role,
                territory=actor.territory or "Assigned Territory",
                total_super_distributors=0,
                total_area_distributors=1,
                total_retailers=total_rets,
                active_users=active,
                inactive_users=inactive,
                suspended_users=suspended,
                pending_review_users=pending,
            )

        else:
            # Retailer Storefront self-summary
            return NetworkSummaryResponse(
                scope="RETAILER",
                user_id=actor.id,
                user_role=actor.role,
                territory=actor.territory,
                total_super_distributors=0,
                total_area_distributors=0,
                total_retailers=1,
                active_users=1 if actor.status == UserStatus.ACTIVE else 0,
                inactive_users=1 if actor.status == UserStatus.INACTIVE else 0,
                suspended_users=1 if actor.status == UserStatus.SUSPENDED else 0,
                pending_review_users=1 if actor.status == UserStatus.PENDING_REVIEW else 0,
            )

    @classmethod
    def get_scoped_users(
        cls,
        db: Session,
        actor: User,
        target_role: UserRole,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[UserStatus] = None,
        search_query: Optional[str] = None,
        parent_filter_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[User], PaginationMeta]:
        """
        Queries and filters users of target_role while strictly enforcing
        the actor's network scope.
        """
        query = select(User).where(User.role == target_role)

        # 1. Enforce Role Scope Boundaries
        if actor.role == UserRole.ADMIN:
            if parent_filter_id:
                query = query.where(User.parent_id == parent_filter_id)
        elif actor.role == UserRole.SUPER_DISTRIBUTOR:
            if target_role == UserRole.SUPER_DISTRIBUTOR:
                query = query.where(User.id == actor.id)
            elif target_role == UserRole.AREA_DISTRIBUTOR:
                query = query.where(User.parent_id == actor.id)
            elif target_role == UserRole.RETAILER:
                ad_ids = list(db.scalars(select(User.id).where(User.role == UserRole.AREA_DISTRIBUTOR, User.parent_id == actor.id)))
                query = query.where(User.parent_id.in_(ad_ids) if ad_ids else False)
        elif actor.role == UserRole.AREA_DISTRIBUTOR:
            if target_role == UserRole.AREA_DISTRIBUTOR:
                query = query.where(User.id == actor.id)
            elif target_role == UserRole.RETAILER:
                query = query.where(User.parent_id == actor.id)
            else:
                # AD cannot query Super Distributors
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden to distributor tier.")
        elif actor.role == UserRole.RETAILER:
            if target_role == UserRole.RETAILER:
                query = query.where(User.id == actor.id)
            elif target_role == UserRole.AREA_DISTRIBUTOR:
                # Retailer may only view assigned parent AD
                query = query.where(User.id == actor.parent_id if actor.parent_id else False)
            else:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden to distributor tier.")

        # 2. Status filter
        if status_filter:
            query = query.where(User.status == status_filter)

        # 3. Search query filter
        if search_query:
            term = f"%{search_query.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(User.login_id).like(term),
                    func.lower(User.full_name).like(term),
                    func.lower(User.email).like(term),
                    User.phone.like(term),
                    func.lower(User.business_name).like(term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_items = db.scalar(count_query) or 0
        total_pages = math.ceil(total_items / page_size) if total_items > 0 else 0

        # Pagination
        offset = (page - 1) * page_size
        results = list(db.scalars(query.order_by(User.created_at.desc()).offset(offset).limit(page_size)))

        meta = PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        )
        return results, meta

    @staticmethod
    def get_user_by_id_scoped(db: Session, actor: User, user_id: uuid.UUID) -> Optional[User]:
        """
        Fetches user by UUID if within the actor's authorized network scope.
        Returns None if not found or outside authorized scope.
        """
        user = db.scalar(select(User).where(User.id == user_id))
        if not user:
            return None
        if not is_in_network_scope(actor, user, db):
            return None
        return user

    @classmethod
    def change_user_status(
        cls,
        db: Session,
        actor: User,
        user_id: uuid.UUID,
        new_status: UserStatus,
        reason: str,
        actor_ip: Optional[str] = None,
    ) -> User:
        """
        Updates account lifecycle status with strict privilege separation and audit logging.
        Prevents self-modification, self-approval, or unauthorized privilege elevation.
        """
        if actor.id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Users are strictly prohibited from changing their own account status or self-approving.",
            )

        target = cls.get_user_by_id_scoped(db, actor, user_id)
        if not target:
            # Consistent resource disclosure: return 404 for non-existent or out-of-scope targets
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or outside your authorized network scope.",
            )

        # Role tier guard: actor cannot modify a user with an equal or higher role tier
        role_tiers = {
            UserRole.ADMIN: 4,
            UserRole.SUPER_DISTRIBUTOR: 3,
            UserRole.AREA_DISTRIBUTOR: 2,
            UserRole.RETAILER: 1,
        }
        if role_tiers.get(actor.role, 0) <= role_tiers.get(target.role, 0) and actor.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify account status of a user in an equal or higher organizational tier.",
            )

        old_status = target.status
        target.status = new_status

        # Append-only audit record
        audit_entry = AuditLog(
            actor_id=actor.id,
            actor_login_id=actor.login_id,
            actor_role=actor.role.value,
            action="USER_STATUS_CHANGE",
            target_id=target.id,
            target_type="USER",
            actor_ip=actor_ip,
            metadata_json=json.dumps({
                "target_login_id": target.login_id,
                "target_role": target.role.value,
                "old_status": old_status.value,
                "new_status": new_status.value,
                "reason": reason,
            }),
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(target)
        return target

    @classmethod
    def reassign_distributor(
        cls,
        db: Session,
        actor: User,
        user_id: uuid.UUID,
        new_parent_id: Optional[uuid.UUID],
        reason: str,
        actor_ip: Optional[str] = None,
    ) -> User:
        """
        Reassigns a distributor's parent relationship.
        Strictly prevents:
        - Self-parenting (new_parent_id == target.id)
        - Hierarchy cycles (target is an ancestor of new_parent)
        - Cross-tier structural violations
        - Unauthorized non-admin modifications
        """
        if actor.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only platform Administrators may reassign organizational hierarchy relationships.",
            )

        target = db.scalar(select(User).where(User.id == user_id))
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

        # 1. Prevent self-parenting
        if new_parent_id == target.id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Self-parenting is invalid: A user cannot be assigned as their own parent.",
            )

        new_parent = None
        if new_parent_id:
            new_parent = db.scalar(select(User).where(User.id == new_parent_id))
            if not new_parent:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposed parent user not found.")

            # 2. Prevent hierarchy cycles: verify target is not an ancestor of proposed new_parent
            curr = new_parent
            visited = set()
            while curr and curr.parent_id:
                if curr.parent_id == target.id:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Hierarchy cycle detected: The target user is already an ancestor of the proposed parent.",
                    )
                if curr.id in visited:
                    break
                visited.add(curr.id)
                curr = db.scalar(select(User).where(User.id == curr.parent_id))

        # 3. Check structural hierarchy rules
        is_valid, err_msg = target.validate_hierarchy(new_parent)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Hierarchy violation: {err_msg}",
            )

        old_parent_id = target.parent_id
        target.parent_id = new_parent_id

        # 4. Append-only audit log
        audit_entry = AuditLog(
            actor_id=actor.id,
            actor_login_id=actor.login_id,
            actor_role=actor.role.value,
            action="DISTRIBUTOR_REASSIGNMENT",
            target_id=target.id,
            target_type="USER",
            actor_ip=actor_ip,
            metadata_json=json.dumps({
                "target_login_id": target.login_id,
                "target_role": target.role.value,
                "old_parent_id": str(old_parent_id) if old_parent_id else None,
                "new_parent_id": str(new_parent_id) if new_parent_id else None,
                "reason": reason,
            }),
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(target)
        return target
