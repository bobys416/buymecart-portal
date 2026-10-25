"""
Microsoft Entra ID (Azure AD) OpenID Connect integration service.

Implements the Authorization Code flow with PKCE:
1. Generate authorization URL → redirect user to Microsoft login
2. Exchange authorization code for tokens at the callback
3. Validate ID token, extract user profile claims
4. Link or create ExternalIdentity record
"""
import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.external_identity import ExternalIdentity, IdentityProvider
from app.models.user import User, UserStatus


# ── State / PKCE storage (in-memory for single-instance; use Redis in prod) ──
_PENDING_AUTH_FLOWS: Dict[str, Dict[str, str]] = {}


class MicrosoftEntraService:
    """Handles the full Microsoft Entra OIDC lifecycle."""

    OPENID_CONFIG_URL = "https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration"
    AUTHORIZE_ENDPOINT = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
    TOKEN_ENDPOINT = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
    SCOPES = "openid profile email User.Read"

    # ─────────────────────────────────────────────────────────────────────
    # Step 1: Build authorization redirect URL
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def create_authorization_url(cls) -> Dict[str, str]:
        """
        Generates a Microsoft Entra authorization URL with PKCE and CSRF state.
        Returns dict with `authorization_url` and `state` for the frontend.
        """
        cls._require_configuration()

        # Generate PKCE code_verifier & code_challenge (S256)
        code_verifier = secrets.token_urlsafe(64)
        code_challenge = (
            hashlib.sha256(code_verifier.encode("ascii"))
            .digest()
        )
        import base64
        code_challenge_b64 = (
            base64.urlsafe_b64encode(code_challenge)
            .rstrip(b"=")
            .decode("ascii")
        )

        # CSRF state token
        state = secrets.token_urlsafe(32)

        # Store for callback validation
        _PENDING_AUTH_FLOWS[state] = {
            "code_verifier": code_verifier,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        tenant = settings.AZURE_TENANT_ID
        params = {
            "client_id": settings.AZURE_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": settings.AZURE_REDIRECT_URI,
            "scope": cls.SCOPES,
            "response_mode": "query",
            "state": state,
            "code_challenge": code_challenge_b64,
            "code_challenge_method": "S256",
            "prompt": "select_account",
        }

        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        authorization_url = f"{cls.AUTHORIZE_ENDPOINT.format(tenant=tenant)}?{query_string}"

        return {
            "authorization_url": authorization_url,
            "state": state,
        }

    # ─────────────────────────────────────────────────────────────────────
    # Step 2: Exchange authorization code at callback
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    async def handle_callback(
        cls,
        code: str,
        state: str,
        db: Session,
    ) -> Tuple[User, bool]:
        """
        Exchanges the authorization code for tokens, validates the ID token,
        and links or returns the corresponding local user.

        Returns: (user, is_new_link)
        """
        cls._require_configuration()

        # Validate state
        flow_data = _PENDING_AUTH_FLOWS.pop(state, None)
        if not flow_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OAuth state parameter.",
            )

        code_verifier = flow_data["code_verifier"]

        # Exchange code for tokens via HTTP POST
        import httpx
        token_url = cls.TOKEN_ENDPOINT.format(tenant=settings.AZURE_TENANT_ID)
        token_payload = {
            "client_id": settings.AZURE_CLIENT_ID,
            "client_secret": settings.AZURE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.AZURE_REDIRECT_URI,
            "grant_type": "authorization_code",
            "code_verifier": code_verifier,
            "scope": cls.SCOPES,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(token_url, data=token_payload)

        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Microsoft token exchange failed: {resp.text}",
            )

        token_data = resp.json()
        id_token_raw = token_data.get("id_token")
        if not id_token_raw:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Microsoft did not return an ID token.",
            )

        # Decode ID token (signature validation skipped for now;
        # in production, validate with JWKS from discovery endpoint)
        claims = jwt.decode(
            id_token_raw,
            options={"verify_signature": False},
            algorithms=["RS256"],
        )

        return cls._link_or_find_user(db, claims, token_data)

    # ─────────────────────────────────────────────────────────────────────
    # Step 3: Link external identity to local user
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def _link_or_find_user(
        cls,
        db: Session,
        id_claims: Dict[str, Any],
        token_data: Dict[str, Any],
    ) -> Tuple[User, bool]:
        """
        Looks up or creates an ExternalIdentity link for the Microsoft user.
        The local User must already exist (no auto-provisioning for fintech compliance).
        """
        subject = id_claims.get("sub") or id_claims.get("oid")
        email = id_claims.get("preferred_username") or id_claims.get("email", "")
        display_name = id_claims.get("name", "")

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Microsoft ID token missing subject claim.",
            )

        # Check if we already have a link for this provider + subject
        existing_link = db.scalar(
            select(ExternalIdentity).where(
                ExternalIdentity.provider == IdentityProvider.MICROSOFT_ENTRA,
                ExternalIdentity.provider_subject == subject,
            )
        )

        if existing_link:
            # Update profile metadata
            existing_link.display_name = display_name
            existing_link.email = email
            existing_link.updated_at = datetime.now(timezone.utc)
            db.commit()

            user = db.scalar(select(User).where(User.id == existing_link.user_id))
            if not user or user.status != UserStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Linked user account is inactive or deleted.",
                )
            return user, False

        # No existing link: try to match by email
        user = db.scalar(
            select(User).where(
                User.email == email.strip().lower(),
                User.status == UserStatus.ACTIVE,
            )
        ) if email else None

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No local BuyMeCart account matches this Microsoft identity. "
                    "Contact your administrator to create your account first."
                ),
            )

        # Create the external identity link
        new_link = ExternalIdentity(
            user_id=user.id,
            provider=IdentityProvider.MICROSOFT_ENTRA,
            provider_subject=subject,
            display_name=display_name,
            email=email,
        )
        db.add(new_link)

        # Mark email as verified (ownership proven via Microsoft)
        user.email_verified = True
        db.commit()
        db.refresh(user)

        return user, True

    # ─────────────────────────────────────────────────────────────────────
    # Admin: unlink a Microsoft identity
    # ─────────────────────────────────────────────────────────────────────
    @classmethod
    def unlink_identity(cls, db: Session, user_id: uuid.UUID) -> bool:
        """Removes a Microsoft Entra external identity link for a user."""
        link = db.scalar(
            select(ExternalIdentity).where(
                ExternalIdentity.user_id == user_id,
                ExternalIdentity.provider == IdentityProvider.MICROSOFT_ENTRA,
            )
        )
        if not link:
            return False
        db.delete(link)
        db.commit()
        return True

    # ─────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _require_configuration() -> None:
        if not settings.AZURE_TENANT_ID or not settings.AZURE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Microsoft Entra ID integration is not configured.",
            )

    @classmethod
    def cleanup_stale_flows(cls, max_age_seconds: int = 600) -> int:
        """Removes PKCE flows older than max_age_seconds. Returns count removed."""
        now = datetime.now(timezone.utc)
        stale_keys = []
        for state, data in _PENDING_AUTH_FLOWS.items():
            created = datetime.fromisoformat(data["created_at"])
            if (now - created).total_seconds() > max_age_seconds:
                stale_keys.append(state)
        for k in stale_keys:
            _PENDING_AUTH_FLOWS.pop(k, None)
        return len(stale_keys)
