"""
Security Service: Immutable Login Event Auditing, Anomaly Detection & Password Reset.
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.audit_log import AuditLog
from app.models.otp_challenge import OtpChannel, OtpPurpose
from app.models.security import (
    AlertSeverity,
    LoginEvent,
    LoginEventResult,
    SecurityAlert,
)
from app.models.user import User, UserStatus
from app.services.auth_service import AuthService
from app.services.otp_service import OtpService
from app.services.session_service import SessionService


class SecurityService:
    """Enterprise security monitoring, threat detection, and password recovery."""

    # Thresholds for anomaly detection
    FAILED_ATTEMPTS_ALERT_THRESHOLD = 5
    FAILED_ATTEMPTS_WINDOW_MINUTES = 15

    @classmethod
    def log_login_event(
        cls,
        db: Session,
        login_id_attempted: str,
        result: LoginEventResult,
        auth_method: str = "password",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user: Optional[User] = None,
        session_id: Optional[uuid.UUID] = None,
        failure_reason: Optional[str] = None,
    ) -> LoginEvent:
        """
        Appends an immutable record to the login_events table.
        Evaluates potential brute-force or lockout anomalies.
        """
        event = LoginEvent(
            user_id=user.id if user else None,
            login_id_attempted=login_id_attempted.strip().lower(),
            result=result,
            auth_method=auth_method,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
            failure_reason=failure_reason,
            session_id=session_id,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Anomaly checks on failure
        if result in (
            LoginEventResult.FAILED_CREDENTIALS,
            LoginEventResult.FAILED_MFA,
            LoginEventResult.FAILED_LOCKOUT,
            LoginEventResult.FAILED_RATE_LIMITED,
        ):
            cls._check_and_trigger_alerts(
                db=db,
                login_id=login_id_attempted,
                ip_address=ip_address,
                result=result,
                user=user,
            )

        return event

    @classmethod
    def _check_and_trigger_alerts(
        cls,
        db: Session,
        login_id: str,
        ip_address: Optional[str],
        result: LoginEventResult,
        user: Optional[User],
    ) -> None:
        """Evaluates whether recent failed attempts warrant raising a security alert."""
        now = datetime.now(timezone.utc)
        since = now - timedelta(minutes=cls.FAILED_ATTEMPTS_WINDOW_MINUTES)

        # 1. Check account lockout event
        if result == LoginEventResult.FAILED_LOCKOUT:
            cls.create_alert(
                db=db,
                alert_type="ACCOUNT_LOCKED",
                severity=AlertSeverity.HIGH,
                message=f"Account '{login_id}' was locked after reaching maximum failed login attempts.",
                user_id=user.id if user else None,
                ip_address=ip_address,
                metadata_json=json.dumps({"login_id": login_id, "trigger": "lockout"}),
            )
            return

        # 2. Check repeated failures by IP
        if ip_address:
            ip_failures = db.scalar(
                select(func.count(LoginEvent.id)).where(
                    LoginEvent.ip_address == ip_address,
                    LoginEvent.result != LoginEventResult.SUCCESS,
                    LoginEvent.created_at >= since,
                )
            ) or 0

            if ip_failures >= cls.FAILED_ATTEMPTS_ALERT_THRESHOLD:
                # Avoid duplicate alerts within window
                existing_alert = db.scalar(
                    select(SecurityAlert).where(
                        SecurityAlert.alert_type == "BRUTE_FORCE_IP",
                        SecurityAlert.ip_address == ip_address,
                        SecurityAlert.created_at >= since,
                    )
                )
                if not existing_alert:
                    cls.create_alert(
                        db=db,
                        alert_type="BRUTE_FORCE_IP",
                        severity=AlertSeverity.HIGH,
                        message=f"Suspicious activity: {ip_failures} failed login attempts from IP {ip_address} in the last {cls.FAILED_ATTEMPTS_WINDOW_MINUTES}m.",
                        user_id=user.id if user else None,
                        ip_address=ip_address,
                        metadata_json=json.dumps({"ip": ip_address, "failures": ip_failures}),
                    )

    @staticmethod
    def create_alert(
        db: Session,
        alert_type: str,
        severity: AlertSeverity,
        message: str,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        metadata_json: Optional[str] = None,
    ) -> SecurityAlert:
        """Creates an actionable security alert and writes to audit log."""
        alert = SecurityAlert(
            user_id=user_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            ip_address=ip_address,
            metadata_json=metadata_json,
            is_resolved=False,
        )
        db.add(alert)

        # System audit log
        audit = AuditLog(
            actor_id=user_id,
            action=f"SECURITY_ALERT_{severity.value}",
            target_id=alert.id,
            target_type="SECURITY_ALERT",
            metadata_json=metadata_json,
            actor_ip=ip_address,
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def list_alerts(
        db: Session,
        user_id: Optional[uuid.UUID] = None,
        severity: Optional[AlertSeverity] = None,
        unresolved_only: bool = False,
        limit: int = 50,
    ) -> List[SecurityAlert]:
        """Lists security alerts for administrative monitoring."""
        query = select(SecurityAlert)
        if user_id:
            query = query.where(SecurityAlert.user_id == user_id)
        if severity:
            query = query.where(SecurityAlert.severity == severity)
        if unresolved_only:
            query = query.where(SecurityAlert.is_resolved == False)  # noqa: E712

        query = query.order_by(SecurityAlert.created_at.desc()).limit(limit)
        return list(db.scalars(query))

    @staticmethod
    def resolve_alert(
        db: Session,
        alert_id: uuid.UUID,
        admin_user: User,
        note: Optional[str] = None,
    ) -> SecurityAlert:
        """Marks a security alert as reviewed and resolved by an administrator."""
        alert = db.scalar(select(SecurityAlert).where(SecurityAlert.id == alert_id))
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Security alert not found.",
            )

        now = datetime.now(timezone.utc)
        alert.is_resolved = True
        alert.resolved_by = admin_user.id
        alert.resolved_at = now

        meta = {}
        if alert.metadata_json:
            try:
                meta = json.loads(alert.metadata_json)
            except Exception:
                meta = {"raw": alert.metadata_json}
        if note:
            meta["resolution_note"] = note
        alert.metadata_json = json.dumps(meta)

        audit = AuditLog(
            actor_id=admin_user.id,
            actor_login_id=admin_user.login_id,
            actor_role=admin_user.role.value,
            action="SECURITY_ALERT_RESOLVED",
            target_id=alert_id,
            target_type="SECURITY_ALERT",
            metadata_json=json.dumps(meta),
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @classmethod
    def request_password_reset(
        cls,
        db: Session,
        login_id: str,
        channel: OtpChannel,
    ) -> dict:
        """
        Initiates a password reset challenge via OTP.
        Always returns generic confirmation to prevent user enumeration.
        """
        normalized = login_id.strip().lower()
        user = AuthService.get_by_login_id(db, normalized)
        if not user:
            # Check by email
            user = db.scalar(select(User).where(func.lower(User.email) == normalized))

        if not user or user.status != UserStatus.ACTIVE:
            # Generic message prevents timing/enumeration attacks
            return {
                "message": "If the account exists and is active, a password reset code has been sent.",
                "channel": channel.value,
                "challenge_id": None,
            }

        # Resolve destination
        destination = user.email if channel == OtpChannel.EMAIL else user.phone
        if not destination:
            return {
                "message": "If the account exists and is active, a password reset code has been sent.",
                "channel": channel.value,
                "challenge_id": None,
            }

        result = OtpService.create_challenge(
            db=db,
            user=user,
            channel=channel,
            purpose=OtpPurpose.PASSWORD_RESET,
            destination=destination,
        )

        return {
            "message": "If the account exists and is active, a password reset code has been sent.",
            "channel": channel.value,
            "challenge_id": result.get("challenge_id"),
        }

    @classmethod
    def confirm_password_reset(
        cls,
        db: Session,
        challenge_id: uuid.UUID,
        code: str,
        new_password: str,
        ip_address: Optional[str] = None,
    ) -> dict:
        """
        Verifies OTP challenge, sets new bcrypt hash, invalidates all active sessions,
        and records a security audit log.
        """
        challenge = OtpService.verify_challenge(
            db=db,
            challenge_id=challenge_id,
            code=code,
        )

        if challenge.purpose != OtpPurpose.PASSWORD_RESET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP challenge purpose for password reset.",
            )

        user = AuthService.get_by_id(db, challenge.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found.",
            )

        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.failed_login_attempts = 0
        db.commit()

        # Invalidate all active sessions across all devices for this user
        revoked_count = SessionService.revoke_all_sessions(
            db=db,
            user_id=user.id,
            reason="password_reset",
        )

        # Audit log entry
        audit = AuditLog(
            actor_id=user.id,
            actor_login_id=user.login_id,
            actor_role=user.role.value,
            action="PASSWORD_RESET_COMPLETED",
            target_id=user.id,
            target_type="USER",
            metadata_json=f'{{"revoked_sessions": {revoked_count}}}',
            actor_ip=ip_address,
        )
        db.add(audit)
        db.commit()

        return {
            "message": "Password successfully updated. All active sessions have been revoked. Please log in with your new password.",
            "revoked_sessions": revoked_count,
        }
