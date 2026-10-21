import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPER_DISTRIBUTOR = "SUPER_DISTRIBUTOR"
    AREA_DISTRIBUTOR = "AREA_DISTRIBUTOR"
    RETAILER = "RETAILER"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    PENDING_REVIEW = "PENDING_REVIEW"


class User(Base):
    """
    User entity representing system operators across the four-role hierarchy:
    Admin -> Super Distributor -> Area Distributor -> Retailer.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    # Normalized unique login identifier (lowercased email, username, or merchant code)
    login_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        index=True,
        nullable=True,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(30),
        index=True,
        nullable=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    business_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    territory: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, native_enum=False, length=50),
        nullable=False,
        default=UserStatus.ACTIVE,
        index=True,
    )
    # Reporting hierarchy: Retailer -> Area Distributor -> Super Distributor -> (Admin/None)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Security & Audit metadata
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Hierarchy Relationships
    parent: Mapped[Optional["User"]] = relationship(
        "User",
        remote_side=[id],
        back_populates="subordinates",
    )
    subordinates: Mapped[List["User"]] = relationship(
        "User",
        back_populates="parent",
        cascade="all, delete-orphan",
    )

    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE

    def validate_hierarchy(self, parent_user: Optional["User"] = None) -> tuple[bool, Optional[str]]:
        """
        Validates reporting hierarchy business rules:
        - Admin cannot have a parent.
        - Super Distributor parent must be Admin or None.
        - Area Distributor parent must be Super Distributor.
        - Retailer parent must be Area Distributor.
        """
        if self.role == UserRole.ADMIN:
            if self.parent_id is not None or parent_user is not None:
                return False, "Admin cannot report to another user."
            return True, None

        if self.role == UserRole.SUPER_DISTRIBUTOR:
            if parent_user and parent_user.role != UserRole.ADMIN:
                return False, "Super Distributor may only report to an Admin."
            return True, None

        if self.role == UserRole.AREA_DISTRIBUTOR:
            if not parent_user or parent_user.role != UserRole.SUPER_DISTRIBUTOR:
                return False, "Area Distributor must report to an authorized Super Distributor."
            return True, None

        if self.role == UserRole.RETAILER:
            if not parent_user or parent_user.role != UserRole.AREA_DISTRIBUTOR:
                return False, "Retailer must report to an authorized Area Distributor."
            return True, None

        return True, None

    def __repr__(self) -> str:
        return f"<User id={self.id} login_id={self.login_id} role={self.role} status={self.status}>"
