#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Surf AI ML Model Server Startup Script
Starts the FastAPI model server on port 8000
"""

import uvicorn
import os
import sys
import io

# Fix Windows console encoding for Unicode
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add services directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services'))

if __name__ == "__main__":
    try:
        print("Starting Surf AI ML Model Server...")
        print("   Server will be available at http://localhost:8000")
        print("   Health check: http://localhost:8000/health")
        print("   Prediction: POST http://localhost:8000/predict")
        print("")
        
        uvicorn.run(
            "services.model_server:app",
            host="0.0.0.0",
            port=8000,
            reload=False,  # Disable reload to avoid issues
            log_level="info"
        )
    except Exception as e:
        print(f"Error starting server: {e}", file=sys.stderr)
        sys.exit(1)

