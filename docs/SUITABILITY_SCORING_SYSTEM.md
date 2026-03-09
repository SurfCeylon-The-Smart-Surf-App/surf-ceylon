# 🏄‍♂️ SurfCeylon Suitability Scoring System - Complete Documentation

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Random Forest ML Model - Deep Dive](#2-random-forest-ml-model---deep-dive)
3. [Enhanced Suitability Calculation](#3-enhanced-suitability-calculation)
4. [Session Learning System](#4-session-learning-system---the-magic-)
5. [Complete Flow Diagram](#5-complete-flow-diagram)
6. [Key Benefits](#6-key-benefits-of-this-system)
7. [Technical Highlights](#7-technical-highlights)
8. [Model Files & Configuration](#8-model-files--configuration)
9. [Training & Retraining Guide](#9-training--retraining-guide)
10. [Performance Monitoring](#10-performance-monitoring)

---

## 1. System Architecture Overview

The suitability scoring system uses a **hybrid ML + rules-based approach** with three main components:

### A. Machine Learning Layer (Random Forest Model)

- **Purpose**: Predicts surf conditions from weather data
- **Location**: `surfapp--ml-engine/` (Python microservice)
- **Model Type**: Multi-output Random Forest Regressor (scikit-learn)
- **Model File**: `models/surf_forecast_model.joblib`
- **Training Script**: `training/train_random_forest_model.py`
- **Wrapper Module**: `models/random_forest.py`

### B. Enhanced Scoring Engine

- **Purpose**: Calculates suitability scores from ML predictions
- **Location**: `surfapp--backend/controllers/EnhancedSuitabilityCalculator.js`
- **Approach**: Skill-adaptive weighted scoring with session learning

### C. Session Learning System

- **Purpose**: Learns user preferences from surf history
- **Location**: `surfapp--backend/models/Session.js` + `spotsController.js`
- **Mechanism**: Analyzes 4-5 star sessions to personalize scores

---

## 2. Random Forest ML Model - Deep Dive

### Training Process

The model was trained on historical surf data from StormGlass API using data from Sri Lankan surf spots.

#### Input Features (15 total)

**Base Features (10)** - Raw weather data from StormGlass API:

```javascript
1. swellHeight          // Primary swell height (meters)
2. swellPeriod          // Primary swell period (seconds)
3. swellDirection       // Primary swell direction (degrees)
4. windSpeed            // Wind speed (m/s)
5. windDirection        // Wind direction (degrees)
6. seaLevel             // Tide level (meters)
7. gust                 // Wind gust speed (m/s)
8. secondarySwellHeight // Secondary swell height (meters)
9. secondarySwellPeriod // Secondary swell period (seconds)
10. secondarySwellDirection // Secondary swell direction (degrees)
```

**Engineered Features (5)** - Calculated physics-based features:

```python
1. swellEnergy = swellHeight² × swellPeriod
   # Wave energy (higher = more powerful waves)

2. offshoreWind = windSpeed × cos(windDirection - 270°)
   # Offshore wind component (270° is offshore for south coast)

3. totalSwellHeight = swellHeight + secondarySwellHeight
   # Combined swell from multiple sources

4. windSwellInteraction = windSpeed × swellHeight
   # How wind affects wave quality

5. periodRatio = swellPeriod / (secondarySwellPeriod + 1)
   # Swell dominance (higher period = cleaner waves)
```

#### Prediction Targets (3)

```javascript
1. waveHeight      // Predicted wave face height (meters)
2. windSpeed       // Predicted wind speed (m/s)
3. windDirection   // Predicted wind direction (degrees)
```

### Model Architecture

```python
RandomForestRegressor(
    n_estimators=200,        # 200 decision trees
    max_depth=15,            # Prevent overfitting
    min_samples_split=5,     # Minimum samples to split node
    min_samples_leaf=2,      # Minimum samples per leaf
    max_features='sqrt',     # Use √15 ≈ 4 features per tree
    random_state=42,
    n_jobs=-1               # Use all CPU cores
)
```

### How Random Forest Works

#### 1. Training Phase

- Creates 200 decision trees
- Each tree trained on random subset of data (bootstrap sampling)
- Each split uses random subset of features
- Trees learn patterns: "If swellPeriod > 10s AND windSpeed < 15 → waveHeight = 1.5m"

#### 2. Prediction Phase

- All 200 trees make predictions independently
- Final prediction = average of all trees
- Reduces overfitting, more accurate than single tree
- Provides robust predictions even with noisy input data

#### 3. Why Random Forest?

- ✅ Handles non-linear relationships (wave physics is complex)
- ✅ Robust to outliers (bad weather data doesn't break it)
- ✅ Feature importance analysis (identifies key factors)
- ✅ No feature scaling needed
- ✅ Works well with limited training data
- ✅ Provides confidence through variance

### Model Performance

```
Overall R² Score: 0.9386
MAE (Mean Absolute Error): 0.1221m for wave height
RMSE (Root Mean Squared Error): 0.1591m for wave height

Translation: Model predicts wave height within ±0.12m accuracy
```

### Feature Engineering - Critical Component

**Why Feature Engineering Matters:**

Raw weather data alone doesn't capture surf quality. The engineered features encode domain knowledge:

```python
# Example: Why swellEnergy matters
# Scenario 1: 1m wave, 8s period → Energy = 1² × 8 = 8
# Scenario 2: 1m wave, 12s period → Energy = 1² × 12 = 12
# Result: Same height, but Scenario 2 has 50% more energy = better surf

# Example: Why offshoreWind matters
# Wind at 270° (offshore) = clean waves (positive value)
# Wind at 90° (onshore) = messy waves (negative value)
# cos(windDirection - 270°) encodes this mathematically
```

---

## 3. Enhanced Suitability Calculation

After ML predictions, the backend calculates a 0-100 suitability score using 4 factors.

### Skill-Adaptive Weights

Different skill levels care about different factors:

```javascript
Beginner (Safety prioritized):
├─ Safety: 35%        // Most important
├─ Wave Quality: 30%
├─ Wind: 20%
└─ Consistency: 15%

Intermediate (Balanced):
├─ Wave Quality: 35%   // Most important
├─ Consistency: 25%
├─ Safety: 25%
└─ Wind: 15%

Advanced (Performance-focused):
├─ Wave Quality: 40%   // Most important
├─ Consistency: 25%
├─ Wind: 20%
└─ Safety: 15%
```

### Factor Scoring Logic

#### 1. Wave Quality Score (0-100)

```javascript
// Ideal wave height ranges by skill level
const optimalRanges = {
  Beginner: { min: 0.5, ideal: 1.0, max: 1.5 },
  Intermediate: { min: 1.0, ideal: 1.5, max: 2.5 },
  Advanced: { min: 1.5, ideal: 2.5, max: 5.0 },
};

// Score calculation (returns 0-1, multiplied by 100 later)
if (waveHeight < range.min) {
  score = waveHeight / range.min; // Too small
} else if (waveHeight <= range.ideal) {
  score = 1.0; // Perfect!
} else if (waveHeight <= range.max) {
  // Good but getting large: linear penalty 1.0 → 0.7
  score = 1.0 - ((waveHeight - range.ideal) / (range.max - range.ideal)) * 0.3;
} else {
  // Too large: drops below 0.7
  score = Math.max(0, 0.7 - ((waveHeight - range.max) / range.max) * 0.5);
}

// Example for Intermediate (ideal 1.5m):
// Actual: 1.3m → score: 1.0 (within ideal range)
// Actual: 2.0m → score: 0.85 (slightly large)
// Actual: 3.0m → score: 0.52 (exceeds max)
```

#### 2. Wind Conditions Score (0-100)

```javascript
// Wind affects wave quality dramatically
// Offshore wind = clean, glassy waves
// Onshore wind = messy, choppy waves

windScore = (speedScore * 0.6 + directionScore * 0.4) * 100;

// Base score from wind speed (km/h)
if (windSpeed < 5) {
  speedScore = 0.6; // Too light (glassy but no swell)
} else if (windSpeed <= 15) {
  speedScore = 1.0; // Optimal
} else if (windSpeed <= 25) {
  speedScore = 0.7; // Moderate
} else if (windSpeed <= 35) {
  speedScore = 0.4; // Strong
} else {
  speedScore = 0.1; // Very strong (dangerous)
}

// Direction scoring relative to spot's offshore direction
angleDiff = min(|windDirection - offshoreDir|, 360 - |windDirection - offshoreDir|);

if (angleDiff <= 45°) {
  directionScore = 1.0;  // Directly offshore
} else if (angleDiff <= 90°) {
  directionScore = 0.8;  // Partially offshore
} else if (angleDiff <= 135°) {
  directionScore = 0.6;  // Side-shore
} else {
  directionScore = 0.4;  // Onshore
}

// Example (south coast spot, offshore direction 270°):
// Wind: 14 km/h at 280° → speedScore=1.0, diff=10°, dirScore=1.0 → Total=100
// Wind: 14 km/h at 90°  → speedScore=1.0, diff=180°, dirScore=0.4 → Total=64
```

#### 3. Safety Score (0-100)

```javascript
// Safety limits per skill level
const safeWaveHeights = {
  Beginner: { max: 1.5, ideal: 1.0 },
  Intermediate: { max: 2.5, ideal: 1.8 },
  Advanced: { max: 5.0, ideal: 2.5 },
};

// Start at 100, apply penalties
let safetyScore = 100;

// Wave height penalty
if (waveHeight > skillThresholds.max) {
  const excess = waveHeight - skillThresholds.max;
  safetyScore -= Math.min(40, excess * 20); // Up to -40
} else if (waveHeight > skillThresholds.ideal) {
  safetyScore -= (waveHeight - skillThresholds.ideal) * 10;
}

// Wind penalty
if (windSpeed > 35) {
  safetyScore -= 30; // Strong wind
} else if (windSpeed > 25) {
  safetyScore -= 15; // Moderate wind
}

// Additional Beginner-specific penalties
// Strong offshore winds for beginners: -25
// Reef/rock bottom for beginners: -10

// Low tide on reef penalty: -10 to -20
// Rip current spots (Beginner): -15

// canSurf determination
canSurf = safetyScore >= 30;

// Safety override: Cap score if dangerous
if (!canSurf) {
  finalScore = Math.min(finalScore, 35);
}
```

#### 4. Consistency Score (0-100)

```javascript
// Starts at 50, then adds/subtracts based on conditions
let consistencyScore = 50;

// Wave period (groundswell quality)
if (wavePeriod >= 14s) consistencyScore += 35;  // Epic groundswell
else if (wavePeriod >= 12s) consistencyScore += 25;  // Excellent
else if (wavePeriod >= 10s) consistencyScore += 15;  // Good
else if (wavePeriod >= 8s) consistencyScore += 5;   // OK
else consistencyScore -= 20;                         // Choppy wind-swell

// Wind stability
if (windSpeed >= 8 && windSpeed <= 15) consistencyScore += 20;  // Ideal window
else if (windSpeed >= 5 && windSpeed <= 20) consistencyScore += 10;
else if (windSpeed < 5) consistencyScore += 5;   // Glassy
else if (windSpeed > 30) consistencyScore -= 30;  // Storm
else if (windSpeed > 20) consistencyScore -= 15;  // Choppy

// Wave height sweet spot
if (waveHeight >= 1.0 && waveHeight <= 2.5) consistencyScore += 10;
else if (waveHeight < 0.5) consistencyScore -= 10;  // Too small
else if (waveHeight > 4.0) consistencyScore -= 10;  // Too large

// Final score clamped between 0 and 100
score = Math.max(0, Math.min(100, consistencyScore));
```

### Weighted Score Calculation

```javascript
weightedScore =
  (waveScore × weights.wave) +
  (windScore × weights.wind) +
  (safetyScore × weights.safety) +
  (consistencyScore × weights.consistency);

// Example: Intermediate surfer
// Wave: 85 × 0.35 = 29.75
// Wind: 75 × 0.15 = 11.25
// Safety: 90 × 0.25 = 22.50
// Consistency: 80 × 0.25 = 20.00
// ────────────────────────
// Total: 83.5 → Rounded: 84

// Suitability Level Determination:
// ≥ 80: "Excellent"
// ≥ 65: "Good"
// ≥ 50: "Fair"
// ≥ 35: "Poor"
// < 35: "Unsuitable"
```

---

## 4. Session Learning System - The Magic! ✨

This is what makes the app **smart and personalized**.

### How It Works

#### Step 1: User Surfs & Rates Sessions

After each surf session:

```javascript
Session.create({
  userId: "user123",
  spotId: "1",
  spotName: "Weligama",
  spotRegion: "South Coast",

  // Weather conditions during session
  conditions: {
    waveHeight: 1.2, // meters
    wavePeriod: 10, // seconds
    windSpeed: 15, // km/h
    windDirection: 280, // degrees
    tide: "Mid",
  },

  // User feedback
  rating: 5, // 1-5 stars
  wouldReturn: true, // yes/no
  comments: "Epic session! Perfect conditions.",

  // Automatically tracked
  startTime: "2025-12-23T08:00:00Z",
  endTime: "2025-12-23T09:30:00Z",
  duration: 90, // minutes (calculated)
  enjoyment: 100, // 0-100 (calculated from duration)
});
```

#### Step 2: System Analyzes High-Rated Sessions

After accumulating 5+ sessions:

```javascript
// Load user's session history
const sessions = await Session.find({ userId })
  .sort({ createdAt: -1 })
  .limit(50);

// Filter high-rated sessions (4-5 stars only)
const highRatedSessions = sessions.filter((s) => s.rating >= 4);

// ────────────────────────────────────────────
// Learn Preferred Wave Height
// ────────────────────────────────────────────
const waveHeights = highRatedSessions
  .map((s) => s.conditions?.waveHeight)
  .filter((h) => h != null && h > 0);

const learnedWaveHeight =
  waveHeights.reduce((a, b) => a + b, 0) / waveHeights.length;

// Example: [1.0, 1.2, 1.3, 1.1, 1.0] → Average: 1.12m

// ────────────────────────────────────────────
// Learn Preferred Wind Speed
// ────────────────────────────────────────────
const windSpeeds = highRatedSessions
  .map((s) => s.conditions?.windSpeed)
  .filter((w) => w != null && w > 0);

const learnedWindSpeed =
  windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length;

// Example: [10, 15, 12, 18, 13] → Average: 13.6 km/h

// ────────────────────────────────────────────
// Identify Favorite Spots
// ────────────────────────────────────────────
const spotCounts = {};
const spotRatings = {};

sessions.forEach((s) => {
  const spotName = s.spotName;
  spotCounts[spotName] = (spotCounts[spotName] || 0) + 1;

  if (!spotRatings[spotName]) spotRatings[spotName] = [];
  if (s.rating) spotRatings[spotName].push(s.rating);
});

// Sort by visit count and average rating
const favoriteSpots = Object.keys(spotCounts)
  .map((spotName) => ({
    name: spotName,
    visitCount: spotCounts[spotName],
    avgRating:
      spotRatings[spotName].reduce((a, b) => a + b) /
      spotRatings[spotName].length,
  }))
  .sort((a, b) => {
    // Sort by visits first, then rating
    if (b.visitCount !== a.visitCount) {
      return b.visitCount - a.visitCount;
    }
    return b.avgRating - a.avgRating;
  })
  .slice(0, 5) // Top 5 favorites
  .map((s) => s.name);

// Example: ["Weligama", "Midigama", "Hiriketiya"]
```

#### Step 3: Scoring Bonuses Applied

When calculating future suitability scores:

```javascript
let normalizedScore = weightedScore; // Base score
const sessionBonuses = [];

// ────────────────────────────────────────────
// Bonus 1: Favorite Spot (+15 points)
// ────────────────────────────────────────────
if (userPreferences.favoriteSpots?.includes(spot.name)) {
  normalizedScore += 15;
  sessionBonuses.push({
    type: "favorite_spot",
    points: 15,
    message: "⭐ One of your favorite spots!",
  });
}

// ────────────────────────────────────────────
// Bonus 2: Wave Preference Match (+10 points)
// ────────────────────────────────────────────
if (userPreferences.learnedWaveHeight) {
  const waveDiff = Math.abs(
    currentWaveHeight - userPreferences.learnedWaveHeight,
  );

  if (waveDiff <= 0.3) {
    // Within 30cm
    normalizedScore += 10;
    sessionBonuses.push({
      type: "wave_match",
      points: 10,
      message: `🌊 Waves match your preferred ${userPreferences.learnedWaveHeight.toFixed(
        1,
      )}m conditions!`,
    });
  }
}

// ────────────────────────────────────────────
// Bonus 3: Wind Preference Match (+5 points)
// ────────────────────────────────────────────
if (userPreferences.learnedWindSpeed) {
  const windDiff = Math.abs(
    currentWindSpeed - userPreferences.learnedWindSpeed,
  );

  if (windDiff <= 5) {
    // Within 5 km/h
    normalizedScore += 5;
    sessionBonuses.push({
      type: "wind_match",
      points: 5,
      message: `💨 Wind matches your preferred ${userPreferences.learnedWindSpeed.toFixed(
        0,
      )} km/h conditions!`,
    });
  }
}

// Cap final score at 100
normalizedScore = Math.min(normalizedScore, 100);
```

### Real-World Example

**User: Sarah (Intermediate Surfer)**

**Session History:**

```
Session 1: Weligama, 1.0m waves, 12 km/h wind → Rating: 5⭐
Session 2: Midigama, 1.5m waves, 20 km/h wind → Rating: 3⭐
Session 3: Weligama, 1.2m waves, 10 km/h wind → Rating: 5⭐
Session 4: Hiriketiya, 0.8m waves, 15 km/h wind → Rating: 4⭐
Session 5: Weligama, 1.1m waves, 18 km/h wind → Rating: 5⭐
Session 6: Arugam Bay, 2.0m waves, 25 km/h wind → Rating: 3⭐
Session 7: Weligama, 0.9m waves, 13 km/h wind → Rating: 4⭐
```

**Learned Preferences (from 4-5⭐ sessions only):**

```javascript
High-rated sessions: 1, 3, 4, 5, 7

learnedWaveHeight = (1.0 + 1.2 + 0.8 + 1.1 + 0.9) / 5 = 1.0m
learnedWindSpeed = (12 + 10 + 15 + 18 + 13) / 5 = 13.6 km/h
favoriteSpots = ["Weligama"] (4 visits, 3 were 4-5⭐)
```

**Current Conditions at Weligama:**

```
Wave Height: 1.1m
Wave Period: 10s
Wind Speed: 14 km/h
Wind Direction: 270° (offshore)
Tide: Mid
```

**Scoring Calculation:**

**Without Session Learning:**

```
Factor Scores:
├─ Wave: 90 (close to intermediate ideal of 1.5m)
├─ Wind: 85 (light offshore wind)
├─ Safety: 95 (safe conditions)
└─ Consistency: 85 (10s period is good)

Weighted Score:
(90 × 0.35) + (85 × 0.15) + (95 × 0.25) + (85 × 0.25) = 90 points
Suitability: "Excellent"
```

**With Session Learning:**

```
Base Score: 90

Session Bonuses:
├─ Favorite Spot: +15 (Weligama is her favorite!)
├─ Wave Match: +10 (1.1m ≈ learned 1.0m, diff = 0.1m < 0.3m)
└─ Wind Match: +5 (14 km/h ≈ learned 13.6 km/h, diff = 0.4 < 5)

Final Score: 90 + 15 + 10 + 5 = 120 → Capped at 100 ✅

Suitability: "Excellent" 🌟

Recommendations:
1. ⭐ One of your favorite spots!
2. 🌊 Waves match your preferred 1.0m conditions!
3. 💨 Wind matches your preferred 14 km/h conditions!
4. Perfect for intermediate surfers
5. Offshore wind creating clean conditions
```

**Impact:**

- Without learning: 90/100 (excellent, but generic)
- With learning: 100/100 (perfect match for Sarah's preferences!)
- The app now knows Sarah prefers smaller waves than typical intermediate surfers

### Learning Update Trigger

```javascript
// After ending a session
await session.save();

// Update user stats
user.stats.totalSessions += 1;
user.stats.totalHours += session.duration / 60;

// Re-learn preferences every 5 sessions
if (user.stats.totalSessions % 5 === 0) {
  await user.updateLearnedPreferences();
  console.log("✅ User preferences updated from session history");
}
```

---

## 5. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER OPENS APP                                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: SurfApp--frontend/data/surfApi.js                 │
│ GET /api/spots?userId=123&skillLevel=Intermediate           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: surfapp--backend/controllers/spotsController.js    │
│                                                              │
│ Step 1: Parse User Preferences                              │
│ ├─ skillLevel: "Intermediate"                               │
│ ├─ minWaveHeight: 0.5m                                      │
│ ├─ maxWaveHeight: 2.5m                                      │
│ └─ boardType: "Soft-top"                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Load Session Insights (if MongoDB connected)        │
│ loadSessionInsights(userId)                                  │
│                                                              │
│ const sessions = await Session.find({ userId })             │
│   .sort({ createdAt: -1 })                                  │
│   .limit(50);                                               │
│                                                              │
│ Filter rating >= 4:                                         │
│ ├─ Calculate learnedWaveHeight: 1.0m                        │
│ ├─ Calculate learnedWindSpeed: 13.6 km/h                    │
│ └─ Identify favoriteSpots: ["Weligama"]                     │
│                                                              │
│ Object.assign(userPreferences, insights);                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Call Python ML Service                              │
│ spawn('python', ['spot_recommender_service.py'])            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ML Service: surfapp--ml-engine/                             │
│                                                              │
│ 3a. Fetch Weather Data                                      │
│     StormGlass API → 10 base features:                      │
│     ├─ swellHeight, swellPeriod, swellDirection             │
│     ├─ windSpeed, windDirection, seaLevel                   │
│     ├─ gust, secondarySwellHeight                           │
│     └─ secondarySwellPeriod, secondarySwellDirection        │
│                                                              │
│ 3b. Feature Engineering                                     │
│     calculate_engineered_features():                        │
│     ├─ swellEnergy = height² × period                       │
│     ├─ offshoreWind = windSpeed × cos(windDir - 270°)       │
│     ├─ totalSwellHeight = primary + secondary               │
│     ├─ windSwellInteraction = windSpeed × swellHeight       │
│     └─ periodRatio = period / (secondary + 1)               │
│     → Now have 15 features                                  │
│                                                              │
│ 3c. Load Model                                              │
│     model = joblib.load('surf_forecast_model.joblib')       │
│     → RandomForestRegressor with 200 trees                  │
│                                                              │
│ 3d. Make Predictions                                        │
│     predictions = model.predict(features_df)                │
│     → [waveHeight, windSpeed, windDirection]                │
│                                                              │
│ 3e. Extract Tide                                            │
│     if seaLevel < 0.3: tide = "Low"                         │
│     elif seaLevel < 0.7: tide = "Mid"                       │
│     else: tide = "High"                                     │
│                                                              │
│ 3f. Return JSON                                             │
│     { waveHeight: 1.1, wavePeriod: 10,                      │
│       windSpeed: 14, windDirection: 270, tide: "Mid" }      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Calculate Enhanced Suitability                      │
│ EnhancedSuitabilityCalculator.calculateEnhancedSuitability()│
│                                                              │
│ 4a. Get Skill-Adaptive Weights                              │
│     Intermediate: { wave: 0.35, consistency: 0.25,          │
│                     safety: 0.25, wind: 0.15 }              │
│                                                              │
│ 4b. Calculate Factor Scores (0-100 each)                    │
│     ├─ waveScore = 90 (1.1m close to ideal)                 │
│     ├─ windScore = 85 (light offshore)                      │
│     ├─ safetyScore = 95 (safe conditions)                   │
│     └─ consistencyScore = 85 (10s period)                   │
│                                                              │
│ 4c. Apply Weighted Formula                                  │
│     weightedScore = (90×0.35) + (85×0.15) +                 │
│                     (95×0.25) + (85×0.25)                   │
│                   = 31.5 + 12.75 + 23.75 + 21.25            │
│                   = 89.25 → 89 points                       │
│                                                              │
│ 4d. Add Session Bonuses                                     │
│     ├─ Favorite Spot: +15 (Weligama)                        │
│     ├─ Wave Match: +10 (1.1m ≈ 1.0m learned)                │
│     └─ Wind Match: +5 (14 ≈ 13.6 km/h learned)              │
│     = 89 + 30 = 119 → Capped at 100                         │
│                                                              │
│ 4e. Determine Suitability Level                             │
│     100 >= 80 → "Excellent"                                 │
│                                                              │
│ 4f. Generate Recommendations                                │
│     ├─ "⭐ One of your favorite spots!"                      │
│     ├─ "🌊 Waves match your preferred 1.0m conditions!"     │
│     ├─ "💨 Wind matches your preferred 14 km/h conditions!" │
│     ├─ "Perfect for intermediate surfers"                   │
│     └─ "Offshore wind creating clean conditions"            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Return to Frontend                                  │
│                                                              │
│ Response JSON:                                               │
│ {                                                            │
│   spots: [                                                   │
│     {                                                        │
│       id: "1",                                               │
│       name: "Weligama",                                      │
│       region: "South Coast",                                 │
│       score: 100,                                            │
│       suitability: "Excellent",                              │
│       breakdown: {                                           │
│         wave: 90,                                            │
│         wind: 85,                                            │
│         safety: 95,                                          │
│         consistency: 85,                                     │
│         overall: 100                                         │
│       },                                                     │
│       recommendations: [                                     │
│         "⭐ One of your favorite spots!",                    │
│         "🌊 Waves match your preferred 1.0m conditions!",   │
│         "💨 Wind matches your preferred 14 km/h conditions!",│
│         "Perfect for intermediate surfers",                  │
│         "Offshore wind creating clean conditions"            │
│       ],                                                     │
│       forecast: {                                            │
│         waveHeight: 1.1,                                     │
│         wavePeriod: 10,                                      │
│         windSpeed: 14,                                       │
│         windDirection: 270,                                  │
│         tide: "Mid"                                          │
│       }                                                      │
│     }                                                        │
│   ]                                                          │
│ }                                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Frontend Rendering                                  │
│                                                              │
│ components/SpotCard.js:                                      │
│ ├─ Display score with color gradient (green for 100)        │
│ ├─ Show suitability level badge ("Excellent")               │
│ ├─ List top recommendations                                 │
│ └─ Show forecast details (1.1m @ 10s, 14 km/h)              │
│                                                              │
│ components/ScoreBreakdown.js:                                │
│ ├─ Overall score: 100/100 (Grade: A+)                       │
│ ├─ Progress bars for 4 factors                              │
│ └─ Detailed descriptions for each                           │
│                                                              │
│ components/SuitabilityRadarChart.js:                         │
│ └─ 4-point spider chart showing balanced scores             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Key Benefits of This System

### ✅ **Personalized**

- Learns from **your actual surf history**
- Adapts to **your unique preferences**
- Bonus points for **your favorite spots**
- Matches **your preferred conditions** (wave height, wind speed)

### ✅ **Adaptive**

- Changes weights based on **skill level**
  - Beginners prioritize safety (35%)
  - Advanced prioritize performance (40% wave quality)
- Adjusts ideal wave heights per skill

### ✅ **Accurate**

- ML model trained on **real historical data**
- 200 decision trees for robust predictions
- Physics-based feature engineering
- ±0.12m wave height accuracy

### ✅ **Real-time**

- Updates with **current weather conditions**
- Recalculates when conditions change
- Uses latest session insights

### ✅ **Transparent**

- Shows **breakdown** of each factor
- Explains **why** a spot scored high/low
- Lists specific recommendations
- Visual radar chart for quick understanding

### ✅ **Smart**

- Recommends **favorite spots** when conditions match
- Identifies patterns in your surf history
- Learns preferred conditions automatically
- No manual tuning required

---

## 7. Technical Highlights

### Why This Design is Excellent

#### 1. **Separation of Concerns**

```
ML Layer (Python) ←→ Scoring Engine (Node.js) ←→ Frontend (React Native)
     │                      │                           │
  Predictions         Calculations               Visualization
```

- Python for ML (scikit-learn, pandas)
- Node.js for business logic (Express)
- React Native for UI (cross-platform)
- Clean API boundaries

#### 2. **Feature Engineering**

- Encodes domain knowledge into ML
- 5 engineered features from 10 base features
- Captures wave physics (energy, wind effects)
- Critical for model accuracy

#### 3. **Ensemble Learning**

- Random Forest = 200 trees voting
- More robust than single model
- Handles noisy data gracefully
- Provides confidence intervals

#### 4. **Adaptive Scoring**

- Different weights per skill level
- Beginner: Safety 35% (most important)
- Advanced: Wave Quality 40% (most important)
- Matches real-world priorities

#### 5. **Session Learning**

- Analyzes 4-5⭐ sessions only (quality filter)
- Learns preferred wave height (±0.3m tolerance)
- Learns preferred wind speed (±5 km/h tolerance)
- Identifies favorite spots (visit count + rating)
- Updates every 5 sessions (not too frequent)

#### 6. **Caching Strategy**

```javascript
// Cache ML predictions for 15 minutes
const cachedData = getCachedData();
if (cachedData && cacheNotExpired) {
  // Recalculate scoring with new user preferences
  // But skip expensive ML prediction
}
```

- Reduces StormGlass API calls (rate limited)
- Faster response times
- Still personalizes with session bonuses

#### 7. **Graceful Degradation**

```javascript
// If MongoDB down
if (!req.isMongoConnected) {
  // Skip session insights
  // Still show generic suitability scores
  // App remains functional
}

// If ML service fails
if (!forecastData) {
  // Return default poor conditions
  // Show error message
  // Don't crash
}
```

#### 8. **Data Validation**

```javascript
// Sanitize ML predictions
const sanitizeNumber = (value) => {
  if (isNaN(value) || !isFinite(value)) {
    return 0; // Replace NaN/Infinity with 0
  }
  return value;
};
```

- Prevents NaN propagation
- Handles missing data
- Ensures valid JSON responses

#### 9. **Modular Architecture**

```
surfapp--ml-engine/
├─ config/           # Model paths, API keys, features
├─ models/           # Random Forest wrapper
├─ services/         # Prediction logic
├─ utils/            # Feature engineering, API client
└─ training/         # Model training scripts

surfapp--backend/
├─ controllers/      # EnhancedSuitabilityCalculator
├─ models/           # Session, User schemas
├─ routes/           # API endpoints
└─ config/           # Cache, database, spotMetadata

SurfApp--frontend/
├─ components/       # SpotCard, ScoreBreakdown, RadarChart
├─ context/          # UserContext (session management)
├─ data/             # surfApi.js (API calls)
└─ app/              # Screen components
```

#### 10. **Testing Strategy**

```
ML Model Testing:
├─ training/train_random_forest_model.py → Outputs R², MAE, RMSE
├─ testing/test_model1.py → Validates predictions
└─ testing/validate_features.py → Checks correlations

Backend Testing:
└─ Manual testing via API endpoints

Frontend Testing:
└─ Visual testing on iOS/Android devices
```

---

## 8. Future Enhancements

### Potential Improvements

#### 1. **Advanced ML Models**

- LSTM for 7-day forecasts (already implemented, not integrated)
- Neural networks for spot-specific predictions
- Transfer learning from global surf data

#### 2. **Collaborative Filtering**

- "Users similar to you also liked..."
- Community-based recommendations
- Spot popularity trends

#### 3. **Real-time Updates**

- WebSocket connections for live scores
- Push notifications when conditions improve
- "Your favorite spot is firing!"

#### 4. **Photo Recognition**

- ML model to verify wave conditions
- User-uploaded photos vs predictions
- Improve model with real observations

#### 5. **Weather Forecast Integration**

- 3-7 day predictions
- Best times to surf forecast
- Trip planning features

#### 6. **Social Learning**

- Learn from community session ratings
- "10 people rated this spot 5⭐ today"
- Collective intelligence

---

## 9. Glossary

### Surf Terms

- **Swell**: Ocean waves generated by distant storms
- **Period**: Time between waves (seconds)
- **Offshore Wind**: Wind blowing from land to sea (clean waves)
- **Onshore Wind**: Wind blowing from sea to land (messy waves)
- **Groundswell**: Long-period swell (12s+) from distant storms (best quality)
- **Wind Swell**: Short-period swell (<8s) from local wind (choppy)
- **Glassy**: Calm, smooth water surface (no wind)

### ML Terms

- **Random Forest**: Ensemble of decision trees
- **Feature Engineering**: Creating new features from raw data
- **R² Score**: Model accuracy (0-1, higher = better)
- **MAE**: Mean Absolute Error (lower = better)
- **Overfitting**: Model learns noise, not patterns

### System Terms

- **Suitability Score**: 0-100 rating of surf spot quality
- **Session Bonus**: Extra points from learned preferences
- **Skill-Adaptive**: Changes behavior based on user skill level
- **Breakdown**: Individual factor scores

---

## 10. API Reference

### Get Spots with Suitability Scores

**Endpoint:** `GET /api/spots`

**Query Parameters:**

```
userId          (optional)  User ID for personalization
skillLevel      (optional)  Beginner | Intermediate | Advanced
minWaveHeight   (optional)  Minimum wave height (meters)
maxWaveHeight   (optional)  Maximum wave height (meters)
preferredRegion (optional)  Preferred coastal region
boardType       (optional)  Soft-top | Longboard | Funboard | Shortboard
tidePreference  (optional)  Low | Mid | High | Any
```

**Response:**

```json
{
  "spots": [
    {
      "id": "1",
      "name": "Weligama",
      "region": "South Coast",
      "coords": [80.4264, 5.9721],
      "score": 95,
      "suitability": "Excellent",
      "breakdown": {
        "overall": 95,
        "wave": 90,
        "wind": 85,
        "safety": 95,
        "consistency": 85
      },
      "recommendations": [
        "⭐ One of your favorite spots!",
        "🌊 Waves match your preferred 1.0m conditions!",
        "Perfect for intermediate surfers"
      ],
      "forecast": {
        "waveHeight": 1.1,
        "wavePeriod": 10,
        "windSpeed": 14,
        "windDirection": 270,
        "tide": "Mid"
      },
      "canSurf": true
    }
  ]
}
```

---

## 11. Contributing

### Model Retraining

To retrain the Random Forest model:

```bash
cd surfapp--ml-engine
python training/train_random_forest_model.py
```

This will:

1. Load historical data from local JSON files
2. Calculate engineered features
3. Train Random Forest model
4. Output performance metrics
5. Save to `surf_forecast_model.joblib`

### Adding New Features

To add a new scoring factor:

1. Update `EnhancedSuitabilityCalculator.js`:
   - Add new factor calculation method
   - Update `getAdaptiveWeights()` to include new factor
   - Update weighted score calculation

2. Update frontend components:
   - Add to `SuitabilityRadarChart.js` factors array
   - Add to `ScoreBreakdown.js` rendering
   - Update angles for balanced chart

3. Test thoroughly with various conditions

---

## 12. Troubleshooting

### Common Issues

**Issue: Scores seem wrong**

- Check ML prediction output in logs
- Verify feature engineering calculations
- Ensure weights sum to 1.0

**Issue: Session bonuses not applying**

- Verify user has 5+ sessions
- Check sessions have ratings
- Confirm MongoDB connection

**Issue: ML predictions fail**

- Check Python dependencies installed
- Verify model file exists
- Check StormGlass API key valid

**Issue: Caching stale data**

- Clear cache: `clearSpotsCache()`
- Check cache expiry time (15 min default)
- Restart backend server

---

## 8. Model Files & Configuration

### Model Artifact Locations

All Random Forest model files are stored in `surfapp--ml-engine/models/`:

| File                         | Size    | Description                                |
| ---------------------------- | ------- | ------------------------------------------ |
| `surf_forecast_model.joblib` | ~2-5 MB | Trained Random Forest model with 200 trees |

### Model Structure

The saved model file contains a dictionary with these keys:

```python
{
    'model': RandomForestRegressor,  # The trained scikit-learn model
    'feature_names': [...],          # List of 15 feature names
    'target_names': [...],           # List of 3 target names
    'engineered_features': [...]     # List of 5 engineered features
}
```

### Loading the Model

```python
# From models/random_forest.py
import joblib

model_data = joblib.load('models/surf_forecast_model.joblib')
model = model_data['model']
feature_names = model_data['feature_names']
target_names = model_data['target_names']

# Make predictions
predictions = model.predict(features_dataframe)
# Returns: [[waveHeight, windSpeed, windDirection], ...]
```

### Configuration Files

**Feature Definitions**: `config/features.py`

```python
# Base features from StormGlass API
RANDOM_FOREST_BASE_FEATURES = [
    'swellHeight', 'swellPeriod', 'swellDirection',
    'windSpeed', 'windDirection', 'seaLevel', 'gust',
    'secondarySwellHeight', 'secondarySwellPeriod',
    'secondarySwellDirection'
]

# Engineered features (calculated)
RANDOM_FOREST_ENGINEERED_FEATURES = [
    'swellEnergy',            # height² × period
    'offshoreWind',           # windSpeed × cos(windDir - 270°)
    'totalSwellHeight',       # primary + secondary swell
    'windSwellInteraction',   # windSpeed × swellHeight
    'periodRatio'             # swellPeriod / (secondaryPeriod + 1)
]

# Prediction targets
RANDOM_FOREST_TARGETS = [
    'waveHeight',      # Predicted wave height (m)
    'windSpeed',       # Predicted wind speed (m/s)
    'windDirection'    # Predicted wind direction (°)
]
```

**Model Paths**: `config/model_paths.py`

```python
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RANDOM_FOREST_MODEL = os.path.join(BASE_DIR, 'models', 'surf_forecast_model.joblib')

def validate_model_exists(model_path, model_name):
    """Check if model file exists and warn if not found"""
    if not os.path.exists(model_path):
        print(f"⚠️ {model_name} not found at {model_path}")
        return False
    return True
```

---

## 9. Training & Retraining Guide

### When to Retrain

Retrain the Random Forest model when:

- ✅ New historical data is available (quarterly recommended)
- ✅ Model accuracy degrades below 85% R²
- ✅ Adding new surf spots to the system
- ✅ Updating to new scikit-learn version
- ✅ Expanding to new geographic regions

### Training Data Requirements

**Minimum Requirements:**

- At least 500 hourly observations
- Mix of different wave conditions (0.5m - 3.0m)
- Various wind conditions (0-40 km/h)
- All tide states represented
- Multiple seasons covered

**Data Sources:**

1. **StormGlass API** (primary):
   - Historical weather data
   - 10 base parameters
   - Hourly resolution
2. **Local JSON Files** (backup):
   - `data/weligama_historical_data_fixed.json`
   - `data/arugam_bay_historical_data_fixed.json`

### Training Process

#### Step 1: Prepare Environment

```bash
cd surfapp--ml-engine

# Ensure dependencies installed
pip install scikit-learn pandas numpy joblib requests python-dotenv

# Set API key
echo "STORMGLASS_API_KEY=your_key_here" > .env
```

#### Step 2: Run Training Script

```bash
python training/train_random_forest_model.py
```

This script performs:

1. **Data Loading**
   - Loads from local JSON files
   - Falls back to API if needed
   - Validates all required parameters present

2. **Data Preprocessing**

   ```python
   - Remove duplicates
   - Handle missing values (fill with median)
   - Remove outliers using IQR method
   - Validate data ranges
   ```

3. **Feature Engineering**

   ```python
   - Calculate swellEnergy
   - Calculate offshoreWind
   - Calculate totalSwellHeight
   - Calculate windSwellInteraction
   - Calculate periodRatio
   ```

4. **Model Training**

   ```python
   RandomForestRegressor(
       n_estimators=200,
       max_depth=15,
       min_samples_split=5,
       min_samples_leaf=2,
       max_features='sqrt',
       random_state=42
   )
   ```

5. **Evaluation**
   - Calculate R², MAE, RMSE per target
   - Display feature importance
   - Show top 10 influential features

6. **Save Model**
   - Save to `models/surf_forecast_model.joblib`
   - Save feature list to `data/model_features.txt`

#### Step 3: Verify Training Output

Look for these metrics in the console:

```
MODEL PERFORMANCE
======================================================================

waveHeight:
  R² Score:  0.8320
  MAE:       0.1221
  RMSE:      0.1591

windSpeed:
  R² Score:  0.9860
  MAE:       0.1970
  RMSE:      0.2725

windDirection:
  R² Score:  0.9978
  MAE:       2.9126
  RMSE:      4.2395

Overall R² Score: 0.9386

FEATURE IMPORTANCE (Top 10)
======================================================================
  windDirection                  | 0.5411 ████████████████████████████████████████████████████
  offshoreWind                   | 0.3298 █████████████████████████████████
  seaLevel                       | 0.0284 ██
  swellEnergy                    | 0.0178 █
  swellHeight                    | 0.0143 █
  gust                           | 0.0136 █
  windSwellInteraction           | 0.0124 █
  swellDirection                 | 0.0059
  swellPeriod                    | 0.0022
  secondarySwellPeriod           | 0.0020

✅ Model saved successfully to '.../models/surf_forecast_model.joblib'
```

**Good Performance Indicators:**

- R² Score > 0.83 for waveHeight, > 0.95 for wind targets
- MAE < 0.15m for wave height
- windDirection is #1 feature (54%+) — indicates good wind encoding
- offshoreWind is #2 feature (33%+) — confirms engineered features are working

---

## 10. Performance Monitoring

### Key Metrics to Track

#### Model Accuracy Metrics

```javascript
// Track prediction accuracy over time
const metrics = {
  // R² Score (0-1, higher is better)
  r2_waveHeight: 0.832,
  r2_windSpeed: 0.986,
  r2_windDirection: 0.9978,

  // Mean Absolute Error (lower is better)
  mae_waveHeight: 0.1221, // meters
  mae_windSpeed: 0.197, // m/s
  mae_windDirection: 2.9126, // degrees

  // Overall performance
  overall_r2: 0.9386,

  // Last trained
  lastTraining: "2026-01-04",
  trainingSamples: 2847,
};
```

#### Production Metrics

Monitor in your backend logs:

```javascript
// Prediction success rate
const predictionMetrics = {
  totalPredictions: 10000,
  successfulPredictions: 9875,
  failedPredictions: 125,
  successRate: 0.9875,

  // API health
  stormglassApiCalls: 1234,
  stormglassApiErrors: 23,
  apiSuccessRate: 0.9814,

  // Cache efficiency
  cacheHits: 8756,
  cacheMisses: 1244,
  cacheHitRate: 0.8756,

  // Model load time
  avgModelLoadTime: "1.2s",
  avgPredictionTime: "0.05s",
};
```

#### Session Learning Metrics

```javascript
// Track user learning effectiveness
const sessionMetrics = {
  // User base
  totalUsers: 1245,
  usersWithSessions: 876,
  usersWithLearning: 342, // 5+ sessions

  // Session quality
  avgSessionsPerUser: 8.3,
  avgSessionDuration: 67, // minutes
  avgSessionRating: 4.2,

  // Learning effectiveness
  avgBonusApplied: 18, // points
  favoriteSpotsIdentified: 342,
  wavePreferencesLearned: 298,
  windPreferencesLearned: 287,

  // Impact on scores
  avgScoreWithoutLearning: 78,
  avgScoreWithLearning: 88,
  avgScoreImprovement: 10, // points
};
```

### Logging Best Practices

#### ML Service Logs

```python
# In services/spot_predictor.py
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log model loading
logger.info(f"Loading Random Forest model from {MODEL_PATH}")
logger.info(f"✅ Model loaded: {model.n_estimators} trees")

# Log predictions
logger.info(f"Processing {len(spots)} surf spots...")
logger.info(f"Successfully generated data for {len(results)} spots")

# Log errors
logger.error(f"❌ Model prediction failed: {error}")
```

#### Backend Logs

```javascript
// In controllers/spotsController.js
console.log(`[${new Date().toISOString()}] - GET /api/spots?userId=${userId}`);
console.log("User preferences:", userPreferences);
console.log("Cache status:", cache.isStale ? "stale" : "fresh");
console.log(`✅ Received ${spots.length} spots from API`);
console.log(`Applied session bonuses to ${bonusCount} spots`);
```

### Health Check Endpoint

Add this to your backend:

```javascript
// routes/health.js
router.get("/health/ml", async (req, res) => {
  const health = {
    status: "unknown",
    timestamp: new Date().toISOString(),
    checks: {
      modelLoaded: false,
      apiConnectivity: false,
      mongodbConnection: false,
      cacheHealth: false,
    },
    metrics: {},
  };

  try {
    // Check if model file exists
    const modelPath = path.join(
      __dirname,
      "../../surfapp--ml-engine/models/surf_forecast_model.joblib",
    );
    health.checks.modelLoaded = fs.existsSync(modelPath);

    // Check StormGlass API
    const testResponse = await fetch(
      "https://api.stormglass.io/v2/weather/point?lat=5.972&lng=80.426",
      {
        headers: { Authorization: process.env.STORMGLASS_API_KEY },
      },
    );
    health.checks.apiConnectivity = testResponse.ok;

    // Check MongoDB
    health.checks.mongodbConnection = mongoose.connection.readyState === 1;

    // Check cache
    const cacheAge = getCacheAge();
    health.checks.cacheHealth = cacheAge < 900000; // < 15 min

    // Overall status
    const allHealthy = Object.values(health.checks).every((v) => v === true);
    health.status = allHealthy ? "healthy" : "degraded";

    res.json(health);
  } catch (error) {
    health.status = "unhealthy";
    health.error = error.message;
    res.status(500).json(health);
  }
});
```

### Alert Thresholds

Set up alerts for these conditions:

```javascript
const ALERT_THRESHOLDS = {
  // Model performance
  min_r2_score: 0.8, // Alert if R² drops below 80%
  max_mae_wave_height: 0.3, // Alert if MAE > 0.3m

  // Production health
  min_prediction_success: 0.95, // Alert if success rate < 95%
  max_model_load_time: 5000, // Alert if load time > 5s
  max_prediction_time: 500, // Alert if prediction > 0.5s

  // API health
  min_api_success_rate: 0.9, // Alert if API success < 90%
  max_api_error_rate: 0.1, // Alert if errors > 10%

  // Session learning
  min_users_with_learning: 100, // Alert if < 100 users have 5+ sessions
  min_avg_session_rating: 3.5, // Alert if avg rating < 3.5

  // Cache
  min_cache_hit_rate: 0.7, // Alert if hit rate < 70%
  max_cache_age: 1800000, // Alert if cache > 30 min old
};
```

---

## 13. License & Credits

**Developed by:** SurfCeylon Team  
**ML Model:** scikit-learn Random Forest  
**Weather Data:** StormGlass API  
**Location Data:** Sri Lankan surf spots database

---

_Last Updated: December 23, 2025_
