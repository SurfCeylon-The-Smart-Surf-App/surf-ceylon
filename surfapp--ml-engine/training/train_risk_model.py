"""
Risk Model Training Module - Updated
==========================
Handles training with safety checks for small datasets.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
import joblib
import pymongo
from datetime import datetime
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# MongoDB connection
def get_db_connection():
    client = pymongo.MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
    return client['surf-risk-analyzer']

# Feature columns
FEATURE_COLS = [
    'total_incidents', 'fatal_count', 'severe_count', 'moderate_count',
    'drowning_count', 'reef_cut_count', 'collision_count', 'rip_current_count',
    'is_peak_season', 'incidents_per_year'
]

def extract_features_from_incidents():
    print("📊 Extracting features from incidents...")
    db = get_db_connection()
    incidents_collection = db['incidents']
    incidents = list(incidents_collection.find())
    
    if len(incidents) == 0:
        print("⚠️ No incidents found in database!")
        return pd.DataFrame()
    
    features_list = []
    surf_spots = incidents_collection.distinct('site')
    print(f"📍 Found {len(surf_spots)} surf spots with incidents")
    
    for spot in surf_spots:
        spot_incidents = [i for i in incidents if i.get('site') == spot]
        if not spot_incidents: continue
        
        total_incidents = len(spot_incidents)
        fatal_count = sum(1 for i in spot_incidents if i.get('severity') == 'fatal')
        severe_count = sum(1 for i in spot_incidents if i.get('severity') == 'severe')
        moderate_count = sum(1 for i in spot_incidents if i.get('severity') == 'moderate')
        
        incident_types = [i.get('incidentType', '') for i in spot_incidents]
        drowning_count = sum(1 for t in incident_types if 'drowning' in t.lower())
        reef_cut_count = sum(1 for t in incident_types if 'reef' in t.lower() or 'cut' in t.lower())
        collision_count = sum(1 for t in incident_types if 'collision' in t.lower())
        rip_current_count = sum(1 for t in incident_types if 'rip' in t.lower())
        
        current_month = datetime.now().month
        months = [i.get('month') for i in spot_incidents if i.get('month')]
        peak_months = pd.Series(months).mode().tolist() if months else [6]
        is_peak_season = 1 if current_month in peak_months else 0
        
        risk_score = ((fatal_count * 10) + (severe_count * 5) + (moderate_count * 2) + 
                      (drowning_count * 3) + (reef_cut_count * 1.5) + (rip_current_count * 2.5)) / max(1, len(spot_incidents) / 10)
        risk_score = min(10, risk_score)
        
        # 0: Low, 1: Medium, 2: High
        risk_level = 0 if risk_score <= 3.3 else (1 if risk_score <= 6.6 else 2)
        
        features_list.append({
            'surf_spot': spot, 'total_incidents': total_incidents, 'fatal_count': fatal_count,
            'severe_count': severe_count, 'moderate_count': moderate_count,
            'drowning_count': drowning_count, 'reef_cut_count': reef_cut_count,
            'collision_count': collision_count, 'rip_current_count': rip_current_count,
            'is_peak_season': is_peak_season, 'incidents_per_year': total_incidents / 10,
            'risk_score': risk_score, 'risk_level': risk_level
        })
    
    df = pd.DataFrame(features_list)
    return df

def train_models(df=None, save_models=True):
    print("\n🤖 Training risk prediction models...")
    if df is None: df = extract_features_from_incidents()
    if df.empty: raise ValueError("No data available for training!")

    X = df[FEATURE_COLS]
    y_level = df['risk_level']

    # CRITICAL FIX: Check if we have more than one class
    unique_classes = np.unique(y_level)
    if len(unique_classes) < 2:
        print(f"⚠️ Only one risk level found ({unique_classes[0]}). Training require at least 2 classes.")
        print("💡 Action: Add more diverse incidents to your database.")
        return None, None, {}

    # Split data with safety for very small datasets
    try:
        X_train, X_test, y_train_level, y_test_level = train_test_split(
            X, y_level, test_size=0.2, random_state=42, stratify=y_level
        )
    except ValueError:
        print("⚠️ Stratified split failed (too few samples of a class). Falling back to standard split.")
        X_train, X_test, y_train_level, y_test_level = train_test_split(
            X, y_level, test_size=0.2, random_state=42
        )

    print(f"📈 Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    # Train Random Forest
    print("\n🌲 Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train_level)
    
    # Dynamic CV adjustment
    cv_folds = min(3, len(X)) # If data is small, use 3 folds instead of 5
    cv_scores = cross_val_score(rf_model, X, y_level, cv=cv_folds)
    print(f"   CV Accuracy ({cv_folds} folds): {cv_scores.mean():.2f}")

    # Train Gradient Boosting with class check
    print("\n🚀 Training Gradient Boosting Classifier...")
    gb_model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
    
    # Final safety check for GB fit
    if len(np.unique(y_train_level)) > 1:
        gb_model.fit(X_train, y_train_level)
        gb_accuracy = gb_model.score(X_test, y_test_level)
    else:
        print("❌ GB Training skipped: Train split contains only 1 class.")
        gb_accuracy = 0.0

    rf_accuracy = rf_model.score(X_test, y_test_level)
    print(f"\n📊 Model Performance:\n   RF Accuracy: {rf_accuracy:.2f}\n   GB Accuracy: {gb_accuracy:.2f}")

    if save_models:
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(rf_model, os.path.join(models_dir, 'risk_classifier.pkl'))
        joblib.dump(gb_model, os.path.join(models_dir, 'risk_regressor.pkl'))
        joblib.dump(FEATURE_COLS, os.path.join(models_dir, 'feature_cols.pkl'))
        print(f"💾 Models saved to {models_dir}/")

    return rf_model, gb_model, {'rf_accuracy': rf_accuracy, 'gb_accuracy': gb_accuracy}

if __name__ == '__main__':
    print("=" * 50)
    print("🏄 Surf Risk Model Training")
    print("=" * 50)
    try:
        train_models()
        print("\n✅ Process finished.")
    except Exception as e:
        print(f"\n❌ Error: {e}")