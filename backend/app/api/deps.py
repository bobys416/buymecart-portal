import time
import uuid
from collections import defaultdict
from typing import Callable, Dict, List, Optional
from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.permissions import Permission, has_permission
from app.core.security import decode_token, is_token_revoked
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.services.auth_service import AuthService

# Optional HTTPBearer scheme so browser cookies can also be used seamlessly
bearer_scheme = HTTPBearer(auto_error=False)

# In-memory sliding window rate limiter for single-instance / local use
# In clustered AWS deployments, replace with Redis token-bucket via aioredis
_IP_REQUEST_LOGS: Dict[str, List[float]] = defaultdict(list)


def rate_limiter(request: Request) -> None:
    """
    Sliding window rate-limiter based on client IP.
    Protects authentication endpoints from brute-force attempts.
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60.0  # 1 minute

    # Prune timestamps older than window
    logs = _IP_REQUEST_LOGS[client_ip]
    _IP_REQUEST_LOGS[client_ip] = [t for t in logs if t > now - window]

    if len(_IP_REQUEST_LOGS[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again after 60 seconds.",
            headers={"Retry-After": "60"},
        )

    _IP_REQUEST_LOGS[client_ip].append(now)


def get_token_from_request(
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
    authorization: Optional[str] = Header(None),
) -> str:
    """
    Extracts JWT token from Authorization header or HttpOnly secure cookie.
    Enables support for both web cookies and mobile Bearer tokens.
    """
    if bearer and bearer.credentials:
        return bearer.credentials
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    if access_token_cookie:
        return access_token_cookie

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials were not provided.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates token signature, expiration, revocation status,
    and returns the active authenticated database User record.
    Never trusts client-submitted role parameters.
    """
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for resource access.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been invalidated. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = AuthService.get_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended.",
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Explicit active-account verification dependency."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active.",
        )
    return current_user


def require_roles(*allowed_roles: UserRole) -> Callable[[User], User]:
    """
    Dependency factory that enforces server-side role-based authorization.
    Rejects requests with 403 Forbidden if user role is not authorized.
    """
    def role_verifier(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            role_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role.value}' does not have required permissions ({', '.join(role_names)}).",
            )
        return current_user

    return role_verifier


def require_permission(permission: Permission) -> Callable[[User], User]:
    """
    Dependency factory that enforces granular permissions based on server-side roles.
    Rejects requests with 403 Forbidden if user role lacks the required permission.
    """
    def permission_verifier(current_user: User = Depends(get_current_active_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role.value}' lacks required permission '{permission.value}'.",
            )
        return current_user

    return permission_verifier


def is_in_network_scope(actor: User, target: User, db: Session) -> bool:
    """
    Determines whether a target user record falls within the authenticated actor's network scope:
    - Root Admin: Platform-wide scope (all records).
    - Super Distributor: Own record, assigned Area Distributors, and their subordinate Retailers.
    - Area Distributor: Own record, directly assigned Retailers, and immediate parent SD.
    - Retailer: Own record and immediate parent AD.
    """
    # 1. Self-access is always permitted
    if actor.id == target.id:
        return True

    # 2. Admin has system-wide oversight
    if actor.role == UserRole.ADMIN:
        return True

    # 3. Super Distributor scope
    if actor.role == UserRole.SUPER_DISTRIBUTOR:
        if target.role == UserRole.AREA_DISTRIBUTOR and target.parent_id == actor.id:
            return True
        if target.role == UserRole.RETAILER and target.parent_id:
            # Query target's parent AD to check if AD reports to actor
            ad_parent = db.scalar(select(User).where(User.id == target.parent_id))
            if ad_parent and ad_parent.parent_id == actor.id:
                return True
        return False

    # 4. Area Distributor scope
    if actor.role == UserRole.AREA_DISTRIBUTOR:
        if target.role == UserRole.RETAILER and target.parent_id == actor.id:
            return True
        if target.id == actor.parent_id:
            return True  # Assigned parent Super Distributor
        return False

    # 5. Retailer scope
    if actor.role == UserRole.RETAILER:
        if target.id == actor.parent_id:
            return True  # Assigned parent Area Distributor
        return False

    return False


# Reusable Role Access Guard Dependencies
require_admin = require_roles(UserRole.ADMIN)
require_super_distributor = require_roles(UserRole.ADMIN, UserRole.SUPER_DISTRIBUTOR)
require_area_distributor = require_roles(UserRole.ADMIN, UserRole.SUPER_DISTRIBUTOR, UserRole.AREA_DISTRIBUTOR)
require_retailer = require_roles(UserRole.RETAILER)
