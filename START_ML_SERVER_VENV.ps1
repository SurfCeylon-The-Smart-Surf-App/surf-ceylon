# START ML SERVER WITH VENV
# Uses virtual environment for ML cardio server

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "🚀 STARTING ML CARDIO SERVER (WITH VENV)" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 79) -ForegroundColor Cyan

# Navigate to ML engine directory
Set-Location "$PSScriptRoot\surfapp--ml-engine"

# Check if virtual environment exists
if (Test-Path "venv\Scripts\python.exe") {
    Write-Host "✅ Using virtual environment" -ForegroundColor Green
    Write-Host "📦 Packages installed:" -ForegroundColor Cyan
    .\venv\Scripts\python.exe -c "import numpy, pandas, sklearn, flask, keras; print('  - NumPy, Pandas, Scikit-learn, Flask, Keras')"
    
    Write-Host "`n🚀 Starting cardio ML server on port 5001..." -ForegroundColor Green
    Write-Host "📡 Server will be available at:" -ForegroundColor Cyan
    Write-Host "   - http://localhost:5001" -ForegroundColor White
    Write-Host "   - http://172.24.130.182:5001" -ForegroundColor White
    Write-Host "`n💡 Press CTRL+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Start ML server using venv Python
    .\venv\Scripts\python.exe services\cardio_ml_server.py
    
} else {
    Write-Host "⚠️ Virtual environment not found!" -ForegroundColor Yellow
    Write-Host "   Using system Python instead..." -ForegroundColor Gray
    
    # Fallback to system Python
    python services\cardio_ml_server.py
}
