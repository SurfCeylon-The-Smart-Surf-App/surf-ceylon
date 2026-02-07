# 🌊 Surf Ceylon - The Smart Surf App

**AI-Powered Surf Forecasting, Spot Recommendations, Community Platform & Training System for Sri Lankan Surfers**

Surf Ceylon is a comprehensive mobile application that combines machine learning, real-time data analysis, and community features to provide intelligent surf forecasting, personalized recommendations, risk assessment, and interactive training for surfers in Sri Lanka.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Feature Documentation](#feature-documentation)
  - [1. Real-time Surf Forecasting & Spot Recommender](#1-real-time-surf-forecasting--spot-recommender)
  - [2. Surf Risk Analyzer](#2-surf-risk-analyzer)
  - [3. AI-Powered Training Features](#3-ai-powered-training-features)
  - [4. AI Video Analyzer](#4-ai-video-analyzer)
  - [5. Surf Community Platform](#5-surf-community-platform)
- [API Documentation](#api-documentation)
- [Machine Learning Models](#machine-learning-models)
- [Directory Structure](#directory-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributors](#contributors)

---

## 🎯 Project Overview

Surf Ceylon is a next-generation surf application that leverages cutting-edge AI and machine learning to revolutionize the surfing experience in Sri Lanka. The platform provides:

- **🌊 7-Day Wave Forecasting** using LSTM deep learning
- **🏄 Smart Spot Recommendations** with Random Forest ML
- **⚠️ Real-time Risk Assessment** with skill-based safety scoring
- **🎥 AI Video Analysis** for technique improvement
- **💪 Personalized Training Plans** with neural collaborative filtering
- **🏄‍♂️ AR Surfboard Coach** with hybrid ML recommendations
- **👥 Social Community** with posts, comments, and real-time chat
- **📊 Progress Tracking** with gamification and achievements

---

## 🚀 Key Features

### 1. **Real-time Surf Forecasting & Spot Recommender**

- **LSTM Wave Forecasting**: 7-day hourly predictions (168 hours) for wave height, period, wind speed
- **Random Forest Spot Scoring**: Intelligent suitability scoring (0-100) for all Sri Lankan surf spots
- **Live Weather Integration**: StormGlass API with 100-key rotation for reliable data
- **Feature Engineering**: 5 surf-specific features (swell energy, offshore wind, etc.)
- **Performance**: 80% accuracy for spot recommendations, 8.8% error for wave height

### 2. **Surf Risk Analyzer**

- **Skill-Based Assessment**: Different risk thresholds for Beginner/Intermediate/Advanced
- **Historical Analysis**: Incident data analysis (drownings, reef cuts, rip currents)
- **Interactive Maps**: Color-coded risk visualization (🟢 Green, 🟡 Yellow, 🔴 Red)
- **Hazard Reporting**: Community-driven safety alerts
- **Real-time Updates**: Dynamic risk calculation based on current conditions

### 3. **AI-Powered Training Features**

- **AI Cardio Plans**: TensorFlow NCF model with 87% AUC accuracy
- **AR Surfboard Coach**: Hybrid ML (Physics + Random Forest) for 15 surfing techniques
- **Progress Tracking**: Gamification with Bronze → Diamond badge system
- **Personalized Workouts**: Generated based on BMI, skill level, and goals
- **Equipment Recommendations**: ML-based surfboard specs (length, volume, wave height)

### 4. **AI Video Analyzer**

- **Pose Detection**: MediaPipe for real-time surfing technique analysis
- **Technique Scoring**: AI evaluation of 15 key surfing maneuvers
- **Progress Tracking**: Historical performance comparison
- **Feedback System**: Actionable improvement suggestions
- **Video Library**: Save and review analyzed sessions

### 5. **Surf Community Platform**

- **Social Feed**: Posts with images, likes, comments
- **Real-time Messaging**: Live chat with typing indicators
- **User Profiles**: Follow system with activity feeds
- **Sessions Sharing**: Log and share surf sessions with conditions
- **Toxicity Filtering**: AI-powered content moderation
- **Engagement**: Nested comments, reactions, user interactions

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      React Native Frontend                        │
│                         (Expo Router)                             │
│  - Spot Recommender UI      - Risk Analyzer Maps                 │
│  - Weather Forecasting      - AI Cardio Plans                    │
│  - AR Coach Interface       - Video Analyzer                     │
│  - Community Feed           - Real-time Chat                     │
│  - User Profiles            - Progress Dashboard                 │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     │ HTTP/REST + Socket.io
                     │
┌────────────────────▼─────────────────────────────────────────────┐
│              Node.js/Express Backend (Port 3000)                  │
│  - Authentication (JWT)     - Spot Management                     │
│  - User Management          - Session Tracking                    │
│  - Posts & Comments         - Real-time Messaging                │
│  - Risk Analysis Routes     - Hazard Reports                     │
│  - AI Tutor Routes          - AR Recommendations                 │
│  - Video Analysis Routes    - Progress Tracking                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬────────────┐
        │                         │            │
        ▼                         ▼            ▼
┌─────────────────┐    ┌──────────────────┐   ┌──────────────────┐
│  MongoDB        │    │  Python ML       │   │  StormGlass API  │
│  Database       │    │  Services        │   │  Weather Data    │
│                 │    │  (Flask)         │   │                  │
│ - Users         │    │                  │   │ - Current        │
│ - Posts         │    │ Port 5001:       │   │ - 7-day Forecast │
│ - Sessions      │    │ - Cardio NCF     │   │ - Historical     │
│ - Messages      │    │ - Spot RF        │   │                  │
│ - Surf Spots    │    │                  │   └──────────────────┘
│ - Incidents     │    │ Port 5002:       │
│ - Hazards       │    │ - LSTM Forecast  │
│ - Progress      │    │ - Feature Eng    │
│                 │    │                  │
└─────────────────┘    │ Port 5003:       │
                       │ - AR Surfboard   │
                       │ - Risk Predictor │
                       │                  │
                       │ Port 5004:       │
                       │ - Video Analyzer │
                       │ - Pose Detection │
                       └──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- **React Native** with Expo (SDK 51+)
- **Expo Router** for navigation
- **NativeWind** (Tailwind CSS for React Native)
- **Socket.io Client** for real-time messaging
- **React Native Maps** for interactive mapping
- **AsyncStorage** for local persistence
- **Axios** for HTTP requests

### Backend

- **Node.js** (v16+)
- **Express.js** (v4.18+)
- **MongoDB** with Mongoose ODM
- **Socket.io** for WebSocket connections
- **JWT** for authentication
- **Multer** for file uploads
- **Bcrypt** for password hashing

### Machine Learning / AI

- **Python** (3.8+)
- **Flask** (3.0+) - REST API servers
- **TensorFlow/Keras** (2.15+) - LSTM forecasting, NCF cardio model
- **scikit-learn** (1.3+) - Random Forest spot recommender, AR surfboard model
- **MediaPipe** - Pose detection for video analysis
- **OpenCV** - Video processing
- **pandas/numpy** - Data processing
- **joblib** - Model serialization

### External APIs

- **StormGlass API** - Weather and wave data
- **Google Maps API** - Location services

---

## 📦 Installation & Setup

### Prerequisites

```bash
# Required software
- Node.js (v16+)
- Python (3.8+)
- MongoDB (v5.0+)
- Expo CLI
- Git

# Optional (for GPU training)
- NVIDIA GPU with CUDA 12.3+
- cuDNN 8.9+
```

### Step 1: Clone Repository

```bash
git clone https://github.com/SurfCeylon-The-Smart-Surf-App/surf-ceylon.git
cd surf-ceylon
```

### Step 2: Backend Setup

```bash
cd surfapp--backend

# Install dependencies
npm install

# Configure environment variables
# Create .env file with:
MONGODB_URI=mongodb://localhost:27017/surfapp
JWT_SECRET=your_jwt_secret_here
STORMGLASS_API_KEYS=key1,key2,key3  # Comma-separated
PORT=3000

# Start backend server
npm start
# Server runs on http://localhost:3000
```

### Step 3: ML Engine Setup

```bash
cd surfapp--ml-engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt

# Train models (optional - pre-trained models included)
python training/train_random_forest_model.py
python training/prepare_timeseries_data.py
python training/train_wave_forecast_lstm.py

# Start all ML services
python start_all_services.py
# Services run on:
# - Spot Recommender: http://localhost:5001
# - Wave Forecaster: http://localhost:5002
# - AR Coach: http://localhost:5003
# - Video Analyzer: http://localhost:5004
```

### Step 4: Frontend Setup

```bash
cd SurfApp--frontend

# Install dependencies
npm install

# Configure API endpoint
# Edit constants/config.js with your local IP
const LOCAL_IP = "192.168.1.100";  # Your machine's IP
const BACKEND_PORT = "3000";

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

### Step 5: Initialize Database

```bash
# Ensure MongoDB is running
mongod

# Seed initial data (from backend directory)
cd surfapp--backend
npm run seed

# This creates:
# - 31 Sri Lankan surf spots
# - Sample users
# - Historical incident data
# - Hazard reports
```

---

## 📖 Feature Documentation

## 1. Real-time Surf Forecasting & Spot Recommender

### Overview

Machine learning-powered system that provides 7-day wave forecasts and intelligent spot recommendations for all surf spots in Sri Lanka.

### How It Works

#### **Random Forest Spot Recommender**

**Step 1: Data Collection**

- Fetches current weather from StormGlass API
- Uses ensemble averaging (sg, noaa, meteo sources)
- Rotates between 100 API keys for reliability

**Step 2: Feature Engineering**
Creates 5 surf-specific features:

```python
# 1. Swell Energy (wave power)
swellEnergy = swellHeight² × swellPeriod

# 2. Offshore Wind (positive = good)
offshoreWind = windSpeed × cos(windDirection - 270°)

# 3. Total Swell Height
totalSwellHeight = primarySwell + secondarySwell

# 4. Wind-Swell Interaction
windSwellInteraction = windSpeed × swellHeight

# 5. Period Ratio (wave quality)
periodRatio = primaryPeriod / (secondaryPeriod + 1)
```

**Step 3: Prediction**

- 200 decision trees ensemble
- 15 input features (10 base + 5 engineered)
- Outputs: wave height, period, wind speed, wind direction

**Step 4: Suitability Scoring**

```javascript
Score (0-100) = Weighted Average:
- Wave Height Match (25%)
- Wave Period Quality (20%)
- Wind Conditions (30%)
- Swell Direction (15%)
- Tide Conditions (10%)
```

#### **LSTM Wave Forecaster**

**Architecture: Sequence-to-Sequence**

```
Input: Past 168 hours (7 days) × 6 features
  ↓
LSTM Encoder (64 units)
  ↓
LSTM Decoder (64 units)
  ↓
Dense Output Layer (6 units)
  ↓
Output: Next 168 hours (7 days) × 6 features
```

**Training Data:**

- 33,000+ sequences from Weligama & Arugam Bay
- Sliding window approach
- 80/20 train/validation split

**Performance:**

- Wave Height: 8.8% MAPE (0.125m MAE)
- Wave Period: 7.4% MAPE (0.464s MAE)
- Training time: ~100 epochs, early stopping

### API Usage

```javascript
// Get spot recommendations
GET /api/spots/recommendations
Response: {
  spots: [
    {
      spotId: "weligama-beach",
      spotName: "Weligama Beach",
      suitabilityScore: 87,
      predictedConditions: {
        waveHeight: 1.2,
        wavePeriod: 12.5,
        windSpeed: 3.2,
        windDirection: 265
      },
      scoreBreakdown: {
        waveHeight: 95,
        wavePeriod: 85,
        windConditions: 88,
        swellDirection: 82
      }
    }
  ]
}

// Get 7-day forecast
GET /api/forecast?lat=5.9249&lon=80.4250&spotId=weligama-beach
Response: {
  spotId: "weligama-beach",
  daily: {
    waveHeight: [1.2, 1.4, 1.6, ...],  // 7 days
    wavePeriod: [11.5, 12.0, 12.5, ...]
  },
  hourly: [
    { time: "2026-01-06T00:00:00Z", waveHeight: 1.1, ... },
    // ... 168 hours
  ]
}
```

### Files Location

```
surfapp--ml-engine/
├── models/
│   ├── random_forest_multi_output.pkl
│   ├── lstm_wave_forecast.keras
│   └── lstm_wave_scaler.pkl
├── services/
│   ├── spot_predictor.py
│   └── forecast_predictor.py
├── training/
│   ├── train_random_forest_model.py
│   ├── prepare_timeseries_data.py
│   └── train_wave_forecast_lstm.py
└── README.md (detailed documentation)
```

---

## 2. Surf Risk Analyzer

### Overview

Intelligent risk assessment system that evaluates surf spots based on historical incidents, hazard reports, and skill-level-specific thresholds.

### Key Features

**1. Skill-Based Risk Thresholds**

| Skill Level  | Low Risk | Medium Risk | High Risk |
| ------------ | -------- | ----------- | --------- |
| Beginner     | 0.0-5.0  | 5.0-6.5     | 6.5-10.0  |
| Intermediate | 0.0-6.0  | 6.0-7.2     | 7.2-10.0  |
| Advanced     | 0.0-7.0  | 7.0-8.0     | 8.0-10.0  |

**2. Risk Calculation**

```python
Risk Score = (
    Historical_Incidents × 0.50 +
    Recent_Hazards × 0.30 +
    Seasonal_Factors × 0.20
)
```

**3. Interactive Map & List Views**

- Color-coded markers (🟢 Green, 🟡 Yellow, 🔴 Red)
- Real-time updates
- Detailed incident breakdown
- Community hazard reports

### How It Works

**Step 1: Historical Analysis**

- Fatal incidents: High weight
- Severe injuries: Medium weight
- Incident types: Drowning, reef cuts, rip currents, collisions

**Step 2: Recent Hazards (24 hours)**

- High severity: +2.0 points
- Medium severity: +1.0 points
- Low severity: +0.5 points

**Step 3: Seasonal Adjustments**

- Peak season indicator
- Monthly incident patterns

**Step 4: Skill-Specific Scoring**

- Same spot, different scores per skill level
- Personalized safety recommendations

### API Usage

```javascript
// Get all spots with risk scores
GET /api/surfSpots
Response: {
  data: [
    {
      _id: "...",
      name: "Hikkaduwa",
      beginnerRisk: { score: 7.5, level: "High", flag: "red" },
      intermediateRisk: { score: 7.5, level: "High", flag: "red" },
      advancedRisk: { score: 3.0, level: "Low", flag: "green" },
      totalIncidents: 45,
      incidentBreakdown: {
        fatal: 2,
        severe: 8,
        drowning: 3,
        reefCut: 12
      }
    }
  ]
}

// Submit hazard report
POST /api/hazardReports
Body: {
  surfSpot: "spot_id",
  hazardType: "rip-current",
  severity: "high",
  description: "Strong rip current observed",
  location: "North end of beach",
  images: [...]
}
```

### Files Location

```
surfapp--ml-engine/
├── calculate_skill_risk.py
├── predict_risk.py
├── analyze_hazard.py
└── models/
    ├── risk_classifier.pkl
    └── risk_regressor.pkl

surfapp--backend/
└── controllers/
    ├── surfSpotController.js
    ├── hazardController.js
    └── incidentController.js

SurfApp--frontend/
└── app/
    └── riskAnalyzer.js
```

---

## 3. AI-Powered Training Features

### Overview

Three integrated AI features for personalized surf training: Cardio Plans, AR Surfboard Coach, and Progress Tracking.

### 3.1 AI Cardio Plan Generation

**How It Works:**

1. **User Quiz**
   - Height, weight (calculates BMI)
   - Skill level (Beginner/Intermediate/Advanced)
   - Goals (Endurance, Strength, Balance, Paddling Power)
   - Equipment available
   - Physical limitations

2. **AI Generation (TensorFlow NCF Model)**
   - Neural Collaborative Filtering
   - 211K parameters
   - Trained on 47K user-exercise pairs
   - 87% AUC accuracy

3. **3 Personalized Plans**
   - Each plan: 4-6 exercises
   - Duration based on skill level
   - Rest periods calculated
   - Total time estimation

**API Usage:**

```javascript
POST /api/ai-tutor/cardio-plan
Body: {
  userProfile: {
    height: 175,
    weight: 70,
    skillLevel: "Intermediate",
    goals: ["Endurance", "Paddling Power"]
  }
}
Response: {
  plans: [
    {
      id: "plan_1",
      name: "Endurance Builder",
      exercises: [
        { name: "Burpees", duration: 45, rest: 15 },
        { name: "Swimming", duration: 300, rest: 60 }
      ],
      totalDuration: 25
    }
  ]
}
```

### 3.2 AR Surfboard AI Coach

**15 Surfing Techniques Supported:**

1. Paddling Technique & Posture
2. The Pop-Up
3. Surfing Stance & Balance
4. Safely Falling & Dismounting
5. The Bottom Turn
6. Generating Speed (Pumping)
7. The Cutback
8. Tube Riding Stance
9. Catching Whitewater Waves
10. Catching Green Waves
11. Trimming & Angling
12. The Floater
13. The Re-entry / Snap
14. The Roundhouse Cutback
15. The Air / Aerial

**How It Works:**

**Step 1: User Input**

- Height, weight, age, gender
- Experience level
- Selected technique

**Step 2: Hybrid ML Calculation**

```python
# Physics-based formulas
board_length = height × 1.06  # (95% accuracy)
board_volume = weight × skill_factor × age_factor

# ML prediction (Random Forest)
wave_height = random_forest.predict([height, weight, age, experience])
```

**Step 3: Personalized Output**

- Board specs (length, volume)
- Ideal wave height
- BMI analysis
- Technique-specific coaching tips

**Training Data:**

- 150+ real surfer profiles
- Kaggle doctoral research dataset
- Features: height, weight, age, experience, board specs, wave conditions

**API Usage:**

```javascript
POST /api/ar/recommendations
Body: {
  height_cm: 175,
  weight_kg: 70,
  age: 25,
  experience_level: "Intermediate",
  gender: "Male",
  drill_id: "cutback"
}
Response: {
  board: {
    length_cm: 185.5,
    length_display: "6'1\" (185.5 cm)",
    volume_liters: 32.5
  },
  wave: {
    height_ft: 4.2,
    height_display: "3-5 ft"
  },
  coaching: {
    tips: [
      "Your board volume provides excellent flotation...",
      "Focus on weight distribution for cutback..."
    ],
    confidence: "95%"
  }
}
```

### 3.3 Progress Tracking & Gamification

**Features:**

- Total workouts completed
- Total training time
- Current streak tracking
- AR session completions
- Badge system (Bronze → Diamond)

**Badge Categories:**

**Cardio Badges:**

- 🥉 First Steps (1 workout)
- 🥈 Dedicated (10 workouts)
- 🥇 Committed (25 workouts)
- 💎 Marathon Master (500+ minutes)

**AR Badges:**

- 🏄 First Session
- 🎯 Technique Explorer (5 modules)
- 🔥 Training Streak (7 days)
- 💪 Master Trainer (all techniques)

**Data Storage:**

- AsyncStorage (local)
- MongoDB (cloud sync)
- Real-time progress updates

### Files Location

```
surfapp--ml-engine/
├── services/
│   └── cardio_service.py
├── ar_surfboard_recommender/
│   ├── ar_prediction_service.py
│   └── train_enhanced_model.py
└── models/
    ├── cardio_ncf_model.h5
    └── ar_surfboard_recommender/enhanced_ar_model.joblib

SurfApp--frontend/
└── app/
    ├── aiTutor/CardioPlans.jsx
    ├── components/ARVisualizationScreen.jsx
    └── components/ProgressScreen.jsx
```

---

## 4. AI Video Analyzer

### Overview

AI-powered video analysis system that uses computer vision to analyze surfing techniques and provide feedback for improvement.

### Key Features

**1. Real-time Pose Detection**

- MediaPipe pose estimation
- 33 body landmark tracking
- Frame-by-frame analysis
- 30 FPS processing

**2. Technique Scoring**

- Evaluates 15 key surfing maneuvers
- Scores based on body positioning
- Angle measurements (joints, stance)
- Balance and stability metrics

**3. Progress Tracking**

- Historical performance comparison
- Improvement trends
- Technique mastery percentage
- Session summaries

**4. Feedback System**

- Actionable improvement tips
- Common mistake detection
- Form correction suggestions
- Drill recommendations

### How It Works

**Step 1: Video Upload**

- User records or uploads surf video
- Supports MP4, MOV formats
- Max 5 minutes length

**Step 2: Pose Detection**

```python
# MediaPipe processing
pose = mp.solutions.pose.Pose()
results = pose.process(frame)

# Extract 33 landmarks
landmarks = results.pose_landmarks.landmark
```

**Step 3: Technique Analysis**

- Stance width calculation
- Body angle measurements
- Center of gravity tracking
- Movement smoothness scoring

**Step 4: Scoring Algorithm**

```python
score = (
    stance_alignment × 0.30 +
    balance_stability × 0.25 +
    movement_flow × 0.25 +
    technique_execution × 0.20
)
```

**Step 5: Feedback Generation**

- Identifies weak areas
- Suggests specific improvements
- Provides drill recommendations

### API Usage

```javascript
POST /api/video-analysis/analyze
Body: FormData {
  video: File,
  userId: "user_id",
  technique: "cutback"
}
Response: {
  success: true,
  analysis: {
    overallScore: 85,
    techniqueScores: {
      stance: 90,
      balance: 85,
      flow: 80,
      execution: 85
    },
    feedback: [
      "Excellent weight distribution during turn",
      "Improve hip rotation for more power",
      "Keep arms extended for better balance"
    ],
    improvements: [
      "Practice hip mobility exercises",
      "Focus on shoulder alignment"
    ],
    videoUrl: "analyzed_video_url",
    thumbnailUrl: "thumbnail_url"
  }
}
```

### Files Location

```
surfapp--ml-engine/
├── services/
│   └── surf_pose_analyzer_service.py
├── models/
│   └── mediapipe_pose_landmarker.task
└── utils/
    └── video_processing.py

surfapp--backend/
└── controllers/
    └── videoAnalysisController.js

SurfApp--frontend/
└── app/
    └── aiVideoAnalyzer.js
```

---

## 5. Surf Community Platform

### Overview

Social networking features that connect surfers, enable content sharing, and facilitate real-time communication.

### Key Features

**1. Social Feed**

- Image/text posts
- Like and comment system
- Nested comment threads
- User mentions (@username)
- Hashtag support

**2. Real-time Messaging**

- One-on-one chat
- Typing indicators
- Read receipts
- Message notifications
- Socket.io powered

**3. User Profiles**

- Profile customization
- Activity feed
- Session history
- Follow/follower system
- Stats and achievements

**4. Session Sharing**

- Log surf sessions
- Share conditions (wave height, wind, etc.)
- Upload photos
- Tag location
- Weather snapshot

**5. Content Moderation**

- AI toxicity detection
- Flagging system
- Admin moderation
- Spam filtering

### How It Works

**Social Feed:**

```javascript
// Create post
POST /api/posts
Body: {
  content: "Epic session at Arugam Bay! 🌊",
  images: [...],
  location: "arugam-bay",
  tags: ["#surfing", "#srilanka"]
}

// Get feed
GET /api/posts?page=1&limit=20
Response: {
  posts: [
    {
      _id: "...",
      author: { username: "surfer123", avatar: "..." },
      content: "...",
      images: [...],
      likes: 45,
      comments: 12,
      createdAt: "2026-01-06T10:30:00Z"
    }
  ]
}
```

**Real-time Messaging:**

```javascript
// Socket.io events
socket.on("message", (data) => {
  // Receive real-time message
  console.log(data);
});

socket.emit("typing", { conversationId, isTyping: true });

socket.emit("sendMessage", {
  conversationId: "...",
  content: "Hey, wanna surf tomorrow?",
  sender: "user_id",
});
```

**Toxicity Detection:**

```python
# AI-powered comment filtering
from transformers import pipeline

toxicity_detector = pipeline(
    "text-classification",
    model="unitary/toxic-bert"
)

result = toxicity_detector(comment_text)
is_toxic = result[0]['label'] == 'toxic'
```

### API Endpoints

**Posts:**

- `POST /api/posts` - Create post
- `GET /api/posts` - Get feed
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comment` - Add comment
- `DELETE /api/posts/:id` - Delete post

**Messaging:**

- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read

**User Management:**

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/follow` - Follow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

**Sessions:**

- `POST /api/sessions` - Log session
- `GET /api/sessions` - Get user sessions
- `GET /api/sessions/:id` - Get session details

### Files Location

```
surfapp--backend/
├── controllers/
│   ├── postController.js
│   ├── messageController.js
│   └── sessionsController.js
├── routes/
│   ├── posts.js
│   ├── messages.js
│   └── sessions.js
└── models/
    ├── Post.js
    ├── Message.js
    └── Session.js

SurfApp--frontend/
└── app/
    ├── (tabs)/
    │   ├── home.js (Feed)
    │   └── profile.js
    ├── messenger.js
    ├── chat.js
    └── postDetail.js
```

---

## 🔌 API Documentation

### Authentication

All authenticated endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

### Base URL

```
http://localhost:3000/api
```

### Main Endpoints

#### Spots & Forecasting

| Endpoint                 | Method | Description                           | Auth |
| ------------------------ | ------ | ------------------------------------- | ---- |
| `/spots/recommendations` | GET    | Get all spots with suitability scores | No   |
| `/spots/:id`             | GET    | Get specific spot details             | No   |
| `/forecast`              | GET    | Get 7-day forecast for location       | No   |

#### Risk Analysis

| Endpoint         | Method | Description                | Auth |
| ---------------- | ------ | -------------------------- | ---- |
| `/surfSpots`     | GET    | Get spots with risk scores | No   |
| `/surfSpots/:id` | GET    | Get spot risk details      | No   |
| `/hazardReports` | POST   | Submit hazard report       | Yes  |
| `/incidents`     | GET    | Get historical incidents   | No   |

#### AI Training

| Endpoint                | Method | Description                   | Auth |
| ----------------------- | ------ | ----------------------------- | ---- |
| `/ai-tutor/cardio-plan` | POST   | Generate cardio plans         | Yes  |
| `/ar/recommendations`   | POST   | Get surfboard recommendations | Yes  |
| `/progress/save`        | POST   | Save progress data            | Yes  |
| `/progress/load`        | GET    | Load progress data            | Yes  |

#### Video Analysis

| Endpoint                   | Method | Description          | Auth |
| -------------------------- | ------ | -------------------- | ---- |
| `/video-analysis/analyze`  | POST   | Analyze surf video   | Yes  |
| `/video-analysis/sessions` | GET    | Get analysis history | Yes  |

#### Community

| Endpoint             | Method   | Description     | Auth |
| -------------------- | -------- | --------------- | ---- |
| `/posts`             | GET/POST | Feed operations | Yes  |
| `/posts/:id/like`    | PUT      | Like post       | Yes  |
| `/posts/:id/comment` | POST     | Comment on post | Yes  |
| `/messages`          | GET/POST | Messaging       | Yes  |
| `/users/:id/follow`  | POST     | Follow user     | Yes  |
| `/sessions`          | GET/POST | Session logging | Yes  |

#### Authentication

| Endpoint         | Method | Description    | Auth |
| ---------------- | ------ | -------------- | ---- |
| `/auth/register` | POST   | Create account | No   |
| `/auth/login`    | POST   | Login          | No   |
| `/auth/refresh`  | POST   | Refresh token  | No   |

---

## 🤖 Machine Learning Models

### 1. Random Forest Spot Recommender

- **Type**: Multi-output Random Forest Regressor
- **Purpose**: Predict current surf conditions for all spots
- **Features**: 15 (10 base + 5 engineered)
- **Outputs**: Wave height, period, wind speed, wind direction
- **Performance**: Overall R² = 0.8068
  - Wave Height: R² = 0.7757, MAE = 0.13m
  - Wind Speed: R² = 0.9787, MAE = 0.22 m/s
  - Wind Direction: R² = 0.9968, MAE = 3.4°
- **Training Data**: 31,942 samples from Weligama & Arugam Bay
- **File**: `models/random_forest_multi_output.pkl`

### 2. LSTM Wave Forecaster

- **Type**: Sequence-to-Sequence LSTM
- **Purpose**: 7-day hourly wave forecasting
- **Architecture**:
  - Encoder: LSTM (64 units)
  - Decoder: LSTM (64 units)
  - Dense output (6 units)
- **Input**: Past 168 hours × 6 features
- **Output**: Next 168 hours × 6 features
- **Performance**:
  - Wave Height: 8.8% MAPE, 0.125m MAE
  - Wave Period: 7.4% MAPE, 0.464s MAE
- **Training**: 830 sequences, 100 epochs
- **File**: `models/lstm_wave_forecast.keras`

### 3. Neural Collaborative Filtering (Cardio)

- **Type**: TensorFlow/Keras NCF
- **Purpose**: Personalized cardio exercise recommendations
- **Architecture**: Embedding layers → Dense layers → Sigmoid
- **Parameters**: 211,360 trainable
- **Performance**: 87% AUC, 82% accuracy
- **Training Data**: 47,000+ user-exercise pairs
- **File**: `models/cardio_ncf_model.h5`

### 4. AR Surfboard Hybrid Model

- **Type**: Hybrid (Physics formulas + Random Forest)
- **Purpose**: Personalized surfboard recommendations
- **Approach**:
  - Board length: Physics-based (95% accuracy)
  - Board volume: Deterministic formula (90% accuracy)
  - Wave height: Random Forest regression (75% accuracy)
- **Training Data**: 150+ real surfer profiles (Kaggle dataset)
- **File**: `ar_surfboard_recommender/trained_model/enhanced_ar_model.joblib`

### 5. Risk Classifier & Regressor

- **Type**: Random Forest + Gradient Boosting
- **Purpose**: Surf spot risk assessment
- **Features**: Historical incidents, hazards, seasonal factors
- **Output**: Risk score (0-10) and level (Low/Medium/High)
- **Files**:
  - `models/risk_classifier.pkl`
  - `models/risk_regressor.pkl`

### 6. Toxicity Detector

- **Type**: BERT transformer
- **Purpose**: Content moderation for comments
- **Model**: `unitary/toxic-bert`
- **Performance**: Flags toxic/offensive content
- **Integration**: Real-time comment filtering

---

## 📁 Directory Structure

```
surf-ceylon/
│
├── surfapp--backend/               # Node.js/Express backend
│   ├── config/                     # Configuration files
│   │   ├── database.js
│   │   ├── spotMetadata.js
│   │   └── python.js
│   ├── controllers/                # Business logic
│   │   ├── authController.js
│   │   ├── postController.js
│   │   ├── messageController.js
│   │   ├── spotsController.js
│   │   ├── forecastController.js
│   │   ├── videoAnalysisController.js
│   │   └── EnhancedSuitabilityCalculator.js
│   ├── models/                     # MongoDB schemas
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Message.js
│   │   ├── Session.js
│   │   └── Comment.js
│   ├── routes/                     # API routes
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── messages.js
│   │   ├── spots.js
│   │   ├── forecast.js
│   │   ├── videoAnalysis.js
│   │   └── sessions.js
│   ├── middlewares/                # Express middlewares
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── mongoStatus.js
│   ├── uploads/                    # User uploaded files
│   ├── server.js                   # Express server
│   └── package.json
│
├── surfapp--ml-engine/             # Python ML services
│   ├── models/                     # Trained models
│   │   ├── random_forest_multi_output.pkl
│   │   ├── lstm_wave_forecast.keras
│   │   ├── lstm_wave_scaler.pkl
│   │   ├── cardio_ncf_model.h5
│   │   ├── risk_classifier.pkl
│   │   └── risk_regressor.pkl
│   ├── services/                   # Flask API services
│   │   ├── spot_predictor.py
│   │   ├── forecast_predictor.py
│   │   ├── cardio_service.py
│   │   └── surf_pose_analyzer_service.py
│   ├── training/                   # Training scripts
│   │   ├── train_random_forest_model.py
│   │   ├── prepare_timeseries_data.py
│   │   ├── train_wave_forecast_lstm.py
│   │   └── cardio_ncf_model.py
│   ├── utils/                      # Utility functions
│   │   ├── feature_engineering.py
│   │   └── toxicityChecker.py
│   ├── ar_surfboard_recommender/   # AR coach module
│   │   ├── ar_prediction_service.py
│   │   └── train_enhanced_model.py
│   ├── data/                       # Training data
│   │   ├── weligama_historical_data_fixed.json
│   │   └── arugam_bay_historical_data_fixed.json
│   ├── artifacts/                  # Training outputs
│   │   ├── timeseries_X_multioutput.npy
│   │   └── timeseries_y_multioutput.npy
│   ├── calculate_skill_risk.py     # Risk calculation
│   ├── start_all_services.py       # Service launcher
│   ├── requirements.txt
│   └── README.md
│
├── SurfApp--frontend/              # React Native app
│   ├── app/                        # Screens (Expo Router)
│   │   ├── (tabs)/                 # Tab navigation
│   │   │   ├── home.js             # Social feed
│   │   │   ├── explore.js          # Spot explorer
│   │   │   ├── sessions.js         # Session logging
│   │   │   └── profile.js          # User profile
│   │   ├── (auth)/                 # Auth screens
│   │   │   ├── login.js
│   │   │   └── register.js
│   │   ├── (spots)/                # Spot details
│   │   │   └── [id].js
│   │   ├── spotRecommender.js      # ML spot recommendations
│   │   ├── weatherForecasting.js   # 7-day LSTM forecast
│   │   ├── riskAnalyzer.js         # Risk assessment
│   │   ├── aiVideoAnalyzer.js      # Video analysis
│   │   ├── aiTutor/                # Training features
│   │   │   └── CardioPlans.jsx
│   │   ├── messenger.js            # Message list
│   │   ├── chat.js                 # Chat screen
│   │   └── postDetail.js           # Post view
│   ├── components/                 # Reusable components
│   │   ├── SpotCard.js
│   │   ├── ForecastChart.js
│   │   ├── ARVisualizationScreen.jsx
│   │   ├── ProgressScreen.jsx
│   │   ├── ScoreBreakdown.js
│   │   ├── RiskCard.js
│   │   ├── WebMapView.js
│   │   └── SkillLevelTabs.js
│   ├── services/                   # API clients
│   │   ├── api.js
│   │   ├── riskAnalyzerAPI.js
│   │   └── socket.js
│   ├── utils/                      # Helper functions
│   │   ├── badges.js
│   │   ├── badgeSystem.js
│   │   ├── riskAnalyzerHelpers.js
│   │   └── riskAnalyzerConstants.js
│   ├── constants/                  # App constants
│   │   ├── config.js
│   │   └── theme.js
│   ├── context/                    # React context
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── assets/                     # Images, fonts
│   ├── package.json
│   └── app.json
│
├── docs/                           # Documentation
│   ├── RANDOM_FOREST_MODEL_PERFORMANCE.md
│   ├── SUITABILITY_SCORING_SYSTEM.md
│   ├── LSTM_FORECAST_MODEL.md
│   └── AI_VIDEO_ANALYZER_GUIDE.md
│
└── README.md                       # This file
```

---

## 🧪 Testing

### Frontend Testing

```bash
cd SurfApp--frontend
npm test
```

### Backend Testing

```bash
cd surfapp--backend
npm test

# Test specific endpoints
curl http://localhost:3000/api/spots/recommendations
curl http://localhost:3000/api/surfSpots
```

### ML Model Testing

**Test Random Forest:**

```bash
cd surfapp--ml-engine
python testing/test_model1.py
python testing/validate_features.py
```

**Test LSTM Forecast:**

```bash
python testing/test_wave_forecast.py
```

**Test AR Surfboard Model:**

```bash
curl -X POST http://localhost:5003/ar/predict \
  -H "Content-Type: application/json" \
  -d '{"height_cm": 175, "weight_kg": 70, "age": 25, "experience_level": "Intermediate", "gender": "Male", "drill_id": "cutback"}'
```

**Test Cardio Service:**

```bash
curl -X POST http://localhost:5001/recommend \
  -H "Content-Type: application/json" \
  -d '{"userProfile": {"height": 175, "weight": 70, "skillLevel": "Intermediate"}}'
```

---

## 🚀 Deployment

### Production Build

**Backend:**

```bash
cd surfapp--backend
npm run build
npm run start:prod
```

**Frontend:**

```bash
cd SurfApp--frontend
eas build --platform all
eas submit --platform all
```

**ML Services:**

```bash
cd surfapp--ml-engine

# Install production dependencies
pip install -r requirements.txt

# Start with gunicorn (production WSGI server)
gunicorn --workers 4 --bind 0.0.0.0:5001 services.spot_predictor:app
gunicorn --workers 4 --bind 0.0.0.0:5002 services.forecast_predictor:app
gunicorn --workers 4 --bind 0.0.0.0:5003 ar_surfboard_recommender.ar_prediction_service:app
```

### Environment Variables

**Backend (.env):**

```
MONGODB_URI=mongodb://production-uri
JWT_SECRET=production-secret
STORMGLASS_API_KEYS=key1,key2,key3
NODE_ENV=production
PORT=3000
```

**Frontend:**

```javascript
// constants/config.js
const API_BASE_URL = "https://api.surfceylon.com";
```

### Cloud Deployment

**Recommended Stack:**

- **Backend**: AWS EC2 / Heroku / DigitalOcean
- **Database**: MongoDB Atlas
- **ML Services**: AWS EC2 with GPU / Google Cloud AI Platform
- **Frontend**: Expo EAS (iOS App Store, Google Play Store)
- **Media Storage**: AWS S3 / Cloudinary
- **CDN**: CloudFront / Cloudflare

---

## 📊 Performance Metrics

### ML Model Performance

| Model             | Metric           | Value  | Grade                |
| ----------------- | ---------------- | ------ | -------------------- |
| **Random Forest** | Overall R²       | 0.8068 | ⭐⭐⭐⭐ Good        |
|                   | Wave Height MAE  | 0.13m  | ⭐⭐⭐⭐⭐ Excellent |
|                   | Wind Speed R²    | 0.9787 | ⭐⭐⭐⭐⭐ Excellent |
| **LSTM**          | Wave Height MAPE | 8.8%   | ⭐⭐⭐⭐⭐ Excellent |
|                   | Wave Period MAPE | 7.4%   | ⭐⭐⭐⭐⭐ Excellent |
|                   | Validation Loss  | 0.3215 | ⭐⭐⭐⭐ Good        |
| **Cardio NCF**    | AUC              | 87%    | ⭐⭐⭐⭐ Good        |
|                   | Accuracy         | 82%    | ⭐⭐⭐⭐ Good        |
| **AR Surfboard**  | Board Length     | 95%    | ⭐⭐⭐⭐⭐ Excellent |
|                   | Board Volume     | 90%    | ⭐⭐⭐⭐⭐ Excellent |

### API Response Times

| Endpoint                 | Average Response | Target  |
| ------------------------ | ---------------- | ------- |
| `/spots/recommendations` | 450ms            | < 500ms |
| `/forecast`              | 2.5s             | < 3s    |
| `/surfSpots`             | 120ms            | < 200ms |
| `/posts`                 | 180ms            | < 300ms |
| `/ar/recommendations`    | 350ms            | < 500ms |

---

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Joi schemas for all inputs
- **Rate Limiting**: Express-rate-limit on all endpoints
- **CORS Protection**: Configured allowed origins
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: Content sanitization
- **File Upload Security**: File type and size validation
- **HTTPS**: TLS/SSL in production
- **Environment Variables**: Sensitive data in .env files

---

## 🐛 Known Issues & Limitations

### Random Forest Model

- Wave period prediction moderate (R² 0.48) - needs more training data
- May struggle with sudden weather changes

### LSTM Model

- Wind direction accuracy needs improvement (47° MAE)
- Accuracy degrades beyond 5-day forecasts
- Requires significant computational resources for training

### AR Surfboard Model

- Limited training data (150 samples) - affects wave height prediction
- Best for common body types (may be less accurate for outliers)

### Video Analyzer

- Requires clear video quality for accurate pose detection
- Performance varies with lighting conditions
- Processing time increases with video length

### General

- StormGlass API rate limits (10 calls/hour per key)
- Real-time messaging requires stable internet connection
- iOS deployment requires Apple Developer account

---

## 🔮 Future Enhancements

### Phase 1 (Q2 2026)

- [ ] Offline mode with cached forecasts
- [ ] Push notifications for hazard alerts
- [ ] Social features: groups, events
- [ ] Advanced filters for spot search
- [ ] Weather radar integration

### Phase 2 (Q3 2026)

- [ ] Live wave camera feeds
- [ ] Crowdsourced spot ratings
- [ ] In-app surfboard marketplace
- [ ] Coach-student matching
- [ ] Advanced analytics dashboard

### Phase 3 (Q4 2026)

- [ ] Wearable device integration (Apple Watch, Garmin)
- [ ] VR surf training simulations
- [ ] Competitive leaderboards
- [ ] Surf trip planning AI
- [ ] Multi-language support

---

## 👥 Contributors

### Core Team

**Real-time Surf Forecasting & Spot Recommender**

- Machine Learning model development (Random Forest, LSTM)
- Feature engineering and domain knowledge integration
- API service implementation and optimization
- Model training and performance evaluation

**Surf Risk Analyzer**

- Risk calculation engine development
- Historical incident analysis
- Interactive map implementation
- Hazard reporting system

**AI-Powered Training Features**

- Cardio NCF model development
- AR Surfboard hybrid ML system
- Progress tracking and gamification
- Training data collection and preprocessing

**AI Video Analyzer**

- MediaPipe pose detection integration
- Technique scoring algorithms
- Video processing pipeline
- Feedback generation system

**Surf Community Platform**

- Social feed and messaging features
- User authentication and profiles
- Real-time Socket.io implementation
- Content moderation system

---

## 📄 License

This project is developed as part of an academic research project. All rights reserved.

**Academic Use**: ✅ Permitted with citation  
**Commercial Use**: ❌ Requires permission  
**Redistribution**: ❌ Not permitted without authorization

---

## 📞 Support & Contact

**Project Repository**: [GitHub - SurfCeylon-The-Smart-Surf-App](https://github.com/SurfCeylon-The-Smart-Surf-App/surf-ceylon)

**Documentation**: See `/docs` folder for detailed feature documentation

**Bug Reports**: Open an issue on GitHub

**Feature Requests**: Submit via GitHub Issues with `enhancement` label

---

## 🙏 Acknowledgments

- **StormGlass API** for weather and wave data
- **MediaPipe** for pose detection models
- **TensorFlow/Keras** team for deep learning framework
- **scikit-learn** contributors for ML tools
- **Expo** team for React Native development platform
- **Kaggle** community for AR surfboard training data
- **MongoDB** for database solutions
- All contributors and testers who helped improve this project

---

## 📚 Documentation Links

- [Random Forest Model Performance](docs/RANDOM_FOREST_MODEL_PERFORMANCE.md)
- [Suitability Scoring System](docs/SUITABILITY_SCORING_SYSTEM.md)
- [LSTM Forecast Model](docs/LSTM_FORECAST_MODEL.md)
- [AI Video Analyzer Guide](docs/AI_VIDEO_ANALYZER_GUIDE.md)
- [ML Engine README](surfapp--ml-engine/README.md)

---

## 🎓 Research & Citations

If you use this project in your research, please cite:

```bibtex
@software{surfceylon2026,
  title={Surf Ceylon: AI-Powered Surf Forecasting and Community Platform},
  author={Surf Ceylon Development Team},
  year={2026},
  url={https://github.com/SurfCeylon-The-Smart-Surf-App/surf-ceylon}
}
```

---

**Last Updated**: January 6, 2026  
**Version**: 1.0.0  
**Status**: Production Ready

---

**Built with 🌊 for Sri Lankan surfers by surfers**

_Empowering the surfing community through intelligent technology_
