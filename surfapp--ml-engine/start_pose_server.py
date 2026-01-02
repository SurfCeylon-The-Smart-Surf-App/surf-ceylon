#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Surf AI Pose Detection Server Startup Script
Starts the FastAPI pose detection server on port 8001
"""

import uvicorn
import os
import sys
import io

# Fix Windows console encoding for Unicode
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
services_dir = os.path.join(current_dir, 'services')
sys.path.insert(0, current_dir)
sys.path.insert(0, services_dir)

if __name__ == "__main__":
    try:
        print("Starting Surf AI Pose Detection Server...")
        print("   Server will be available at http://localhost:8001")
        print("   Health check: http://localhost:8001/health")
        print("   Detection: POST http://localhost:8001/detect")
        print("")
        
        # Change to services directory for proper imports
        os.chdir(services_dir)
        
        uvicorn.run(
            "pose_server:app",
            host="0.0.0.0",
            port=8001,
            reload=False,  # Disable reload to avoid import issues
            log_level="info"
        )
    except Exception as e:
        print(f"Error starting server: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
