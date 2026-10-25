#!/bin/sh
set -e

echo "[Docker Entrypoint] Running database migrations..."
alembic upgrade head || true

echo "[Docker Entrypoint] Ensuring UAT synthetic accounts are seeded..."
python scripts/seed_uat_users.py || true

echo "[Docker Entrypoint] Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
