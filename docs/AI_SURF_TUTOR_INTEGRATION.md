# AI Surf Tutor Integration - Complete Documentation

## Overview

This document outlines the complete integration of Sabri's AI Surf Tutor implementation into the original SurfCeylon project.

## What Was Integrated

### 1. Backend Integration (`surfapp--backend`)

#### New Files Added:

- `config/aiConstants.js` - Configuration for AI Tutor features (ML model server URLs, pose detection server URLs, skill/goal mappings)
- `config/firebaseAdmin.js` - Firebase admin SDK initialization for optional cloud features
- `middlewares/errorHandler.js` - Centralized error handling middleware
- `controllers/gamificationController.js` - Gamification system (points, badges, streaks, leaderboards)
- `controllers/poseController.js` - Pose detection and analysis using MediaPipe
- `controllers/progressController.js` - User progress tracking and storage
- `controllers/recommendController.js` - ML-based workout recommendations
- `routes/aiTutor.js` - Consolidated routes for all AI Tutor endpoints

#### Modified Files:

- `server.js` - Added AI Tutor routes (`/api/ai-tutor/*`), increased JSON payload limit to 10MB for pose detection images
- `package.json` - Added dependencies: `firebase-admin`, `node-fetch`

#### New API Endpoints:

```
POST   /api/ai-tutor/gamification/award              - Award points/badges
GET    /api/ai-tutor/gamification/stats              - Get gamification stats
POST   /api/ai-tutor/gamification/streak             - Update workout streak
POST   /api/ai-tutor/gamification/check-badges       - Check badge eligibility
GET    /api/ai-tutor/gamification/leaderboard        - Get leaderboard
POST   /api/ai-tutor/gamification/calculate-points   - Calculate workout points

POST   /api/ai-tutor/pose/detect                     - Detect pose from image (MediaPipe)
POST   /api/ai-tutor/pose/analyze                    - Analyze pose landmarks
POST   /api/ai-tutor/pose-analysis/analyze           - Detailed pose analysis
GET    /api/ai-tutor/pose-analysis/health            - Pose service health check

POST   /api/ai-tutor/progress/save                   - Save user progress
GET    /api/ai-tutor/progress/load                   - Load user progress

POST   /api/ai-tutor/recommend                       - Get workout recommendations
```

### 2. Frontend Integration (`SurfApp--frontend`)

#### New Files Added:

- `app/aiSurfTutor.js` - Main AI Surf Tutor entry screen
- `services/aiTutorAPI.js` - API client for all AI Tutor backend endpoints

#### Modified Files:

- `app/(tabs)/dashboard.js` - Added navigation to AI Surf Tutor (item.id === 4)
- `package.json` - Added dependency: `react-native-vector-icons`

#### Features Available:

1. **Cardio Plans** - AI-generated personalized cardio workout plans
2. **Sea Drills (AR)** - AR visualization of surfing techniques
3. **Land Drills** - Real-time pose detection and coaching
4. **Progress Tracking** - Track achievements, badges, and progress

### 3. ML Engine Integration (`surfapp--ml-engine`)

#### New Files Added:

- `services/model_server.py` - FastAPI server for workout recommendations (port 8000)
- `services/pose_server.py` - FastAPI server for pose detection using MediaPipe (port 8001)
- `services/pose_detection.py` - MediaPipe pose detection implementation
- `services/smart_workout_templates.py` - Template-based workout generation system
- `start_all_services.py` - Script to start all ML services
- `start_server.py` - Script to start model server
- `start_pose_server.py` - Script to start pose detection server
- `models/*.joblib` - ML model artifacts (encoders)

#### Modified Files:

- `requirements.txt` - Added dependencies: `fastapi`, `uvicorn`, `pydantic`, `opencv-python`, `mediapipe`

#### ML Services:

1. **Model Server** (Port 8000)

   - Endpoint: `POST /predict`
   - Features: Smart template-based workout generation, BMI-based personalization, equipment/limitation filtering, adaptive learning

2. **Pose Detection Server** (Port 8001)
   - Endpoint: `POST /detect`
   - Features: Real-time pose detection using MediaPipe, landmark extraction, stability scoring, person detection

## How to Use

### Backend Setup

1. Install dependencies:

```bash
cd surfapp--backend
npm install
```

2. Configure environment variables in `.env`:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
MODEL_SERVER_URL=http://localhost:8000/predict
POSE_SERVER_URL=http://localhost:8001/detect
FIREBASE_SERVICE_ACCOUNT=/path/to/firebase-key.json  # Optional
```

3. Start the backend:

```bash
npm start
```

### ML Engine Setup

1. Install Python dependencies:

```bash
cd surfapp--ml-engine
pip install -r requirements.txt
```

2. Start both ML services:

```bash
# Start all services together
python start_all_services.py

