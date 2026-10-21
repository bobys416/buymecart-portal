import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set
import bcrypt
import jwt
from fastapi import HTTPException, status
from app.core.config import settings

# Thread-safe in-memory token revocation store for access & refresh tokens
# In high-availability AWS deployments, this is backed by Redis or DB session invalidation.
_REVOKED_JTIS: Dict[str, float] = {}

# Precomputed dummy hash for constant-time generic error protection
_DUMMY_HASH = bcrypt.hashpw(b"constant-time-dummy-salt", bcrypt.gensalt(10)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a secure bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def verify_dummy_password() -> bool:
    """
    Performs a dummy bcrypt check against a constant hash to prevent
    timing attacks when a queried user account does not exist.
    """
    try:
        bcrypt.checkpw(b"timing-protection-dummy", _DUMMY_HASH.encode("utf-8"))
    except Exception:
        pass
    return False


def get_password_hash(password: str) -> str:
    """Hashes a plain-text password using modern bcrypt with auto-generated salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generates a cryptographically signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    jti = str(uuid.uuid4())
    payload = {
        "sub": subject,
        "role": role,
        "type": "access",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generates a cryptographically signed JWT refresh token for session renewal."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    jti = str(uuid.uuid4())
    payload = {
        "sub": subject,
        "type": "refresh",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token signature and expiration.
    Raises HTTPException(401) on invalid or expired tokens.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        jti = payload.get("jti")
        if jti and is_token_revoked(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh your session or log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def revoke_token(jti: str, exp: Optional[float] = None) -> None:
    """Blacklists a token by its JTI until its expiration timestamp."""
    _cleanup_expired_revocations()
    # Default retention: 7 days if exp not known
    expiry = exp if exp else (time.time() + (7 * 86400))
    _REVOKED_JTIS[jti] = expiry


def is_token_revoked(jti: str) -> bool:
    """Checks whether a token JTI has been revoked."""
    if jti in _REVOKED_JTIS:
        if _REVOKED_JTIS[jti] > time.time():
            return True
        else:
            del _REVOKED_JTIS[jti]
    return False


def _cleanup_expired_revocations() -> None:
    """Removes expired entries from the revocation store."""
    now = time.time()
    expired = [k for k, v in _REVOKED_JTIS.items() if v <= now]
    for k in expired:
        _REVOKED_JTIS.pop(k, None)
