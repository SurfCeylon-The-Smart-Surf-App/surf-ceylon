# SurfCeylon - Start All Services
# Run this script to start ML Server, Backend, and Frontend

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SURF CEYLON - Starting All Services" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Start ML Server
Write-Host "[1/3] Starting ML Server (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\sabri\OneDrive\Desktop\dev\integratedrepo\surf-ceylon\surfapp--ml-engine\services'; `$env:FLASK_ENV='production'; python cardio_ml_server.py"
Start-Sleep -Seconds 3

# Start Backend
Write-Host "[2/3] Starting Backend Server (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\sabri\OneDrive\Desktop\dev\integratedrepo\surf-ceylon\surfapp--backend'; node server.js"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[3/3] Starting Frontend (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\sabri\OneDrive\Desktop\dev\integratedrepo\surf-ceylon\SurfApp--frontend'; npx expo start"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "ML Server:  http://172.28.2.243:5001" -ForegroundColor White
Write-Host "Backend:    http://172.28.2.243:3000" -ForegroundColor White
Write-Host "Frontend:   Scan QR code in Expo window" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
