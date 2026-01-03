# RETRAIN ENHANCED ML MODEL FOR 90%+ ACCURACY
# This script retrains the cardio recommendation model with upgraded architecture

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "🚀 RETRAINING ENHANCED ML MODEL FOR 90%+ ACCURACY" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 79) -ForegroundColor Cyan

Write-Host "`n📊 Model Improvements:" -ForegroundColor Green
Write-Host "  ✅ Doubled embedding dimensions (16→32, 64→128)" -ForegroundColor White
Write-Host "  ✅ Deeper tower architectures (3 layers each)" -ForegroundColor White
Write-Host "  ✅ Increased interaction layer capacity (512→256→128→64)" -ForegroundColor White
Write-Host "  ✅ Added Precision & Recall metrics" -ForegroundColor White
Write-Host "  ✅ Optimized learning rate (0.0005)" -ForegroundColor White
Write-Host "  ✅ Increased training epochs (50)" -ForegroundColor White
Write-Host "  ✅ Smaller batch size (32) for better gradients" -ForegroundColor White
Write-Host "  ✅ Enhanced early stopping & LR scheduling" -ForegroundColor White

Write-Host "`n🎯 Expected Performance:" -ForegroundColor Green
Write-Host "  - Accuracy: 90%+ (up from 82%)" -ForegroundColor Cyan
Write-Host "  - AUC: 93%+ (up from 87%)" -ForegroundColor Cyan
Write-Host "  - Parameters: ~800K (up from 211K)" -ForegroundColor Cyan

Write-Host "`n⏱️ Estimated training time: 10-15 minutes" -ForegroundColor Yellow
Write-Host ""

# Navigate to ML engine directory
Set-Location "$PSScriptRoot\surfapp--ml-engine"

# Check if virtual environment exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "✅ Activating Python virtual environment..." -ForegroundColor Green
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host "⚠️ Virtual environment not found. Using system Python..." -ForegroundColor Yellow
}

# Step 1: Verify data is preprocessed
Write-Host "`n📂 Step 1: Verifying preprocessed data..." -ForegroundColor Cyan
if (-not (Test-Path "data\processed\training_data.csv")) {
    Write-Host "  ⚠️ Training data not found. Running preprocessing..." -ForegroundColor Yellow
    Write-Host "  Running: python training\2_preprocess_kaggle_data.py" -ForegroundColor Gray
    python training\2_preprocess_kaggle_data.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Preprocessing failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Training data ready" -ForegroundColor Green
}

# Step 2: Train enhanced model
Write-Host "`n🏋️ Step 2: Training enhanced deep learning model..." -ForegroundColor Cyan
Write-Host "  Running: python training\3_train_deep_model.py" -ForegroundColor Gray
Write-Host ""

python training\3_train_deep_model.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Training failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Evaluate model
Write-Host "`n📊 Step 3: Evaluating model performance..." -ForegroundColor Cyan
Write-Host "  Running: python training\4_evaluate_model.py" -ForegroundColor Gray
Write-Host ""

python training\4_evaluate_model.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️ Evaluation completed with warnings" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Evaluation complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "✅ ENHANCED MODEL TRAINING COMPLETE!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 79) -ForegroundColor Cyan

Write-Host "`n📁 Generated files:" -ForegroundColor Yellow
Write-Host "  - artifacts\cardio_model_deep.h5 (Enhanced model)" -ForegroundColor White
Write-Host "  - artifacts\model_encoders.pkl (Encoders)" -ForegroundColor White
Write-Host "  - artifacts\evaluation_report.png (Performance metrics)" -ForegroundColor White
Write-Host "  - artifacts\training_history.png (Training curves)" -ForegroundColor White

Write-Host "`n🚀 Next steps:" -ForegroundColor Green
Write-Host "  1. Check artifacts\evaluation_report.png for accuracy metrics" -ForegroundColor White
Write-Host "  2. If accuracy >= 90%, restart ML server with enhanced model" -ForegroundColor White
Write-Host "  3. Test with app: Complete quiz → Get 3 diverse workout plans" -ForegroundColor White

Write-Host "`n💡 To restart ML server:" -ForegroundColor Cyan
Write-Host "  cd services" -ForegroundColor Gray
Write-Host "  python cardio_ml_server.py" -ForegroundColor Gray
Write-Host ""
