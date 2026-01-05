#!/usr/bin/env python3
"""Check MediaPipe installation and API"""

try:
    import mediapipe as mp
    print(f"✓ MediaPipe version: {mp.__version__}")
    
    # Check for new API (v0.10.0+)
    try:
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        print("✓ New MediaPipe Tasks API available")
        print(f"  Vision tasks: {[x for x in dir(vision) if not x.startswith('_')]}")
    except ImportError as e:
        print(f"✗ New API not available: {e}")
    
    # Note: Legacy API (mediapipe.python.solutions) was removed in v0.10.0+
    # The new Tasks API should be used instead
        
except ImportError as e:
    print(f"✗ MediaPipe not installed: {e}")
