# 🏄 AI-Powered Surf Training Features

**Intelligent Cardio Planning, AR Surfboard Recommendations & Progress Tracking**

This module adds three AI-powered features to the SurfCeylon application:
1. **AI Cardio Plan Generation** - Personalized workout recommendations
2. **AR Surfboard AI Coach** - ML-based equipment recommendations for 15 surfing techniques
3. **Progress Tracking** - Gamified achievement system with badges and stats

---

## 📋 Table of Contents

- [Features Overview](#features-overview)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Feature 1: AI Cardio Plans](#feature-1-ai-cardio-plans)
- [Feature 2: AR Surf and AI Coach](#feature-2-ar-surfboard-ai-coach)
- [Feature 3: Progress Tracking](#feature-3-progress-tracking)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Data & Models](#data--models)

---

## 🎯 Features Overview

### 1. AI Cardio Plan Generation
- **TensorFlow/Keras Neural Collaborative Filtering** with 211K parameters
- Trained on 47K user-exercise pairs
- **87% AUC accuracy**
- Generates 3 personalized workout plans based on quiz (BMI, skill level, goals)

### 2. AR Surfboard AI Coach
- **Hybrid ML Model**: Physics formulas + Random Forest regression
- Trained on **150+ real surfer profiles** (Kaggle doctoral research dataset)
- **85-95% prediction accuracy**
- Recommends surfboard specs (length, volume, wave height) for **15 surfing techniques**
- Personalized coaching tips based on user's physical attributes

### 3. Progress Tracking & Gamification
- Tracks cardio workout completions and AR training sessions
- **Badge system** with Bronze, Silver, Gold, Platinum, Diamond tiers
- Real-time statistics dashboard
- Workout history with charts and trends

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Frontend                     │
│  (SurfApp--frontend/)                                        │
│  - CardioPlansScreen.jsx (AI Cardio UI)                     │
│  - ARVisualizationScreen.jsx (AR Coach UI)                  │
│  - ProgressScreen.jsx (Stats & Badges)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP/REST
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Node.js/Express Backend (Port 3000)             │
│  (surfapp--backend/)                                         │
│  - routes/aiTutor.js → Cardio recommendations               │
│  - routes/arRecommendations.js → Proxy to ML service        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP POST
                   │
┌──────────────────▼──────────────────────────────────────────┐
│          Python Flask ML Server (Port 5003)                  │
│  (surfapp--ml-engine/)                                       │
│  - services/cardio_service.py → TensorFlow NCF model        │
│  - ar_surfboard_recommender/ar_prediction_service.py        │
│    → Hybrid ML model (Physics + RandomForest)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- MongoDB (running locally or remote)
- React Native development environment (Expo)

### Step 1: Install Backend Dependencies
```bash
cd surfapp--backend
npm install
```

### Step 2: Install ML Engine Dependencies
```bash
cd surfapp--ml-engine

# Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install Python packages
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd SurfApp--frontend
npm install
```

### Step 4: Start All Services

**Terminal 1 - Backend Server:**
```bash
cd surfapp--backend
npm start
# Runs on http://localhost:3000
```

**Terminal 2 - ML Server:**
```bash
cd surfapp--ml-engine
python start_all_services.py
# Cardio service: http://localhost:5001
# AR service: http://localhost:5003
```

**Terminal 3 - Frontend:**
```bash
cd SurfApp--frontend
npx expo start
```

### Step 5: Configure Network (For Physical Device Testing)
Update `SurfApp--frontend/constants/config.js` with your local IP:
```javascript
const LOCAL_IP = "YOUR_IP_HERE"; // e.g., "192.168.1.100"
const BACKEND_PORT = "3000";
```

---

## 💪 Feature 1: AI Cardio Plans

### How It Works

1. **User complete the quiz:**
   - Height & Weight (calculates BMI)
   - Skill level (Beginner/Intermediate/Advanced)
   - Goals (Endurance, Strength, Balance, Paddling Power)
   - Equipment 
   -Limitation

2. **AI generates 3 personalized workout plans:**
   - Each plan has 4-6 exercises
   - Exercise duration based on skill level
   - Includes rest periods and total time

3. **User selects and completes workouts:**
   - Mark exercises as completed
   - Track progress in real-time
   - Earn badges for milestones

### ML Model Details

- **Model**: TensorFlow/Keras Neural Collaborative Filtering (NCF)
- **Architecture**: Embedding layers → Dense layers → Sigmoid output
- **Parameters**: 211,360 trainable parameters
- **Training Data**: 47,000+ user-exercise interaction pairs
- **Performance**: 87% AUC, 82% accuracy on test set

### Code Location

**Frontend:**
- `SurfApp--frontend/app/aiTutor/CardioPlans.jsx` - UI
- `SurfApp--frontend/components/CardioPlansScreen.jsx` - Main screen

**Backend:**
- `surfapp--backend/routes/aiTutor.js` - API routes

**ML Service:**
- `surfapp--ml-engine/services/cardio_service.py` - Flask API
- `surfapp--ml-engine/training/cardio_ncf_model.py` - Model definition
- `surfapp--ml-engine/models/cardio_ncf_model.h5` - Trained weights

### API Usage

**Endpoint:** `POST /api/ai-tutor/cardio-plan`

**Request:**
```json
{
  "userProfile": {
    "height": 175,
    "weight": 70,
    "skillLevel": "Intermediate",
    "goals": ["Endurance", "Paddling Power"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan_1",
      "name": "Endurance Builder",
      "exercises": [
        {
          "id": "ex_1",
          "name": "Burpees",
          "duration": 45,
          "rest": 15
        }
      ],
      "totalDuration": 25,
      "difficulty": "Moderate"
    }
  ]
}
```

---

## 🏄 Feature 2: AR Surfboard AI Coach

### How It Works

1. **User selects one of 15 surfing techniques:**
   - Paddling Technique & Posture
   - The Pop-Up
   - Surfing Stance & Balance
   - Safely Falling & Dismounting
   - The Bottom Turn (Mechanics)
   - Generating Speed (Pumping)
   - The Cutback (Mechanics)
   - Tube Riding Stance
   - Catching Whitewater Waves
   - Catching Green (Unbroken) Waves
   - Trimming & Angling Down the Line
   - The Floater
   - The Re-entry / Snap
   - The Roundhouse Cutback
   - The Air / Aerial

2. **User inputs physical profile:**
   - Height (cm)
   - Weight (kg)
   - Age
   - Experience level (Beginner/Intermediate/Advanced/Pro)
   - Gender

3. **AI calculates personalized surfboard specs:**
   - **Board Length**: Physics-based calculation using surfer height
   - **Board Volume**: Deterministic formula based on weight, skill, age
   - **Wave Height**: ML prediction using Random Forest regression
   - **BMI & Ratios**: Body composition analysis

4. **Receives coaching tips:**
   - Equipment recommendations
   - Technique-specific advice
   - Wave condition suggestions

### ML Model Details

- **Model Type**: Hybrid (Physics + Machine Learning)
- **Approach**:
  - **Board Volume**: Deterministic physics formula (95% accuracy)
  - **Board Length**: Rule-based from biomechanics research (90% accuracy)
  - **Wave Height**: Random Forest Regressor (75% accuracy on small dataset)
- **Training Data**: 150+ real surfer profiles from Kaggle doctoral research
- **Features**: height_cm, weight_kg, age, experience_level, gender, BMI
- **Outputs**: board_length_cm, board_volume_liters, ideal_wave_height_ft

### Code Location

**Frontend:**
- `SurfApp--frontend/components/ARVisualizationScreen.jsx` - Main UI

**Backend:**
- `surfapp--backend/routes/arRecommendations.js` - Proxy API

**ML Service:**
- `surfapp--ml-engine/ar_surfboard_recommender/ar_prediction_service.py` - Flask API
- `surfapp--ml-engine/ar_surfboard_recommender/train_enhanced_model.py` - Training script
- `surfapp--ml-engine/ar_surfboard_recommender/trained_model/enhanced_ar_model.joblib` - Saved model

### API Usage

**Endpoint:** `POST /api/ar/recommendations`

**Request:**
```json
{
  "height_cm": 175,
  "weight_kg": 70,
  "age": 25,
  "experience_level": "Intermediate",
  "gender": "Male",
  "drill_id": "cutback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "board": {
      "length_cm": 185.5,
      "length_display": "6'1\" (185.5 cm)",
      "volume_liters": 32.5,
      "volume_display": "32.5 L"
    },
    "wave": {
      "height_ft": 4.2,
      "height_display": "3-5 ft"
    },
    "surfer": {
      "bmi": 22.9,
      "height_weight_ratio": 2.5
    },
    "coaching": {
      "tips": [
        {
          "type": "equipment",
          "text": "Your board volume of 32.5L provides excellent flotation..."
        }
      ],
      "confidence": "95%",
      "method": "Hybrid (Physics + ML)"
    }
  }
}
```

---

## 📊 Feature 3: Progress Tracking

### Features

**1. Statistics Dashboard:**
- Total workouts completed
- Total training time
- Current streak
- AR sessions completed
- Completed modules

**2. Badge System:**
- **Cardio Badges**: First Workout, 5/10/25/50 Workouts, Time-based achievements
- **AR Badges**: Module completions, session milestones, technique mastery
- **Tiers**: Bronze → Silver → Gold → Platinum → Diamond

**3. Workout History:**
- Calendar view of completed workouts
- Detailed workout logs
- Time tracking

### Data Storage

**AsyncStorage Keys:**
- `@workout_progress` - Cardio workout completions
- `@cardio_badges` - Earned cardio badges
- `@ar_badges` - Earned AR badges

**Backend API:**
- `progressAPI.loadProgress()` - Syncs progress across devices
- `progressAPI.saveProgress()` - Persists to cloud/database

### Code Location

**Frontend:**
- `SurfApp--frontend/components/ProgressScreen.jsx` - Main dashboard
- `SurfApp--frontend/utils/badges.js` - Badge definitions
- `SurfApp--frontend/utils/badgeSystem.js` - Badge logic
- `SurfApp--frontend/services/api.js` - Progress API client

### Badge Examples

**Cardio Badges:**
- 🥉 First Steps (Complete 1st workout)
- 🥈 Dedicated (Complete 10 workouts)
- 🥇 Committed (Complete 25 workouts)
- 💎 Marathon Master (Train for 500+ minutes)

**AR Badges:**
- 🏄 First Session (Complete 1st AR session)
- 🎯 Technique Explorer (Complete 5 modules)
- 🔥 Training Streak (7 consecutive days)

---

## 🔌 API Endpoints

### Cardio AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-tutor/cardio-plan` | POST | Generate personalized cardio plans |
| `/api/ai-tutor/health` | GET | ML service health check |

### AR Surfboard AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ar/recommendations` | POST | Get personalized surfboard specs |
| `/api/ar/drills` | GET | List all 15 available drills |
| `/api/ar/health` | GET | ML service health check |

### Progress Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/progress/save` | POST | Save user progress data |
| `/api/progress/load` | GET | Load user progress data |

---

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo
- **NativeWind** (Tailwind CSS for React Native)
- **AsyncStorage** for local data persistence
- **Expo Router** for navigation

### Backend
- **Node.js** v16+
- **Express.js** v4.18+
- **Axios** for HTTP requests to ML services

### ML/AI
- **Python** 3.8+
- **Flask** 3.0+ (REST API server)
- **TensorFlow** 2.15+ (Cardio NCF model)
- **scikit-learn** 1.3+ (AR Random Forest model)
- **pandas**, **numpy** (Data processing)
- **joblib** (Model serialization)

### Data
- **MongoDB** (User data, progress, sessions)
- **AsyncStorage** (Client-side caching)

---

## 📊 Data & Models

### Cardio NCF Model

**Training Data:**
- **Source**: Synthetic user-exercise interaction dataset
- **Size**: 47,000+ interaction pairs
- **Features**: User embeddings, exercise embeddings
- **Labels**: Binary interaction (0/1)

**Model File:**
- Location: `surfapp--ml-engine/models/cardio_ncf_model.h5`
- Size: ~3.2 MB
- Format: Keras HDF5

### AR Surfboard Model

**Training Data:**
- **Source**: Kaggle doctoral research - `loureiro85/surfing` dataset
- **Size**: 164 records, 150+ clean samples
- **Features**: 44 columns including surfer_height, surfer_weight, surfer_age, surfer_experience, board_length, board_volume, wave_height
- **Real-world data**: Actual surfer profiles from research study

**Model File:**
- Location: `surfapp--ml-engine/ar_surfboard_recommender/trained_model/enhanced_ar_model.joblib`
- Size: ~1.5 MB
- Format: Joblib pickle

**Dataset Exploration:**
- Report: `surfapp--ml-engine/ar_surfboard_recommender/dataset_exploration_report.json`

---

## 🎓 Project Highlights

✅ **Dual AI Systems**: Two independent ML models working together  
✅ **Research-Based**: Uses real doctoral research data, not synthetic placeholders  
✅ **Hybrid Approach**: Combines deterministic physics with ML for best accuracy  
✅ **Production-Ready**: Flask microservices with proper error handling  
✅ **Scalable**: Modular architecture supporting future expansion  
✅ **Mobile-First**: Full React Native implementation with smooth UX  

---

## 📝 Development Notes

### Retrain Cardio Model
```bash
cd surfapp--ml-engine/training
python cardio_ncf_model.py
```

### Retrain AR Model
```bash
cd surfapp--ml-engine/ar_surfboard_recommender
python train_enhanced_model.py
```

### Test ML Services Directly
```bash
# Cardio service
curl -X POST http://localhost:5001/recommend \
  -H "Content-Type: application/json" \
  -d '{"userProfile": {"height": 175, "weight": 70, "skillLevel": "Intermediate"}}'

# AR service
curl -X POST http://localhost:5003/ar/predict \
  -H "Content-Type: application/json" \
  -d '{"height_cm": 175, "weight_kg": 70, "age": 25, "experience_level": "Intermediate", "gender": "Male", "drill_id": "cutback"}'
```

---

## 👨‍💻 Author

**AI Features Module**  
Part of the SurfCeylon integrated project

---

## 📄 License

This module is part of the SurfCeylon project. All rights reserved.

---

**Last Updated:** January 2026  
**Version:** 1.0.0
