# 🚀 Quick Start Guide - AR Feature

## ✅ Setup Complete!

Your IP address is configured: **172.24.130.182**

---

## 🏃 Start Everything (3 Terminals)

### Terminal 1: ML Service (Python)
```powershell
cd surfapp--ml-engine\ar_surfboard_recommender
python ar_prediction_service.py
```
**Expected**: `📡 Starting server on http://localhost:5003`

### Terminal 2: Backend (Node.js)
```powershell
cd surfapp--backend
npm start
```
**Expected**: `🚀 Server running on port 5000`

### Terminal 3: Frontend (Expo)
```powershell
cd SurfApp--frontend
npm start
```

---

## 🧪 Test the Connection

### From your computer:
```powershell
# Test ML Service
Invoke-WebRequest -Uri "http://localhost:5003/ar/health"

# Test Backend
Invoke-WebRequest -Uri "http://localhost:5000/api/ar/health"
```

### From your phone (on same network):
```powershell
# Test Backend from phone's browser
http://172.24.130.182:5000/api/ar/health
```

---

## 📱 Using the AR Feature

1. **Open the app** on your phone
2. **Navigate** to AR Visualization
3. **Select** a surfing drill
4. **Enter** your profile:
   - Height: 175 cm
   - Weight: 75 kg
   - Age: 28
   - Experience: Intermediate
5. **Tap** "Get AI Recommendations"
6. **See** your personalized setup!

---

## ⚠️ Important Notes

### For the Backend to Work:
- ✅ ML service must be running on port 5003
- ✅ Backend must be running on port 5000
- ✅ Your computer and phone must be on same WiFi network
- ✅ Firewall must allow connections on ports 5000 and 5003

### Check Your IP Address:
```powershell
# Get your IP
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

If your IP changed, update:
- `SurfApp--frontend/constants/config.js` → change `LOCAL_IP`

---

## 🐛 Troubleshooting

### Frontend can't connect to backend:
1. Verify IP in `constants/config.js` matches your computer's IP
2. Check backend is running: `http://localhost:5000/api/ar/health`
3. Verify firewall allows port 5000
4. Make sure phone and computer are on same WiFi

### Backend can't connect to ML service:
1. Verify ML service is running: `http://localhost:5003/ar/health`
2. Check no other app is using port 5003

### "Model not found" error:
```powershell
cd surfapp--ml-engine\ar_surfboard_recommender
python train_enhanced_model.py
```

---

## ✅ Success Indicators

**ML Service Running:**
```
✅ Model loaded successfully!
📡 Starting server on http://localhost:5003
```

**Backend Running:**
```
🚀 Server running on port 5000
✅ MongoDB connected
```

**Frontend Working:**
- Can select drills
- Form accepts input
- Shows loading spinner when submitting
- Displays recommendations

---

## 📊 Your Configuration

```javascript
Backend API: http://172.24.130.182:5000/api
ML Service:  http://localhost:5003 (internal only)

AR Endpoint: http://172.24.130.182:5000/api/ar/recommendations
```

---

Ready to surf! 🏄
