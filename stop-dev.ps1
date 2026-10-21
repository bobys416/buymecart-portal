# Buymecart / IBNK - Development Shutdown Script
# Terminates running Next.js and Uvicorn development servers

Write-Host "Stopping all Buymecart local development servers..." -ForegroundColor Yellow

# Find and kill Uvicorn processes
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" -or $_.Path -like "*backend\.venv*" } | ForEach-Object {
    Write-Host "Stopping Python backend process (PID $($_.Id))..." -ForegroundColor Cyan
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Find and kill Next.js processes on ports 3000 and 3001
$ports = @(3000, 3001, 8000)
foreach ($port in $ports) {
    $netstat = netstat -ano | findstr ":$port" | findstr "LISTENING"
    if ($netstat) {
        $parts = $netstat -split '\s+'
        $pidToKill = $parts[-1]
        if ($pidToKill -and $pidToKill -ne "0") {
            Write-Host "Releasing port $port (PID $pidToKill)..." -ForegroundColor Cyan
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "All development services have been stopped successfully." -ForegroundColor Green
