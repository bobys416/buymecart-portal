import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_dummy_password, verify_password
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreateInternal


class AuthService:
    """Authentication and identity lifecycle service with strict security validation."""

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
        return db.scalar(select(User).where(User.id == user_id))

    @staticmethod
    def get_by_login_id(db: Session, login_id: str) -> Optional[User]:
        normalized = login_id.strip().lower()
        return db.scalar(select(User).where(func.lower(User.login_id) == normalized))

    @classmethod
    def authenticate(cls, db: Session, login_id: str, password: str) -> User:
        """
        Authenticates a user against secure bcrypt password hashes.
        Uses constant-time dummy verification and generic error messaging
        to prevent user enumeration side-channels.
        """
        normalized_id = login_id.strip().lower()
        user = cls.get_by_login_id(db, normalized_id)

        if not user:
            # Perform dummy verification to match timing characteristics
            verify_dummy_password()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login identifier or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Account lockout after too many failed attempts
        if user.failed_login_attempts >= User.MAX_FAILED_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to multiple failed login attempts. Contact support.",
            )
        if not verify_password(password, user.hashed_password):
            user.failed_login_attempts += 1
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login identifier or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Active account check
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive, suspended, or pending verification. Access denied.",
            )

        # Successful authentication: reset failed attempts & update timestamp
        user.failed_login_attempts = 0
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        return user

    @classmethod
    def create_internal_user(cls, db: Session, user_in: UserCreateInternal) -> User:
        """
        Internal / Admin-only helper to register users while strictly enforcing
        the hierarchical reporting structure.
        """
        normalized_id = user_in.login_id.strip().lower()
        existing = cls.get_by_login_id(db, normalized_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this login identifier already exists.",
            )

        parent_user = None
        if user_in.parent_id:
            parent_user = cls.get_by_id(db, user_in.parent_id)
            if not parent_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent reporting user not found.",
                )

        new_user = User(
            login_id=normalized_id,
            email=user_in.email.strip().lower() if user_in.email else None,
            phone=user_in.phone.strip() if user_in.phone else None,
            full_name=user_in.full_name.strip(),
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role,
            status=user_in.status,
            parent_id=user_in.parent_id,
        )

        # Enforce hierarchy governance rules
        is_valid, err_msg = new_user.validate_hierarchy(parent_user)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Hierarchy violation: {err_msg}",
            )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
