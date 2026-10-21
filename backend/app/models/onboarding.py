import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.user import User, UserRole


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVATED = "ACTIVATED"


class KycDocumentType(str, enum.Enum):
    PAN_CARD = "PAN_CARD"
    AADHAAR_FRONT = "AADHAAR_FRONT"
    AADHAAR_BACK = "AADHAAR_BACK"
    ADDRESS_PROOF = "ADDRESS_PROOF"
    BANK_PROOF = "BANK_PROOF"
    MERCHANT_SELFIE = "MERCHANT_SELFIE"
    EMPLOYEE_SELFIE = "EMPLOYEE_SELFIE"
    SHOP_FRONT = "SHOP_FRONT"
    SHOP_INSIDE = "SHOP_INSIDE"
    SIGNATURE = "SIGNATURE"
    VKYC_VIDEO = "VKYC_VIDEO"
    MSME_CERTIFICATE = "MSME_CERTIFICATE"
    REGISTRATION_DOC = "REGISTRATION_DOC"


class DocumentVerificationStatus(str, enum.Enum):
    NOT_UPLOADED = "NOT_UPLOADED"
    UPLOADED = "UPLOADED"
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    RE_UPLOAD_REQUIRED = "RE_UPLOAD_REQUIRED"


class BankVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    MANUALLY_VERIFIED = "MANUALLY_VERIFIED"
    REJECTED = "REJECTED"
    PENNY_DROP_PENDING = "PENNY_DROP_PENDING"


class ReviewAction(str, enum.Enum):
    DRAFT_SAVED = "DRAFT_SAVED"
    SUBMITTED = "SUBMITTED"
    REVIEW_STARTED = "REVIEW_STARTED"
    CORRECTION_REQUESTED = "CORRECTION_REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVATED = "ACTIVATED"


class ConsentType(str, enum.Enum):
    AADHAAR_OFFLINE_KYC = "AADHAAR_OFFLINE_KYC"
    TERMS_AND_CONDITIONS = "TERMS_AND_CONDITIONS"
    VKYC_RECORDING = "VKYC_RECORDING"
    DATA_PROCESSING = "DATA_PROCESSING"


class OnboardingApplication(Base):
    """
    Onboarding Application entity representing merchant/distributor lifecycle:
    DRAFT -> SUBMITTED -> UNDER_REVIEW -> (CORRECTION_REQUIRED | APPROVED | REJECTED) -> ACTIVATED
    """
    __tablename__ = "onboarding_applications"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    applicant_role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, native_enum=False, length=50),
        nullable=False,
        default=ApplicationStatus.DRAFT,
        index=True,
    )
    initiator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    parent_distributor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    territory: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    assigned_reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activated_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_merchant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    correction_reason: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    activated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    # Optimistic concurrency protection
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
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

    # Relationships
    profile: Mapped[Optional["ApplicationProfile"]] = relationship(
        "ApplicationProfile",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan",
    )
    documents: Mapped[List["KycDocument"]] = relationship(
        "KycDocument",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="KycDocument.created_at",
    )
    bank_account: Mapped[Optional["BankAccountVerification"]] = relationship(
        "BankAccountVerification",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan",
    )
    reviews: Mapped[List["ApplicationReview"]] = relationship(
        "ApplicationReview",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationReview.created_at.desc()",
    )
    status_history: Mapped[List["ApplicationStatusHistory"]] = relationship(
        "ApplicationStatusHistory",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationStatusHistory.created_at.desc()",
    )
    consents: Mapped[List["ConsentRecord"]] = relationship(
        "ConsentRecord",
        back_populates="application",
        cascade="all, delete-orphan",
    )
    parent_distributor: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[parent_distributor_id],
    )
    initiator: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[initiator_id],
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_reviewer_id],
    )
    activated_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[activated_user_id],
    )
    target_merchant: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[target_merchant_id],
    )

    def __repr__(self) -> str:
        return f"<OnboardingApplication num={self.application_number} role={self.applicant_role} status={self.status}>"


