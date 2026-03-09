"""
Random Forest Model - Accuracy Evaluation
==========================================
Loads the ALREADY-TRAINED model and historical data, recreates the same
80/20 test split used during training (random_state=42), runs predictions
on the held-out test set, and reports full accuracy metrics.

NO retraining required. Runtime: ~30 seconds.

Usage:
    cd surfapp--ml-engine
    python testing/evaluate_random_forest.py
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Add parent directory to path so we can import from config/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ─── Feature / Target definitions (must match training script) ────────────────
BASE_FEATURES = [
    'swellHeight', 'swellPeriod', 'swellDirection', 'windSpeed',
    'windDirection', 'seaLevel', 'gust', 'secondarySwellHeight',
    'secondarySwellPeriod', 'secondarySwellDirection'
]
TARGET_NAMES = ['waveHeight', 'windSpeed', 'windDirection']
TARGET_LABELS = {
    'waveHeight':    'Wave Height',
    'windSpeed':     'Wind Speed',
    'windDirection': 'Wind Direction'
}
TARGET_UNITS = {
    'waveHeight':    'm',
    'windSpeed':     'm/s',
    'windDirection': '°'
}
# Industry-standard acceptable MAE thresholds
BENCHMARK_MAE = {
    'waveHeight':    0.20,   # ±20 cm
    'windSpeed':     1.50,   # ±1.5 m/s
    'windDirection': 15.0    # ±15°
}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_average_from_sources(source_dict):
    """Average values from multiple weather sources (noaa, sg, meteo, etc.)"""
    if not source_dict or not isinstance(source_dict, dict):
        return None
    values = [v for v in source_dict.values()
              if isinstance(v, (int, float))]
    return sum(values) / len(values) if values else None


def load_historical_data(data_dir):
    """Load all *_historical_data_fixed.json files from data/"""
    files = [f for f in os.listdir(data_dir)
             if f.endswith('_historical_data_fixed.json')]

    if not files:
        print(f"  ❌ No data files found in {data_dir}")
        sys.exit(1)

    print(f"  Found {len(files)} data files:")
    all_records = []
    all_params = list(set(BASE_FEATURES + TARGET_NAMES))

    for filename in sorted(files):
        filepath = os.path.join(data_dir, filename)
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)

            before = len(all_records)
            for hour in data.get('hours', []):
                record = {}
                is_valid = True
                for param in all_params:
                    raw = hour.get(param, {})
                    if isinstance(raw, dict):
                        value = get_average_from_sources(raw)
                    elif isinstance(raw, (int, float)):
                        value = raw
                    else:
                        value = None
                    if value is None:
                        is_valid = False
                        break
                    record[param] = value
                if is_valid:
                    all_records.append(record)

            added = len(all_records) - before
            print(f"    ✓ {filename}: {added:,} records")

        except Exception as e:
            print(f"    ⚠️  Could not load {filename}: {e}")

    return pd.DataFrame(all_records)


def preprocess(df):
    """Replicate the preprocessing from train_random_forest_model.py exactly"""
    # 1. Remove duplicates
    before = len(df)
    df = df.drop_duplicates()
    print(f"  Removed {before - len(df):,} duplicates")

    # 2. Remove outliers using IQR on all feature + target columns
    print("  Removing outliers...")
    all_cols = BASE_FEATURES + TARGET_NAMES
    for col in all_cols:
        if col in df.columns:
            Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
            IQR = Q3 - Q1
            before = len(df)
            df = df[(df[col] >= Q1 - 1.5 * IQR) & (df[col] <= Q3 + 1.5 * IQR)]
            removed = before - len(df)
            if removed > 0:
                print(f"    {col}: -{removed:,}")

    # 3. Feature engineering
    df['swellEnergy'] = df['swellHeight'] ** 2 * df['swellPeriod']
    df['offshoreWind'] = df['windSpeed'] * \
        np.cos(np.radians(df['windDirection'] - 270))
    df['totalSwellHeight'] = df['swellHeight'] + df['secondarySwellHeight']
    df['windSwellInteraction'] = df['windSpeed'] * df['swellHeight']
    df['periodRatio'] = df['swellPeriod'] / (df['secondarySwellPeriod'] + 1)

    all_features = BASE_FEATURES + [
        'swellEnergy', 'offshoreWind', 'totalSwellHeight',
        'windSwellInteraction', 'periodRatio'
    ]
    print(f"  Clean records: {len(df):,} | Features: {len(all_features)}")
    return df, all_features


def mape(y_true, y_pred):
    """Mean Absolute Percentage Error (skips zeros to avoid division by zero)"""
    arr_true = np.asarray(y_true, dtype=float)
    arr_pred = np.asarray(y_pred, dtype=float)
    mask = arr_true != 0
    if mask.sum() == 0:
        return float('nan')
    return float(np.mean(np.abs((arr_true[mask] - arr_pred[mask]) / arr_true[mask])) * 100)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("  RANDOM FOREST MODEL — ACCURACY EVALUATION")
    print("  No retraining. Evaluates on the same held-out 20% test split.")
    print("=" * 70)

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(BASE_DIR, 'models', 'surf_forecast_model.joblib')
    data_dir = os.path.join(BASE_DIR, 'data')

    # ── Step 1: Load model ───────────────────────────────────────────────────
    print("\n[1/5] Loading model...")
    try:
        model_data = joblib.load(model_path)
        model = model_data['model']
        print(f"  ✅ RandomForestRegressor loaded")
        print(f"     Trees:     {model.n_estimators}")
        print(f"     Max depth: {model.max_depth}")
        print(f"     Features:  {model.n_features_in_}")
    except FileNotFoundError:
        print(f"  ❌ Model not found at: {model_path}")
        print("     Run training first: python training/train_random_forest_model.py")
        sys.exit(1)

    # ── Step 2: Load data ────────────────────────────────────────────────────
    print("\n[2/5] Loading historical data...")
    df = load_historical_data(data_dir)
    print(f"  Total raw records: {len(df):,}")

    # ── Step 3: Preprocess ───────────────────────────────────────────────────
    print("\n[3/5] Preprocessing...")
    df, all_features = preprocess(df)

    # ── Step 4: Recreate the exact same 80/20 test split ────────────────────
    print("\n[4/5] Creating test split (random_state=42, same as training)...")
    X = df[all_features]
    y = df[TARGET_NAMES]
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)
    print(f"  Total samples: {len(X):,}")
    print(f"  Test set size: {len(X_test):,} samples")

    # ── Step 5: Predict & compute metrics ───────────────────────────────────
    print("\n[5/5] Running predictions...")
    y_pred = model.predict(X_test)

    # ── Results ──────────────────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print(f"  RESULTS — Held-out test set ({len(X_test):,} samples)")
    print(f"{'=' * 70}")

    col_h = 20
    col_r2 = 8
    col_v = 12

    header = (f"  {'Target':<{col_h}} {'R²':>{col_r2}}  "
              f"{'MAE':>{col_v}}  {'RMSE':>{col_v}}  {'MAPE':>7}  Status")
    print(f"\n{header}")
    print("  " + "─" * 70)

    for i, target in enumerate(TARGET_NAMES):
        r2_val = r2_score(y_test.iloc[:, i], y_pred[:, i])
        mae_val = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        rmse_val = float(np.sqrt(mean_squared_error(
            y_test.iloc[:, i], y_pred[:, i])))
        mape_val = mape(y_test.iloc[:, i].values, y_pred[:, i])
        unit = TARGET_UNITS[target]
        bench = BENCHMARK_MAE[target]
        status = "✅ Exceeds benchmark" if mae_val < bench else "⚠️  Above benchmark"
        label = TARGET_LABELS[target]

        print(f"  {label:<{col_h}} {r2_val:{col_r2}.4f}  "
              f"{mae_val:>8.4f} {unit:<3}  {rmse_val:>8.4f} {unit:<3}  "
              f"{mape_val:>5.1f}%  {status}")

    overall_r2 = model.score(X_test, y_test)
    print(f"\n  {'Overall R²':<{col_h}} {overall_r2:{col_r2}.4f}")

    # ── Feature importance ───────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print(f"  FEATURE IMPORTANCE (Top 10)")
    print(f"{'=' * 70}")
    importances = model.feature_importances_
    feat_imp = sorted(zip(all_features, importances),
                      key=lambda x: x[1], reverse=True)
    for feat, imp in feat_imp[:10]:
        bar = '█' * int(imp * 50)
        print(f"  {feat:<30}  {imp:.4f}  {bar}")

    # ── Metric explanation ───────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print(f"  METRIC GUIDE")
    print(f"{'=' * 70}")
    print("""
  ┌─────────────────────────────────────────────────────────────────────┐
  │ R² (R-squared / Coefficient of Determination)                       │
  │   Formula : 1 - SS_residual / SS_total                              │
  │   Range   : 0 to 1  (negative = worse than predicting the mean)     │
  │   Meaning : Fraction of the target's variance the model explains.   │
  │   Example : R²=0.83 → model explains 83% of wave height variance.   │
  │   Perfect : 1.0  |  No better than mean: 0.0                        │
  ├─────────────────────────────────────────────────────────────────────┤
  │ MAE (Mean Absolute Error)                                           │
  │   Formula : mean( |y_true - y_pred| )                               │
  │   Meaning : Average prediction error in the target's own units.     │
  │   Example : MAE=0.12m → predictions off by ±12 cm on average.       │
  │   Best for: human-interpretable accuracy in real-world units.       │
  ├─────────────────────────────────────────────────────────────────────┤
  │ RMSE (Root Mean Squared Error)                                      │
  │   Formula : sqrt( mean( (y_true - y_pred)² ) )                      │
  │   Meaning : Like MAE but large errors are penalised more heavily.   │
  │   Note    : Always ≥ MAE. Large RMSE-MAE gap = occasional big       │
  │             errors that inflate the squared penalty.                 │
  ├─────────────────────────────────────────────────────────────────────┤
  │ MAPE (Mean Absolute Percentage Error)                               │
  │   Formula : mean( |y_true - y_pred| / |y_true| ) × 100%            │
  │   Meaning : Average error as % of the actual value.                 │
  │   Example : MAPE=10% → predictions are roughly 10% off.             │
  │   Useful  : Scale-independent, easy to compare across targets.      │
  └─────────────────────────────────────────────────────────────────────┘

  Benchmark MAE thresholds (industry standards for surf forecasting):
    Wave Height  < 0.20 m   — accepted ±20 cm tolerance
    Wind Speed   < 1.50 m/s — accepted ±1.5 m/s tolerance
    Wind Dir     < 15.0 °   — accepted ±15° tolerance
""")


if __name__ == '__main__':
    main()
