import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.onboarding import (
    ApplicationStatus,
    BankVerificationStatus,
    ConsentType,
    DocumentVerificationStatus,
    KycDocumentType,
    ReviewAction,
)
from app.models.user import UserRole
from app.schemas.network import PaginationMeta


# ---------------------------------------------------------
# Sub-Schemas for Application Sections
# ---------------------------------------------------------

class PersonalDetailsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str = Field(..., min_length=2, max_length=255)
    rmn: str = Field(..., min_length=10, max_length=15, description="Registered Mobile Number")
    alternate_mobile: Optional[str] = Field(None, max_length=15)
    email: str = Field(..., min_length=5, max_length=255)
    dob: Optional[str] = Field(None, max_length=20)
    mobile_verified: bool = False
    email_verified: bool = False

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if "@" not in clean or "." not in clean.split("@")[-1]:
            raise ValueError("Invalid email format.")
        return clean


class BusinessDetailsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    business_name: Optional[str] = Field(None, max_length=255)
    shop_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    business_type: Optional[str] = Field("Individual", max_length=100)
    shop_address: Optional[str] = Field(None, max_length=500)
    country: str = Field("India", max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    pin_code: Optional[str] = Field(None, max_length=20)
    landmark: Optional[str] = Field(None, max_length=255)
    geo_coords: Optional[str] = Field(None, max_length=100)
    msme_udyam_number: Optional[str] = Field(None, max_length=50)
    registration_number: Optional[str] = Field(None, max_length=100)


class IdentityKycSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pan_number: Optional[str] = Field(None, max_length=20)
    pan_verified: bool = False
    aadhaar_last_four: Optional[str] = Field(None, max_length=10)
    aadhaar_verified: bool = False
    address_proof_type: Optional[str] = Field(None, max_length=50)

    @field_validator("pan_number")
    @classmethod
    def normalize_pan(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.strip().upper()
        return v

    @field_validator("aadhaar_last_four")
    @classmethod
    def validate_aadhaar_last_four(cls, v: Optional[str]) -> Optional[str]:
        if v:
            digits = "".join(filter(str.isdigit, v))
            if len(digits) > 4:
                digits = digits[-4:]
            return digits
        return v


class IdentityKycResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pan_number: Optional[str] = Field(None, max_length=20)
    pan_verified: bool = False
    aadhaar_last_four: Optional[str] = Field(None, max_length=30)
    aadhaar_verified: bool = False
    address_proof_type: Optional[str] = Field(None, max_length=50)


class BankDetailsInputSchema(BaseModel):
    account_holder_name: str = Field(..., min_length=2, max_length=255)
    bank_name: str = Field(..., min_length=2, max_length=255)
    account_number: str = Field(..., min_length=6, max_length=34)
    ifsc_code: str = Field(..., min_length=4, max_length=20)
    account_type: str = Field("Current", max_length=50)
    branch: Optional[str] = Field(None, max_length=255)

    @field_validator("ifsc_code")
    @classmethod
    def normalize_ifsc(cls, v: str) -> str:
        return v.strip().upper()


class VideoKycInputSchema(BaseModel):
    vkyc_duration_seconds: int = Field(0, ge=0)
    vkyc_code_recited: Optional[str] = Field(None, max_length=50)
    vkyc_status: str = Field("Not Started", max_length=50)
    vkyc_consent_given: bool = False
    vkyc_provider_reference: Optional[str] = Field(None, max_length=100)


class ConsentInputSchema(BaseModel):
    consent_type: ConsentType
    consent_text_version: str = "v1.0"
    terms_accepted: bool = True


# ---------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------

class OnboardingCreateRequest(BaseModel):
    applicant_role: UserRole
    target_merchant_id: Optional[uuid.UUID] = None
    parent_distributor_id: Optional[uuid.UUID] = None
    territory: Optional[str] = Field(None, max_length=100)
    personal: PersonalDetailsSchema
    business: Optional[BusinessDetailsSchema] = None
    identity: Optional[IdentityKycSchema] = None
    bank: Optional[BankDetailsInputSchema] = None
    video_kyc: Optional[VideoKycInputSchema] = None
    consents: Optional[List[ConsentInputSchema]] = None


class OnboardingUpdateRequest(BaseModel):
    territory: Optional[str] = None
    personal: Optional[PersonalDetailsSchema] = None
    business: Optional[BusinessDetailsSchema] = None
    identity: Optional[IdentityKycSchema] = None
    bank: Optional[BankDetailsInputSchema] = None
    video_kyc: Optional[VideoKycInputSchema] = None
    consents: Optional[List[ConsentInputSchema]] = None


class ReviewDecisionRequest(BaseModel):
    action: ReviewAction = Field(..., description="APPROVED, REJECTED, or CORRECTION_REQUESTED")
    remarks: Optional[str] = Field(None, max_length=1000)
    correction_fields: Optional[List[str]] = None
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class ResubmitRequest(BaseModel):
    remarks: Optional[str] = Field(None, max_length=1000)


class ActivationRequest(BaseModel):
    initial_password: Optional[str] = Field(None, min_length=8, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)


# ---------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------

class KycDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    document_type: KycDocumentType
    label: str
    description: Optional[str] = None
    required: bool
    status: DocumentVerificationStatus
    original_filename: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    sha256_checksum: Optional[str] = None
    download_url: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    reviewer_remarks: Optional[str] = None


class BankAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    account_holder_name: str
    bank_name: str
    account_number_masked: str  # Always masked, e.g. "•••• •••• 4291"
    ifsc_code: str
    account_type: str
    branch: Optional[str] = None
    verification_status: BankVerificationStatus
    penny_drop_reference: Optional[str] = None
    verified_at: Optional[datetime] = None


class ApplicationReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewer_name: Optional[str] = None
    reviewer_role: Optional[str] = None
    action: ReviewAction
    remarks: Optional[str] = None
    correction_fields: Optional[List[str]] = None
    created_at: datetime


class ApplicationStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    from_status: str
    to_status: str
    actor_id: Optional[uuid.UUID] = None
    actor_role: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime


class ConsentRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    consent_type: ConsentType
    consent_text_version: str
    granted_at: datetime


class OnboardingApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_number: str
    applicant_role: UserRole
    status: ApplicationStatus
    initiator_id: Optional[uuid.UUID] = None
    parent_distributor_id: Optional[uuid.UUID] = None
    parent_distributor_name: Optional[str] = None
    territory: Optional[str] = None
    assigned_reviewer_id: Optional[uuid.UUID] = None
    activated_user_id: Optional[uuid.UUID] = None
    target_merchant_id: Optional[uuid.UUID] = None
    correction_reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None
    version: int
    created_at: datetime
    updated_at: datetime

    personal: Optional[PersonalDetailsSchema] = None
    business: Optional[BusinessDetailsSchema] = None
    identity: Optional[IdentityKycResponseSchema] = None
    bank: Optional[BankAccountResponse] = None
    video_kyc: Optional[VideoKycInputSchema] = None
    documents: List[KycDocumentResponse] = []
    reviews: List[ApplicationReviewResponse] = []
    status_history: List[ApplicationStatusHistoryResponse] = []
    consents: List[ConsentRecordResponse] = []

    @classmethod
    def from_orm_model(cls, app: Any) -> "OnboardingApplicationResponse":
        personal_data = None
        business_data = None
        identity_data = None
        video_kyc_data = None

        if app.profile:
            p = app.profile
            personal_data = PersonalDetailsSchema(
                full_name=p.full_name,
                rmn=p.rmn,
                alternate_mobile=p.alternate_mobile,
                email=p.email,
                dob=p.dob,
                mobile_verified=p.mobile_verified,
                email_verified=p.email_verified,
            )
            business_data = BusinessDetailsSchema(
                business_name=p.business_name,
                shop_name=p.shop_name,
                category=p.category,
                business_type=p.business_type,
                shop_address=p.shop_address,
                country=p.country,
                state=p.state,
                district=p.district,
                city=p.city,
                pin_code=p.pin_code,
                landmark=p.landmark,
                geo_coords=p.geo_coords,
                msme_udyam_number=p.msme_udyam_number,
                registration_number=p.registration_number,
            )
            # Mask PAN and Aadhaar in safe output
            masked_pan = None
            if p.pan_number:
                if len(p.pan_number) == 10:
                    masked_pan = f"{p.pan_number[:2]}XXXXX{p.pan_number[-3:]}"
                else:
                    masked_pan = "XXXXX"

            masked_aadhaar = None
            if p.aadhaar_last_four:
                masked_aadhaar = f"•••• •••• {p.aadhaar_last_four}"

            identity_data = IdentityKycResponseSchema(
                pan_number=masked_pan,
                pan_verified=p.pan_verified,
                aadhaar_last_four=masked_aadhaar,
                aadhaar_verified=p.aadhaar_verified,
                address_proof_type=p.address_proof_type,
            )

            video_kyc_data = VideoKycInputSchema(
                vkyc_duration_seconds=p.vkyc_duration_seconds,
                vkyc_code_recited=p.vkyc_code_recited,
                vkyc_status=p.vkyc_status,
                vkyc_consent_given=p.vkyc_consent_given,
                vkyc_provider_reference=p.vkyc_provider_reference,
            )

        bank_data = None
        if app.bank_account:
            b = app.bank_account
            bank_data = BankAccountResponse(
                id=b.id,
                application_id=b.application_id,
                account_holder_name=b.account_holder_name,
                bank_name=b.bank_name,
                account_number_masked=b.account_number_masked,
                ifsc_code=b.ifsc_code,
                account_type=b.account_type,
                branch=b.branch,
                verification_status=b.verification_status,
                penny_drop_reference=b.penny_drop_reference,
                verified_at=b.verified_at,
            )

        reviews_data = []
        for r in getattr(app, "reviews", []):
            corr_fields = None
            if r.correction_fields_json:
                try:
                    corr_fields = json.loads(r.correction_fields_json)
                except Exception:
                    corr_fields = []
            reviewer_name = r.reviewer.full_name if r.reviewer else None
            reviewer_role = r.reviewer.role.value if r.reviewer else None
            reviews_data.append(
                ApplicationReviewResponse(
                    id=r.id,
                    reviewer_id=r.reviewer_id,
                    reviewer_name=reviewer_name,
                    reviewer_role=reviewer_role,
                    action=r.action,
                    remarks=r.remarks,
                    correction_fields=corr_fields,
                    created_at=r.created_at,
                )
            )

        status_history_data = [
            ApplicationStatusHistoryResponse(
                id=sh.id,
                from_status=sh.from_status,
                to_status=sh.to_status,
                actor_id=sh.actor_id,
                actor_role=sh.actor_role,
                reason=sh.reason,
                created_at=sh.created_at,
            )
            for sh in getattr(app, "status_history", [])
        ]

        consents_data = [
            ConsentRecordResponse(
                id=c.id,
                consent_type=c.consent_type,
                consent_text_version=c.consent_text_version,
                granted_at=c.granted_at,
            )
            for c in getattr(app, "consents", [])
        ]

        docs_data = [
            KycDocumentResponse(
                id=d.id,
                application_id=d.application_id,
                document_type=d.document_type,
                label=d.label,
                description=d.description,
                required=d.required,
                status=d.status,
                original_filename=d.original_filename,
                file_size_bytes=d.file_size_bytes,
                mime_type=d.mime_type,
                sha256_checksum=d.sha256_checksum,
                download_url=f"/api/v1/onboarding/{app.id}/documents/{d.id}/download" if d.storage_path else None,
                uploaded_at=d.uploaded_at,
                verified_at=d.verified_at,
                reviewer_remarks=d.reviewer_remarks,
            )
            for d in getattr(app, "documents", [])
        ]

        parent_name = app.parent_distributor.full_name if app.parent_distributor else None

        return cls(
            id=app.id,
            application_number=app.application_number,
            applicant_role=app.applicant_role,
            status=app.status,
            initiator_id=app.initiator_id,
            parent_distributor_id=app.parent_distributor_id,
            parent_distributor_name=parent_name,
            territory=app.territory,
            assigned_reviewer_id=app.assigned_reviewer_id,
            activated_user_id=app.activated_user_id,
            target_merchant_id=app.target_merchant_id,
            correction_reason=app.correction_reason,
            rejection_reason=app.rejection_reason,
            submitted_at=app.submitted_at,
            reviewed_at=app.reviewed_at,
            approved_at=app.approved_at,
            activated_at=app.activated_at,
            version=app.version,
            created_at=app.created_at,
            updated_at=app.updated_at,
            personal=personal_data,
            business=business_data,
            identity=identity_data,
            bank=bank_data,
            video_kyc=video_kyc_data,
            documents=docs_data,
            reviews=reviews_data,
            status_history=status_history_data,
            consents=consents_data,
        )


class PaginatedOnboardingResponse(BaseModel):
    items: List[OnboardingApplicationResponse]
    meta: PaginationMeta


# ---------------------------------------------------------
# Phase 5: Statutory Verification & Compliance Dossier Schemas
# ---------------------------------------------------------

class PanVerificationRequest(BaseModel):
    pan_number: Optional[str] = Field(None, description="Optional override PAN number; if omitted, uses application profile PAN.")


class PanVerificationResponse(BaseModel):
    pan_number: str
    entity_type: str = Field(..., description="Individual, Firm, Company, Trust, etc.")
    format_valid: bool
    name_matched: bool
    pan_verified: bool
    message: str
    verified_at: str


class AadhaarVerificationRequest(BaseModel):
    aadhaar_last_four: Optional[str] = Field(None, description="Optional override last 4 digits; if omitted, uses profile.")
    consent_given: bool = Field(True, description="Explicit consent for UIDAI offline XML verification.")
    consent_text_version: str = Field("UIDAI-OFFLINE-CONSENT-v2.1", description="Version of consent disclosure accepted.")


class AadhaarVerificationResponse(BaseModel):
    aadhaar_last_four: str
    format_valid: bool
    aadhaar_verified: bool
    consent_record_id: uuid.UUID
    message: str
    verified_at: str


class BankVerificationRequest(BaseModel):
    account_number: Optional[str] = Field(None, description="Optional override account number")
    ifsc_code: Optional[str] = Field(None, description="Optional override IFSC code")


class BankVerificationResponse(BaseModel):
    bank_name: str
    account_masked: str
    ifsc_code: str
    penny_drop_reference: str
    verification_status: BankVerificationStatus
    verified: bool
    message: str
    verified_at: str


class DossierDocumentRecord(BaseModel):
    document_type: KycDocumentType
    label: str
    status: DocumentVerificationStatus
    file_size_bytes: Optional[int]
    mime_type: Optional[str]
    sha256_checksum: Optional[str]
    uploaded_at: Optional[datetime]
    verified_at: Optional[datetime]
    reviewer_remarks: Optional[str]


class DossierReviewRecord(BaseModel):
    reviewer_name: Optional[str]
    reviewer_role: Optional[str]
    action: ReviewAction
    remarks: Optional[str]
    timestamp: datetime


class ComplianceDossierResponse(BaseModel):
    application_id: uuid.UUID
    application_number: str
    applicant_role: UserRole
    status: ApplicationStatus
    territory: str
    applicant_name: str
    applicant_email: str
    applicant_mobile: str
    business_name: Optional[str]
    business_type: Optional[str]
    pan_number: Optional[str]
    pan_verified: bool
    aadhaar_last_four: Optional[str]
    aadhaar_verified: bool
    bank_account_masked: Optional[str]
    bank_ifsc: Optional[str]
    bank_verified: bool
    penny_drop_reference: Optional[str]
    vkyc_status: Optional[str]
    vkyc_duration_seconds: Optional[int]
    initiator_id: Optional[uuid.UUID]
    parent_distributor_id: Optional[uuid.UUID]
    parent_distributor_name: Optional[str]
    documents: List[DossierDocumentRecord]
    review_trail: List[DossierReviewRecord]
    regulatory_framework: str = "RBI Master Direction - KYC (Updated 2026) / PMLA Rule 9"
    dossier_sha256_fingerprint: str
    generated_at: str
