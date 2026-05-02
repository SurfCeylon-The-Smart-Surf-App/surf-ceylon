# SurfCeylon Project Master Overview

## 1) Project Summary

SurfCeylon is a multi-module surf technology platform with three main runtime layers:

- Mobile app (React Native + Expo) in `SurfApp--frontend`
- API backend (Node.js + Express + MongoDB) in `surfapp--backend`
- ML/AI engine (Python) in `surfapp--ml-engine`

Core capabilities implemented across these layers:

- Wave and weather forecasting
- Spot recommendation and suitability scoring
- Surf risk analysis and hazard reporting
- AI-assisted surf training and progression
- AI video analysis with pose classification
- AR surfboard recommendation experience
- Community/social features (posts, follows, chat)
- Marketplace features for business accounts

## 2) High-Level Architecture

### Runtime flow

1. Frontend calls backend REST endpoints under `/api/*`.
2. Backend handles auth, validation, persistence, and orchestration.
3. Backend invokes Python ML scripts/services using child processes.
4. Python returns JSON outputs used by backend controllers.
5. Frontend renders scores, forecasts, recommendations, and social data.

### Key integration points

- Backend starts in `surfapp--backend/server.js`
- Frontend network base URLs defined in `SurfApp--frontend/config/network.js`
- Backend Python integration helper in `surfapp--backend/config/python.js`
- ML service wrappers:
  - `surfapp--ml-engine/forecast_7day_service.py`
  - `surfapp--ml-engine/spot_recommender_service.py`
  - `surfapp--ml-engine/surf_pose_analyzer_service.py`

## 3) Repository Inventory (Source-Oriented)

Counts below exclude large dependency/artifact folders such as `node_modules`, `venv`, `__pycache__`, `.git`, `uploads`, and `artifacts`.

- `docs`: 15 files
- `surfapp--backend`: 64 files
- `SurfApp--frontend`: 145 files
- `surfapp--ml-engine`: 101 files
- Approximate source-oriented total: 325 files

## 4) Top-Level Folder Guide

## `docs`

Contains focused implementation and research write-ups, including:

- AI tutor integration and workflows
- AI video analyzer setup, flow, fixes, and root-cause notes
- LSTM and Random Forest model documentation/performance
- Suitability scoring system details
- Surf spot database update notes
- Thesis documentation file for community and video analyzer modules

## `surfapp--backend`

Express API layer and integration bridge between frontend, MongoDB, and Python ML.

Top-level backend structure:

- `config/`: DB, cache, multer, Python runner, constants
- `controllers/`: business logic for each domain
- `middlewares/`: auth and upload/mongo status guards
- `models/`: Mongoose schemas
- `routes/`: feature-separated API routers
- `scripts/`: utility scripts (for example, seeding)
- `server.js`: app bootstrap, middleware, route mounting, startup logs

## `SurfApp--frontend`

Expo Router mobile app with feature screens, services, and shared UI.

Top-level frontend structure:

- `app/`: route-driven screens
- `components/`: reusable UI components and feature widgets
- `config/`: centralized network configuration
- `context/` + `hooks/`: auth/session/user state and realtime hooks
- `services/`: API wrappers for backend communication
- `data/`: local source files (for example shared spot JSON)
- `utils/`: network helpers and constants

## `surfapp--ml-engine`

Python ML services, model artifacts, training scripts, and utility modules.

Top-level ML structure:

- `services/`: production service logic
- `training/`: training/preprocessing/evaluation scripts
- `models/`: persisted model files and encoders
- `config/`: model paths, feature lists, settings, API key config
- `utils/`: data fetching, feature engineering, mock data helpers
- top-level scripts: CLI entry wrappers and specialized ML tasks

## 5) Backend API Surface (Module View)

Mounted in `surfapp--backend/server.js`:

- `/api/auth`
- `/api/users`
- `/api/posts`
- `/api/follow`
- `/api/messages`
- `/api/spots`
- `/api/sessions`
- `/api/forecast`
- `/api/health`
- `/api/video-analysis`
- `/api/surf-spots`
- `/api/hazard-reports`
- `/api/incidents`
- `/api/market`
- `/api/ai-tutor`
- `/api/ar`

Additional utility endpoints:

- `/api/health-check`
- `/api/server-info`
- `/uploads/*` static files

