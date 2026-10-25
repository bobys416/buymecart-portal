import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Integer, String, Uuid, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class OtpChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"


class OtpPurpose(str, enum.Enum):
    LOGIN_MFA = "LOGIN_MFA"           # Second factor during login
    EMAIL_VERIFY = "EMAIL_VERIFY"     # Email ownership verification
    PHONE_VERIFY = "PHONE_VERIFY"     # Phone ownership verification
    PASSWORD_RESET = "PASSWORD_RESET"


class OtpChallenge(Base):
    """
    Tracks individual OTP challenges with brute-force protection.

    Each challenge has:
    - A hashed code (never stored in plaintext)
    - An expiry timestamp
    - Attempt counter with max-attempts lockout
    - Cooldown enforcement via created_at
    """
    __tablename__ = "otp_challenges"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    channel: Mapped[OtpChannel] = mapped_column(
        Enum(OtpChannel, native_enum=False, length=20), nullable=False
    )
    purpose: Mapped[OtpPurpose] = mapped_column(
        Enum(OtpPurpose, native_enum=False, length=30), nullable=False
    )
    # OTP code is stored as a bcrypt hash to prevent DB-level exposure
    hashed_code: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(
        String(255), nullable=False  # email address or phone number
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @property
    def is_expired(self) -> bool:
        from datetime import timezone as tz
        now = datetime.now(tz.utc)
        if self.expires_at.tzinfo is None:
            now = now.replace(tzinfo=None)
        return now > self.expires_at

    @property
    def is_locked(self) -> bool:
        return self.attempts >= self.max_attempts

    def __repr__(self) -> str:
        return (
            f"<OtpChallenge id={self.id} user={self.user_id} "
            f"channel={self.channel} purpose={self.purpose} "
            f"verified={self.is_verified}>"
        )
