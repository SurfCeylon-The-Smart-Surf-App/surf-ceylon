"""Feature Definitions for ML Models.
Single source of truth for all feature names"""

# Model 1 (Random Forest) - 6 base weather parameters from StormGlass API
RANDOM_FOREST_BASE_FEATURES = [
    'swellHeight',           # Primary swell height (m)
    'swellPeriod',           # Primary swell period (s)
    'swellDirection',        # Primary swell direction (degrees)
    'windSpeed',             # Wind speed (m/s)
    'windDirection',         # Wind direction (degrees)
    'secondarySwellHeight',  # Secondary swell height (m)
]

# Model 1 (Random Forest) - 3 engineered features (calculated from base features)
RANDOM_FOREST_ENGINEERED_FEATURES = [
    'offshoreWind',          # windSpeed × cos(windDir - 270°)
    'totalSwellHeight',      # primary + secondary swell
    'swellEnergy',           # height² × period
]

# Model 1 (Random Forest) - Total: 6 final features passed to the model
RANDOM_FOREST_ALL_FEATURES = [
    'windSpeed',
    'windDirection',
    'swellDirection',
    'swellEnergy',
    'offshoreWind',
    'totalSwellHeight'
]

# Model 1 (Random Forest) - 1 prediction target
RANDOM_FOREST_TARGETS = [
    'waveHeight',      # Predicted wave height (m)
]

# Model 2 (LSTM) - 6 time-series features for 7-day forecasts
LSTM_FEATURE_COLUMNS = [
    'waveHeight',
    'swellHeight',
    'swellPeriod',
    'windSpeed',
    'windDirection',
    'seaLevel'
]

# Model 2 (LSTM) - 6 multi-output predictions (same as input features)
LSTM_TARGET_COLUMNS = LSTM_FEATURE_COLUMNS

# Alias for backward compatibility
FEATURE_NAMES = RANDOM_FOREST_BASE_FEATURES
TARGET_NAMES = RANDOM_FOREST_TARGETS
FEATURE_COLS = LSTM_FEATURE_COLUMNS