### Core route modules

- `routes/auth.js`: register, login, profile, preferences, password, account deletion
- `routes/users.js`: profile update with uploads and AI tutor profile fields, user search/list
- `routes/posts.js`: feed, CRUD, likes, shares, comments
- `routes/follow.js`: follow system and follow request management
- `routes/messages.js`: conversations and message lifecycle
- `routes/spots.js`: spot recommendation endpoint
- `routes/forecast.js`: forecast by spot ID/name and view mode
- `routes/sessions.js`: session start/end/history/insights
- `routes/videoAnalysis.js`: video upload, analysis, history placeholder, health
- `routes/surfSpots.js`: risk-oriented surf spot retrieval and risk update
- `routes/hazardReports.js`: hazard submission with ML validation and duplicate image hash detection
- `routes/incidents.js`: incident retrieval endpoints
- `routes/market.js`: listing CRUD with role-gated business actions
- `routes/aiTutor.js`: gamification, progress tracking, recommendation routes
- `routes/arRecommendations.js`: AR surfboard recommendation endpoint and drill/health helpers

## 6) Data Model Overview (MongoDB)

Primary schema modules in `surfapp--backend/models`:

- `User.js`
  - auth identity + profile fields
  - social graph (followers/following)
  - surf preferences and learned preferences
  - AI surf tutor profile block
  - stats tracking

- `Session.js`
  - surf session records with conditions, duration, rating
  - analytics statics for favorite spots, preferred conditions, best times

- `SurfSpot.js`
  - coordinates and overall risk metrics
  - skill-specific risk buckets (`beginner`, `intermediate`, `advanced`)
  - methods for per-skill and overall risk evaluation

- `HazardReport.js`
  - surf spot-linked hazard entries
  - media attachments and ML analysis result
  - image hash index for duplicate detection
  - status and expiry lifecycle fields

- `Post.js`, `Comment.js`, `Follow.js`
  - community/social feed model structure

- `Conversation.js`, `Message.js`
  - private messaging data model

- `MarketListing.js`
  - marketplace listing data for business users

- `Incident.js`
  - surf incident history storage and retrieval

## 7) Frontend Feature Map

Route-level screens under `SurfApp--frontend/app` include:

- Auth flow: `(auth)/login`, `(auth)/register`
- Tab flow: dashboard, community, map, market, profile
- Forecasting: `weatherForecasting.js`
- Spot recommendation: `spotRecommender.js`
- Risk analysis: `RiskAnalyzerScreen.js`, `ReportHazardScreen.js`
- AI tutor: `aiTutor/*`, `aiSurfTutor.js`, cardio/progress screens
- AR: `arExperience.js`, `arViewer.js`
- AI video analyzer: `aiVideoAnalyzer.js`
- Social/chat: `chat.js`, `messenger.js`, `postDetail.js`, `followersList.js`
- User management: `editProfile.js`, `userProfile.js`

App composition in `app/_layout.js` wraps the app with:

- `UserProvider`
- `AuthProvider`
- `SurfTutorProfileProvider`
- shared `ActiveSessionBanner`

Frontend service layer:

- `services/api.js`: auth/users/posts/follow/messages/spots/sessions/health wrappers
- `services/aiTutorAPI.js`: tutor, gamification, progress, cardio endpoints
- `services/risk_api.js`: surf spots + hazard report flow with 422 validation handling
- `config/network.js`: centralized base URLs and endpoint constants

## 8) ML Engine Functional Overview

## Forecasting pipeline

- Entry: `forecast_7day_service.py`
- Main logic: `services/forecast_predictor.py`
- Behavior:
  - fetches historical weather/wave data with API key rotation
  - falls back to mock data if needed
  - predicts 168 hours (hourly) and aggregates to 7-day daily arrays
  - outputs metadata including source/method

## Spot recommendation pipeline

- Entry: `spot_recommender_service.py`
- Main logic: `services/spot_predictor.py`
- Behavior:
  - loads shared spots from frontend JSON
  - gets weather inputs or mock fallback
  - applies feature engineering + Random Forest inference
  - returns spot list with per-spot forecast payload

## Video analysis pipeline

