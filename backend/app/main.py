from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import ai, auth, banking_api, health, ledger, mfa, ml, network, onboarding, providers
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.services.ai_service import AiService

# Ensure DB tables and default AI models exist on launch
Base.metadata.create_all(bind=engine)
with SessionLocal() as init_db:
    AiService.seed_default_models(init_db)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="BuyMeCart / IBNK High-Security Core Fintech Backend Engine",
    docs_url=f"{settings.API_V1_STR}/docs" if not settings.is_production else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if not settings.is_production else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if not settings.is_production else None,
)

# Explicit CORS Origins Configuration (Zero Wildcard with Credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Adds essential OWASP defensive HTTP security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Global Exception Handler to Prevent Sensitive Information Leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Internal Server Error: {str(exc)}"},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred. Please contact system support."},
    )


# Root Health & Telemetry Routes
app.include_router(health.router)

# Versioned API Routes (/api/v1)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(mfa.router, prefix=settings.API_V1_STR)
app.include_router(network.router, prefix=settings.API_V1_STR)
app.include_router(onboarding.router, prefix=settings.API_V1_STR)
app.include_router(ledger.router, prefix=settings.API_V1_STR)
app.include_router(providers.router, prefix=settings.API_V1_STR)
app.include_router(banking_api.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_entry():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_v1": settings.API_V1_STR,
        "health": "/health",
        "ready": "/ready",
        "status": "operational",
    }
