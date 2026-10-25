"""
OTP (One-Time Password) challenge service for email and SMS verification.

Security properties:
- OTP codes are bcrypt-hashed before storage (never plaintext in DB)
- Per-challenge attempt limits prevent brute-force
- Resend cooldown prevents abuse
- Active challenge count per user is capped
- Expired/used challenges are cleaned up
"""
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.otp_challenge import OtpChallenge, OtpChannel, OtpPurpose
from app.models.user import User


class OtpService:
    """Manages OTP challenge lifecycle: create, verify, resend, cleanup."""

    # ─────────────────────────────────────────────────────────────────────
    # Generate and send OTP
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def create_challenge(
        cls,
        db: Session,
        user: User,
        channel: OtpChannel,
        purpose: OtpPurpose,
        destination: Optional[str] = None,
    ) -> dict:
        """
        Creates a new OTP challenge, hashes the code, stores it,
        and dispatches it via the appropriate channel.

        Returns metadata (challenge_id, destination, expires_at).
        """
        # Resolve destination
        if not destination:
            if channel == OtpChannel.EMAIL:
                destination = user.email
            elif channel == OtpChannel.SMS:
                destination = user.phone

        if not destination:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No {channel.value.lower()} address on file for this user.",
            )

        # Enforce cooldown
        cls._enforce_cooldown(db, user.id, channel, purpose)

        # Enforce active challenge cap
        cls._enforce_active_cap(db, user.id, channel)

        # Generate secure numeric OTP
        code = cls._generate_code(settings.OTP_LENGTH)

        # Hash the code
        hashed = bcrypt.hashpw(code.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_TTL_SECONDS)

        challenge = OtpChallenge(
            user_id=user.id,
            channel=channel,
            purpose=purpose,
            hashed_code=hashed,
            destination=destination,
            max_attempts=settings.OTP_MAX_ATTEMPTS,
            expires_at=expires_at,
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)

        # Dispatch the code
        cls._dispatch(channel, destination, code, purpose)

        return {
            "challenge_id": str(challenge.id),
            "channel": channel.value,
            "destination": cls._mask_destination(destination, channel),
            "expires_at": expires_at.isoformat(),
            "ttl_seconds": settings.OTP_TTL_SECONDS,
        }

    # ─────────────────────────────────────────────────────────────────────
    # Verify OTP
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def verify_challenge(
        cls,
        db: Session,
        challenge_id: uuid.UUID,
        code: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> OtpChallenge:
        """
        Validates the submitted OTP code against the stored bcrypt hash.
        Returns the challenge record on success.
        Raises HTTP 4xx on failure (expired, locked, wrong code).
        """
        query = select(OtpChallenge).where(OtpChallenge.id == challenge_id)
        if user_id is not None:
            query = query.where(OtpChallenge.user_id == user_id)
        challenge = db.scalar(query)

        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="OTP challenge not found.",
            )

        if challenge.is_verified:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This OTP challenge has already been verified.",
            )

        if challenge.is_expired:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="OTP has expired. Please request a new code.",
            )

        if challenge.is_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new code.",
            )

        # Constant-time comparison via bcrypt
        if not bcrypt.checkpw(code.encode("utf-8"), challenge.hashed_code.encode("utf-8")):
            challenge.attempts += 1
            db.commit()
            remaining = challenge.max_attempts - challenge.attempts
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid OTP code. {remaining} attempt(s) remaining.",
            )

        # Success
        challenge.is_verified = True
        challenge.verified_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(challenge)

        return challenge

    # ─────────────────────────────────────────────────────────────────────
    # Post-verification: update user flags
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def apply_verification_result(cls, db: Session, user: User, challenge: OtpChallenge) -> None:
        """Updates user verification flags based on the purpose of the OTP."""
        if challenge.purpose == OtpPurpose.EMAIL_VERIFY:
            user.email_verified = True
        elif challenge.purpose == OtpPurpose.PHONE_VERIFY:
            user.phone_verified = True
        db.commit()
        db.refresh(user)

    # ─────────────────────────────────────────────────────────────────────
    # Cleanup expired challenges
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def cleanup_expired(cls, db: Session) -> int:
        """Deletes expired and unverified challenges. Returns count deleted."""
        now = datetime.now(timezone.utc)
        expired = db.scalars(
            select(OtpChallenge).where(
                OtpChallenge.expires_at < now,
                OtpChallenge.is_verified == False,
            )
        ).all()
        count = len(expired)
        for c in expired:
            db.delete(c)
        if count:
            db.commit()
        return count

    # ─────────────────────────────────────────────────────────────────────
    # Internal: enforcement helpers
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def _enforce_cooldown(
        cls,
        db: Session,
        user_id: uuid.UUID,
        channel: OtpChannel,
        purpose: OtpPurpose,
    ) -> None:
        """Raises 429 if a challenge was created too recently."""
        cooldown_threshold = datetime.now(timezone.utc) - timedelta(
            seconds=settings.OTP_RESEND_COOLDOWN_SECONDS
        )
        recent = db.scalar(
            select(OtpChallenge).where(
                OtpChallenge.user_id == user_id,
                OtpChallenge.channel == channel,
                OtpChallenge.purpose == purpose,
                OtpChallenge.created_at > cooldown_threshold,
            ).order_by(OtpChallenge.created_at.desc())
        )
        if recent:
            wait_seconds = settings.OTP_RESEND_COOLDOWN_SECONDS - int(
                (datetime.now(timezone.utc) - recent.created_at).total_seconds()
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {max(wait_seconds, 1)} seconds before requesting a new code.",
                headers={"Retry-After": str(max(wait_seconds, 1))},
            )

    @classmethod
    def _enforce_active_cap(cls, db: Session, user_id: uuid.UUID, channel: OtpChannel) -> None:
        """Ensures a user doesn't have too many active (unexpired, unverified) challenges."""
        now = datetime.now(timezone.utc)
        active_count = db.scalar(
            select(func.count()).select_from(OtpChallenge).where(
                OtpChallenge.user_id == user_id,
                OtpChallenge.channel == channel,
                OtpChallenge.is_verified == False,
                OtpChallenge.expires_at > now,
            )
        ) or 0

        if active_count >= settings.OTP_MAX_ACTIVE_CHALLENGES:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many active OTP challenges. Wait for existing codes to expire.",
            )

    # ─────────────────────────────────────────────────────────────────────
    # Internal: code generation
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _generate_code(length: int = 6) -> str:
        """Generates a cryptographically secure numeric OTP code."""
        # Use secrets for CSPRNG
        upper = 10 ** length
        code_int = secrets.randbelow(upper)
        return str(code_int).zfill(length)

    # ─────────────────────────────────────────────────────────────────────
    # Internal: dispatch via channel
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def _dispatch(cls, channel: OtpChannel, destination: str, code: str, purpose: OtpPurpose) -> None:
        """
        Sends the OTP code via the appropriate channel.
        In dev/console mode, logs to stdout. In production, calls SMTP or SMS provider.
        """
        purpose_label = purpose.value.replace("_", " ").title()

        if channel == OtpChannel.EMAIL:
            cls._send_email_otp(destination, code, purpose_label)
        elif channel == OtpChannel.SMS:
            cls._send_sms_otp(destination, code, purpose_label)

    @classmethod
    def _send_email_otp(cls, email: str, code: str, purpose_label: str) -> None:
        """Send OTP via email. Falls back to console logging in dev."""
        if not settings.SMTP_HOST:
            # Console fallback for development
            print(f"[EMAIL OTP] To: {email} | Code: {code} | Purpose: {purpose_label}")
            return

        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(
            f"Your BuyMeCart verification code is: {code}\n\n"
            f"Purpose: {purpose_label}\n"
            f"This code expires in {settings.OTP_TTL_SECONDS // 60} minutes.\n\n"
            f"If you did not request this code, please ignore this email.",
            "plain",
        )
        msg["Subject"] = f"BuyMeCart - {purpose_label} Code: {code}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = email

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        except Exception as e:
            print(f"[EMAIL OTP ERROR] Failed to send to {email}: {e}")

    @classmethod
    def _send_sms_otp(cls, phone: str, code: str, purpose_label: str) -> None:
        """Send OTP via SMS. Falls back to console logging in dev."""
        provider = settings.SMS_PROVIDER.lower()

        if provider == "console" or not provider:
            print(f"[SMS OTP] To: {phone} | Code: {code} | Purpose: {purpose_label}")
            return

        if provider == "twilio":
            cls._send_via_twilio(phone, code, purpose_label)
        else:
            print(f"[SMS OTP] Unknown provider '{provider}', logging to console.")
            print(f"[SMS OTP] To: {phone} | Code: {code} | Purpose: {purpose_label}")

    @classmethod
    def _send_via_twilio(cls, phone: str, code: str, purpose_label: str) -> None:
        """Send SMS via Twilio REST API."""
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            print(f"[SMS OTP] Twilio not configured. Code for {phone}: {code}")
            return

        try:
            import httpx

            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            data = {
                "From": settings.TWILIO_FROM_NUMBER,
                "To": phone,
                "Body": f"BuyMeCart {purpose_label} code: {code}. Expires in {settings.OTP_TTL_SECONDS // 60} min.",
            }
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    url,
                    data=data,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                )
                if resp.status_code >= 400:
                    print(f"[SMS OTP ERROR] Twilio {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[SMS OTP ERROR] Twilio send failed: {e}")

    # ─────────────────────────────────────────────────────────────────────
    # Internal: privacy masking
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _mask_destination(destination: str, channel: OtpChannel) -> str:
        """Masks destination for safe display (e.g., a****@gmail.com, +91****1234)."""
        if channel == OtpChannel.EMAIL and "@" in destination:
            local, domain = destination.rsplit("@", 1)
            masked_local = local[0] + "****" if len(local) > 1 else "****"
            return f"{masked_local}@{domain}"
        elif channel == OtpChannel.SMS and len(destination) > 4:
            return destination[:3] + "****" + destination[-4:]
        return "****"
