"""
Setup Checker for Hazard Classification System
==============================================
Run this script to verify your environment is ready for training.

Usage:
    python training/check_setup.py
"""

import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "hazard_images"
MODEL_DIR = BASE_DIR / "artifacts" / "hazard_classifier"

HAZARD_CLASSES = [
    'shark', 'jellyfish', 'rip_current', 
    'sea_urchin', 'large_waves', 'reef_coral', 'no_hazard'
]


def check_python_version():
    """Check Python version."""
    print("\n1️⃣  Python Version")
    print("-" * 40)
    version = sys.version_info
    if version.major == 3 and version.minor >= 9:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor} (need 3.9+)")
        return False


def check_dependencies():
    """Check required packages."""
    print("\n2️⃣  Dependencies")
    print("-" * 40)
    
    required = {
        'tensorflow': '2.16.0',
        'numpy': '1.26.0',
        'opencv-python': '4.10.0',
        'matplotlib': '3.9.0',
        'scikit-learn': '1.0.0',
        'pillow': '10.0.0'
    }
    
    all_ok = True
    
    for package, min_version in required.items():
        try:
            if package == 'opencv-python':
                import cv2
                version = cv2.__version__
            elif package == 'scikit-learn':
                import sklearn
                version = sklearn.__version__
            elif package == 'pillow':
                import PIL
                version = PIL.__version__
            else:
                mod = __import__(package.replace('-', '_'))
                version = getattr(mod, '__version__', 'unknown')
            
            print(f"   ✅ {package}: {version}")
        except ImportError:
            print(f"   ❌ {package}: NOT INSTALLED")
            all_ok = False
    
    return all_ok


def check_gpu():
    """Check GPU availability."""
    print("\n3️⃣  GPU Support")
    print("-" * 40)
    
    try:
        import tensorflow as tf
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"   ✅ GPU available: {len(gpus)} device(s)")
            for gpu in gpus:
                print(f"      - {gpu.name}")
            return True
        else:
            print("   ⚠️  No GPU detected (training will be slower)")
            return True  # Not a blocker
    except:
        print("   ⚠️  Could not check GPU")
        return True


def check_dataset():
    """Check dataset folders and images."""
    print("\n4️⃣  Dataset")
    print("-" * 40)
    
    if not DATA_DIR.exists():
        print(f"   ❌ Dataset folder missing: {DATA_DIR}")
        return False
    
    total_images = 0
    all_ok = True
    
    for class_name in HAZARD_CLASSES:
        class_dir = DATA_DIR / class_name
        if not class_dir.exists():
            print(f"   ❌ {class_name}: folder missing")
            all_ok = False
            continue
        
        images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png")) + list(class_dir.glob("*.jpeg"))
        count = len(images)
        total_images += count
        
        if count == 0:
            print(f"   ❌ {class_name}: 0 images")
            all_ok = False
        elif count < 50:
            print(f"   ⚠️  {class_name}: {count} images (need 50+)")
        elif count < 100:
            print(f"   ⚠️  {class_name}: {count} images (100+ recommended)")
        else:
            print(f"   ✅ {class_name}: {count} images")
    
    print(f"\n   📦 Total: {total_images} images")
    
    if total_images < 350:
        print("   ❌ Not enough images for training (need 350+)")
        return False
    elif total_images < 700:
        print("   ⚠️  More images recommended (700+)")
    
    return all_ok


def check_model():
    """Check if model already exists."""
    print("\n5️⃣  Existing Model")
    print("-" * 40)
    
    model_path = MODEL_DIR / "hazard_classifier_best.keras"
    if model_path.exists():
        print(f"   ✅ Model found: {model_path}")
        
        metadata_path = MODEL_DIR / "model_metadata.json"
        if metadata_path.exists():
            import json
            with open(metadata_path) as f:
                meta = json.load(f)
            print(f"      Version: {meta.get('version', 'unknown')}")
            print(f"      Accuracy: {meta.get('accuracy', 0)*100:.1f}%")
            print(f"      Created: {meta.get('created', 'unknown')}")
        return True
    else:
        print("   ⚠️  No trained model found")
        print("      Run: python training/train_hazard_classifier.py")
        return False


def main():
    print("=" * 50)
    print("🏄 Surf Ceylon - Hazard Classifier Setup Check")
    print("=" * 50)
    
    results = {
        'Python': check_python_version(),
        'Dependencies': check_dependencies(),
        'GPU': check_gpu(),
        'Dataset': check_dataset(),
        'Model': check_model()
    }
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    all_ready = True
    for name, status in results.items():
        icon = "✅" if status else "❌"
        print(f"   {icon} {name}")
        if name in ['Python', 'Dependencies', 'Dataset'] and not status:
            all_ready = False
    
    print("\n" + "-" * 50)
    
    if not results['Dataset']:
        print("\n📥 NEXT STEP: Collect training images")
        print("   Option 1: python training/download_hazard_images.py --all --count 100")
        print("   Option 2: Manually add images to data/hazard_images/<category>/")
    elif not results['Model']:
        print("\n🚀 READY TO TRAIN!")
        print("   Run: python training/train_hazard_classifier.py")
    else:
        print("\n✅ System is ready!")
        print("   Model is trained and ready to classify hazard images.")
    
    return 0 if all_ready else 1


if __name__ == "__main__":
    sys.exit(main())
