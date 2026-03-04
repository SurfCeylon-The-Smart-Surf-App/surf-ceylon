"""
Data Preparation Module
=======================
Prepares and preprocesses data for model training.
Includes data augmentation and synthetic data generation.

Usage:
    python prepare_data.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Sri Lankan surf spots for synthetic data
SRI_LANKAN_SURF_SPOTS = [
    'Hikkaduwa', 'Midigama', 'Mirissa', 'Unawatuna', 'Ahangama',
    'Arugam Bay', 'Matara', 'Thalpe', 'Weligama', 'Kalpitiya',
    'Point Pedro', 'Trincomalee'
]

# Incident types with weights
INCIDENT_TYPES = {
    'drowning': 0.15,
    'near drowning': 0.20,
    'reef cut': 0.25,
    'collision': 0.10,
    'rip current rescue': 0.20,
    'jellyfish sting': 0.05,
    'board injury': 0.05
}

# Severity levels with weights
SEVERITY_LEVELS = {
    'minor': 0.40,
    'moderate': 0.35,
    'severe': 0.20,
    'fatal': 0.05
}


def generate_synthetic_incidents(num_incidents=500, seed=42):
    """
    Generate synthetic incident data for training when real data is limited.
    
    Args:
        num_incidents: Number of synthetic incidents to generate
        seed: Random seed for reproducibility
    
    Returns:
        pd.DataFrame: DataFrame with synthetic incidents
    """
    print(f"🎲 Generating {num_incidents} synthetic incidents...")
    
    random.seed(seed)
    np.random.seed(seed)
    
    incidents = []
    
    # Risk profiles for each spot (some spots are inherently riskier)
    spot_risk_profiles = {
        'Hikkaduwa': {'base_risk': 0.7, 'reef_factor': 0.8, 'crowd_factor': 0.9},
        'Midigama': {'base_risk': 0.6, 'reef_factor': 0.7, 'crowd_factor': 0.5},
        'Mirissa': {'base_risk': 0.5, 'reef_factor': 0.4, 'crowd_factor': 0.6},
        'Unawatuna': {'base_risk': 0.8, 'reef_factor': 0.6, 'crowd_factor': 0.8},
        'Ahangama': {'base_risk': 0.5, 'reef_factor': 0.5, 'crowd_factor': 0.4},
        'Arugam Bay': {'base_risk': 0.4, 'reef_factor': 0.3, 'crowd_factor': 0.7},
        'Matara': {'base_risk': 0.5, 'reef_factor': 0.4, 'crowd_factor': 0.3},
        'Thalpe': {'base_risk': 0.4, 'reef_factor': 0.3, 'crowd_factor': 0.3},
        'Weligama': {'base_risk': 0.5, 'reef_factor': 0.4, 'crowd_factor': 0.6},
        'Kalpitiya': {'base_risk': 0.3, 'reef_factor': 0.2, 'crowd_factor': 0.3},
        'Point Pedro': {'base_risk': 0.3, 'reef_factor': 0.3, 'crowd_factor': 0.2},
        'Trincomalee': {'base_risk': 0.3, 'reef_factor': 0.2, 'crowd_factor': 0.4}
    }
    
    for i in range(num_incidents):
        # Select spot based on risk profile (riskier spots have more incidents)
        spot_weights = [spot_risk_profiles[s]['base_risk'] for s in SRI_LANKAN_SURF_SPOTS]
        spot = random.choices(SRI_LANKAN_SURF_SPOTS, weights=spot_weights)[0]
        profile = spot_risk_profiles[spot]
        
        # Select incident type based on spot characteristics
        incident_weights = list(INCIDENT_TYPES.values())
        # Increase reef cuts for high reef factor spots
        if profile['reef_factor'] > 0.5:
            incident_weights[2] *= 1.5  # reef cut
        # Increase collisions for crowded spots
        if profile['crowd_factor'] > 0.6:
            incident_weights[3] *= 1.5  # collision
        
        incident_type = random.choices(list(INCIDENT_TYPES.keys()), weights=incident_weights)[0]
        
        # Select severity (riskier spots have more severe incidents)
        severity_weights = list(SEVERITY_LEVELS.values())
        if profile['base_risk'] > 0.6:
            severity_weights[2] *= 1.3  # severe
            severity_weights[3] *= 1.2  # fatal
        
        severity = random.choices(list(SEVERITY_LEVELS.keys()), weights=severity_weights)[0]
        
        # Generate random date (past 10 years)
        days_ago = random.randint(0, 3650)
        incident_date = datetime.now() - timedelta(days=days_ago)
        
        # Peak season months (November to April for Sri Lanka)
        month = incident_date.month
        
        incidents.append({
            'site': spot,
            'incidentType': incident_type,
            'severity': severity,
            'date': incident_date,
            'month': month,
            'year': incident_date.year,
            'description': f"Synthetic {incident_type} incident at {spot}",
            'is_synthetic': True
        })
    
    df = pd.DataFrame(incidents)
    print(f"✅ Generated {len(df)} synthetic incidents")
    print(f"📊 Distribution by spot:")
    print(df['site'].value_counts())
    
    return df


def augment_existing_data(df, augmentation_factor=2):
    """
    Augment existing incident data by creating variations.
    
    Args:
        df: Original DataFrame with incidents
        augmentation_factor: How many times to multiply the data
    
    Returns:
        pd.DataFrame: Augmented DataFrame
    """
    print(f"📈 Augmenting data with factor {augmentation_factor}...")
    
    augmented_rows = []
    
    for _, row in df.iterrows():
        for _ in range(augmentation_factor - 1):
            new_row = row.copy()
            
            # Vary the month slightly
            month_shift = random.randint(-1, 1)
            new_month = (row.get('month', 6) + month_shift - 1) % 12 + 1
            new_row['month'] = new_month
            
            # Vary the year
            year_shift = random.randint(-2, 2)
            if 'year' in row:
                new_row['year'] = row['year'] + year_shift
            
            augmented_rows.append(new_row)
    
    augmented_df = pd.concat([df, pd.DataFrame(augmented_rows)], ignore_index=True)
    print(f"✅ Data augmented from {len(df)} to {len(augmented_df)} records")
    
    return augmented_df


def prepare_training_data(include_synthetic=True, augment=True):
    """
    Prepare complete training dataset.
    
    Args:
        include_synthetic: Whether to include synthetic data
        augment: Whether to augment existing data
    
    Returns:
        pd.DataFrame: Prepared training data
    """
    import pymongo
    
    print("📦 Preparing training data...")
    
    # Load real data from MongoDB
    client = pymongo.MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
    db = client['surf-risk-analyzer']
    incidents_collection = db['incidents']
    
    real_incidents = list(incidents_collection.find())
    real_df = pd.DataFrame(real_incidents)
    
    print(f"📊 Loaded {len(real_df)} real incidents from database")
    
    # Add synthetic data if needed
    if include_synthetic and len(real_df) < 100:
        print("⚠️ Limited real data, adding synthetic incidents...")
        synthetic_df = generate_synthetic_incidents(num_incidents=500)
        combined_df = pd.concat([real_df, synthetic_df], ignore_index=True)
    else:
        combined_df = real_df
    
    # Augment data
    if augment and len(combined_df) < 200:
        combined_df = augment_existing_data(combined_df, augmentation_factor=3)
    
    # Save prepared data
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, 'prepared_training_data.csv')
    combined_df.to_csv(output_path, index=False)
    print(f"💾 Saved prepared data to {output_path}")
    
    client.close()
    return combined_df


if __name__ == '__main__':
    print("=" * 50)
    print("🏄 Data Preparation for Surf Risk ML")
    print("=" * 50)
    
    df = prepare_training_data()
    print(f"\n✅ Prepared {len(df)} records for training")
