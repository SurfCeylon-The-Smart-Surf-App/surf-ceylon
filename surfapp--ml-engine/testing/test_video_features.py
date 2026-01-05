#!/usr/bin/env python3
"""
Test script to see what features are actually extracted from videos.
This helps us understand why the model keeps predicting the same class.
"""

import sys
import cv2
import numpy as np
from pathlib import Path

def analyze_video_features(video_path):
    """Extract and analyze features from a test video."""
    
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"❌ Could not open video: {video_path}")
        return None
    
    features_list = []
    prev_frame = None
    frame_count = 0
    max_frames = 50  # Just analyze first 50 frames
    
    print(f"\n🎥 Analyzing video: {video_path.name}")
    print(f"   Processing up to {max_frames} frames...\n")
    
    while frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_frame is not None:
            diff = cv2.absdiff(prev_frame, gray)
            motion = np.mean(diff)
            brightness = np.mean(gray)
            contrast = np.std(gray)
            max_diff = np.max(diff)
            
            features_list.append([motion, brightness, contrast, max_diff])
            
            if frame_count < 5:  # Show first 5 frames
                print(f"   Frame {frame_count}: motion={motion:.2f}, brightness={brightness:.2f}, contrast={contrast:.2f}, max_diff={max_diff:.2f}")
        
        prev_frame = gray
        frame_count += 1
    
    cap.release()
    
    if not features_list:
        return None
    
    features_array = np.array(features_list)
    
    print(f"\n📊 Statistics across {len(features_list)} frames:")
    print(f"   Motion:     mean={np.mean(features_array[:, 0]):.2f}, std={np.std(features_array[:, 0]):.2f}")
    print(f"   Brightness: mean={np.mean(features_array[:, 1]):.2f}, std={np.std(features_array[:, 1]):.2f}")
    print(f"   Contrast:   mean={np.mean(features_array[:, 2]):.2f}, std={np.std(features_array[:, 2]):.2f}")
    print(f"   Max Diff:   mean={np.mean(features_array[:, 3]):.2f}, std={np.std(features_array[:, 3]):.2f}")
    
    return features_array

def main():
    # Check if video path provided
    if len(sys.argv) > 1:
        video_path = Path(sys.argv[1])
        if video_path.exists():
            analyze_video_features(video_path)
        else:
            print(f"❌ Video not found: {video_path}")
    else:
        print("Usage: python test_video_features.py <video_path>")
        print("\nOr analyzing test videos in uploads folder...")
        
        # Try to find test videos
        uploads_dir = Path(__file__).parent.parent / 'surfapp--backend' / 'uploads' / 'videos'
        if uploads_dir.exists():
            videos = list(uploads_dir.glob('*.mp4'))
            if videos:
                print(f"\nFound {len(videos)} videos. Analyzing first one...")
                analyze_video_features(videos[0])
            else:
                print("No videos found in uploads folder.")

if __name__ == '__main__':
    main()
