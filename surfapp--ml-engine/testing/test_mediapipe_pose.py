#!/usr/bin/env python3
"""
Test MediaPipe pose detection on a video file.
"""

import sys
import cv2
import numpy as np
from pathlib import Path

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    print("✓ MediaPipe imported successfully")
except ImportError as e:
    print(f"✗ MediaPipe import failed: {e}")
    sys.exit(1)

BASE_DIR = Path(__file__).parent
POSE_MODEL_PATH = BASE_DIR / 'models' / 'pose_landmarker_lite.task'


def test_pose_detection(video_path):
    """Test pose detection on a video."""
    
    print(f"\n🎥 Testing pose detection on: {video_path}")
    
    # Download model if needed
    if not POSE_MODEL_PATH.exists():
        print("📥 Downloading MediaPipe Pose model...")
        import urllib.request
        model_url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        POSE_MODEL_PATH.parent.mkdir(exist_ok=True)
        try:
            urllib.request.urlretrieve(model_url, POSE_MODEL_PATH)
            print("✓ Model downloaded")
        except Exception as e:
            print(f"✗ Download failed: {e}")
            return
    
    # Create pose landmarker
    try:
        base_options = python.BaseOptions(model_asset_path=str(POSE_MODEL_PATH))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1
        )
        detector = vision.PoseLandmarker.create_from_options(options)
        print("✓ Pose detector created")
    except Exception as e:
        print(f"✗ Failed to create detector: {e}")
        return
    
    # Open video
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"✗ Could not open video")
        return
    
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"   Video: {total_frames} frames @ {fps} FPS")
    print(f"   Testing first 10 frames...")
    
    poses_detected = 0
    frame_count = 0
    
    while frame_count < 10:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect
        timestamp_ms = int((frame_count / fps) * 1000)
        result = detector.detect_for_video(mp_image, timestamp_ms)
        
        if result.pose_landmarks:
            poses_detected += 1
            if frame_count == 0:
                print(f"\n   ✓ Pose detected in frame 0!")
                print(f"      Landmarks detected: {len(result.pose_landmarks[0])}")
                # Show first few landmarks
                for i, landmark in enumerate(result.pose_landmarks[0][:3]):
                    print(f"      Landmark {i}: x={landmark.x:.3f}, y={landmark.y:.3f}, z={landmark.z:.3f}, vis={landmark.visibility:.3f}")
        
        frame_count += 1
    
    cap.release()
    detector.close()
    
    print(f"\n📊 Results:")
    print(f"   Frames tested: {frame_count}")
    print(f"   Poses detected: {poses_detected}")
    print(f"   Detection rate: {(poses_detected/frame_count)*100:.1f}%")
    
    if poses_detected > 0:
        print(f"\n✅ MediaPipe pose detection is WORKING!")
    else:
        print(f"\n⚠️  No poses detected. Video may not contain visible people.")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        video_path = Path(sys.argv[1])
        if video_path.exists():
            test_pose_detection(video_path)
        else:
            print(f"✗ Video not found: {video_path}")
    else:
        print("Usage: python test_mediapipe_pose.py <video_path>")
        
        # Try to find a test video
        uploads_dir = BASE_DIR.parent / 'surfapp--backend' / 'uploads' / 'videos'
        if uploads_dir.exists():
            videos = list(uploads_dir.glob('*.mp4'))
            if videos:
                print(f"\nFound test video, analyzing: {videos[0].name}")
                test_pose_detection(videos[0])
