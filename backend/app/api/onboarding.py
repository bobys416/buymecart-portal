import io
import uuid
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_permission
from app.core.config import settings
from app.core.permissions import Permission
from app.models.onboarding import ApplicationStatus, KycDocument
from app.models.user import User, UserRole
from app.schemas.onboarding import (
    ActivationRequest,
    KycDocumentResponse,
    OnboardingApplicationResponse,
    OnboardingCreateRequest,
    OnboardingUpdateRequest,
    PaginatedOnboardingResponse,
    ResubmitRequest,
    ReviewDecisionRequest,
)
from app.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/onboarding", tags=["Onboarding & KYC"])


@router.post(
    "",
    response_model=OnboardingApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Onboarding Application Draft",
    description="Initiates an onboarding application draft with server-side hierarchy validation and configurable document requirements.",
)
def create_onboarding_application(
    request: Request,
    data: OnboardingCreateRequest,
    current_user: User = Depends(require_permission(Permission.CREATE_ONBOARDING)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    application = OnboardingService.create_draft_application(
        actor=current_user,
        data=data,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.get(
    "",
    response_model=PaginatedOnboardingResponse,
    summary="List Onboarding Applications",
    description="Retrieves a paginated list of applications scoped to the caller's organizational authority.",
)
def list_onboarding_applications(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    role_filter: Optional[UserRole] = Query(None, alias="role"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    apps, meta = OnboardingService.get_scoped_applications(
        actor=current_user,
        status_filter=status_filter,
        role_filter=role_filter,
        page=page,
        limit=limit,
        db=db,
    )
    return PaginatedOnboardingResponse(
        items=[OnboardingApplicationResponse.from_orm_model(app) for app in apps],
        meta=meta,
    )


@router.get(
    "/{application_id}",
    response_model=OnboardingApplicationResponse,
    summary="Get Onboarding Application Details",
    description="Returns full application metadata with masked sensitive identifiers. 404 on out-of-scope.",
)
def get_onboarding_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = OnboardingService.get_application_by_id_scoped(
        actor=current_user,
        application_id=application_id,
        db=db,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.patch(
    "/{application_id}",
    response_model=OnboardingApplicationResponse,
    summary="Update Application Draft",
    description="Modifies draft or correction details. Prohibited once under review or approved.",
)
def update_onboarding_application(
    application_id: uuid.UUID,
    data: OnboardingUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    application = OnboardingService.update_application(
        actor=current_user,
        application_id=application_id,
        data=data,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.post(
    "/{application_id}/submit",
    response_model=OnboardingApplicationResponse,
    summary="Submit Application for Review",
    description="Validates all mandatory fields, documents, and Video KYC (if required) before advancing to UNDER_REVIEW.",
)
def submit_onboarding_application(
    application_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    application = OnboardingService.submit_application(
        actor=current_user,
        application_id=application_id,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.get(
    "/{application_id}/documents",
    response_model=List[KycDocumentResponse],
    summary="List KYC Documents",
    description="Returns document requirements checklist with current upload and verification status.",
)
def list_application_documents(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    application = OnboardingService.get_application_by_id_scoped(
        actor=current_user,
        application_id=application_id,
        db=db,
    )
    return [
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
            download_url=f"/api/v1/onboarding/{application.id}/documents/{d.id}/download" if d.storage_path else None,
            uploaded_at=d.uploaded_at,
            verified_at=d.verified_at,
            reviewer_remarks=d.reviewer_remarks,
        )
        for d in application.documents
    ]


@router.post(
    "/{application_id}/documents/{document_id}/upload",
    response_model=KycDocumentResponse,
    summary="Upload KYC Document File",
    description="Uploads document or video file with magic byte verification and storage key randomization.",
)
async def upload_application_document(
    application_id: uuid.UUID,
    document_id: uuid.UUID,
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    max_mb = settings.MAX_VIDEO_SIZE_MB if (file.content_type or "").startswith("video/") else settings.MAX_DOCUMENT_SIZE_MB
    max_bytes = max_mb * 1024 * 1024
    file_buffer = bytearray()
    while chunk := await file.read(min(1024 * 1024, max_bytes + 1 - len(file_buffer))):
        file_buffer.extend(chunk)
        if len(file_buffer) > max_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File exceeds the {max_mb} MB upload limit.")
    file_bytes = bytes(file_buffer)
    declared_mime = file.content_type or "application/octet-stream"
    original_filename = file.filename or "upload.bin"

    doc = OnboardingService.upload_document(
        actor=current_user,
        application_id=application_id,
        document_id=document_id,
        file_bytes=file_bytes,
        original_filename=original_filename,
        declared_mime_type=declared_mime,
        db=db,
        client_ip=client_ip,
    )
    return KycDocumentResponse(
        id=doc.id,
        application_id=doc.application_id,
        document_type=doc.document_type,
        label=doc.label,
        description=doc.description,
        required=doc.required,
        status=doc.status,
        original_filename=doc.original_filename,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        sha256_checksum=doc.sha256_checksum,
        download_url=f"/api/v1/onboarding/{application_id}/documents/{doc.id}/download",
        uploaded_at=doc.uploaded_at,
        verified_at=doc.verified_at,
        reviewer_remarks=doc.reviewer_remarks,
    )


@router.get(
    "/{application_id}/documents/{document_id}/download",
    summary="Download KYC Document",
    description="Streams document bytes after checking caller authorization.",
)
def download_application_document(
    application_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    content, mime, filename = OnboardingService.get_document_bytes_and_mime(
        actor=current_user,
        application_id=application_id,
        document_id=document_id,
        db=db,
    )
    return StreamingResponse(
        io.BytesIO(content),
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{filename.replace(chr(34), "")}"'},
    )


@router.post(
    "/{application_id}/corrections",
    response_model=OnboardingApplicationResponse,
    summary="Request Corrections",
    description="Reviewer flags application back to CORRECTION_REQUIRED with specific remarks.",
)
def request_application_corrections(
    application_id: uuid.UUID,
    data: ReviewDecisionRequest,
    request: Request,
    current_user: User = Depends(require_permission(Permission.REVIEW_ONBOARDING)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    data.action = ReviewDecisionRequest.__fields__["action"].default or data.action
    application = OnboardingService.review_application(
        actor=current_user,
        application_id=application_id,
        data=data,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.post(
    "/{application_id}/resubmit",
    response_model=OnboardingApplicationResponse,
    summary="Resubmit After Corrections",
    description="Applicant resubmits corrected application back to UNDER_REVIEW.",
)
def resubmit_application(
    application_id: uuid.UUID,
    data: ResubmitRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    application = OnboardingService.resubmit_application(
        actor=current_user,
        application_id=application_id,
        data=data,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.post(
    "/{application_id}/review",
    response_model=OnboardingApplicationResponse,
    summary="Submit Compliance Review Decision",
    description="Reviewer records formal decision (APPROVED, REJECTED, or CORRECTION_REQUESTED). Self-review prohibited.",
)
def review_onboarding_application(
    application_id: uuid.UUID,
    data: ReviewDecisionRequest,
    request: Request,
    current_user: User = Depends(require_permission(Permission.REVIEW_ONBOARDING)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    application = OnboardingService.review_application(
        actor=current_user,
        application_id=application_id,
        data=data,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)


@router.post(
    "/{application_id}/activate",
    response_model=OnboardingApplicationResponse,
    summary="Activate Approved Application",
    description="Administrative activation: creates an ACTIVE system User account. Requires APPROVED status.",
)
def activate_onboarding_application(
    application_id: uuid.UUID,
    data: ActivationRequest,
    request: Request,
    current_user: User = Depends(require_permission(Permission.CHANGE_ACCOUNT_STATUS)),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    application, _ = OnboardingService.activate_application(
        actor=current_user,
        application_id=application_id,
        data=data,
        db=db,
        client_ip=client_ip,
    )
    return OnboardingApplicationResponse.from_orm_model(application)
