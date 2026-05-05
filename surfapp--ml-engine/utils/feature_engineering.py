"""Feature Engineering Functions - CRITICAL: Must match training exactly"""
import numpy as np
import pandas as pd


def calculate_engineered_features(input_df):
    """
    Calculate 3 engineered features from base features.

    CRITICAL: These calculations MUST match the training pipeline exactly.
    Any deviation will cause ML model to produce incorrect predictions.

    Args:
        input_df: DataFrame with 6 base features from StormGlass API
                 ['swellHeight', 'swellPeriod', 'swellDirection', 'windSpeed',
                  'windDirection', 'secondarySwellHeight']

    Returns:
        DataFrame with final 6 features:
        ['windSpeed', 'windDirection', 'swellDirection', 'swellEnergy', 'offshoreWind', 'totalSwellHeight']

    Engineered Features:
    1. offshoreWind = windSpeed × cos(windDirection - 270°) (offshore component for south coast)
    2. totalSwellHeight = swellHeight + secondarySwellHeight (combined swell)
    3. swellEnergy = swellHeight² × swellPeriod (wave energy)
    """
    # Make a copy to avoid modifying original
    df = input_df.copy()

    # 1. Offshore wind factor (for south coast Sri Lanka, offshore ≈ 270°)
    df['offshoreWind'] = df['windSpeed'] * \
        np.cos(np.radians(df['windDirection'] - 270))

    # 2. Combined swell height
    df['totalSwellHeight'] = df['swellHeight'] + df['secondarySwellHeight']

    # 3. Swell energy (height² × period)
    df['swellEnergy'] = (df['swellHeight'] ** 2) * df['swellPeriod']

    # Keep ONLY the final 6 features required for ML
    cols_to_keep = [
        'windSpeed', 'windDirection', 'swellDirection',
        'swellEnergy', 'offshoreWind', 'totalSwellHeight'
    ]

    # Fill missing calculated columns with 0 if base columns are missing in training dataset
    for col in cols_to_keep:
        if col not in df.columns:
            df[col] = 0

    return df[cols_to_keep]


def validate_features(features_dict, required_features):
    """
    Validate that all required features are present and numeric.

    Args:
        features_dict: Dictionary of features
        required_features: List of required feature names

    Returns:
        tuple: (is_valid, cleaned_features_dict)
    """
    cleaned = {}

    for feature in required_features:
        if feature not in features_dict:
            return False, None

        value = features_dict[feature]

        # Check if numeric
        try:
            numeric_value = float(value)
            if np.isnan(numeric_value) or np.isinf(numeric_value):
                return False, None
            cleaned[feature] = numeric_value
        except (ValueError, TypeError):
            return False, None

    return True, cleaned
