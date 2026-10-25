import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Uuid, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.user import User

class IdentityProvider(str, enum.Enum):
    MICROSOFT_ENTRA = "MICROSOFT_ENTRA"
    # Future providers can be added here

class ExternalIdentity(Base):
    """Links a local user to an external identity provider (e.g., Microsoft Entra)."""
    __tablename__ = "external_identities"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[IdentityProvider] = mapped_column(
        Enum(IdentityProvider, native_enum=False, length=50), nullable=False, index=True
    )
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    user: Mapped[User] = relationship("User", backref="external_identities")
