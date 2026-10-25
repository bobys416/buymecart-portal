"""
Session Lifecycle and Device Tracking Service.

Tracks authenticated user sessions, supports per-device revocation,
all-device revocation, and concurrent session tracking.
"""
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import revoke_token
from app.models.audit_log import AuditLog
from app.models.security import UserSession
from app.models.user import User


class SessionService:
    """Manages active user sessions, device metadata, and cryptographic revocation."""

    @staticmethod
    def parse_user_agent(user_agent: Optional[str]) -> tuple[str, str]:
        """
        Parses User-Agent string to determine device name and category.
        Returns: (device_name, device_type)
        """
        if not user_agent:
            return ("Unknown Device", "api")

        ua = user_agent.lower()

        # Determine device category
        if "ipad" in ua or "tablet" in ua:
            device_type = "tablet"
        elif "mobi" in ua or "iphone" in ua or "android" in ua:
            device_type = "mobile"
        elif "postman" in ua or "curl" in ua or "python" in ua or "httpx" in ua:
            device_type = "api"
        else:
            device_type = "web"

        # Determine browser/client name
        browser = "Unknown Browser"
        if "edg/" in ua:
            browser = "Microsoft Edge"
        elif "chrome/" in ua and "chromium" not in ua and "edg" not in ua:
            browser = "Chrome"
        elif "firefox/" in ua:
            browser = "Firefox"
        elif "safari/" in ua and "chrome" not in ua:
            browser = "Safari"
        elif "postman" in ua:
            browser = "Postman Client"
        elif "python" in ua or "httpx" in ua:
            browser = "Python Client"

        # Determine OS
        os_name = "Unknown OS"
        if "windows" in ua:
            os_name = "Windows"
        elif "macintosh" in ua or "mac os" in ua:
            os_name = "macOS"
        elif "linux" in ua and "android" not in ua:
            os_name = "Linux"
        elif "android" in ua:
            os_name = "Android"
        elif "iphone" in ua or "ipad" in ua:
            os_name = "iOS"

        device_name = f"{browser} on {os_name}"
        return (device_name, device_type)

    @classmethod
    def create_session(
        cls,
        db: Session,
        user: User,
        refresh_jti: str,
        request: Optional[Request] = None,
        auth_method: str = "password",
        user_agent_str: Optional[str] = None,
        ip_address_str: Optional[str] = None,
    ) -> UserSession:
        """
        Records a new active session upon successful login.
        Extracts device metadata and binds to refresh JWT JTI.
        """
        ua_str = user_agent_str
        ip_str = ip_address_str

        if request:
            if not ua_str:
                ua_str = request.headers.get("user-agent")
            if not ip_str:
                ip_str = request.client.host if request.client else None
                # Check for X-Forwarded-For if behind proxy
                forwarded_for = request.headers.get("x-forwarded-for")
                if forwarded_for:
                    ip_str = forwarded_for.split(",")[0].strip()

        device_name, device_type = cls.parse_user_agent(ua_str)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

        session = UserSession(
            user_id=user.id,
            refresh_jti=refresh_jti,
            device_name=device_name,
            device_type=device_type,
            user_agent=ua_str[:500] if ua_str else None,
            ip_address=ip_str[:50] if ip_str else None,
            auth_method=auth_method,
            is_active=True,
            last_activity_at=now,
            expires_at=expires_at,
            created_at=now,
        )

        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def list_active_sessions(
        db: Session,
        user_id: uuid.UUID,
        current_jti: Optional[str] = None,
    ) -> List[dict]:
        """Returns all currently active and unexpired sessions for a user."""
        now = datetime.now(timezone.utc)
        query = (
            select(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.is_active == True,  # noqa: E712
                UserSession.expires_at > now,
            )
            .order_by(UserSession.last_activity_at.desc())
        )
        sessions = list(db.scalars(query))
        result = []
        for s in sessions:
            result.append({
                "id": s.id,
                "user_id": s.user_id,
                "device_name": s.device_name,
                "device_type": s.device_type,
                "user_agent": s.user_agent,
                "ip_address": s.ip_address,
                "auth_method": s.auth_method,
                "is_active": s.is_active,
                "last_activity_at": s.last_activity_at,
                "expires_at": s.expires_at,
                "created_at": s.created_at,
                "is_current": (s.refresh_jti == current_jti) if current_jti else False,
            })
        return result

    @staticmethod
    def revoke_session(
        db: Session,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        reason: str = "user_revoked",
    ) -> bool:
        """
        Revokes a single session, blacklisting its refresh JTI.
        """
        session = db.scalar(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.user_id == user_id,
            )
        )
        if not session or not session.is_active:
            return False

        now = datetime.now(timezone.utc)
        session.is_active = False
        session.revoked_at = now
        session.revoked_reason = reason

        # Blacklist JTI in memory/store
        revoke_token(session.refresh_jti, session.expires_at.timestamp())

        # Audit log entry
        audit = AuditLog(
            actor_id=user_id,
            action="SESSION_REVOKED",
            target_id=session_id,
            target_type="USER_SESSION",
            metadata_json=f'{{"reason": "{reason}", "device": "{session.device_name}"}}',
            actor_ip=session.ip_address,
        )
        db.add(audit)
        db.commit()
        return True

    @staticmethod
    def revoke_all_sessions(
        db: Session,
        user_id: uuid.UUID,
        except_jti: Optional[str] = None,
        reason: str = "revoke_all",
    ) -> int:
        """
        Revokes all active sessions for a user (optionally preserving current session).
        """
        now = datetime.now(timezone.utc)
        query = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.is_active == True,  # noqa: E712
        )
        sessions = list(db.scalars(query))
        revoked_count = 0

        for s in sessions:
            if except_jti and s.refresh_jti == except_jti:
                continue

            s.is_active = False
            s.revoked_at = now
            s.revoked_reason = reason
            revoke_token(s.refresh_jti, s.expires_at.timestamp())
            revoked_count += 1

        if revoked_count > 0:
            audit = AuditLog(
                actor_id=user_id,
                action="ALL_SESSIONS_REVOKED",
                target_id=user_id,
                target_type="USER",
                metadata_json=f'{{"revoked_count": {revoked_count}, "reason": "{reason}"}}',
            )
            db.add(audit)
            db.commit()

        return revoked_count

    @staticmethod
    def touch_session(db: Session, refresh_jti: str) -> Optional[UserSession]:
        """Updates last_activity timestamp for an active session upon token refresh."""
        session = db.scalar(
            select(UserSession).where(
                UserSession.refresh_jti == refresh_jti,
                UserSession.is_active == True,  # noqa: E712
            )
        )
        if session:
            session.last_activity_at = datetime.now(timezone.utc)
            db.commit()
        return session
