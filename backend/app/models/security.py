"""
Security models for session tracking, login events, and security alerts.

These are append-only / immutable tables for compliance and forensics.
"""
import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Integer, String, Text, Uuid, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


# ═══════════════════════════════════════════════════════════════════════
# User Sessions — tracks active sessions per device/browser
# ═══════════════════════════════════════════════════════════════════════

class UserSession(Base):
    """
    Tracks active authenticated sessions. Enables:
    - View all active sessions for a user
    - Revoke specific sessions (e.g., lost device)
    - Revoke all sessions (e.g., password change)
    - Detect concurrent logins
    """
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # JWT JTI for the refresh token (used for revocation)
    refresh_jti: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    # Device / browser metadata
    device_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # web, mobile, api
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Auth method used to create this session
    auth_method: Mapped[str] = mapped_column(
        String(50), default="password", nullable=False  # password, microsoft_entra, otp
    )
    # Session lifecycle
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<UserSession id={self.id} user={self.user_id} active={self.is_active} device={self.device_type}>"


# ═══════════════════════════════════════════════════════════════════════
# Login Events — immutable audit trail for all login attempts
# ═══════════════════════════════════════════════════════════════════════

class LoginEventResult(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED_CREDENTIALS = "FAILED_CREDENTIALS"
    FAILED_MFA = "FAILED_MFA"
    FAILED_LOCKOUT = "FAILED_LOCKOUT"
    FAILED_INACTIVE = "FAILED_INACTIVE"
    FAILED_RATE_LIMITED = "FAILED_RATE_LIMITED"


class LoginEvent(Base):
    """
    Immutable record of every login attempt — successful or failed.
    Used for security monitoring, compliance, and anomaly detection.
    """
    __tablename__ = "login_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, nullable=False
    )
    # May be null for failed attempts where user doesn't exist
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    login_id_attempted: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    result: Mapped[LoginEventResult] = mapped_column(
        Enum(LoginEventResult, native_enum=False, length=30), nullable=False, index=True
    )
    auth_method: Mapped[str] = mapped_column(
        String(50), default="password", nullable=False  # password, microsoft_entra
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Session created (if login succeeded)
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<LoginEvent id={self.id} login={self.login_id_attempted} result={self.result}>"


# ═══════════════════════════════════════════════════════════════════════
# Security Alerts — suspicious activity flags
# ═══════════════════════════════════════════════════════════════════════

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SecurityAlert(Base):
    """
    Records security-relevant events that may require investigation:
    - Repeated login failures from an IP
    - Account lockouts
    - Concurrent sessions from different geolocations
    - MFA bypass attempts
    - Privileged role escalation
    """
    __tablename__ = "security_alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, nullable=False
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    alert_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, native_enum=False, length=20), nullable=False, index=True
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<SecurityAlert id={self.id} type={self.alert_type} severity={self.severity}>"
