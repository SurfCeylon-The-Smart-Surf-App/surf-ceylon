# Start ML Engine Servers
# This script activates the venv and starts both model and pose detection servers

Write-Host "Starting ML Engine Servers..." -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup_venv.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Start model server in background
Write-Host "`nStarting Model Server (port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services'; python model_server.py"

# Wait a moment
Start-Sleep -Seconds 2

# Start pose server in background
Write-Host "Starting Pose Detection Server (port 8001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services'; python pose_server.py"

Write-Host "`n✅ Servers started!" -ForegroundColor Green
Write-Host "`nModel Server: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Pose Server: http://localhost:8001" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in each server window to stop" -ForegroundColor Yellow
