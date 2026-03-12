"""General Settings and Configuration"""
import os

# Toggle between real API and mock data
# Set to True for faster testing with 78 spots (API calls would timeout)
# Set to False to use real StormGlass API data
USE_MOCK_DATA = True  # Model 1 enabled - uses ML predictions with mock weather data

# API request timeout (seconds)
# Increased for slow connections (e.g., university networks)
# Format: (connect_timeout, read_timeout) or single value for both
API_TIMEOUT = (15, 45)  # 15s to connect, 45s to read response

# Retry configuration for API calls with exponential backoff
MAX_API_RETRIES = 3  # Retry each key up to 3 times before moving to next
RETRY_DELAY_SECONDS = 2  # Initial delay, doubles with each retry
MAX_RETRY_DELAY = 10  # Cap retry delay at 10 seconds

# Region definitions for Sri Lanka
REGIONS = {
    'South Coast': {
        'offshore_wind_direction': 270,  # West wind is offshore for south coast
        'seasonal_variation': 'high'
    },
    'East Coast': {
        'offshore_wind_direction': 90,   # East wind is offshore for east coast
        'seasonal_variation': 'moderate'
    },
    'West Coast': {
        'offshore_wind_direction': 180,  # South wind is offshore for west coast
        'seasonal_variation': 'low'
    }
}

# Model configuration flags
ENABLE_RANDOM_FOREST = True   # Model 1: Spot recommendations
ENABLE_LSTM = True            # Model 2: 7-day forecasts

# Logging configuration
VERBOSE_LOGGING = os.getenv('VERBOSE_LOGGING', 'False').lower() == 'true'

# Data source preferences
PREFER_API_OVER_MOCK = not USE_MOCK_DATA
