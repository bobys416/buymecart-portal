# Buymecart / IBNK - Development Startup Script
# Starts both FastAPI backend and Next.js frontend

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   BUYMECART / IBNK FINTECH ENGINE - LOCAL DEV RUNTIME    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Python Venv
$pythonExe = "backend\.venv\Scripts\python.exe"
$uvicornExe = "backend\.venv\Scripts\uvicorn.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "Error: Python virtual environment not found at backend\.venv" -ForegroundColor Red
    Write-Host "Please run: python -m venv backend\.venv && .\backend\.venv\Scripts\pip install -r backend/requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 2. Database migrations check
Write-Host "`n[1/3] Verifying database migrations..." -ForegroundColor Green
& backend\.venv\Scripts\alembic.exe -c backend/alembic.ini upgrade head

# 3. Start Backend Server
Write-Host "`n[2/3] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath $uvicornExe -ArgumentList "app.main:app --app-dir backend --port 8000 --reload" -PassThru -NoNewWindow
Write-Host "Backend started with PID: $($backendProc.Id)" -ForegroundColor Cyan

# 4. Start Next.js Frontend
Write-Host "`n[3/3] Starting Next.js Frontend..." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate both servers.`n" -ForegroundColor Yellow

try {
    & npm.cmd run dev
} finally {
    Write-Host "`nStopping backend server (PID $($backendProc.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    Write-Host "All development services stopped." -ForegroundColor Green
}
