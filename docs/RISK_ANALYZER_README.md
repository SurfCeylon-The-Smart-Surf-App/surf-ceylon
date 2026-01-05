# 🌊 Surf Risk Analyzer - Feature Documentation

## Overview

The **Surf Risk Analyzer** is an intelligent risk assessment system that evaluates surf spots in Sri Lanka based on historical incident data, current hazard reports, and skill-level-specific thresholds. It provides real-time risk scores and safety recommendations to help surfers make informed decisions.

---

## 🎯 Key Features

### 1. **Skill-Based Risk Assessment**
- **Three Skill Levels**: Beginner, Intermediate, Advanced
- **Dynamic Thresholds**: Each skill level has different risk tolerance levels
- **Personalized Risk Scores**: Same spot can be green for advanced surfers but red for beginners

### 2. **Interactive Map & List Views**
- **Map View**: Visual representation with color-coded pins (🟢 Green, 🟡 Yellow, 🔴 Red)
- **List View**: Detailed cards with risk scores, incident history, and safety information
- **Real-time Updates**: Automatic refresh with pull-to-refresh functionality

### 3. **Comprehensive Risk Data**
- **Historical Incidents**: Analysis of drownings, reef cuts, rip currents, and collisions
- **Recent Hazards**: Real-time hazard reports from the community (last 24 hours)
- **Seasonal Adjustments**: Peak season considerations
- **Weather Integration**: Current conditions and forecasts

### 4. **Safety Features**
- **Risk Level Indicators**: Clear visual flags (Green, Yellow, Red)
- **Incident History**: Detailed breakdown of past accidents
- **Hazard Reports**: Community-driven safety alerts
- **Emergency Information**: Quick access to safety tips

---

## 📊 Risk Scoring System

### Skill-Specific Thresholds

| Skill Level    | Low Risk    | Medium Risk | High Risk   |
|----------------|-------------|-------------|-------------|
| **Beginner**   | 0.0 - 5.0   | 5.0 - 6.5   | 6.5 - 10.0  |
| **Intermediate**| 0.0 - 6.0   | 6.0 - 7.2   | 7.2 - 10.0  |
| **Advanced**   | 0.0 - 7.0   | 7.0 - 8.0   | 8.0 - 10.0  |

### Risk Calculation Factors

1. **Historical Incidents** (50% weight)
   - Fatal incidents
   - Severe injuries
   - Moderate incidents
   - Incident types (drowning, reef cuts, collisions, rip currents)

2. **Recent Hazards** (30% weight)
   - High severity hazards: +2.0 points
   - Medium severity hazards: +1.0 points
   - Low severity hazards: +0.5 points

3. **Seasonal Adjustments** (20% weight)
   - Peak season indicator
   - Monthly incident patterns

---

## 🏗️ Technical Architecture

### Frontend (React Native - Expo)

#### Main Components

**`riskAnalyzer.js`** - Main screen component
- Handles view switching (Map/List)
- Manages skill level selection
- Displays risk data and safety information

**`SkillLevelTabs.js`** - Skill level selector
- Three-tab interface (Beginner, Intermediate, Advanced)
- Visual icons and color coding

**`WebMapView.js`** - Interactive map component
- Color-coded markers based on risk level
- Clickable pins with spot details
- Zoom and pan functionality

**`RiskCard.js`** - Individual spot risk display
- Risk score visualization
- Incident breakdown
- Quick actions (View Details, Report Hazard)

#### Services

**`riskAnalyzerAPI.js`** - API client
```javascript
// Main endpoints
getSurfSpots()              // Fetch all surf spots with risk scores
getSurfSpotById(spotId)     // Get detailed spot information
submitHazardReport(data)    // Submit new hazard report
getHazardReports(spotId)    // Get recent hazards for spot
getIncidents(spotId)        // Get historical incidents
```

#### Utilities

**`riskAnalyzerConstants.js`**
- Skill level definitions
- Risk level configurations
- Color schemes and thresholds

