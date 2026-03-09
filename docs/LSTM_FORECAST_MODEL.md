# LSTM Forecast Model Documentation

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

The **Multi-Output LSTM (Long Short-Term Memory)** model is designed to generate **7-day surf forecasts** with hourly granularity (168 hours total) for any geographic location. It predicts 6 key surf and weather parameters simultaneously.

### Key Features

- ✅ **Sequence-to-Sequence Architecture**: Takes 168 hours of historical data, outputs 168 hours of future predictions
- ✅ **Multi-Output Predictions**: Simultaneously predicts 6 features per timestep
- ✅ **Time Series Forecasting**: Captures temporal patterns and dependencies
- ✅ **Gradient Clipping**: Prevents training instabilities
- ✅ **Data Validation**: Handles NaN/Inf values and outliers
- ✅ **Fallback Mechanisms**: Gracefully degrades to extrapolation when model unavailable

### Predicted Features (6 Parameters)

1. **Wave Height (m)** - Average wave height
2. **Swell Height (m)** - Height of ocean swell
3. **Swell Period (s)** - Period of ocean swell
4. **Wind Speed (m/s)** - Surface wind speed
5. **Wind Direction (°)** - Wind direction in degrees
6. **Sea Level (m)** - Sea level / tidal component

---

## Model Architecture

### Network Design

The model uses a **Sequence-to-Sequence (Seq2Seq)** architecture with an **Encoder-Decoder** pattern.

```
Input: (batch_size, 168 timesteps, 6 features)
                    ↓
┌─────────────────────────────────────────┐
│           ENCODER LAYERS                │
├─────────────────────────────────────────┤
│  LSTM(64 units, return_sequences=True)  │  ← Process input sequence
│  Dropout(0.3)                           │
│  LSTM(32 units, return_sequences=False) │  ← Compress to context vector
│  Dropout(0.3)                           │
└─────────────────────────────────────────┘
                    ↓
         RepeatVector(168)  ← Repeat context for each output timestep
                    ↓
┌─────────────────────────────────────────┐
│           DECODER LAYERS                │
├─────────────────────────────────────────┤
│  LSTM(32 units, return_sequences=True)  │  ← Generate output sequence
│  Dropout(0.3)                           │
│  LSTM(16 units, return_sequences=True)  │
│  Dropout(0.3)                           │
│  TimeDistributed(Dense(6))              │  ← Predict all 6 features
└─────────────────────────────────────────┘
                    ↓
Output: (batch_size, 168 timesteps, 6 features)
```

### Layer Details

| Layer                 | Type                  | Units | Purpose                            |
| --------------------- | --------------------- | ----- | ---------------------------------- |
| **Encoder LSTM 1**    | LSTM                  | 64    | Process input sequence patterns    |
| **Encoder Dropout 1** | Dropout               | 30%   | Prevent overfitting                |
| **Encoder LSTM 2**    | LSTM                  | 32    | Compress to context vector         |
| **Encoder Dropout 2** | Dropout               | 30%   | Regularization                     |
| **Repeat Vector**     | RepeatVector          | 168   | Broadcast context to all timesteps |
| **Decoder LSTM 1**    | LSTM                  | 32    | Generate output sequence           |
| **Decoder Dropout 1** | Dropout               | 30%   | Regularization                     |
| **Decoder LSTM 2**    | LSTM                  | 16    | Refine predictions                 |
| **Decoder Dropout 2** | Dropout               | 30%   | Prevent overfitting                |
| **Output Layer**      | TimeDistributed Dense | 6     | Multi-output predictions           |

### Model Specifications

- **Total Parameters**: 42,150 trainable parameters
- **Activation Function**: `tanh` (LSTM default)
- **Optimizer**: Adam with learning rate 0.001
- **Loss Function**: Mean Squared Error (MSE)
- **Metrics**: Mean Absolute Error (MAE)
- **Gradient Clipping**: Norm clipping at 1.0

---

## Training Process

### Data Preparation

#### 1. Input Data Format

```python
# X: Historical observations (input)
Shape: (n_samples, 168 hours, 6 features)

# y: Future observations (target)
Shape: (n_samples, 168 hours, 6 features)
```

#### 2. Data Cleaning & Validation