# Or start individually
python start_server.py          # Model server on port 8000
python start_pose_server.py     # Pose server on port 8001
```

### Frontend Setup

1. Install dependencies:

```bash
cd SurfApp--frontend
npm install
```

2. Update API base URL in `utils/networkConfig.js`:

```javascript
export const API_BASE_URL = "http://YOUR_IP:5001";
```

3. Start the app:

```bash
npm start
```

## Testing the Integration

### 1. Test Backend Health

```bash
curl http://localhost:5001/api/health
```

### 2. Test ML Model Server

```bash
curl http://localhost:8000/health
```

### 3. Test Pose Detection Server

```bash
curl http://localhost:8001/health
```

### 4. Test AI Tutor Endpoints

```bash
# Get workout recommendations
curl -X POST http://localhost:5001/api/ai-tutor/recommend \
  -H "Content-Type: application/json" \
  -d '{"skillLevel":"Beginner","goal":["Endurance"],"durationRange":"10-20 minutes"}'

# Check gamification stats
curl http://localhost:5001/api/ai-tutor/gamification/stats
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SurfCeylon Mobile App                      │
│                    (React Native/Expo)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─ Dashboard → AI Surf Tutor Entry
                     │
                     ├─ API Calls via services/aiTutorAPI.js
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SurfCeylon Backend (Node.js/Express)            │
│                      Port: 5001                              │
├─────────────────────────────────────────────────────────────┤
│  Routes:                                                     │
│  - /api/ai-tutor/gamification/*                             │
│  - /api/ai-tutor/pose/*                                     │
│  - /api/ai-tutor/progress/*                                 │
│  - /api/ai-tutor/recommend                                  │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             │                       │
             ▼                       ▼
┌─────────────────────┐  ┌──────────────────────────┐
│  ML Model Server    │  │  Pose Detection Server   │
│  (FastAPI/Python)   │  │   (FastAPI/MediaPipe)    │
│    Port: 8000       │  │      Port: 8001          │
├─────────────────────┤  ├──────────────────────────┤
│ - Workout Plans     │  │ - Real-time Pose         │
│ - Smart Templates   │  │   Detection              │
│ - BMI Adaptation    │  │ - Landmark Extraction    │
└─────────────────────┘  └──────────────────────────┘
```

## Key Features

### Gamification System

- Points and XP system
- Badge system (Bronze, Silver, Gold)
- Workout streaks
- Leaderboards (ready for multiplayer)
- Achievement tracking

### Pose Detection

- Real-time pose detection using MediaPipe
- 33 landmark points tracking
- Stability scoring
- Person detection with confidence levels
- Support for various drill types

### Workout Recommendations

- AI-powered workout plan generation
- 3 unique plan variations per request
- BMI-based personalization
- Equipment filtering (None/Kettlebell/Gym)
- Limitation filtering (injuries, conditions)
- Adaptive learning from workout history
- Duration-based planning (5-10, 10-20, 20+ minutes)

### Progress Tracking

- Completed drills tracking
- Score history
- Badge collection
- Session tracking
- Local storage support

## Important Notes

1. **Network Configuration**: Ensure all services are on the same network if testing on physical devices
2. **Firewall**: May need to configure firewall rules to allow connections to ports 5001, 8000, 8001
3. **Dependencies**: Install all backend and ML engine dependencies before starting
4. **Optional Features**: Firebase integration is optional and will gracefully degrade if not configured
5. **Authentication**: Current implementation works without authentication for easy testing (auth can be added later)

## Future Enhancements

1. Full screen implementations for:

   - Cardio Plans screen with quiz
   - AR Visualization screen
   - Land Drills practice screen
   - Progress tracking screen

2. Additional features:
   - Voice coaching during workouts
   - AR overlay for pose guidance
   - Social features (sharing progress)
   - Offline mode support
   - Video recording and analysis

## Troubleshooting

### Backend won't start

- Check if port 5001 is available
- Verify MongoDB connection string
- Check node_modules are installed

### ML servers won't start

- Verify Python 3.8+ is installed
- Check if ports 8000 and 8001 are available
- Ensure all Python dependencies are installed: `pip install -r requirements.txt`

### Frontend can't connect

- Verify API_BASE_URL in networkConfig.js matches your backend IP
- Check that backend and ML servers are running
- Ensure phone and PC are on same WiFi network

### Pose detection not working

- Verify pose_server.py is running on port 8001
- Check mediapipe is properly installed
- Ensure camera permissions are granted on mobile device

## Credits

**Original Project**: SurfCeylon Team
**AI Surf Tutor Implementation**: Sabri
**Integration**: January 2026

## License

Same as SurfCeylon project license.
