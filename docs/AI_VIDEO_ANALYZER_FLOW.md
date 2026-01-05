# AI Video Analyzer - System Flow Diagram

## 📱 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER OPENS APP                            │
│                   (React Native + Expo)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION FLOW                               │
│                                                                   │
│  Home → Utils Tab → Click "AI Video Analyzer" Card              │
│                                                                   │
│  Route: /aiVideoAnalyzer                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI VIDEO ANALYZER PAGE LOADS                        │
│                                                                   │
│  Components:                                                     │
│  ├─ Header with back button                                     │
│  ├─ Info card (explains feature)                                │
│  ├─ Upload section                                              │
│  ├─ Results section (hidden initially)                          │
│  └─ Tips card                                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   USER CLICKS "SELECT VIDEO"                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXPO IMAGE PICKER OPENS                         │
│                                                                   │
│  • Requests media library permissions                           │
│  • Filters for videos only                                      │
│  • User selects video from gallery                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VIDEO VALIDATION                              │
│                                                                   │
│  Checks:                                                         │
│  ✓ File size < 50MB                                             │
│  ✓ Format: MP4, MOV, AVI, WEBM                                  │
│  ✓ File accessible                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              VIDEO SELECTED - SHOW INFO                          │
│                                                                   │
│  Display:                                                        │
│  ✓ Filename                                                      │
│  ✓ "Analyze Video" button appears                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER CLICKS "ANALYZE VIDEO"                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PREPARE UPLOAD                                 │
│                                                                   │
│  • Get auth token from AsyncStorage                             │
│  • Create FormData with video file                              │
│  • Show loading indicator                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UPLOAD VIDEO                                 │
│                                                                   │
│  POST /api/video-analysis/analyze                               │
│  Headers: Authorization: Bearer <token>                         │
│  Body: multipart/form-data with video                           │
│                                                                   │
│  Progress: 0% → 25% → 50% → 75% → 100%                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND RECEIVES                              │
│              (Node.js + Express + Multer)                        │
│                                                                   │
│  1. Authenticate user (JWT middleware)                          │
│  2. Multer receives file upload                                 │
│  3. Save to: uploads/videos/surf-video-[timestamp].mp4         │
│  4. Validate file type and size                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CALL PYTHON ML SERVICE                          │
│                                                                   │
│  spawn(PYTHON_EXECUTABLE, [                                     │
│    'surf_pose_analyzer_service.py',                             │
│    videoPath                                                     │
│  ])                                                              │
│                                                                   │
│  Status: "Analyzing your technique..."                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PYTHON ML ENGINE                               │
│          (surf_pose_analyzer_service.py)                         │
│                                                                   │
│  Step 1: Load Models                                            │
│  ├─ Load surf_model.pkl (Random Forest)                         │
│  └─ Load label_encoder.pkl                                      │
│                                                                   │
│  Step 2: Extract Pose Landmarks                                 │
│  ├─ Open video with OpenCV                                      │
│  ├─ Process frames with MediaPipe                               │
│  ├─ Extract 33 body landmarks per frame                         │
│  ├─ Each landmark: (x, y, z, visibility)                        │
│  └─ Collect up to 300 frames                                    │
│                                                                   │
│  Step 3: Classify Technique                                     │
│  ├─ Average all pose landmarks                                  │
│  ├─ Feed to Random Forest model                                 │
│  ├─ Get prediction and confidence                               │
│  └─ Get probabilities for all classes                           │
│                                                                   │
│  Step 4: Generate Feedback                                      │
│  ├─ Match detected pose to feedback database                    │
│  ├─ Determine rating (excellent/good/needs work)                │
│  ├─ Select relevant strengths                                   │
│  ├─ Generate specific suggestions                               │
│  └─ Create next steps roadmap                                   │
│                                                                   │
│  Step 5: Return JSON Result                                     │
│  └─ Print to stdout (captured by Node.js)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND PROCESSES RESULT                        │
│                                                                   │
│  1. Capture Python stdout                                       │
│  2. Parse JSON response                                         │
│  3. Delete temporary video file                                 │
│  4. Return result to frontend                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND DISPLAYS RESULTS                       │
│                                                                   │
│  Classification Card:                                            │
│  ├─ Pose name (e.g., "Good Popup")                             │
│  ├─ Confidence badge (85%)                                      │
│  └─ Frames analyzed (120 frames)                                │
│                                                                   │
│  Feedback Card:                                                  │
│  ├─ Rating icon & color                                         │
│  ├─ Personalized message                                        │
│  ├─ 💪 Strengths section                                        │
│  ├─ 💡 Suggestions section                                      │
│  ├─ 🎯 Next steps section                                       │
│  └─ Alternative detections (if any)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER READS FEEDBACK                             │
│                                                                   │
│  • Understands their current technique level                    │
│  • Knows what they're doing well                                │
│  • Gets specific improvement suggestions                        │
│  • Has clear next steps to practice                             │
│                                                                   │
│  Options:                                                        │
│  ├─ Upload another video                                        │
│  ├─ Return to dashboard                                         │
│  └─ Practice suggested techniques                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Summary