```python
# Steps performed:
1. Check for NaN and Inf values
2. Replace bad values with feature-wise median
3. Validate data ranges and statistics
4. Ensure no remaining NaN/Inf after cleaning
```

#### 3. Feature Scaling

```python
# StandardScaler for normalization
X_scaled = (X - μ) / σ
y_scaled = (y - μ) / σ

# Separate scalers for inputs and outputs
- scaler_X: Fitted on input features
- scaler_y: Fitted on target features
```

### Training Configuration

```python
# Training Parameters
BATCH_SIZE = 32
EPOCHS = 100 (with early stopping)
VALIDATION_SPLIT = 0.2 (80/20 train/test)
RANDOM_STATE = 42

# Callbacks
1. EarlyStopping(patience=10, monitor='val_loss')
2. ReduceLROnPlateau(factor=0.5, patience=5)
3. ModelCheckpoint(save_best_only=True)
4. TerminateOnNaN() - Critical for stability
```

### Training Pipeline

```
1. Load Data
   └─→ Load timeseries_X_multioutput.npy
   └─→ Load timeseries_y_multioutput.npy

2. Validate & Clean
   └─→ Check NaN/Inf values
   └─→ Replace with feature medians
   └─→ Validate ranges

3. Scale Data
   └─→ Fit StandardScaler on X and y
   └─→ Transform to normalized values

4. Train/Test Split
   └─→ 80% training, 20% testing
   └─→ Stratified by time

5. Build Model
   └─→ Initialize Seq2Seq architecture
   └─→ Compile with Adam optimizer

6. Train Model
   └─→ Fit for up to 100 epochs
   └─→ Apply callbacks (early stopping, LR reduction)
   └─→ Save best model

7. Evaluate
   └─→ Calculate MSE, MAE, MAPE
   └─→ Generate prediction plots

8. Save Artifacts
   └─→ model.keras
   └─→ scalers (X and y)
   └─→ feature names
```

### Training Script

**Location**: `surfapp--ml-engine/training/train_wave_forecast_lstm.py`

```bash
# Run training
cd surfapp--ml-engine/training
python train_wave_forecast_lstm.py

# Prerequisites:
# - artifacts/timeseries_X_multioutput.npy must exist
# - artifacts/timeseries_y_multioutput.npy must exist
```

---

## Prediction Pipeline

### How Predictions Work

#### Step 1: Load Model & Scalers

```python
# Singleton pattern - loads once and caches
model, scaler_x, scaler_y, feature_names = load_lstm_model()

# Files loaded:
- models/wave_forecast_multioutput_lstm.keras
- models/wave_forecast_scaler_X_multioutput.joblib
- models/wave_forecast_scaler_y_multioutput.joblib
- models/wave_forecast_feature_names.joblib
```

#### Step 2: Fetch Historical Data

```python
# Option A: Real data from StormGlass API
recent_data = fetch_historical_data_with_rotation(
    lat, lng, hours=168
)

# Option B: Mock data if API fails
recent_data = generate_mock_timeseries_data(
    lat, lng, hours=168
)

# Shape: (168, 6)
```

#### Step 3: Prepare Input

```python
# Ensure exactly 168 timesteps
if len(recent_data) < 168:
    # Pad with last observation
    recent_data = pad_to_168(recent_data)

# Scale input using scaler_x
X_scaled = scaler_x.transform(recent_data)

# Reshape for model: (1, 168, 6)
X_input = X_scaled.reshape(1, 168, 6)
```

#### Step 4: Model Prediction

```python
# Forward pass through LSTM
y_pred_scaled = model.predict(X_input, verbose=0)

# Shape: (1, 168, 6)
```

#### Step 5: Inverse Transform

```python
# Convert scaled predictions back to real values
y_pred_flat = y_pred_scaled.reshape(-1, 6)
y_pred = scaler_y.inverse_transform(y_pred_flat)

# Reshape: (168, 6)
```

#### Step 6: Format Output

```python
# Hourly forecast (168 hours)
hourly_forecast = [
    {
        'hour': i,
        'day': i // 24,
        'hourOfDay': i % 24,
        'waveHeight': y_pred[i][0],
        'wavePeriod': y_pred[i][1],
        'swellHeight': y_pred[i][2],
        'swellPeriod': y_pred[i][3],
        'windSpeed': y_pred[i][4],
        'windDirection': y_pred[i][5]
    }
    for i in range(168)
]

# Daily forecast (7 days)
daily_forecast = aggregate_hourly_to_daily(hourly_forecast)
```