Index(
    "uq_open_merchant_kyc_dossier",
    OnboardingApplication.target_merchant_id,
    unique=True,
    sqlite_where=text(
        "target_merchant_id IS NOT NULL AND status IN ('DRAFT', 'CORRECTION_REQUIRED', 'UNDER_REVIEW')"
    ),
    postgresql_where=text(
        "target_merchant_id IS NOT NULL AND status IN ('DRAFT', 'CORRECTION_REQUIRED', 'UNDER_REVIEW')"
    ),
)


class ApplicationProfile(Base):
    """Business, personal, and identity metadata associated with an onboarding application."""
    __tablename__ = "application_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("onboarding_applications.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Personal Information
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rmn: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    alternate_mobile: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    dob: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    mobile_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Business Information
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    shop_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    business_type: Mapped[Optional[str]] = mapped_column(String(100), default="Individual", nullable=True)
    shop_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pin_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    landmark: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    geo_coords: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    msme_udyam_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Identity Information
    pan_number: Mapped[Optional[str]] = mapped_column(String(20), index=True, nullable=True)
    pan_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    aadhaar_last_four: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    aadhaar_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    address_proof_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Video KYC Information
    vkyc_duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    vkyc_code_recited: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vkyc_status: Mapped[str] = mapped_column(String(50), default="Not Started", nullable=False)
    vkyc_consent_given: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    vkyc_reviewer_remarks: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    vkyc_provider_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    application: Mapped["OnboardingApplication"] = relationship("OnboardingApplication", back_populates="profile")


class KycDocument(Base):
    """KYC Document records with metadata, checksums, and lifecycle states."""
    __tablename__ = "kyc_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("onboarding_applications.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    document_type: Mapped[KycDocumentType] = mapped_column(
        Enum(KycDocumentType, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[DocumentVerificationStatus] = mapped_column(
        Enum(DocumentVerificationStatus, native_enum=False, length=50),
        default=DocumentVerificationStatus.NOT_UPLOADED,
        nullable=False,
        index=True,
    )
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sha256_checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    uploaded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_remarks: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    application: Mapped["OnboardingApplication"] = relationship("OnboardingApplication", back_populates="documents")


class BankAccountVerification(Base):
    """Bank account verification records with masked representation and audit separation."""
    __tablename__ = "bank_account_verifications"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("onboarding_applications.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    account_holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number_masked: Mapped[str] = mapped_column(String(50), nullable=False)
    account_number_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    account_number_encrypted: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ifsc_code: Mapped[str] = mapped_column(String(20), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), default="Current", nullable=False)
    branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    proof_doc_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("kyc_documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    verification_status: Mapped[BankVerificationStatus] = mapped_column(
        Enum(BankVerificationStatus, native_enum=False, length=50),
        default=BankVerificationStatus.PENDING,
        nullable=False,
    )
    penny_drop_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    application: Mapped["OnboardingApplication"] = relationship("OnboardingApplication", back_populates="bank_account")
    verified_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_id])


class ApplicationReview(Base):
    """Review decisions, remarks, and correction flags."""
    __tablename__ = "application_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("onboarding_applications.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[ReviewAction] = mapped_column(
        Enum(ReviewAction, native_enum=False, length=50),
        nullable=False,
    )
    remarks: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    correction_fields_json: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["OnboardingApplication"] = relationship("OnboardingApplication", back_populates="reviews")
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id])


class ApplicationStatusHistory(Base):
    """Append-only audit history of lifecycle state transitions."""
    __tablename__ = "application_status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("onboarding_applications.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    from_status: Mapped[str] = mapped_column(String(50), nullable=False)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    actor_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["OnboardingApplication"] = relationship("OnboardingApplication", back_populates="status_history")
    actor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[actor_id])


class ConsentRecord(Base):
    """User declarations, consent timestamps, and audit metadata."""
    __tablename__ = "consent_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("onboarding_applications.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType, native_enum=False, length=50),
        nullable=False,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    consent_text_version: Mapped[str] = mapped_column(String(50), default="v1.0", nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["OnboardingApplication"] = relationship("OnboardingApplication", back_populates="consents")
