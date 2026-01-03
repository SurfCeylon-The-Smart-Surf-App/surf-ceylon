# 🚀 STARTUP GUIDE - Cardio ML System

## Quick Start Commands

### 1. Start ML Server (Python)
```powershell
cd C:\Users\sabri\OneDrive\Desktop\dev\integratedrepo\surf-ceylon\surfapp--ml-engine\services
python cardio_ml_server.py
```

**Server will run on**: `http://127.0.0.1:5001`

---

### 2. Start Backend Server (Node.js)
```powershell
cd C:\Users\sabri\OneDrive\Desktop\dev\integratedrepo\surf-ceylon\surfapp--backend
npm start
```

**Backend will run on**: `http://localhost:5000`

---

### 3. Start Frontend (React Native / Expo)
```powershell
cd C:\Users\sabri\OneDrive\Desktop\dev\integratedrepo\surf-ceylon\SurfApp--frontend
npm start
```

---

## 📊 System Architecture

```
Frontend (Expo/React Native)
         ↓
    [CardioQuizScreen.jsx]
         ↓
    HTTP POST /api/ai-tutor/recommend
         ↓
Backend (Node.js/Express)
    [recommendController.js]
         ↓
    HTTP POST http://127.0.0.1:5001/api/ai-tutor/recommend
         ↓
ML Server (Python/Flask)
    [cardio_ml_server.py]
         ↓
    Deep Learning Model
    [cardio_recommender_v1.keras]
         ↓
    Returns Personalized Workout Plan
```

---

## ✅ Testing the Full Flow

### Test ML Server Directly
```powershell
$body = @{
    skillLevel='intermediate'
    goal='endurance'
    equipment='none'
    duration='10-20'
    height=175
    weight=75
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://127.0.0.1:5001/api/ai-tutor/recommend' `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' | 
    Select-Object -ExpandProperty Content
```

### Test Through Backend
```powershell
$body = @{
    skillLevel='intermediate'
    goal='endurance'
    equipment='none'
    duration='10-20'
    height=175
    weight=75
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:5000/api/ai-tutor/recommend' `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' | 
    Select-Object -ExpandProperty Content
```

---

## 🎯 What Should Happen

### 1. User fills quiz in frontend:
- Fitness Level: Intermediate
- Goal: Endurance
- Equipment: None
- Duration: 10-20 minutes
- Height: 175 cm
- Weight: 75 kg

### 2. Frontend sends data to backend

### 3. Backend forwards to ML server

### 4. ML server:
- Encodes user features
- Filters exercises by constraints
- Runs neural network predictions
- Ranks exercises by suitability score
- Builds workout plan

### 5. Returns workout plan:
```json
{
  "planName": "Endurance Cardio Workout",
  "exercises": [
    {
      "name": "Jump Rope",
      "sets": 3,
      "reps": 10,
      "duration": 150,
      "rest": 30
    },
    ...
  ],
  "durationMinutes": 20,
  "mlGenerated": true
}
```

### 6. Frontend displays plan in WorkoutExecutionScreen

### 7. User completes workout → Progress tracked → Gamification works!

---

## 🔧 Troubleshooting

### ML Server Not Running
```
Error: Cannot connect to ML server
```
**Fix**: Start Python ML server first!
```powershell
cd surfapp--ml-engine\services
python cardio_ml_server.py
```

### Backend Can't Connect
```
Error: ECONNREFUSED
```
**Fix**: Check ML server is on port 5001
```powershell
# Should show: Running on http://127.0.0.1:5001
```

### Model Not Found
```
Error: Model file not found
```
**Fix**: Train the model first
```powershell
cd surfapp--ml-engine\training
python 3_train_deep_model.py
```

---

## 📦 Required Dependencies

### Python (ML Server)
```bash
pip install tensorflow scikit-learn pandas flask flask-cors kagglehub
```

### Node.js (Backend)
```bash
cd surfapp--backend
npm install
```

### React Native (Frontend)
```bash
cd SurfApp--frontend
npm install
```

---

## 🎓 For Presentation

### Demo Script
1. **Show the problem**: Old template system with fake data
2. **Show the solution**: New ML system with real Kaggle dataset
3. **Show the quiz**: Frontend cardio quiz
4. **Submit request**: Watch console logs
5. **Show ML processing**: Terminal output from ML server
6. **Show result**: Generated workout plan
7. **Show metrics**: 87% AUC, 82% accuracy
8. **Show visualizations**: Training curves, evaluation plots

### Key Files to Show
- `training/cardio_config.py` - Configuration
- `training/3_train_deep_model.py` - Model architecture
- `services/cardio_ml_server.py` - Production server
- `artifacts/model_evaluation_results.png` - Performance metrics
- `artifacts/PRESENTATION_SUMMARY.md` - Full report

---

## ✅ Quick Verification Checklist

- [ ] ML server running on port 5001
- [ ] Backend server running on port 5000
- [ ] Frontend running
- [ ] Test ML endpoint directly → Success
- [ ] Test through backend → Success
- [ ] Submit from frontend → Plan generated
- [ ] Gamification works → Progress tracked
- [ ] Presentation materials ready

---

## 🏆 Success Criteria

Your system is working if:
1. ✅ ML server starts without errors
2. ✅ Backend connects to ML server
3. ✅ Frontend quiz submits successfully
4. ✅ Workout plan is generated with 4-8 exercises
5. ✅ Exercises match user's fitness level and goal
6. ✅ Progress tracking and gamification work
7. ✅ All metrics are above 80%

---

**🎉 READY FOR DEMONSTRATION! 🎉**