### Fallback Mechanisms

The system has multiple fallback layers:

```
1. Try LSTM Prediction
   └─→ Success? → Return LSTM results
   └─→ Fail? → Go to step 2

2. Try Trend Extrapolation
   └─→ Linear extrapolation from historical data
   └─→ Success? → Return extrapolated results
   └─→ Fail? → Go to step 3

3. Use Mock Data
   └─→ Generate synthetic forecast
   └─→ Always succeeds (last resort)
```

---

## Data Flow

### End-to-End Flow Diagram

```
┌────────────────────┐
│  Node.js Backend   │
│  (server.js)       │
└─────────┬──────────┘
          │ HTTP Request: GET /api/forecast?lat=X&lng=Y
          ↓
┌────────────────────────────────────┐
│  Forecast Controller               │
│  (controllers/forecastController.js)│
└─────────┬──────────────────────────┘
          │ Spawn Python process
          ↓
┌──────────────────────────────────────┐
│  forecast_7day_service.py            │
│  (CLI entry point)                   │
└─────────┬────────────────────────────┘
          │ Calls predict_7day_forecast()
          ↓
┌──────────────────────────────────────┐
│  services/forecast_predictor.py      │
└─────────┬────────────────────────────┘
          │
          ├─→ Load LSTM model (models/lstm.py)
          ├─→ Fetch historical data (utils/api_client.py)
          ├─→ Predict with LSTM
          ├─→ Aggregate to daily
          └─→ Return JSON
          ↓
┌──────────────────────────────────────┐
│  JSON Output                         │
│  {                                   │
│    "daily": {...},                   │
│    "hourly": [...],                  │
│    "metadata": {...}                 │
│  }                                   │
└──────────────────────────────────────┘
          ↓
    HTTP Response to Frontend
```

---

## Model Files

### Artifact Locations

All model artifacts are stored in `surfapp--ml-engine/models/`:

| File                                        | Size     | Description                                  |
| ------------------------------------------- | -------- | -------------------------------------------- |
| `wave_forecast_multioutput_lstm.keras`      | ~5-10 MB | Trained LSTM model (TensorFlow/Keras format) |
| `wave_forecast_scaler_X_multioutput.joblib` | ~5 KB    | StandardScaler for input features            |
| `wave_forecast_scaler_y_multioutput.joblib` | ~5 KB    | StandardScaler for output targets            |
| `wave_forecast_feature_names.joblib`        | ~1 KB    | Feature name mappings                        |

### Loading Models

```python
# Automatic loading (cached globally)
from models import load_lstm_model

model, scaler_x, scaler_y, feature_names = load_lstm_model()

# Check if loaded successfully
if model is None:
    print("LSTM not available - fallback to extrapolation")
```

### Configuration File

Model paths are defined in `config/model_paths.py`:

```python
LSTM_MODEL = os.path.join(BASE_DIR, 'models', 'wave_forecast_multioutput_lstm.keras')
LSTM_SCALER_X = os.path.join(BASE_DIR, 'models', 'wave_forecast_scaler_X_multioutput.joblib')
LSTM_SCALER_Y = os.path.join(BASE_DIR, 'models', 'wave_forecast_scaler_y_multioutput.joblib')
LSTM_FEATURE_NAMES = os.path.join(BASE_DIR, 'models', 'wave_forecast_feature_names.joblib')
```

---

## Performance Metrics

### Test Set Evaluation (20% holdout, random_state=42)

**Dataset**: 237,312 total sequences × 168 hours × 6 features  
**Test set**: 47,463 sequences (20%)

| Feature        | MAE        | RMSE       | MAPE  | Status         |
| -------------- | ---------- | ---------- | ----- | -------------- |
| Wave Height    | 0.1248 m   | 0.1630 m   | 8.5%  | ✅ Good        |
| Swell Height   | 0.4391 m   | 0.5834 m   | 6.9%  | ⚠️ High error¹ |
| Swell Period   | 0.1234 s   | 0.1595 s   | 11.9% | ✅ Good        |
| Wind Speed     | 0.9342 m/s | 1.2942 m/s | 11.3% | ✅ Good        |
| Wind Direction | 0.9204 °   | 1.2086 °   | 39.4% | ✅ Good        |
| Sea Level      | -          | -          | -     | ⚠️ Unit issue² |

