import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
import joblib
import pymongo
from datetime import datetime
import os

# MongoDB connection
client = pymongo.MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['surf-risk-analyzer']
incidents_collection = db['incidents']

def extract_features_from_incidents():
    """Extract features from historical incidents for ML training"""
    print("Extracting features from incidents...")
    
    incidents = list(incidents_collection.find())
    
    features_list = []
    
    # Group by surf spot
    surf_spots = incidents_collection.distinct('site')
    
    for spot in surf_spots:
        spot_incidents = [i for i in incidents if i['site'] == spot]
        
        if len(spot_incidents) == 0:
            continue
        
        # Calculate features
        total_incidents = len(spot_incidents)
        fatal_count = sum(1 for i in spot_incidents if i.get('severity') == 'fatal')
        severe_count = sum(1 for i in spot_incidents if i.get('severity') == 'severe')
        moderate_count = sum(1 for i in spot_incidents if i.get('severity') == 'moderate')
        
        # Seasonal patterns
        months = [i.get('month') for i in spot_incidents if i.get('month')]
        peak_months = pd.Series(months).mode().tolist() if months else [6]
        
        # Incident types
        incident_types = [i.get('incidentType', '') for i in spot_incidents]
        drowning_count = sum(1 for t in incident_types if 'drowning' in t.lower())
        reef_cut_count = sum(1 for t in incident_types if 'reef' in t.lower() or 'cut' in t.lower())
        collision_count = sum(1 for t in incident_types if 'collision' in t.lower())
        rip_current_count = sum(1 for t in incident_types if 'rip' in t.lower())
        
        # Current month (for seasonal adjustment)
        current_month = datetime.now().month
        is_peak_season = 1 if current_month in peak_months else 0
        
        # Calculate risk score (target variable)
        risk_score = (
            (fatal_count * 10) +
            (severe_count * 5) +
            (moderate_count * 2) +
            (drowning_count * 3) +
            (reef_cut_count * 1.5) +
            (rip_current_count * 2.5) +
            (collision_count * 1)
        ) / max(1, len(spot_incidents) / 10)  # Normalize by incident frequency
        
        risk_score = min(10, risk_score)  # Cap at 10
        
        # Categorize risk level
        if risk_score <= 3.3:
            risk_level = 0  # Low
        elif risk_score <= 6.6:
            risk_level = 1  # Medium
        else:
            risk_level = 2  # High
        
        features = {
            'surf_spot': spot,
            'total_incidents': total_incidents,
            'fatal_count': fatal_count,
            'severe_count': severe_count,
            'moderate_count': moderate_count,
            'drowning_count': drowning_count,
            'reef_cut_count': reef_cut_count,
            'collision_count': collision_count,
            'rip_current_count': rip_current_count,
            'is_peak_season': is_peak_season,
            'incidents_per_year': total_incidents / 10,  # Assuming 10 years of data
            'risk_score': risk_score,
            'risk_level': risk_level
        }
        
        features_list.append(features)
    
    df = pd.DataFrame(features_list)
    print(f"Extracted features for {len(df)} surf spots")
    return df

def train_risk_model():
    """Train Random Forest and Gradient Boosting models"""
    print("Training risk prediction model...")
    
    df = extract_features_from_incidents()
    
    # Features for training
    feature_cols = [
        'total_incidents', 'fatal_count', 'severe_count', 'moderate_count',
        'drowning_count', 'reef_cut_count', 'collision_count', 'rip_current_count',
        'is_peak_season', 'incidents_per_year'
    ]
    
    X = df[feature_cols]
    y_score = df['risk_score']
    y_level = df['risk_level']
    
    # Split data
    X_train, X_test, y_train_score, y_test_score, y_train_level, y_test_level = train_test_split(
        X, y_score, y_level, test_size=0.2, random_state=42
    )
    
    # Train Random Forest for risk level classification
    print("Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    rf_model.fit(X_train, y_train_level)
    
    # Cross-validation
    cv_scores = cross_val_score(rf_model, X, y_level, cv=5)
    print(f"Random Forest CV Accuracy: {cv_scores.mean():.2f} (+/- {cv_scores.std() * 2:.2f})")
    
    # Train Gradient Boosting for risk score regression
    print("Training Gradient Boosting Regressor...")
    gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42, max_depth=5)
    gb_model.fit(X_train, y_train_level)
    
    # Save models
    joblib.dump(rf_model, 'models/risk_classifier.pkl')
    joblib.dump(gb_model, 'models/risk_regressor.pkl')
    joblib.dump(feature_cols, 'models/feature_cols.pkl')
    
    print("Models saved successfully!")
    print(f"Test Accuracy: {rf_model.score(X_test, y_test_level):.2f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feature_importance)
    
    return rf_model, gb_model

if __name__ == '__main__':
    os.makedirs('models', exist_ok=True)
    train_risk_model()
    client.close()
    print("Training completed!")