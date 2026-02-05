"""
Prepare time-series training data for multi-output 7-day forecasting
Predicts: Wave Height, Wave Period, Swell Height, Swell Period, Wind Speed, Wind Direction
Converts JSON to training sequences
Creates sliding windows (168 hours input → 168 hours output)

Output:

artifacts/timeseries_X_multioutput.npy - Input sequences (past 168 hours)
artifacts/timeseries_y_multioutput.npy - Target sequences (next 168 hours)

Front (X): Past 7 days of weather
Back (y): Next 7 days that actually happened
"""
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configuration
LOOKBACK_HOURS = 168  # Use past 7 days (168 hours) to predict
FORECAST_HOURS = 168  # Predict next 7 days (168 hours)
FEATURE_COLS = ['waveHeight', 'wavePeriod', 'swellHeight',
                'swellPeriod', 'windSpeed', 'windDirection']


def prepare_multioutput_sequences(json_file, lookback_hours=168, forecast_hours=168):
    """
    Create sequences for multi-output time-series forecasting

    Args:
        json_file: Path to historical data JSON file
        lookback_hours: Use past N hours to predict (default: 168 = 7 days)
        forecast_hours: Predict next N hours (default: 168 = 7 days)

    Returns:
        X: Input sequences (samples, lookback_hours, 6 features)
        y: Output sequences (samples, forecast_hours, 6 features)
        df: Original DataFrame for reference
    """
    print(f"\nProcessing {json_file}...")

    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {json_file} not found!")
        return None, None, None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file}: {e}")
        return None, None, None

    # Convert to DataFrame
    records = []
    hours_data = data.get('hours', [])

    if not hours_data:
        print(f"Warning: No 'hours' data found in {json_file}")
        return None, None, None

    print(f"  Found {len(hours_data)} hourly records")

    for hour in hours_data:  # Extract 6 features from nested JSON structure
        try:
            records.append({
                'timestamp': hour['time'],
                'waveHeight': hour.get('waveHeight', {}).get('sg', 0),
                'wavePeriod': hour.get('wavePeriod', {}).get('sg', 0),
                'swellHeight': hour.get('swellHeight', {}).get('sg', 0),
                'swellPeriod': hour.get('swellPeriod', {}).get('sg', 0),
                'windSpeed': hour.get('windSpeed', {}).get('sg', 0),
                'windDirection': hour.get('windDirection', {}).get('sg', 0)
            })
        except KeyError as e:
            print(f"  Warning: Missing key {e} in record, skipping")
            continue

    if not records:
        print(f"Error: No valid records extracted from {json_file}")
        return None, None, None

    df = pd.DataFrame(records)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').reset_index(drop=True)

    print(f"  Processed {len(df)} valid records")
    print(f"  Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    # Create sequences
    X_sequences = []  # Past data (input)
    y_sequences = []  # Future data (output) - ALL parameters

    total_required = lookback_hours + forecast_hours
    max_sequences = len(df) - total_required

    if max_sequences <= 0:
        print(
            f"  Error: Not enough data. Need {total_required} hours, have {len(df)}")
        return None, None, None

    print(f"  Creating {max_sequences} training sequences...")

    # Creates many training examples from limited data
    # Teaches model patterns across different time periods
    for i in range(max_sequences):
        # Input: Past lookback_hours (default: 7 days) of all features
        X_seq = df.iloc[i:i+lookback_hours][FEATURE_COLS].values

        # Output: Next forecast_hours (default: 7 days) of ALL features
        y_seq = df.iloc[i+lookback_hours:i+lookback_hours +
                        forecast_hours][FEATURE_COLS].values

        X_sequences.append(X_seq)
        y_sequences.append(y_seq)

        if (i + 1) % 100 == 0:
            print(f"    Created {i + 1}/{max_sequences} sequences...")

    X_array = np.array(X_sequences)
    y_array = np.array(y_sequences)

    print(f"  ✅ Created {len(X_array)} sequences")
    print(f"     Input shape: {X_array.shape}")
    print(f"     Output shape: {y_array.shape}")

    return X_array, y_array, df


def main():
    """Main data preparation pipeline"""
    print("=" * 60)
    print("TIME-SERIES DATA PREPARATION FOR 7-DAY FORECAST")
    print("=" * 60)

    # Auto-discover and prepare data for all locations
    import glob
    data_files = glob.glob('data/*_historical_data_fixed.json')
    print(f"\n✅ Found {len(data_files)} location files")

    all_X = []
    all_y = []
    all_dfs = []

    for filepath in data_files:
        spot_name = os.path.basename(filepath).replace(
            '_historical_data_fixed.json', '').replace('_', ' ').title()
        print(f"  📍 Processing {spot_name}...")
        X, y, df = prepare_multioutput_sequences(
            filepath, LOOKBACK_HOURS, FORECAST_HOURS)
        if X is not None:
            all_X.append(X)
            all_y.append(y)
            all_dfs.append(df)
            print(f"     ✅ {len(X)} sequences")

    # Check if datasets were successfully prepared
    if not all_X:
        print("\n❌ Error: No valid datasets created!")
        print("   Please check your JSON files and try again.")
        return

    # Combine datasets
    print(f"\n{'=' * 60}")
    print("COMBINING DATASETS")
    print('=' * 60)

    X_combined = np.vstack(all_X)
    y_combined = np.vstack(all_y)

    print(f"\n✅ Combined training sequences: {X_combined.shape}")
    print(f"   Format: (samples, 168 hours, 6 features)")
    print(f"\n✅ Combined target sequences: {y_combined.shape}")
    print(f"   Format: (samples, 168 hours, 6 outputs)")

    # Data quality checks
    print(f"\n{'=' * 60}")
    print("DATA QUALITY CHECKS")
    print('=' * 60)

    # Check for NaN or infinite values
    x_nan = np.isnan(X_combined).sum()
    y_nan = np.isnan(y_combined).sum()
    x_inf = np.isinf(X_combined).sum()
    y_inf = np.isinf(y_combined).sum()

    print(f"Input NaN values: {x_nan}")
    print(f"Output NaN values: {y_nan}")
    print(f"Input Inf values: {x_inf}")
    print(f"Output Inf values: {y_inf}")

    if x_nan > 0 or y_nan > 0:
        print("\n⚠️  Warning: Dataset contains NaN values. Replacing with zeros...")
        X_combined = np.nan_to_num(X_combined, nan=0.0)
        y_combined = np.nan_to_num(y_combined, nan=0.0)

    # Statistics
    print(f"\n{'=' * 60}")
    print("DATASET STATISTICS")
    print('=' * 60)

    for i, name in enumerate(FEATURE_COLS):
        x_mean = X_combined[:, :, i].mean()
        x_std = X_combined[:, :, i].std()
        x_min = X_combined[:, :, i].min()
        x_max = X_combined[:, :, i].max()

        print(f"{name:20s}: mean={x_mean:7.2f}, std={x_std:7.2f}, "
              f"min={x_min:7.2f}, max={x_max:7.2f}")

    # Save for training
    output_x = 'artifacts/timeseries_X_multioutput.npy'
    output_y = 'artifacts/timeseries_y_multioutput.npy'

    np.save(output_x, X_combined)
    np.save(output_y, y_combined)

    print(f"\n{'=' * 60}")
    print("✅ PREPARATION COMPLETE!")
    print('=' * 60)
    print(f"Saved to:")
    print(f"  📁 {output_x}")
    print(f"  📁 {output_y}")
    print(f"\nNext step: Run train_wave_forecast_lstm.py to train the model")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error during data preparation: {e}")
        import traceback
        traceback.print_exc()
