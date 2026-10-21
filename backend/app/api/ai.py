import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_permission
from app.core.permissions import Permission
from app.models.user import User
from app.schemas.ai import (
    AiAuditRecordOut,
    AiChatRequest,
    AiChatResponse,
    AiModelCreate,
    AiModelOut,
    AiModelUpdate,
    AiRuntimeStatusOut,
)
from app.services.ai_service import AiService

router = APIRouter(prefix="/ai", tags=["AI Copilot & Model Intelligence"])


@router.get(
    "/models",
    response_model=List[AiModelOut],
    summary="List Configured AI Models",
    description="Retrieves all registered and active AI inference models stored in the database.",
)
def list_models(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    models = AiService.list_models(db)
    return models


@router.post(
    "/models",
    response_model=AiModelOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register New AI Model",
    description="Registers an open-weight LLM, Ollama, or vLLM runtime endpoint into the database.",
)
def create_model(
    data: AiModelCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_AI)),
    db: Session = Depends(get_db),
):
    existing = AiService.get_model(data.id, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"AI Model with ID '{data.id}' already exists.",
        )
    return AiService.create_model(data, db)


@router.put(
    "/models/{model_id}",
    response_model=AiModelOut,
    summary="Update AI Model Configuration",
    description="Updates inference parameters, quantization, context window, or temperature.",
)
def update_model(
    model_id: str,
    data: AiModelUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_AI)),
    db: Session = Depends(get_db),
):
    model = AiService.update_model(model_id, data, db)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Model '{model_id}' not found.",
        )
    return model


@router.post(
    "/models/{model_id}/toggle",
    response_model=AiModelOut,
    summary="Toggle AI Model Ready/Standby",
    description="Toggles the operational readiness of an inference model.",
)
def toggle_model(
    model_id: str,
    current_user: User = Depends(require_permission(Permission.MANAGE_AI)),
    db: Session = Depends(get_db),
):
    model = AiService.toggle_model_status(model_id, db)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Model '{model_id}' not found.",
        )
    return model


@router.get(
    "/status",
    response_model=AiRuntimeStatusOut,
    summary="Get AI Inference Runtime Status",
    description="Fetches live telemetry of local/remote open-weight neural execution engines.",
)
def get_runtime_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return AiService.get_runtime_status(db)


@router.post(
    "/chat",
    response_model=AiChatResponse,
    summary="Submit Query to AI Fintech Copilot",
    description="Processes natural language inquiries with strict NPCI guardrails, double-entry audit context, and role-based access control.",
)
def chat_copilot(
    req: AiChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return AiService.process_chat(user=current_user, req=req, db=db)


@router.get(
    "/audit-records",
    response_model=List[AiAuditRecordOut],
    summary="Inspect AI Security & Compliance Audit Log",
    description="Lists chronological records of AI inquiries, safety triggers, and model modifications.",
)
def get_audit_records(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_permission(Permission.MANAGE_AI)),
    db: Session = Depends(get_db),
):
    return AiService.list_audit_records(limit=limit, db=db)
