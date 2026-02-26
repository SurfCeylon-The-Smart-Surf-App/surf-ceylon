import joblib
import numpy as np
import pymongo
from datetime import datetime, timedelta
import os

# Load models
rf_model = joblib.load('models/risk_classifier.pkl')
gb_model = joblib.load('models/risk_regressor.pkl')
feature_cols = joblib.load('models/feature_cols.pkl')

# MongoDB connection
client = pymongo.MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['surf-risk-analyzer']
incidents_collection = db['incidents']
surf_spots_collection = db['surfspots']
hazard_reports_collection = db['hazardreports']

def calculate_spot_features(spot_name):
    """Calculate features for a specific surf spot"""
    
    # Historical incidents
    spot_incidents = list(incidents_collection.find({'site': spot_name}))
    
    total_incidents = len(spot_incidents)
    fatal_count = sum(1 for i in spot_incidents if i.get('severity') == 'fatal')
    severe_count = sum(1 for i in spot_incidents if i.get('severity') == 'severe')
    moderate_count = sum(1 for i in spot_incidents if i.get('severity') == 'moderate')
    
    incident_types = [i.get('incidentType', '') for i in spot_incidents]
    drowning_count = sum(1 for t in incident_types if 'drowning' in t.lower())
    reef_cut_count = sum(1 for t in incident_types if 'reef' in t.lower() or 'cut' in t.lower())
    collision_count = sum(1 for t in incident_types if 'collision' in t.lower())
    rip_current_count = sum(1 for t in incident_types if 'rip' in t.lower())
    
    # Recent hazard reports (last 24 hours)
    yesterday = datetime.now() - timedelta(days=1)
    surf_spot = surf_spots_collection.find_one({'name': spot_name})
    
    recent_hazard_boost = 0
    if surf_spot:
        recent_hazards = list(hazard_reports_collection.find({
            'surfSpot': surf_spot['_id'],
            'reportDate': {'$gte': yesterday},
            'status': {'$ne': 'rejected'}
        }))
        
        # Boost risk based on recent hazards
        for hazard in recent_hazards:
            if hazard.get('severity') == 'high':
                recent_hazard_boost += 2
            elif hazard.get('severity') == 'medium':
                recent_hazard_boost += 1
            else:
                recent_hazard_boost += 0.5
    
    # Seasonal adjustment
    current_month = datetime.now().month
    months = [i.get('month') for i in spot_incidents if i.get('month')]
    peak_months = set(months)
    is_peak_season = 1 if current_month in peak_months else 0
    
    features = {
        'total_incidents': total_incidents + recent_hazard_boost * 5,
        'fatal_count': fatal_count,
        'severe_count': severe_count,
        'moderate_count': moderate_count,
        'drowning_count': drowning_count,
        'reef_cut_count': reef_cut_count,
        'collision_count': collision_count,
        'rip_current_count': rip_current_count,
        'is_peak_season': is_peak_season,
        'incidents_per_year': total_incidents / 10
    }
    
    return features, recent_hazard_boost

def predict_risk_score(spot_name):
    """Predict risk score and level for a surf spot"""
    
    features, hazard_boost = calculate_spot_features(spot_name)
    
    # Prepare feature vector
    X = np.array([[features[col] for col in feature_cols]])
    
    # Predict risk level
    risk_level_int = rf_model.predict(X)[0]
    risk_level_proba = rf_model.predict_proba(X)[0]
    
    # Calculate risk score (0-10)
    base_score = (risk_level_int + 1) * 3.33  # 0->3.33, 1->6.66, 2->10
    
    # Adjust based on probability confidence
    confidence_adjustment = (risk_level_proba[risk_level_int] - 0.5) * 2  # -1 to 1
    risk_score = base_score + confidence_adjustment + hazard_boost
    risk_score = np.clip(risk_score, 0, 10)
    
    # Determine risk level and flag
    if risk_score <= 3.3:
        risk_level = 'Low'
        flag_color = 'green'
    elif risk_score <= 6.6:
        risk_level = 'Medium'
        flag_color = 'yellow'
    else:
        risk_level = 'High'
        flag_color = 'red'
    
    return {
        'risk_score': round(risk_score, 2),
        'risk_level': risk_level,
        'flag_color': flag_color,
        'confidence': round(risk_level_proba[risk_level_int], 2),
        'has_recent_hazards': hazard_boost > 0
    }

def update_all_risk_scores():
    """Update risk scores for all surf spots"""
    print("Updating risk scores for all surf spots...")
    
    surf_spots = surf_spots_collection.find()
    
    for spot in surf_spots:
        try:
            prediction = predict_risk_score(spot['name'])
            
            surf_spots_collection.update_one(
                {'_id': spot['_id']},
                {
                    '$set': {
                        'riskScore': prediction['risk_score'],
                        'riskLevel': prediction['risk_level'],
                        'flagColor': prediction['flag_color'],
                        'lastUpdated': datetime.now()
                    }
                }
            )
            
            print(f"{spot['name']}: {prediction['risk_score']} ({prediction['flag_color']})")
            
        except Exception as e:
            print(f"Error updating {spot['name']}: {e}")
    
    print("Risk scores updated successfully!")

if __name__ == '__main__':
    update_all_risk_scores()
    client.close()