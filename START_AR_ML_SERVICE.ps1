# AR Surfboard Recommender - Quick Start Script
# This script helps you start the AR ML service easily

Write-Host ""
Write-Host "🏄 "*20 -ForegroundColor Cyan
Write-Host "AR SURFBOARD RECOMMENDER - STARTUP" -ForegroundColor Yellow
Write-Host "🏄 "*20 -ForegroundColor Cyan
Write-Host ""

# Check if model exists
$modelPath = ".\surfapp--ml-engine\ar_surfboard_recommender\trained_model\enhanced_ar_model.joblib"

if (-not (Test-Path $modelPath)) {
    Write-Host "❌ Model not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the training script first:" -ForegroundColor Yellow
    Write-Host "  cd surfapp--ml-engine\ar_surfboard_recommender" -ForegroundColor Cyan
    Write-Host "  python train_enhanced_model.py" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ Model found!" -ForegroundColor Green
Write-Host ""

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python detected: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Starting AR ML Service on port 5003..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open while using the AR feature!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To test the service, open a new terminal and run:" -ForegroundColor Cyan
Write-Host "  Invoke-WebRequest -Uri 'http://localhost:5003/ar/health'" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Gray
Write-Host ""
Write-Host "="*60 -ForegroundColor Gray
Write-Host ""

# Start the service
Set-Location -Path ".\surfapp--ml-engine\ar_surfboard_recommender"
python ar_prediction_service.py