**`riskAnalyzerHelpers.js`**
- `getRiskDataForSkill()` - Extract skill-specific data
- `getRiskLevelForSkill()` - Determine risk level
- `getThresholdRanges()` - Get threshold info
- `getSkillLevelInfo()` - Get skill metadata

---

### Backend (Node.js - Express)

#### API Routes

**`/api/surfSpots`**
```javascript
GET /api/surfSpots
// Returns all surf spots with calculated risk scores
Response: {
  success: true,
  data: [
    {
      _id: "...",
      name: "Hikkaduwa",
      location: { latitude: 6.1401, longitude: 80.0991 },
      riskScore: 7.5,
      riskLevel: "High",
      flagColor: "red",
      beginnerRisk: { score: 7.5, level: "High", flag: "red" },
      intermediateRisk: { score: 7.5, level: "High", flag: "red" },
      advancedRisk: { score: 3.0, level: "Low", flag: "green" },
      totalIncidents: 45,
      incidentBreakdown: {...}
    }
  ]
}
```

**`/api/surfSpots/:id`**
```javascript
GET /api/surfSpots/:id
// Returns detailed information for a specific surf spot
```

**`/api/hazardReports`**
```javascript
POST /api/hazardReports
// Submit a new hazard report with image upload

GET /api/hazardReports?spotId=xxx
// Get recent hazard reports for a spot
```

**`/api/incidents`**
```javascript
GET /api/incidents?spotId=xxx
// Get historical incident data for a spot
```

#### Controllers

**`surfSpotController.js`**
- `getAllSurfSpots()` - Fetch all spots with risk data
- `getSurfSpotById()` - Get detailed spot information

**`hazardController.js`**
- `createHazardReport()` - Handle new hazard submissions
- `getHazardReports()` - Retrieve hazard reports

**`incidentController.js`**
- `getIncidents()` - Fetch historical incident data

---

### ML Engine (Python - Flask)

#### Core Scripts

**`calculate_skill_risk.py`** - Main risk calculation engine
```python
# Manual risk scores for each surf spot and skill level
MANUAL_RISK_SCORES = {
    'Hikkaduwa': {
        'beginner': 7.5,
        'intermediate': 7.5,
        'advanced': 3.0
    },
    # ... other spots
}

# Functions
calculate_skill_based_risks()      # Calculate all risk scores
update_database_with_skill_risks() # Update MongoDB
get_risk_level_and_flag()          # Determine risk level
```

**`predict_risk.py`** - ML-based risk prediction
```python
# Uses machine learning models for dynamic risk assessment
calculate_spot_features(spot_name)  # Extract features
predict_risk_score(spot_name)       # Calculate risk
```

**`analyze_hazard.py`** - Hazard report analysis
- Validates hazard severity
- Integrates with risk calculations
- Updates spot risk scores

#### Models
- **`risk_classifier.pkl`** - Random Forest classifier for risk levels
- **`risk_regressor.pkl`** - Gradient Boosting regressor for scores
- **`feature_cols.pkl`** - Feature definitions

---

## 🗄️ Database Schema

### SurfSpot Model
```javascript
{
  name: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  riskScore: Number,           // Overall risk (0-10)
  riskLevel: String,           // "Low", "Medium", "High"
  flagColor: String,           // "green", "yellow", "red"
  
  // Skill-specific risks
  beginnerRisk: {
    score: Number,
    level: String,
    flag: String
  },
  intermediateRisk: {
    score: Number,
    level: String,
    flag: String
  },
  advancedRisk: {
    score: Number,
    level: String,
    flag: String
  },
  
  // Incident data
  totalIncidents: Number,
  incidentBreakdown: {
    fatal: Number,
    severe: Number,
    moderate: Number,
    drowning: Number,
    reefCut: Number,
    collision: Number,
    ripCurrent: Number
  },
  
  lastUpdated: Date
}
```

