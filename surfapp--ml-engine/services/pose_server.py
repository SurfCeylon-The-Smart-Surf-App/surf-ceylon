"""
Pose Detection API Server
FastAPI service for real-time pose detection using MediaPipe
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from .pose_detection import detect_pose_from_base64

app = FastAPI(title='Surf AI Pose Detection Server')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PoseDetectionRequest(BaseModel):
    image: str  # Base64 encoded image
    drillId: Optional[str] = None  # Optional drill ID for context
    sessionId: Optional[str] = None  # Optional session ID for velocity tracking

class PoseDetectionResponse(BaseModel):
    success: bool
    personDetected: bool
    landmarks: Optional[dict] = None
    confidence: float
    stability_score: float = 0.0  # 0.0 to 1.0, based on landmark variance
    error: Optional[str] = None
    # Phase 1.1 & 5: Enhanced detection data
    boundingBox: Optional[dict] = None
    detectionQuality: float = 0.0
    bodyCompleteness: Optional[dict] = None
    calibrationStatus: str = 'not_detected'
    averageVisibility: float = 0.0
    lighting: str = 'good'
    estimatedDistance: str = 'optimal'
    velocity: Optional[dict] = None
    landmark_count: int = 0

@app.get('/health')
def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "pose-detection",
        "model": "MediaPipe Pose"
    }

@app.post('/detect', response_model=PoseDetectionResponse)
def detect_pose(request: PoseDetectionRequest):
    """
    Detect pose landmarks from base64 encoded image
    
    Args:
        request: Contains base64 image and optional drillId
        
    Returns:
        PoseDetectionResponse with landmarks or error
    """
    try:
        if not request.image:
            raise HTTPException(status_code=400, detail="Image is required")
        
        # Detect pose (pass session_id for velocity tracking)
        result = detect_pose_from_base64(request.image, session_id=request.sessionId)
        
        return PoseDetectionResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pose detection failed: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "pose_server:app",
        host="0.0.0.0",
        port=8001,  # Different port from model server (8000)
        reload=True,
        log_level="info"
    )

