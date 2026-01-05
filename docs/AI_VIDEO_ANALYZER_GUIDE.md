# AI Video Analyzer - Setup & Integration Guide

## Overview

The AI Video Analyzer feature allows users to upload surfing videos and receive AI-powered feedback on their technique, form, and areas for improvement.

## Architecture

### 1. ML Engine (Python Service)

**File:** `surfapp--ml-engine/surf_pose_analyzer_service.py`

**Key Components:**

- **MediaPipe Pose Detection**: Extracts body pose landmarks from video frames
- **Random Forest Classifier**: Classifies surf techniques (popup, riding, duck dive, etc.)
- **Feedback Engine**: Generates personalized feedback based on classification

**Required Models:**

- `surf_model.pkl` - Trained Random Forest classifier
- `label_encoder.pkl` - Label encoder for pose classes

**Location:** `surfapp--ml-engine/models/`

### 2. Backend (Node.js API)

**Files:**

- `surfapp--backend/controllers/videoAnalysisController.js` - Handles video upload and analysis
- `surfapp--backend/routes/videoAnalysis.js` - API endpoints
- `surfapp--backend/config/python.js` - Python script path configuration

**API Endpoints:**

- `POST /api/video-analysis/analyze` - Upload and analyze video
- `GET /api/video-analysis/history` - Get analysis history (TODO)
- `GET /api/video-analysis/health` - Service health check

### 3. Frontend (React Native)

**File:** `SurfApp--frontend/app/aiVideoAnalyzer.js`

**Features:**

- Video picker from device gallery
- Upload progress tracking
- Real-time analysis feedback
- Detailed technique breakdown
- Improvement suggestions

## Setup Instructions

### Step 1: Place Trained Models

1. Place your trained model files in the models directory:

   ```
   surfapp--ml-engine/models/
   ├── surf_model.pkl
   └── label_encoder.pkl
   ```

2. These files should be generated using the training script you provided (Google Colab)

### Step 2: Install Python Dependencies

Navigate to the ML engine directory and install requirements:

```bash
cd surfapp--ml-engine
pip install -r requirements.txt
```

**New Dependencies Added:**

- `mediapipe==0.10.14` - Pose detection
- `opencv-python==4.11.0.86` - Video processing

### Step 3: Install Node.js Dependencies

The backend already has `multer` for file uploads. If not installed:

```bash
cd surfapp--backend
npm install multer
```

### Step 4: Install Frontend Dependencies

The frontend requires expo libraries:

```bash
cd SurfApp--frontend
npm install expo-document-picker expo-image-picker
```

Or with Expo:

```bash
npx expo install expo-document-picker expo-image-picker
```

### Step 5: Test the Service

1. **Test ML Service Directly:**

   ```bash
   cd surfapp--ml-engine
   python surf_pose_analyzer_service.py /path/to/test/video.mp4
   ```

2. **Test Backend Health:**

   ```bash
   curl http://localhost:5001/api/video-analysis/health
   ```

3. **Test Frontend:**
   - Launch the app
   - Navigate to Utils > AI Video Analyzer
   - Select a test video
   - Click "Analyze Video"

## Model Training

### Supported Pose Categories

The model should be trained on these pose/technique categories:

1. **perfect_popup** - Excellent popup technique
2. **good_popup** - Good popup with minor issues
3. **needs_work_popup** - Popup needs improvement
4. **riding_wave** - Actively riding a wave
5. **duck_dive** - Duck diving under waves
6. **paddling** - Paddling technique
7. **wipeout** - Falling/wiping out

### Training Process

Use the Google Colab script you provided:

1. Organize videos in folders by category:

   ```
   /content/drive/MyDrive/SurfAI/video_dataset/train/
   ├── perfect_popup/
   ├── good_popup/
   ├── needs_work_popup/
   ├── riding_wave/
   ├── duck_dive/
   ├── paddling/
   └── wipeout/
   ```

2. Run the training script in Google Colab

3. Download the generated files:

   - `surf_model.pkl`
   - `label_encoder.pkl`

4. Place them in `surfapp--ml-engine/models/`

## Feedback System

The feedback engine provides:

### 1. Classification

