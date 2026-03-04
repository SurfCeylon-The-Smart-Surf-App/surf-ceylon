"""Test model loading"""
import joblib
import os
import sys
import traceback

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "ar_surfboard", "enhanced_ar_model.joblib")

print(f"Testing model load from: {MODEL_PATH}")
print(f"File exists: {os.path.exists(MODEL_PATH)}")

if os.path.exists(MODEL_PATH):
    print(f"File size: {os.path.getsize(MODEL_PATH)} bytes")

try:
    print("\nAttempting to load model...")
    data = joblib.load(MODEL_PATH)
    print("✅ Model loaded successfully!")
    print(f"Model type: {type(data)}")
    
    if isinstance(data, dict):
        print(f"Model keys: {list(data.keys())}")
    
except Exception as e:
    print(f"❌ Error loading model: {type(e).__name__}: {str(e)}")
    traceback.print_exc()
    sys.exit(1)
