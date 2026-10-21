import hashlib
import hmac
import os
import time
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, Tuple
from fastapi import HTTPException, status
from app.core.config import settings


class StorageValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class StorageProvider(ABC):
    """Abstract interface for secure document and video storage."""

    @abstractmethod
    def save_file(
        self,
        file_bytes: bytes,
        original_filename: str,
        declared_mime_type: str,
        is_video: bool = False,
    ) -> Tuple[str, str, int, str]:
        """
        Saves file after validation.
        Returns: (storage_path, sha256_checksum, size_bytes, verified_mime_type)
        """
        pass

    @abstractmethod
    def get_file_bytes(self, storage_path: str) -> bytes:
        """Retrieves raw file bytes."""
        pass

    @abstractmethod
    def file_exists(self, storage_path: str) -> bool:
        """Checks if file exists in storage."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Deletes file from storage."""
        pass

    @abstractmethod
    def generate_signed_token(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        """Generates an HMAC-signed access token for short-lived authorized access."""
        pass

    @abstractmethod
    def verify_signed_token(self, storage_path: str, token: str) -> bool:
        """Verifies an HMAC-signed access token."""
        pass


class LocalStorageProvider(StorageProvider):
    """
    Secure local filesystem storage provider with magic-byte verification,
    size limits, path sanitization, and cryptographic signed tokens.
    """

    ALLOWED_IMAGE_MIMES = {
        "image/jpeg": [b"\xff\xd8\xff"],
        "image/png": [b"\x89PNG\r\n\x1a\n"],
        "image/webp": [b"RIFF"],
        "application/pdf": [b"%PDF"],
    }

    ALLOWED_VIDEO_MIMES = {
        "video/mp4": [b"ftyp"],  # found at offset 4
        "video/webm": [b"\x1a\x45\xdf\xa3"],
    }

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_and_resolve_path(self, storage_path: str) -> Path:
        """Prevents path traversal attacks (e.g. ../ or absolute paths outside base_dir)."""
        # Strip leading slashes to keep relative
        clean_rel = storage_path.lstrip("/\\")
        resolved = (self.base_dir / clean_rel).resolve()
        if not str(resolved).startswith(str(self.base_dir)):
            raise StorageValidationError("Path traversal detected or invalid storage path.")
        return resolved

    def _validate_file_signature(self, file_bytes: bytes, mime_type: str, is_video: bool) -> str:
        """Validates file magic bytes against declared MIME type."""
        if not file_bytes:
            raise StorageValidationError("File content is empty.")

        mime_lower = mime_type.lower().strip()

        if is_video:
            if mime_lower not in self.ALLOWED_VIDEO_MIMES:
                raise StorageValidationError(
                    f"Unsupported video MIME type: {mime_type}. Allowed: {list(self.ALLOWED_VIDEO_MIMES.keys())}"
                )
            if mime_lower == "video/mp4":
                # MP4 has 'ftyp' at offset 4
                if len(file_bytes) < 12 or file_bytes[4:8] != b"ftyp":
                    raise StorageValidationError("File signature does not match declared video/mp4 format.")
            elif mime_lower == "video/webm":
                if not file_bytes.startswith(b"\x1a\x45\xdf\xa3"):
                    raise StorageValidationError("File signature does not match declared video/webm format.")
            return mime_lower

        # Non-video document / photo
        if mime_lower not in self.ALLOWED_IMAGE_MIMES:
            raise StorageValidationError(
                f"Unsupported document MIME type: {mime_type}. Allowed: {list(self.ALLOWED_IMAGE_MIMES.keys())}"
            )

        signatures = self.ALLOWED_IMAGE_MIMES[mime_lower]
        matched = False
        for sig in signatures:
            if mime_lower == "image/webp":
                if file_bytes.startswith(b"RIFF") and len(file_bytes) >= 12 and file_bytes[8:12] == b"WEBP":
                    matched = True
                    break
            elif file_bytes.startswith(sig):
                matched = True
                break

        if not matched:
            raise StorageValidationError(f"File magic bytes do not match declared MIME type '{mime_type}'.")

        return mime_lower

    def save_file(
        self,
        file_bytes: bytes,
        original_filename: str,
        declared_mime_type: str,
        is_video: bool = False,
    ) -> Tuple[str, str, int, str]:
        # 1. Size check
        size_bytes = len(file_bytes)
        max_mb = settings.MAX_VIDEO_SIZE_MB if is_video else settings.MAX_DOCUMENT_SIZE_MB
        max_bytes = max_mb * 1024 * 1024
        if size_bytes > max_bytes:
            raise StorageValidationError(
                f"File size ({size_bytes / (1024 * 1024):.2f} MB) exceeds maximum allowed limit ({max_mb} MB)."
            )

        # 2. Magic byte verification
        verified_mime = self._validate_file_signature(file_bytes, declared_mime_type, is_video)

        # 3. Determine safe file extension
        ext_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "application/pdf": ".pdf",
            "video/mp4": ".mp4",
            "video/webm": ".webm",
        }
        ext = ext_map.get(verified_mime, ".bin")

        # 4. Generate randomized storage key (UUIDv4)
        subfolder = "videos" if is_video else "documents"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        rel_storage_path = f"{subfolder}/{unique_name}"

        full_path = self._sanitize_and_resolve_path(rel_storage_path)
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # 5. Calculate SHA256 checksum
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # 6. Write securely to disk
        with open(full_path, "wb") as f:
            f.write(file_bytes)

        return rel_storage_path, sha256_hash, size_bytes, verified_mime

    def get_file_bytes(self, storage_path: str) -> bytes:
        full_path = self._sanitize_and_resolve_path(storage_path)
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage.",
            )
        with open(full_path, "rb") as f:
            return f.read()

    def file_exists(self, storage_path: str) -> bool:
        try:
            full_path = self._sanitize_and_resolve_path(storage_path)
            return full_path.exists() and full_path.is_file()
        except Exception:
            return False

    def delete_file(self, storage_path: str) -> bool:
        try:
            full_path = self._sanitize_and_resolve_path(storage_path)
            if full_path.exists():
                full_path.unlink()
                return True
            return False
        except Exception:
            return False

    def generate_signed_token(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        """
        Creates an HMAC-SHA256 token encoding (storage_path, expiry_epoch).
        Format: <expiry_epoch>:<hmac_hex>
        """
        expires_at = int(time.time()) + expires_in_seconds
        message = f"{storage_path}:{expires_at}".encode("utf-8")
        signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()
        return f"{expires_at}:{signature}"

    def verify_signed_token(self, storage_path: str, token: str) -> bool:
        try:
            parts = token.split(":", 1)
            if len(parts) != 2:
                return False
            expires_at_str, signature = parts
            expires_at = int(expires_at_str)
            if time.time() > expires_at:
                return False  # Expired

            message = f"{storage_path}:{expires_at}".encode("utf-8")
            expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()
            return hmac.compare_digest(signature, expected_sig)
        except Exception:
            return False


# Singleton factory
_storage_provider: Optional[StorageProvider] = None


def get_storage_provider() -> StorageProvider:
    global _storage_provider
    if _storage_provider is None:
        _storage_provider = LocalStorageProvider()
    return _storage_provider