- Detected pose/technique
- Confidence score
- Alternative possibilities

### 2. Rating

- Excellent
- Good
- Needs Improvement
- Learning

### 3. Detailed Feedback

- **Strengths**: What the surfer is doing well
- **Suggestions**: Specific improvements to make
- **Next Steps**: Progressive goals and exercises

### 4. Smart Tips

- Contextualized based on detected pose
- Progressive difficulty
- Safety considerations

## API Usage

### Analyze Video

```javascript
POST /api/video-analysis/analyze
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
{
  "video": <video_file>
}

Response:
{
  "success": true,
  "data": {
    "success": true,
    "classification": {
      "pose": "good_popup",
      "confidence": 0.85,
      "all_classes": {...},
      "frames_analyzed": 120
    },
    "feedback": {
      "rating": "good",
      "message": "Good pop-up! You're getting there.",
      "strengths": [...],
      "suggestions": [...],
      "next_steps": [...]
    }
  }
}
```

### Health Check

```javascript
GET /api/video-analysis/health

Response:
{
  "success": true,
  "status": "healthy",
  "checks": {
    "pythonScript": true,
    "surfModel": true,
    "labelEncoder": true
  }
}
```

## File Size Limits

- **Maximum video size**: 50MB
- **Supported formats**: MP4, MOV, AVI, WEBM
- **Processing time**: ~30-60 seconds per video
- **Frame analysis**: Up to 300 frames per video

## Troubleshooting

### Issue: "Model files not found"

**Solution:** Ensure `surf_model.pkl` and `label_encoder.pkl` are in `surfapp--ml-engine/models/`

### Issue: "Could not extract pose data"

**Solutions:**

- Ensure surfer is clearly visible in frame
- Check video quality and lighting
- Video should show full body, not just close-ups

### Issue: "MediaPipe not installed"

**Solution:**

```bash
pip install mediapipe==0.10.14 opencv-python==4.11.0.86
```

### Issue: Low confidence scores

**Solutions:**

- Use videos with better lighting
- Ensure surfer is centered in frame
- Use videos with clear, distinct movements
- Retrain model with more diverse data

### Issue: "Upload failed"

**Solutions:**

- Check file size (must be < 50MB)
- Verify file format (MP4, MOV, AVI, WEBM)
- Ensure backend server is running
- Check network connection

## Performance Optimization

### For Better Results:

1. **Video Quality**

   - Good lighting conditions
   - Stable camera (avoid shaky footage)
   - Surfer clearly visible
   - Medium distance shot (full body visible)

2. **Model Accuracy**

   - Train with diverse dataset
   - Include multiple angles
   - Various lighting conditions
   - Different surfer body types

3. **Processing Speed**
   - Keep videos under 30 seconds
   - Compress videos before upload
   - Use appropriate video quality (720p is sufficient)

## Future Enhancements

### Planned Features:

1. **Analysis History** - Store and track progress over time
2. **Comparison Mode** - Compare with pro surfers
3. **Video Annotations** - Visual feedback overlays
4. **Skill Progression Tracking** - Long-term improvement metrics
5. **Social Sharing** - Share analyses with friends/coaches
6. **Real-time Analysis** - Live camera feed analysis

### Database Schema (Future):

```javascript
VideoAnalysis {
  userId: ObjectId,
  videoUrl: String,
  classification: Object,
  feedback: Object,
  timestamp: Date,
  videoMetadata: {
    duration: Number,
    size: Number,
    format: String
  }
}
```

## Security Considerations

1. **Authentication Required**: All analysis endpoints require valid JWT token
2. **File Validation**: Strict file type and size checks
3. **Temporary Storage**: Videos deleted after analysis
4. **Rate Limiting**: Consider adding rate limits for expensive operations

## Support

For issues or questions:

1. Check health endpoint: `/api/video-analysis/health`
2. Review server logs for errors
3. Ensure all dependencies are installed
4. Verify model files are present

## Credits

- **Pose Detection**: Google MediaPipe
- **ML Framework**: Scikit-learn Random Forest
- **Video Processing**: OpenCV
- **Backend**: Node.js + Express
- **Frontend**: React Native + Expo
