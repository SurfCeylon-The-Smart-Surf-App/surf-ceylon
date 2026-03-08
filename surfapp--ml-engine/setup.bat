@echo off
echo ========================================
echo    AR Model Setup - Surf Ceylon
echo ========================================
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/3] Verifying scikit-learn version...
python -c "import sklearn; print('✓ scikit-learn version:', sklearn.__version__)"

echo.
echo [3/3] Testing AR prediction service...
echo {"height_cm": 175, "weight_kg": 70, "age": 25, "experience_level": "Beginner", "gender": "Male"} | python services\ar_prediction_service.py

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
pause
