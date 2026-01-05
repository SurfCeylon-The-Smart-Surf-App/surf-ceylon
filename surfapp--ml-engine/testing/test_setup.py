#!/usr/bin/env python3
"""
Test script to verify AI Video Analyzer setup
Run this to check if all dependencies and models are ready
"""

import sys
import os
from pathlib import Path

def print_status(check_name, passed, message=""):
    """Print colored status message"""
    status = "✅" if passed else "❌"
    print(f"{status} {check_name}")
    if message:
        print(f"   {message}")
    return passed

def main():
    print("🔍 AI Video Analyzer - Setup Verification\n")
    print("=" * 60)
    
    all_passed = True
    
    # Check 1: Python version
    print("\n1. Python Environment")
    python_version = sys.version_info
    version_ok = python_version.major == 3 and python_version.minor >= 8
    all_passed &= print_status(
        "Python version",
        version_ok,
        f"Version: {python_version.major}.{python_version.minor}.{python_version.micro}"
    )
    
    # Check 2: Required packages
    print("\n2. Required Packages")
    
    packages = {
        'cv2': 'opencv-python',
        'mediapipe': 'mediapipe',
        'numpy': 'numpy',
        'pandas': 'pandas',
        'pickle': 'built-in',
        'sklearn': 'scikit-learn'
    }
    
    for module, package in packages.items():
        try:
            __import__(module)
            print_status(f"{package}", True)
        except ImportError:
            all_passed &= print_status(
                f"{package}",
                False,
                f"Install with: pip install {package}"
            )
    
    # Check 3: MediaPipe functionality
    print("\n3. MediaPipe Pose Detection")
    try:
        import mediapipe as mp
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose()
        all_passed &= print_status("MediaPipe initialization", True)
        pose.close()
    except Exception as e:
        all_passed &= print_status("MediaPipe initialization", False, str(e))
    
    # Check 4: Model files
    print("\n4. Model Files")
    base_dir = Path(__file__).parent.absolute()
    model_dir = base_dir / 'models'
    
    model_path = model_dir / 'surf_model.pkl'
    encoder_path = model_dir / 'label_encoder.pkl'
    
    model_exists = model_path.exists()
    encoder_exists = encoder_path.exists()
    
    all_passed &= print_status(
        "surf_model.pkl",
        model_exists,
        f"Location: {model_path}" if model_exists else "Place trained model in models/"
    )
    
    all_passed &= print_status(
        "label_encoder.pkl",
        encoder_exists,
        f"Location: {encoder_path}" if encoder_exists else "Place label encoder in models/"
    )
    
    # Check 5: Load models if they exist
    if model_exists and encoder_exists:
        print("\n5. Model Loading")
        try:
            import pickle
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            with open(encoder_path, 'rb') as f:
                label_encoder = pickle.load(f)
            
            print_status("Load surf_model.pkl", True)
            print_status("Load label_encoder.pkl", True)
            
            # Check model classes
            classes = label_encoder.classes_
            print(f"\n   Model trained on {len(classes)} classes:")
            for cls in classes:
                print(f"     - {cls}")
            
        except Exception as e:
            all_passed &= print_status("Model loading", False, str(e))
    else:
        print("\n5. Model Loading")
        print_status("Skipped", False, "Model files not found")
    
    # Check 6: Service script
    print("\n6. Service Script")
    service_script = base_dir / 'surf_pose_analyzer_service.py'
    script_exists = service_script.exists()
    all_passed &= print_status(
        "surf_pose_analyzer_service.py",
        script_exists,
        f"Location: {service_script}"
    )
    
    # Final summary
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL CHECKS PASSED!")
        print("\n🎉 System is ready for video analysis!")
        print("\nNext steps:")
        print("  1. Start backend: cd surfapp--backend && npm start")
        print("  2. Test endpoint: curl http://localhost:5001/api/video-analysis/health")
        print("  3. Use app: Navigate to Utils > AI Video Analyzer")
    else:
        print("❌ SOME CHECKS FAILED")
        print("\n⚠️  Please fix the issues above before using the service")
        print("\nQuick fixes:")
        print("  • Install packages: pip install -r requirements.txt")
        print("  • Place model files in: surfapp--ml-engine/models/")
        print("  • Ensure Python 3.8+ is installed")
    
    print("\n" + "=" * 60)
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
