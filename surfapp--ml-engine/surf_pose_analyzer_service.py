#!/usr/bin/env python3
"""
Surf Pose Analyzer Service (Refactored)
Uses modular architecture with clean separation of concerns.

This file maintains backward compatibility with Node.js backend.
All business logic has been extracted to organized modules:
- models/ - Pose detection and classification models
- services/ - Video analysis and feedback generation

Usage:
    python surf_pose_analyzer_service.py <video_path>
    
Output:
    JSON with pose classification, confidence scores, and feedback
"""

# Import from services layer
from services.video_analyzer import main

if __name__ == '__main__':
    main()
