from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["Health & Telemetry"])


@router.get("/health", summary="Liveness Probe")
def health_check():
    """
    Returns 200 OK if the application service process is alive and responsive.
    Suitable for Kubernetes/ECS liveness probes.
    """
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready", summary="Readiness Probe")
def readiness_check(db: Session = Depends(get_db)):
    """
    Verifies database connectivity and readiness to accept incoming traffic.
    Returns 200 OK if database is responsive, 503 if unreachable.
    """
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "environment": settings.ENVIRONMENT,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity check failed: {str(exc)}",
        )
