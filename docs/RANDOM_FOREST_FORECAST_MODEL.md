# Random Forest Forecast Model Documentation

## Table of Contents

1. [Overview](#overview)
2. [Model Architecture](#model-architecture)
3. [Training Process](#training-process)
4. [Prediction Pipeline](#prediction-pipeline)
5. [Data Flow](#data-flow)
6. [Model Files](#model-files)
7. [Performance Metrics](#performance-metrics)
8. [Usage Examples](#usage-examples)
9. [API Integration](#api-integration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The **Multi-Output Random Forest Regressor** is used to generate **real-time surf condition predictions** for any geographic location. Given a single set of current weather observations, it instantly predicts three key surf and weather parameters simultaneously.

### Key Features

- ✅ **Ensemble Learning**: 200 decision trees vote together for robust predictions
- ✅ **Multi-Output Predictions**: Simultaneously predicts 3 targets in one pass
- ✅ **Feature Engineering**: 5 domain-specific surf physics features boost accuracy
- ✅ **Instant Inference**: Single prediction in ~10ms (no GPU required)
- ✅ **Outlier Resistance**: Ensemble averaging reduces sensitivity to noisy inputs
- ✅ **Fallback Mechanism**: Mock data generation when live API is unavailable

### Predicted Targets (3 Parameters)

1. **Wave Height (m)** — Average wave height at the surf spot
2. **Wind Speed (m/s)** — Surface wind speed (converted to km/h in API output)
3. **Wind Direction (°)** — Wind direction in degrees (0–360, meteorological convention)

---

## Model Architecture

### How Random Forest Works

A Random Forest is an **ensemble of decision trees**. Each tree independently splits the input data along feature thresholds and produces a prediction. The final output is the **average** of all tree predictions (regression mode).

```
Input Features (15 values)
          ↓
┌─────────────────────────────────────────────────────────────┐
│                  RANDOM FOREST ENSEMBLE                      │
├─────────────────────────────────────────────────────────────┤
│  Tree 1  │  Tree 2  │  Tree 3  │  ...  │  Tree 200         │
│  ↓        │  ↓        │  ↓        │       │  ↓               │
│  pred₁    │  pred₂    │  pred₃    │  ...  │  pred₂₀₀         │
└─────────────────────────────────────────────────────────────┘
          ↓
  Average(pred₁ ... pred₂₀₀)
          ↓
  [waveHeight, windSpeed, windDirection]
```

### Decision Tree Splitting

Each split tests one feature against a threshold:

```
         windDirection < 180°?
              ↙         ↘
         Yes             No
    offshoreWind > 3?   seaLevel > 0.8?
       ↙     ↘             ↙     ↘
   wave=1.2  wave=0.8  wave=1.5  wave=2.0
```

### Feature Randomness (Bagging)

Each tree is trained on a **random bootstrap sample** of the data and uses only a **random subset of features** at each split. This creates diversity between trees and prevents overfitting.

```
Training Data (104,173 samples)
          ↓
┌─── Bootstrap Sampling ───────────────────────────────────────┐
│  Tree 1: 104,173 rows randomly drawn WITH replacement        │
│  Tree 2: 104,173 rows randomly drawn WITH replacement        │
│  ...      (each tree sees a different subset of data)        │
└──────────────────────────────────────────────────────────────┘
```

At each split: randomly choose `√15 ≈ 4` features to consider (not all 15).

### Input Features (15 Total)

#### Base Features (10) — from StormGlass Weather API

| #   | Feature                   | Unit | Description                                  |
| --- | ------------------------- | ---- | -------------------------------------------- |
| 1   | `swellHeight`             | m    | Primary swell height                         |
| 2   | `swellPeriod`             | s    | Primary swell period (time between crests)   |
| 3   | `swellDirection`          | °    | Primary swell direction (degrees from north) |
| 4   | `windSpeed`               | m/s  | Surface wind speed                           |
| 5   | `windDirection`           | °    | Wind direction (degrees from north)          |
| 6   | `seaLevel`                | m    | Sea level / tidal component                  |
| 7   | `gust`                    | m/s  | Wind gust speed                              |
| 8   | `secondarySwellHeight`    | m    | Secondary swell height                       |
| 9   | `secondarySwellPeriod`    | s    | Secondary swell period                       |
| 10  | `secondarySwellDirection` | °    | Secondary swell direction                    |

#### Engineered Features (5) — computed at inference time

| Feature                | Formula                                    | Purpose                                |
| ---------------------- | ------------------------------------------ | -------------------------------------- |
| `swellEnergy`          | `swellHeight² × swellPeriod`               | Total wave energy (power indicator)    |
| `offshoreWind`         | `windSpeed × cos(windDirection − 270°)`    | Offshore wind component (surf quality) |
| `totalSwellHeight`     | `swellHeight + secondarySwellHeight`       | Combined swell from all directions     |
| `windSwellInteraction` | `windSpeed × swellHeight`                  | Wind influence on wave building        |
| `periodRatio`          | `swellPeriod / (secondarySwellPeriod + 1)` | Swell dominance / wave quality proxy   |

### Model Specifications

| Parameter           | Value                    | Purpose                               |
| ------------------- | ------------------------ | ------------------------------------- |
| `n_estimators`      | 200                      | 200 independent decision trees        |
| `max_depth`         | 15                       | Maximum tree depth (prevents overfit) |
| `min_samples_split` | 5                        | Minimum samples to create a split     |
| `min_samples_leaf`  | 2                        | Minimum samples at a leaf node        |
| `max_features`      | `'sqrt'` (√15 ≈ 4)       | Features considered per split         |
| `random_state`      | 42                       | Reproducible results                  |
| `n_jobs`            | -1                       | Use all available CPU cores           |
| **Output**          | Multi-output (3 targets) | Single model, 3 predictions           |

---

## Training Process

### Data Preparation

#### 1. Input Data Format

Training data comes from 8 StormGlass historical JSON files (one per surf spot):

```python
# Each file contains an 'hours' array. Each hour has source-averaged values.
{
  "hours": [
    {
      "time": "2024-01-01T00:00:00+00:00",
      "waveHeight": {"noaa": 1.22, "sg": 1.19, "meteo": 1.20},
      "windSpeed":  {"noaa": 5.1,  "sg": 5.3},
      ...
    }
  ]
}

# Multiple sources per parameter → averaged to a single value:
value = mean([v for v in source_dict.values() if isinstance(v, (int, float))])
```

#### 2. Data Preprocessing

```python
# Step 1: Remove duplicates
df = df.drop_duplicates()
# → 52,750 duplicate records removed

# Step 2: Fill missing values with median
df[col].fillna(df[col].median(), inplace=True)

# Step 3: Remove outliers using IQR method per feature
Q1, Q3 = df[col].quantile([0.25, 0.75])
IQR = Q3 - Q1
df = df[(df[col] >= Q1 - 1.5*IQR) & (df[col] <= Q3 + 1.5*IQR)]
# → ~56,361 outlier records removed across all columns
```

#### 3. Feature Engineering

```python
# Applied to both training data AND at inference time (critical to match)
df['swellEnergy']          = df['swellHeight']**2 * df['swellPeriod']
df['offshoreWind']         = df['windSpeed'] * np.cos(np.radians(df['windDirection'] - 270))
df['totalSwellHeight']     = df['swellHeight'] + df['secondarySwellHeight']
df['windSwellInteraction'] = df['windSpeed'] * df['swellHeight']
df['periodRatio']          = df['swellPeriod'] / (df['secondarySwellPeriod'] + 1)
```

### Training Configuration

```python
# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Model
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
```

### Training Pipeline

```
1. Discover Data Files
   └─→ Scan data/ for *_historical_data_fixed.json
   └─→ Load and average multi-source values
   └─→ Collect 239,328 raw hourly records

2. Preprocess
   └─→ Deduplicate   → -52,750 records
   └─→ Fill missing  → median imputation
   └─→ IQR outlier removal → -56,361 records
   └─→ Final clean dataset: 130,217 records

3. Feature Engineering
   └─→ Compute 5 engineered features
   └─→ Combine with 10 base features = 15 total

4. Train / Test Split
   └─→ 80% training: 104,173 samples
   └─→ 20% test:      26,044 samples
   └─→ random_state=42 (reproducible)

5. Train Model
   └─→ RandomForestRegressor.fit(X_train, y_train)
   └─→ 200 trees trained in parallel

6. Evaluate
   └─→ R², MAE, RMSE, MAPE per target
   └─→ Feature importance ranking

7. Save Artifacts
   └─→ models/surf_forecast_model.joblib
```

### Training Script

**Location**: `surfapp--ml-engine/training/train_random_forest_model.py`

```bash
# Run training (no GPU needed, ~30 seconds)
cd surfapp--ml-engine
python training/train_random_forest_model.py

# Output: models/surf_forecast_model.joblib
# No prerequisites — reads directly from data/*.json
```

---

## Prediction Pipeline

### How Predictions Work

#### Step 1: Load Model

```python
# Singleton pattern — loads once and caches in memory
from models import load_random_forest_model

SURF_PREDICTOR = load_random_forest_model()
# Loads: models/surf_forecast_model.joblib
# Returns: dict with keys: model, feature_names, target_names, engineered_features
```

#### Step 2: Fetch Live Weather Data

```python
# Option A: Real data from StormGlass API (current conditions for a location)
features, is_valid = fetch_weather_data_with_rotation(
    lat, lng,
    hours_ahead=48,
    feature_names=RANDOM_FOREST_BASE_FEATURES   # the 10 base features
)

# Option B: Mock data if API is unavailable
forecast = generate_mock_spot_forecast(spot)
```

#### Step 3: Apply Feature Engineering

```python
# CRITICAL: Must apply the same 5 transformations as during training
input_df = pd.DataFrame([features])           # shape: (1, 10)
input_df = calculate_engineered_features(input_df)  # shape: (1, 15)
```

#### Step 4: Model Prediction

```python
# Single-row prediction → instant (~10ms)
predictions_array = predict_with_random_forest(input_df, model=SURF_PREDICTOR)
predictions = dict(zip(RANDOM_FOREST_TARGETS, predictions_array[0]))
# → {'waveHeight': 1.4, 'windSpeed': 5.2, 'windDirection': 267.3}
```

#### Step 5: Format Output

```python
# Extract tide status from sea level
sea_level = float(features.get('seaLevel', 0.5))
tide_status = 'High' if sea_level > 0.8 else ('Low' if sea_level < 0.3 else 'Mid')

result = {
    'waveHeight':    round(predictions['waveHeight'], 1),         # metres
    'wavePeriod':    round(features.get('swellPeriod', 10.0), 1), # from API (not predicted)
    'windSpeed':     round(predictions['windSpeed'] * 3.6, 1),    # m/s → km/h
    'windDirection': round(predictions['windDirection'], 1),       # degrees
    'tide':          {'status': tide_status}
}
```

### Fallback Mechanisms

```
1. Try Live API + RF Prediction
   └─→ SURF_PREDICTOR loaded AND is_valid AND features exist
   └─→ Success? → Return ML prediction
   └─→ Fail?    → Go to step 2

2. Use Mock Data
   └─→ generate_mock_spot_forecast(spot)
   └─→ Generates realistic synthetic conditions
   └─→ Always succeeds (last resort)
```

---

## Data Flow

### End-to-End Flow Diagram

```
┌────────────────────┐
│  React Native App  │
│  (Frontend)        │
└─────────┬──────────┘
          │ HTTP Request: GET /api/spots/recommendations
          ↓
┌────────────────────────────────────┐
│  Node.js Backend                   │
│  (routes/arRecommendations.js)     │
└─────────┬──────────────────────────┘
          │ Spawn Python process
          ↓
┌──────────────────────────────────────┐
│  spot_recommender_service.py         │
│  (CLI entry point)                   │
└─────────┬────────────────────────────┘
          │ Calls main() → get_spots_with_predictions()
          ↓
┌──────────────────────────────────────┐
│  services/spot_predictor.py          │
└─────────┬────────────────────────────┘
          │
          ├─→ Load RF model         (models/random_forest.py)
          ├─→ Load surf spots list  (SurfApp--frontend/data/surf_spots.json)
          ├─→ For each spot:
          │     ├─→ Fetch live weather  (utils/api_client.py)
          │     ├─→ Engineer features   (utils/feature_engineering.py)
          │     └─→ Predict conditions  (models/random_forest.py)
          └─→ Return JSON array
          ↓
┌──────────────────────────────────────┐
│  JSON Output                         │
│  [                                   │
│    {                                 │
│      "id": "1",                      │
│      "name": "Weligama",             │
│      "forecast": {                   │
│        "waveHeight": 1.4,            │
│        "wavePeriod": 10.5,           │
│        "windSpeed": 18.7,            │
│        "windDirection": 267.3,       │
│        "tide": {"status": "Mid"}     │
│      }                               │
│    },                                │
│    ...                               │
│  ]                                   │
└──────────────────────────────────────┘
          ↓
    HTTP Response to Frontend
```

---

## Model Files

### Artifact Locations

All model artifacts are stored in `surfapp--ml-engine/models/`:

| File                         | Description                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `surf_forecast_model.joblib` | Trained model dict: `model`, `feature_names`, `target_names`, `engineered_features` |

### Loading the Model

```python
# From the ml-engine root
import joblib

model_data = joblib.load('models/surf_forecast_model.joblib')
model         = model_data['model']          # RandomForestRegressor instance
feature_names = model_data['feature_names']  # list of 15 feature names
target_names  = model_data['target_names']   # ['waveHeight', 'windSpeed', 'windDirection']

# Direct prediction
import pandas as pd
X = pd.DataFrame([your_feature_dict])[feature_names]
y_pred = model.predict(X)   # shape: (1, 3)
```

### Model Wrapper (Production)

The production code uses a wrapper in `models/random_forest.py`:

```python
from models import load_random_forest_model, predict_with_random_forest

predictor = load_random_forest_model()
# predictor is None if file not found → fallback to mock

predictions = predict_with_random_forest(input_df, model=predictor)
```

### Configuration File

Feature and target names are defined in `config/features.py`:

```python
RANDOM_FOREST_BASE_FEATURES = [
    'swellHeight', 'swellPeriod', 'swellDirection',
    'windSpeed', 'windDirection', 'seaLevel', 'gust',
    'secondarySwellHeight', 'secondarySwellPeriod', 'secondarySwellDirection'
]
RANDOM_FOREST_TARGETS = ['waveHeight', 'windSpeed', 'windDirection']
```

---

## Performance Metrics

### Test Set Evaluation (20% holdout, random_state=42)

**Dataset**: 130,217 clean records from 8 Sri Lankan surf spots  
**Test set**: 26,044 samples (20%)

| Target         | R²         | MAE        | RMSE       | MAPE  | Status                       |
| -------------- | ---------- | ---------- | ---------- | ----- | ---------------------------- |
| Wave Height    | 0.8320     | 0.1221 m   | 0.1591 m   | 8.9%  | ✅ Exceeds benchmark         |
| Wind Speed     | 0.9860     | 0.1970 m/s | 0.2725 m/s | 7.0%  | ✅ Exceeds benchmark         |
| Wind Direction | 0.9978     | 2.9126 °   | 4.2395 °   | 22.8% | ✅ Exceeds benchmark         |
| **Overall R²** | **0.9386** | —          | —          | —     | **93.9% variance explained** |

### Benchmark Comparison

| Target         | Industry Benchmark | Our MAE    | Improvement     |
| -------------- | ------------------ | ---------- | --------------- |
| Wave Height    | < 0.20 m           | 0.1221 m   | ✅ 39% better   |
| Wind Speed     | < 1.50 m/s         | 0.1970 m/s | ✅✅ 87% better |
| Wind Direction | < 15.0 °           | 2.9126 °   | ✅✅ 81% better |

### Industry Standards Comparison

| Application            | Typical R² | Our Model   |
| ---------------------- | ---------- | ----------- |
| Weather Forecasting    | 0.70–0.85  | 0.9386 ✅✅ |
| Wave Height Prediction | 0.65–0.80  | 0.8320 ✅✅ |
| Wind Speed Prediction  | 0.80–0.90  | 0.9860 ✅✅ |
| Wind Direction Pred.   | 0.90–0.99  | 0.9978 ✅✅ |

### Feature Importance

| Rank | Feature                | Importance | Type       | Bar                                  |
| ---- | ---------------------- | ---------- | ---------- | ------------------------------------ |
| 1    | `windDirection`        | 54.11%     | Original   | ████████████████████████████████████ |
| 2    | `offshoreWind`         | 32.98%     | Engineered | ██████████████████████               |
| 3    | `seaLevel`             | 2.84%      | Original   | ██                                   |
| 4    | `swellEnergy`          | 1.78%      | Engineered | █                                    |
| 5    | `swellHeight`          | 1.43%      | Original   | █                                    |
| 6    | `gust`                 | 1.36%      | Original   | █                                    |
| 7    | `windSwellInteraction` | 1.24%      | Engineered | █                                    |
| 8    | `totalSwellHeight`     | 1.09%      | Engineered |                                      |
| 9    | `windSpeed`            | 0.88%      | Original   |                                      |
| 10   | `swellDirection`       | 0.86%      | Original   |                                      |

**Wind features combined**: windDirection (54.11%) + offshoreWind (32.98%) = **87.09%** of total importance.

### Evaluation Metrics Explained

```
R² (R-squared)
  Formula : 1 - SS_residual / SS_total
  Range   : 0 to 1 (1.0 = perfect, 0 = no better than predicting the mean)
  Example : R²=0.83 → model explains 83% of wave height variance

MAE (Mean Absolute Error)
  Formula : mean( |y_true - y_pred| )
  Meaning : Average prediction error in the target's own units
  Example : MAE=0.12m → predictions off by ±12 cm on average

RMSE (Root Mean Squared Error)
  Formula : sqrt( mean( (y_true - y_pred)² ) )
  Meaning : MAE but large errors are penalised more (always ≥ MAE)

MAPE (Mean Absolute Percentage Error)
  Formula : mean( |y_true - y_pred| / |y_true| ) × 100%
  Meaning : Scale-independent error as % of actual value
  Note    : High MAPE for windDirection due to near-zero degree values
```

### Visualisation

Running `testing/evaluate_random_forest.py` prints:

1. **Per-target metrics table** — R², MAE, RMSE, MAPE with benchmark status
2. **Feature importance bar chart** — ASCII bars, top 10 features
3. **Metric guide** — plain-English explanation of each metric

---

## Usage Examples

### 1. Command Line (Spot Recommendations)

```bash
# Predict conditions for all surf spots
cd surfapp--ml-engine
python spot_recommender_service.py

# Output: JSON array — all spots with forecast predictions
[
  {
    "id": "1",
    "name": "Weligama",
    "region": "South Coast",
    "coords": [80.4264, 5.9721],
    "forecast": {
      "waveHeight": 1.4,
      "wavePeriod": 10.5,
      "windSpeed": 18.7,
      "windDirection": 267.3,
      "tide": {"status": "Mid"}
    }
  },
  ...
]
```

### 2. Single Spot Prediction (Python)

```python
import joblib
import pandas as pd
import numpy as np
import os

# Load model
model_data = joblib.load('models/surf_forecast_model.joblib')
model = model_data['model']

# Provide the 10 base weather features
features = {
    'swellHeight': 1.5,
    'swellPeriod': 12.0,
    'swellDirection': 220.0,
    'windSpeed': 5.0,
    'windDirection': 270.0,
    'seaLevel': 0.5,
    'gust': 7.2,
    'secondarySwellHeight': 0.4,
    'secondarySwellPeriod': 8.0,
    'secondarySwellDirection': 180.0,
}

# Apply the same 5 feature engineering steps as training
df = pd.DataFrame([features])
df['swellEnergy']          = df['swellHeight']**2 * df['swellPeriod']
df['offshoreWind']         = df['windSpeed'] * np.cos(np.radians(df['windDirection'] - 270))
df['totalSwellHeight']     = df['swellHeight'] + df['secondarySwellHeight']
df['windSwellInteraction'] = df['windSpeed'] * df['swellHeight']
df['periodRatio']          = df['swellPeriod'] / (df['secondarySwellPeriod'] + 1)

# Predict
y_pred = model.predict(df[model_data['feature_names']])
result = dict(zip(model_data['target_names'], y_pred[0]))

print(f"Wave Height:    {result['waveHeight']:.2f} m")
print(f"Wind Speed:     {result['windSpeed']:.2f} m/s  ({result['windSpeed']*3.6:.1f} km/h)")
print(f"Wind Direction: {result['windDirection']:.1f}°")
```

### 3. Evaluate Model Accuracy (No Retraining)

```bash
# Run the standalone accuracy evaluation script
cd surfapp--ml-engine
.\venv\Scripts\activate           # activate venv (Windows)
python testing/evaluate_random_forest.py

# Runtime: ~30 seconds
# Output: R², MAE, RMSE, MAPE per target + feature importance
```

### 4. Retrain the Model

```bash
# Full retraining from scratch (~30 seconds)
cd surfapp--ml-engine
python training/train_random_forest_model.py

# Overwrites: models/surf_forecast_model.joblib
# Reads from:  data/*_historical_data_fixed.json (8 files)
```

### 5. Node.js Backend Integration

```javascript
// routes/arRecommendations.js (simplified)
const { spawn } = require("child_process");
const path = require("path");

const getSpotRecommendations = async (req, res) => {
  const scriptPath = path.join(
    __dirname,
    "../../surfapp--ml-engine/spot_recommender_service.py",
  );
  const python = spawn("python", [scriptPath]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });
  python.stderr.on("data", (data) => {
    /* logs */
  });

  python.on("close", (code) => {
    if (code === 0) {
      const spots = JSON.parse(output);
      res.json({ spots });
    } else {
      res.status(500).json({ error: "Prediction failed" });
    }
  });
};
```

---

## API Integration

### StormGlass API

The model uses the **StormGlass Weather API** to fetch the 10 live weather features:

```python
# 100-key rotation for rate limit management
params = [
    'swellHeight', 'swellPeriod', 'swellDirection',
    'windSpeed', 'windDirection', 'seaLevel', 'gust',
    'secondarySwellHeight', 'secondarySwellPeriod', 'secondarySwellDirection'
]

response = requests.get(
    'https://api.stormglass.io/v2/weather/point',
    params={
        'lat': lat,
        'lng': lng,
        'params': ','.join(params),
        'start': now.isoformat(),
        'end': (now + timedelta(hours=1)).isoformat()
    },
    headers={'Authorization': API_KEY}
)

# Average across multiple model sources (noaa, sg, meteo, ...)
for param in params:
    feature_value = mean(response[param].values())
```

### Rate Limit Handling

```python
# Automatic key rotation on HTTP 429 (Too Many Requests)
# Total: 100 API keys
# Each key: 10 requests/day (free tier)
# Rotation: round-robin per request
```

### Mock Data Fallback

When the API is unavailable (development/testing or quota exceeded), the system uses `generate_mock_spot_forecast(spot)` which produces realistic sea state values based on the spot's region.

---

## Troubleshooting

### Model File Not Found

```
Error: Model not found at models/surf_forecast_model.joblib
```

**Fix**: Retrain the model:

```bash
cd surfapp--ml-engine
python training/train_random_forest_model.py
```

---

### Feature Mismatch at Inference

```
ValueError: X has 10 features, but RandomForestRegressor is expecting 15 features
```

**Cause**: Missing feature engineering step at inference time.

**Fix**: Always apply all 5 engineered features before calling `model.predict()`:

```python
df['swellEnergy']          = df['swellHeight']**2 * df['swellPeriod']
df['offshoreWind']         = df['windSpeed'] * np.cos(np.radians(df['windDirection'] - 270))
df['totalSwellHeight']     = df['swellHeight'] + df['secondarySwellHeight']
df['windSwellInteraction'] = df['windSpeed'] * df['swellHeight']
df['periodRatio']          = df['swellPeriod'] / (df['secondarySwellPeriod'] + 1)
```

---

### NaN / Inf in Predictions

**Cause**: Input features contain NaN or Inf values (e.g., `periodRatio` when `secondarySwellPeriod` is 0).

**Fix**: The `+1` guard in `periodRatio` prevents division by zero. For other features, sanitise inputs:

```python
import numpy as np
df.replace([np.inf, -np.inf], np.nan, inplace=True)
df.fillna(df.median(), inplace=True)
```

---

### Slow Predictions

**Cause**: Model loaded fresh on every request (loading takes ~200ms).

**Fix**: Load once using the singleton pattern in `models/random_forest.py`:

```python
_CACHED_MODEL = None

def load_random_forest_model():
    global _CACHED_MODEL
    if _CACHED_MODEL is None:
        _CACHED_MODEL = joblib.load(MODEL_PATH)
    return _CACHED_MODEL
```

---

### All Spots Return Mock Data

**Cause**: `USE_MOCK_DATA = True` in `config/__init__.py` (default for development).

**Fix**: Set `USE_MOCK_DATA = False` to enable live API calls.  
Note: Ensure valid StormGlass API keys are configured before switching.

---

### Stale Accuracy Numbers

If you retrain the model on new data and the performance numbers change, rerun the evaluation script to get updated metrics:

```bash
cd surfapp--ml-engine
python testing/evaluate_random_forest.py
```
