import time
from typing import Any, Dict, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings

# Handle SQLite vs PostgreSQL specific connection options
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine_kwargs: Dict[str, Any] = {
    "connect_args": connect_args,
    "pool_pre_ping": True,
    "echo": False,
}

if not is_sqlite:
    # Production PostgreSQL connection pooling configuration
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    })

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def check_database_health(db: Session) -> Dict[str, Any]:
    """
    Executes a round-trip diagnostic ping against the active database:
    Returns engine dialect, connection pool telemetry, and ping latency in milliseconds.
    """
    start_time = time.perf_counter()
    db.execute(text("SELECT 1"))
    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    dialect_name = engine.dialect.name
    pool = engine.pool
    pool_size = getattr(pool, "size", lambda: 1)()
    checked_in = getattr(pool, "checkedin", lambda: 0)()
    checked_out = getattr(pool, "checkedout", lambda: 0)()
    overflow = getattr(pool, "overflow", lambda: 0)()

    return {
        "status": "HEALTHY",
        "dialect": dialect_name,
        "is_sqlite": is_sqlite,
        "pool_size": pool_size,
        "checked_in_connections": checked_in,
        "checked_out_connections": checked_out,
        "overflow_connections": overflow,
        "query_latency_ms": latency_ms,
        "database_target": "SQLite (Dev/Test)" if is_sqlite else f"PostgreSQL ({settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB})",
    }


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