```
Video File → FormData → Backend → Python → MediaPipe → Model → Feedback → JSON → Frontend → UI
  (50MB)     (Upload)   (Multer)  (spawn)   (Pose)    (RF)   (Generate)  (Parse)  (React)  (Display)
```

## 🎯 Key Technologies

| Layer            | Technology          | Purpose          |
| ---------------- | ------------------- | ---------------- |
| Frontend         | React Native + Expo | Mobile UI        |
| Upload           | expo-image-picker   | Video selection  |
| API              | Axios               | HTTP requests    |
| Backend          | Node.js + Express   | API server       |
| Upload Handler   | Multer              | File uploads     |
| Auth             | JWT                 | Security         |
| ML Service       | Python              | Video analysis   |
| Pose Detection   | MediaPipe           | Body landmarks   |
| Classification   | Random Forest       | Technique ID     |
| Video Processing | OpenCV              | Frame extraction |

## 📊 Performance Timeline

```
0s    │ User clicks "Select Video"
      │
1s    │ Video picker opens
      │
2s    │ User selects video
      │
3s    │ Video validated
      │
4s    │ User clicks "Analyze"
      │
5-10s │ ████████░░░░░░░░░░ Uploading (50%)
      │
10s   │ Upload complete
      │
11s   │ Backend receives & validates
      │
12s   │ Python service starts
      │
13s   │ Models loaded
      │
14s   │ Video opened
      │
15-40s│ ████████████████░░ Extracting poses
      │
41s   │ Classification running
      │
42s   │ Feedback generation
      │
43s   │ Results returned
      │
44s   │ ✅ RESULTS DISPLAYED
```

## 🏗️ File Structure Map

```
surfceylon/
│
├── surfapp--backend/
│   ├── controllers/
│   │   └── videoAnalysisController.js  ⭐ NEW
│   ├── routes/
│   │   └── videoAnalysis.js            ⭐ NEW
│   ├── uploads/
│   │   └── videos/                     ⭐ NEW (auto-created)
│   ├── config/
│   │   └── python.js                   ✏️ UPDATED
│   └── server.js                       ✏️ UPDATED
│
├── surfapp--ml-engine/
│   ├── surf_pose_analyzer_service.py   ⭐ NEW
│   ├── test_setup.py                   ⭐ NEW
│   ├── requirements.txt                ✏️ UPDATED
│   ├── README_VIDEO_ANALYZER.md        ⭐ NEW
│   └── models/
│       ├── README.md                   ⭐ NEW
│       ├── surf_model.pkl              📦 YOU PLACE
│       └── label_encoder.pkl           📦 YOU PLACE
│
├── SurfApp--frontend/
│   └── app/
│       ├── aiVideoAnalyzer.js          ⭐ NEW
│       └── (tabs)/
│           └── dashboard.js            ✏️ UPDATED
│
└── docs/
    ├── AI_VIDEO_ANALYZER_GUIDE.md      ⭐ NEW
    ├── AI_VIDEO_ANALYZER_CHECKLIST.md  ⭐ NEW
    ├── AI_VIDEO_ANALYZER_SUMMARY.md    ⭐ NEW
    └── AI_VIDEO_ANALYZER_FLOW.md       ⭐ NEW (this file)
```

## 🎬 Example Analysis Result

```json
{
  "success": true,
  "classification": {
    "pose": "good_popup",
    "confidence": 0.85,
    "frames_analyzed": 120,
    "all_classes": {
      "good_popup": 0.85,
      "perfect_popup": 0.1,
      "needs_work_popup": 0.05
    }
  },
  "feedback": {
    "rating": "good",
    "message": "👍 Good pop-up! You're getting there.",
    "strengths": ["Decent form and timing", "Acceptable stance width"],
    "suggestions": [
      "Focus on explosive push from chest",
      "Keep your back foot perpendicular to the board",
      "Look ahead, not down at the board"
    ],
    "next_steps": [
      "Practice pop-ups on the beach 20x daily",
      "Work on fluid motion without pauses"
    ],
    "also_detected": ["perfect_popup (10%)"]
  }
}
```

---

**This diagram shows the complete journey from user action to AI feedback!** 🚀