- Entry: `surf_pose_analyzer_service.py`
- Main logic: `services/video_analyzer.py`
- Behavior:
  - validates video with YOLO surfboard detection gate
  - extracts pose landmarks (MediaPipe, with fallback)
  - classifies pose using trained model/encoder
  - produces confidence scores and improvement feedback

## AR recommendation pipeline

- Service: `services/ar_prediction_service.py`
- Behavior:
  - hybrid logic (physics-inspired calculations + ML inference)
  - predicts board length/volume and ideal wave context
  - returns coaching tips and recommendation payload

## Additional ML services

- `services/cardio_ml_server.py`: deep learning based cardio/workout recommendation in CLI JSON mode
- hazard/risk/toxicity scripts at ML root and `services/` support risk and moderation workflows

## Model assets

Located in `surfapp--ml-engine/models`, including:

- LSTM forecast model + scalers
- Random Forest and feature artifacts
- Pose classification model + label encoder
- AR model artifacts
- Cardio recommender model and encoders
- Toxicity/risk model assets

## 9) Cross-Module Data and Control Flow

## Forecasting and recommendations

1. Frontend requests `/api/spots` and `/api/forecast`.
2. Backend controllers spawn Python services.
3. ML engine returns predictions as JSON.
4. Backend enriches and sorts with suitability logic.
5. Frontend visualizes charts/cards/maps.

## Hazard and risk analysis

1. User submits hazard media via frontend multipart form.
2. Backend stores files, runs ML image validation, and computes image hash.
3. Invalid or duplicate reports are rejected with reason (`422`).
4. Valid reports are stored and risk recalculation is triggered.
5. Risk-aware surf spot views are returned to frontend.

## AI tutor and progress

1. Frontend submits profile/progress/gamification interactions.
2. Backend routes call tutor controllers and recommendation logic.
3. Cardio recommendation requests run Python ML prediction service.
4. Progress and points/badges persist and are surfaced to UI.

## Video analyzer

1. Frontend uploads a surf video.
2. Backend validates extension/size and invokes Python analyzer.
3. ML pipeline checks surfboard presence then classifies technique.
4. Backend returns structured analysis and feedback.

## 10) Setup and Runtime Notes

## Backend

- Start command: `npm start` in `surfapp--backend`
- Main port: from `PORT` env (defaults to 5001 in server startup section)
- CORS origins configurable via `CORS_ORIGINS`
- MongoDB is required for persistent feature sets

## Frontend

- Start command: `npm start` in `SurfApp--frontend`
- Expo entry uses `expo-router/entry`
- Network host/IP controlled from `config/network.js`

## ML engine

- Python dependencies pinned in `requirements.txt`
- Services are generally invoked by backend child process runners
- Optional direct execution via individual CLI scripts for debugging

## 11) Existing Documentation Index

Docs currently present in `docs`:

- `AI_SURF_TUTOR_INTEGRATION.md`
- `AI_VIDEO_ANALYZER_CHECKLIST.md`
- `AI_VIDEO_ANALYZER_FLOW.md`
- `AI_VIDEO_ANALYZER_GUIDE.md`
- `AI_VIDEO_ANALYZER_MODEL_FIX.md`
- `AI_VIDEO_ANALYZER_SUMMARY.md`
- `LSTM_FORECAST_MODEL.md`
- `MEDIAPIPE_POSE_DETECTION_FIXED.md`
- `RANDOM_FOREST_FORECAST_MODEL.md`
- `RANDOM_FOREST_MODEL_PERFORMANCE.md`
- `SUITABILITY_SCORING_SYSTEM.md`
- `SURF_SPOTS_UPDATE.md`
- `THESIS_SURF_COMMUNITY_AND_AI_VIDEO_ANALYZER.md`
- `WHY_MODEL_PREDICTS_SAME_CLASS.md`

This file (`PROJECT_MASTER_OVERVIEW.md`) is intended as the single top-level project map linking all of the above focused documents.

## 12) Notable Implementation Characteristics

- Backend is a strong orchestrator pattern: Node handles API/domain flow while Python handles heavy ML.
- Multiple fallback strategies are implemented (mock data, extrapolation, validation guards) to keep UX responsive when models/data are unavailable.
- Risk logic includes both aggregate and skill-specific scoring.
- Frontend networking is centralized and designed for local-network mobile testing.
- Documentation depth is high for model-specific areas, and this document unifies those pieces into one repository-level view.