### HazardReport Model
```javascript
{
  surfSpot: ObjectId,
  reportedBy: ObjectId,
  hazardType: String,          // "rip-current", "rocks", etc.
  severity: String,            // "low", "medium", "high"
  description: String,
  location: String,
  images: [String],
  reportDate: Date,
  status: String,              // "pending", "verified", "rejected"
  verifiedBy: ObjectId,
  verificationDate: Date
}
```

### Incident Model
```javascript
{
  site: String,
  incidentType: String,
  severity: String,
  date: Date,
  month: Number,
  year: Number,
  description: String,
  outcomes: String
}
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- MongoDB
- Expo CLI

### Frontend Setup
```bash
cd SurfApp--frontend
npm install
npx expo start
```

### Backend Setup
```bash
cd surfapp--backend
npm install
npm run dev
```

### ML Engine Setup
```bash
cd surfapp--ml-engine
pip install -r requirements.txt
python calculate_skill_risk.py  # Initialize risk scores
```

---

## 📱 User Interface

### Map View
- **Color-coded markers**: Green (safe), Yellow (caution), Red (dangerous)
- **Clustering**: Multiple spots grouped when zoomed out
- **Tap interaction**: Click marker for spot details
- **Current location**: Shows user's position

### List View
- **Risk cards**: Sorted by risk level (high to low)
- **Risk score**: Large number display with color coding
- **Incident count**: Total historical incidents
- **Quick actions**: View details, Report hazard
- **Skill indicator**: Shows current skill filter

### Spot Detail View
- **Risk breakdown**: All skill levels displayed
- **Weather forecast**: Current and upcoming conditions
- **Incident history**: Timeline of past accidents
- **Recent hazards**: Community reports from last 24 hours
- **Safety tips**: Skill-appropriate recommendations

---

## 🧪 Testing

### Frontend Tests
```bash
cd SurfApp--frontend
npm test
```

### Backend Tests
```bash
cd surfapp--backend
npm test
```

### API Testing
Use the included Postman collection or test manually:
```bash
curl http://localhost:3000/api/surfSpots
curl http://localhost:3000/api/surfSpots/:id
```

---

## 🔒 Security Features

1. **User Authentication**: Required for hazard reporting
2. **Image Validation**: File type and size checks
3. **Input Sanitization**: All user inputs validated
4. **Rate Limiting**: API request throttling
5. **CORS Protection**: Configured for allowed origins

---

## 📈 Future Enhancements

1. **Real-time Weather Integration**: Live wave height and wind data
2. **AI-powered Predictions**: Machine learning for risk forecasting
3. **User Feedback**: Community ratings and reviews
4. **Push Notifications**: Alert users of hazard changes
5. **Offline Mode**: Cached data for no-connectivity scenarios
6. **Advanced Filters**: Filter by specific hazard types
7. **Historical Trends**: Visualize risk changes over time
8. **Social Features**: Share spots with friends

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Risk scores not updating
- **Solution**: Run `python calculate_skill_risk.py` to recalculate

**Issue**: Map not loading
- **Solution**: Check API_BASE_URL in config.js

**Issue**: Images not uploading
- **Solution**: Verify multer configuration and upload directory permissions

**Issue**: Backend connection failed
- **Solution**: Ensure MongoDB is running and backend server is started

---

## 📞 API Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200  | Success | Request completed successfully |
| 400  | Bad Request | Invalid input data |
| 401  | Unauthorized | Authentication required |
| 404  | Not Found | Resource doesn't exist |
| 500  | Server Error | Internal server error |

---

## 📚 References

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

## 👥 Contributors

**Risk Analyzer Feature** developed by:
- Frontend Development: React Native + Expo
- Backend Development: Node.js + Express
- ML Engine: Python + Flask
- Database: MongoDB

---

## 📄 License

This feature is part of the Surf Ceylon application. All rights reserved.

---

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Skill-based risk assessment
- ✅ Interactive map and list views
- ✅ Hazard reporting system
- ✅ Historical incident analysis
- ✅ Real-time risk updates
- ✅ Community-driven safety alerts

---

**Last Updated**: January 5, 2026

For more information, visit the main [Surf Ceylon README](../README.md)