**¹** Swell Height: MAPE of 6.9% is good but absolute MAE of 0.44m indicates larger absolute swells in raw data may inflate this.

**²** Sea Level: The raw StormGlass `seaLevel` data appears to use centimetres rather than the expected metres, causing inflated sea level metrics. This does not affect wave height, swell, or wind predictions.

### MAE by Forecast Horizon (Wave Height)

Error is not monotonically increasing because the LSTM’s encoder-decoder structure predicts the full 168-hour window simultaneously rather than recursively.

| Horizon | MAE (m) |
| ------- | ------- |
| H+1     | 0.2024  |
| H+6     | 0.1325  |
| H+12    | 0.1270  |
| Day 1   | 0.1257  |
| Day 2   | 0.1232  |
| Day 3   | 0.1198  |
| Day 4   | 0.1191  |
| Day 5   | 0.1200  |
| Day 6   | 0.1236  |
| Day 7   | 0.1509  |

### Evaluation Metrics

```python
# Mean Squared Error (MSE) - Training loss
test_loss = model.evaluate(X_test, y_test)

# Mean Absolute Error (MAE) - Average prediction error
mae_per_feature = calculate_mae(y_pred, y_true)

# Mean Absolute Percentage Error (MAPE) - Relative error
mape = np.mean(|y_pred - y_true| / |y_true|) × 100
```

### Visualization

Training generates these plots in `artifacts/`:

1. **training_history_multioutput.png**
   - Loss curves (train vs validation)
   - MAE curves over epochs

2. **sample_predictions.png**
   - 6 subplots (one per feature)
   - Actual vs Predicted values for 168 hours

---

## Usage Examples

### 1. Command Line Usage

```bash
# Generate 7-day forecast for Weligama, Sri Lanka
python forecast_7day_service.py 5.9721 80.4264

# Output: JSON with daily and hourly forecasts
{
  "location": {"lat": 5.9721, "lng": 80.4264},
  "daily": {
    "waveHeight": [1.2, 1.3, 1.4, 1.5, 1.6, 1.5, 1.4],
    "wavePeriod": [10.5, 11.0, 11.5, 12.0, 11.8, 11.5, 11.2],
    ...
  },
  "hourly": [...],
  "metadata": {
    "dataSource": "api",
    "forecastMethod": "lstm",
    "generatedAt": "2026-01-04T12:00:00Z"
  }
}
```

### 2. Python Integration

```python
from services.forecast_predictor import predict_7day_forecast

# Generate forecast
hourly, daily, source, method = predict_7day_forecast(
    lat=5.9721,
    lng=80.4264
)

# Access results
print(f"Data source: {source}")  # 'api' or 'mock'
print(f"Method: {method}")       # 'lstm' or 'extrapolation'

# Daily forecast
for day in range(7):
    print(f"Day {day}: Wave Height = {daily[day]['waveHeight']} m")

# Hourly details
for hour in range(168):
    print(f"Hour {hour}: {hourly[hour]}")
```

### 3. Node.js Backend Integration

```javascript
// controllers/forecastController.js
const { spawn } = require("child_process");

const getForecast = async (req, res) => {
  const { lat, lng } = req.query;

  const python = spawn("python", ["forecast_7day_service.py", lat, lng]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.on("close", (code) => {
    if (code === 0) {
      const forecast = JSON.parse(output);
      res.json(forecast);
    } else {
      res.status(500).json({ error: "Forecast generation failed" });
    }
  });
};
```

---

## API Integration

### StormGlass API

The model uses **StormGlass Weather API** for historical data:

```python
# 100-key rotation for rate limit management
API_KEYS = [key1, key2, ..., key100]

# Fetch 168 hours of historical data
params = [
    'waveHeight',
    'swellHeight',
    'swellPeriod',
    'windSpeed',
    'windDirection',
    'seaLevel'
]

response = requests.get(
    f'https://api.stormglass.io/v2/weather/point',
    params={
        'lat': lat,
        'lng': lng,
        'params': ','.join(params),
        'start': (now - 168h).isoformat(),
        'end': now.isoformat()
    },
    headers={'Authorization': API_KEY}
)
```

### Rate Limit Handling

