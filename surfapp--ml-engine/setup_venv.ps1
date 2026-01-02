# Setup Python Virtual Environment for ML Engine
# This script creates a venv and installs all required packages

Write-Host "Setting up Python Virtual Environment for ML Engine..." -ForegroundColor Cyan

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "`nCreating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Virtual environment created successfully!" -ForegroundColor Green
} else {
    Write-Host "`nVirtual environment already exists." -ForegroundColor Yellow
}

# Activate virtual environment
Write-Host "`nActivating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "`nUpgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
Write-Host "`nInstalling required packages from requirements.txt..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nTo activate the virtual environment manually, run:" -ForegroundColor Cyan
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "`nTo start the model server:" -ForegroundColor Cyan
Write-Host "  cd services" -ForegroundColor White
Write-Host "  python model_server.py" -ForegroundColor White
