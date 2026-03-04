"""
Step 2: Preprocess Kaggle Data for Cardio ML System
Filters and prepares exercise data for deep learning model
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from cardio_config import *

def load_dataset():
    """Load the downloaded Kaggle dataset"""
    print("=" * 80)
    print("📂 LOADING DATASET")
    print("=" * 80)
    
    # Load path from previous step
    with open(DATA_DIR / "dataset_path.json", "r") as f:
        path_info = json.load(f)
    
    dataset_path = Path(path_info["kaggle_path"])
    
    # Load main dataset
    csv_path = dataset_path / "programs_detailed_boostcamp_kaggle.csv"
    print(f"Loading: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df):,} rows\n")
    
    return df

def filter_cardio_exercises(df):
    """Filter exercises relevant for cardio/warmup workouts"""
    print("=" * 80)
    print("🔍 FILTERING CARDIO-RELEVANT EXERCISES")
    print("=" * 80)
    
    original_count = len(df)
    
    # Keywords for cardio/warmup exercises
    cardio_keywords = [
        'cardio', 'hiit', 'run', 'jog', 'sprint', 'jump', 'burpee',
        'mountain climber', 'jumping jack', 'high knee', 'butt kick',
        'ladder', 'agility', 'cone', 'shuttle', 'box jump',
        'plyometric', 'explosive', 'power', 'dynamic', 'warmup', 'warm-up',
        'stretch', 'mobility', 'foam roll', 'activation',
        'bodyweight', 'calisthenics', 'circuit', 'conditioning',
        'skip', 'hop', 'bound', 'lunge walk', 'inchworm',
        'plank jack', 'skater', 'lateral', 'bear crawl', 'crab walk'
    ]
    
    # Filter by exercise name and goal
    df_filtered = df[
        df['exercise_name'].str.lower().str.contains('|'.join(cardio_keywords), na=False) |
        df['goal'].str.lower().str.contains('bodyweight|athletics|conditioning', na=False)
    ].copy()
    
    print(f"Original rows: {original_count:,}")
    print(f"After filtering: {len(df_filtered):,}")
    print(f"Reduction: {((1 - len(df_filtered)/original_count) * 100):.1f}%\n")
    
    return df_filtered

def clean_and_enrich_data(df):
    """Clean data and add computed features"""
    print("=" * 80)
    print("🧹 CLEANING AND ENRICHING DATA")
    print("=" * 80)
    
    # Drop rows with missing critical data
    df = df.dropna(subset=['exercise_name', 'level', 'goal'])
    
    # Parse level (convert string list to actual list)
    df['level_list'] = df['level'].apply(lambda x: eval(x) if isinstance(x, str) else [])
    
    # Parse goal (convert string list to actual list)
    df['goal_list'] = df['goal'].apply(lambda x: eval(x) if isinstance(x, str) else [])
    
    # Map fitness levels
    def map_fitness_level(levels):
        """Map Kaggle levels to our frontend levels"""
        levels_lower = [l.lower() for l in levels]
        if 'beginner' in levels_lower or 'novice' in levels_lower:
            return 'beginner'
        elif 'advanced' in levels_lower:
            return 'pro'
        else:
            return 'intermediate'
    
    df['fitness_level'] = df['level_list'].apply(map_fitness_level)
    
    # Estimate exercise intensity from reps/sets
    def calculate_intensity(row):
        """Calculate intensity score"""
        sets = row.get('sets', 3) if pd.notna(row.get('sets')) else 3
        reps = row.get('reps', 10) if pd.notna(row.get('reps')) else 10
        
        # Normalize (higher sets/reps = higher intensity)
        if reps < 0:  # Time-based (seconds)
            return 'high' if abs(reps) > 30 else 'moderate'
        else:
            total_volume = sets * reps
            if total_volume > 50:
                return 'very_high'
            elif total_volume > 30:
                return 'high'
            elif total_volume > 15:
                return 'moderate'
            else:
                return 'low'
    
    df['intensity_level'] = df.apply(calculate_intensity, axis=1)
    
    # Map equipment
    def map_equipment(eq):
        """Map equipment to frontend categories"""
        if pd.isna(eq):
            return 'none'
        eq_lower = str(eq).lower()
        if 'bodyweight' in eq_lower or 'no equipment' in eq_lower:
            return 'none'
        elif 'gym' in eq_lower or 'full gym' in eq_lower:
            return 'gym'
        else:
            return 'kettlebell'  # Default for other equipment
    
    df['equipment_category'] = df['equipment'].apply(map_equipment)
    
    # Estimate duration per exercise (in seconds)
    def estimate_duration(row):
        """Estimate exercise duration"""
        sets = row.get('sets', 3) if pd.notna(row.get('sets')) else 3
        reps = row.get('reps', 10) if pd.notna(row.get('reps')) else 10
        
        if reps < 0:  # Time-based
            return abs(reps) * sets + (sets - 1) * 30  # Include rest
        else:
            return reps * 3 * sets + (sets - 1) * 45  # 3 sec per rep, 45 sec rest
    
    df['estimated_duration_sec'] = df.apply(estimate_duration, axis=1)
    
    # Map to goal categories
    def map_goal(goals):
        """Map Kaggle goals to our categories"""
        goals_lower = [g.lower() for g in goals]
        if any('bodyweight' in g or 'athletics' in g for g in goals_lower):
            return 'endurance'
        elif any('power' in g or 'explosive' in g for g in goals_lower):
            return 'power'
        else:
            return 'warm-up'
    
    df['goal_category'] = df['goal_list'].apply(map_goal)
    
    print(f"✅ Cleaned rows: {len(df):,}")
    print(f"\nFitness Level Distribution:")
    print(df['fitness_level'].value_counts())
    print(f"\nGoal Distribution:")
    print(df['goal_category'].value_counts())
    print(f"\nEquipment Distribution:")
    print(df['equipment_category'].value_counts())
    print(f"\nIntensity Distribution:")
    print(df['intensity_level'].value_counts())
    print()
    
    return df

def create_exercise_database(df):
    """Create structured exercise database"""
    print("=" * 80)
    print("🏗️ BUILDING EXERCISE DATABASE")
    print("=" * 80)
    
    # Group by exercise name and aggregate
    exercise_groups = df.groupby('exercise_name').agg({
        'fitness_level': lambda x: list(x.mode()),
        'goal_category': lambda x: list(x.mode()),
        'equipment_category': lambda x: list(x.mode()),
        'intensity_level': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'moderate',
        'sets': 'median',
        'reps': 'median',
        'estimated_duration_sec': 'median',
        'description': 'first'
    }).reset_index()
    
    # Convert to JSON-friendly format
    exercises = []
    for idx, row in exercise_groups.iterrows():
        exercise = {
            'id': idx,
            'name': row['exercise_name'],
            'description': row['description'] if pd.notna(row['description']) else '',
            'fitness_levels': row['fitness_level'] if isinstance(row['fitness_level'], list) else [row['fitness_level']],
            'goals': row['goal_category'] if isinstance(row['goal_category'], list) else [row['goal_category']],
            'equipment': row['equipment_category'] if isinstance(row['equipment_category'], list) else [row['equipment_category']],
            'intensity': row['intensity_level'],
            'sets': int(row['sets']) if pd.notna(row['sets']) and row['sets'] > 0 else 3,
            'reps': int(row['reps']) if pd.notna(row['reps']) and row['reps'] > 0 else 10,
            'duration_sec': int(row['estimated_duration_sec']) if pd.notna(row['estimated_duration_sec']) else 60,
        }
        exercises.append(exercise)
    
    print(f"✅ Created {len(exercises)} unique exercises\n")
    
    # Save to JSON
    PROCESSED_DATA_PATH.mkdir(exist_ok=True)
    
    with open(EXERCISE_DB_PATH, 'w') as f:
        json.dump(exercises, f, indent=2)
    
    print(f"💾 Saved to: {EXERCISE_DB_PATH}")
    
    return exercises

def create_training_dataset(df):
    """Create training dataset for ML model"""
    print("\n" + "=" * 80)
    print("🎯 CREATING TRAINING DATASET")
    print("=" * 80)
    
    # Select relevant columns for training
    training_df = df[[
        'exercise_name',
        'fitness_level',
        'goal_category',
        'equipment_category',
        'intensity_level',
        'sets',
        'reps',
        'estimated_duration_sec'
    ]].copy()
    
    # Save training data
    training_path = PROCESSED_DATA_PATH / "training_data.csv"
    training_df.to_csv(training_path, index=False)
    
    print(f"✅ Training dataset saved: {training_path}")
    print(f"   Rows: {len(training_df):,}")
    print(f"   Columns: {len(training_df.columns)}")
    
    return training_df

def generate_synthetic_user_profiles(n_profiles=10000):
    """Generate synthetic user profiles for training"""
    print("\n" + "=" * 80)
    print("👥 GENERATING SYNTHETIC USER PROFILES")
    print("=" * 80)
    
    np.random.seed(42)
    
    profiles = []
    for i in range(n_profiles):
        # Random user profile
        fitness_level = np.random.choice(FITNESS_LEVELS, p=[0.4, 0.4, 0.2])
        goal = np.random.choice(GOALS, p=[0.5, 0.3, 0.2])
        duration_range = np.random.choice(list(DURATION_RANGES.keys()), p=[0.3, 0.5, 0.2])
        equipment = np.random.choice(EQUIPMENT_OPTIONS, p=[0.4, 0.3, 0.3])
        
        # BMI (realistic distribution)
        height = np.random.normal(170, 10)  # cm
        weight = np.random.normal(70, 15)   # kg
        bmi_category = get_bmi_category(height, weight)
        
        # Limitations (sparse - most people have none)
        has_limitations = np.random.random() < 0.2
        limitations = []
        if has_limitations:
            n_limitations = np.random.randint(1, 3)
            limitations = list(np.random.choice(LIMITATIONS, n_limitations, replace=False))
        
        profile = {
            'user_id': f'user_{i}',
            'fitness_level': fitness_level,
            'goal': goal,
            'duration_range': duration_range,
            'equipment': equipment,
            'height': round(height, 1),
            'weight': round(weight, 1),
            'bmi_category': bmi_category,
            'limitations': limitations
        }
        profiles.append(profile)
    
    # Save profiles
    profiles_df = pd.DataFrame(profiles)
    profiles_path = PROCESSED_DATA_PATH / "user_profiles.csv"
    profiles_df.to_csv(profiles_path, index=False)
    
    print(f"✅ Generated {len(profiles):,} synthetic user profiles")
    print(f"💾 Saved to: {profiles_path}")
    
    print(f"\nProfile Distribution:")
    print(f"  Fitness Levels: {profiles_df['fitness_level'].value_counts().to_dict()}")
    print(f"  Goals: {profiles_df['goal'].value_counts().to_dict()}")
    print(f"  Equipment: {profiles_df['equipment'].value_counts().to_dict()}")
    
    return profiles_df

def main():
    """Main preprocessing pipeline"""
    print("\n🚀 KAGGLE DATA PREPROCESSING PIPELINE")
    print("=" * 80)
    
    # Load dataset
    df = load_dataset()
    
    # Filter cardio exercises
    df_cardio = filter_cardio_exercises(df)
    
    # Clean and enrich
    df_clean = clean_and_enrich_data(df_cardio)
    
    # Create exercise database
    exercises = create_exercise_database(df_clean)
    
    # Create training dataset
    training_df = create_training_dataset(df_clean)
    
    # Generate synthetic user profiles
    profiles_df = generate_synthetic_user_profiles(10000)
    
    print("\n" + "=" * 80)
    print("✅ PREPROCESSING COMPLETE!")
    print("=" * 80)
    print(f"📊 Exercise Database: {len(exercises)} exercises")
    print(f"📊 Training Data: {len(training_df):,} exercise instances")
    print(f"📊 User Profiles: {len(profiles_df):,} synthetic users")
    print(f"\n➡️ Next step: Run 3_train_deep_model.py")
    print("=" * 80)

if __name__ == "__main__":
    main()