```python
# Automatic key rotation on 429 errors
- Total: 100 API keys
- Each key: 10 requests/day (free tier)
- Total capacity: 1000 requests/day
- Automatic failover to next key
- Exponential backoff on errors
```

---

## Troubleshooting

### Common Issues

#### 1. Model Not Loading

```
❌ Failed to load LSTM model: No such file or directory

Solution:
- Check that all model files exist in models/ directory
- Run training script: python training/train_wave_forecast_lstm.py
- Verify file paths in config/model_paths.py
```

#### 2. TensorFlow Import Error

```
❌ Cannot load LSTM: TensorFlow/Keras not available

Solution:
pip install tensorflow
```

#### 3. Version Warning

```
⚠️ InconsistentVersionWarning: Trying to unpickle estimator StandardScaler
from version 1.7.2 when using version 1.8.0

Solution (optional):
- Retrain models with current scikit-learn version
- Or ignore (usually works fine)
```

#### 4. NaN Predictions

```
❌ LSTM prediction returned NaN values

Causes:
- Corrupted input data
- Exploding gradients during training
- Scaler not fitted properly

Solutions:
- Validate input data for NaN/Inf
- Retrain model with gradient clipping
- Check scaler files
```

#### 5. Python Process Timeout

```
Python process timed out

Causes:
- Model taking too long to load (first request)
- API calls timing out
- Heavy computation

Solutions:
- Increase timeout in Node.js backend (default: 30s)
- Use caching to avoid repeated model loads
- Check network connectivity for API calls
```

### Debug Mode

Enable verbose logging:

```python
# In services/forecast_predictor.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Outputs detailed logs:
# - Model loading steps
# - API request attempts
# - Scaling transformations
# - Prediction execution time
```

---

## Advanced Topics

### Retraining the Model

When to retrain:

- ✅ New historical data available
- ✅ Model performance degradation
- ✅ Updated dependencies (TensorFlow, scikit-learn)
- ✅ Different geographic regions

Steps:

1. Prepare new training data (timeseries arrays)
2. Run `python training/train_wave_forecast_lstm.py`
3. Evaluate performance metrics
4. Replace old model files in `models/`
5. Restart backend server

### Hyperparameter Tuning

Key parameters to experiment with:

```python
# Architecture
ENCODER_UNITS = [64, 128, 256]  # LSTM layer sizes
DECODER_UNITS = [32, 64, 128]
DROPOUT_RATE = [0.2, 0.3, 0.4, 0.5]

# Training
LEARNING_RATE = [0.0001, 0.001, 0.01]
BATCH_SIZE = [16, 32, 64]
EPOCHS = [50, 100, 200]

# Regularization
CLIP_NORM = [0.5, 1.0, 5.0]  # Gradient clipping
```

### Model Monitoring

Track these metrics in production:

```python
# Prediction quality
- Average MAE per feature
- Request success rate
- Fallback usage (LSTM vs extrapolation)

# Performance
- Model load time
- Prediction latency
- Memory usage

# Data quality
- API success rate
- Mock data usage percentage
- NaN/Inf occurrences
```

---

## Related Documentation

- [Suitability Scoring System](./SUITABILITY_SCORING_SYSTEM.md) - How forecasts are used for scoring
- [Random Forest Model](./RANDOM_FOREST_MODEL.md) - Spot recommendation model (if exists)
- [API Documentation](./API.md) - Backend API endpoints (if exists)

---

## References

### Libraries Used

- **TensorFlow/Keras** 2.x - Deep learning framework
- **NumPy** - Numerical computations
- **scikit-learn** - StandardScaler preprocessing
- **joblib** - Model serialization
- **Matplotlib** - Visualization

### Research Papers

- Hochreiter & Schmidhuber (1997) - "Long Short-Term Memory"
- Sutskever et al. (2014) - "Sequence to Sequence Learning with Neural Networks"

### External APIs

- [StormGlass API Documentation](https://docs.stormglass.io/)
- [TensorFlow Keras Guide](https://www.tensorflow.org/guide/keras)

---

## Changelog

| Date       | Version | Changes               |
| ---------- | ------- | --------------------- |
| 2026-01-04 | 1.0     | Initial documentation |

---

**Maintained by**: Surf Ceylon Development Team  
**Last Updated**: January 4, 2026
