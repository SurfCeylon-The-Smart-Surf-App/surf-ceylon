"""
Cardio ML Server - Deep Learning Based Workout Recommendation
CLI mode for on-demand predictions (spawned by Node.js)

Usage:
  python cardio_ml_server.py

Input (stdin JSON):
  {"skillLevel": "intermediate", "goal": "endurance", "equipment": "none", "height": 170, "weight": 70}

Output (stdout JSON):
  {"plans": [...]}
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent / "training"))

import numpy as np
import json
import pickle
import tensorflow as tf
from tensorflow import keras

from cardio_config import *

# ============================================================================
# LOAD MODEL AND ARTIFACTS
# ============================================================================

# Load trained model
model = keras.models.load_model(MODEL_PATH)

# Load encoders
with open(ENCODER_PATH, 'rb') as f:
    artifacts = pickle.load(f)

exercise_encoder = artifacts['exercise_encoder']
fitness_encoder = artifacts['fitness_encoder']
goal_encoder = artifacts['goal_encoder']
equipment_encoder = artifacts['equipment_encoder']
bmi_encoder = artifacts['bmi_encoder']
scaler = artifacts['scaler']

# Load exercise database
with open(EXERCISE_DB_PATH, 'r') as f:
    exercise_database = json.load(f)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def normalize_string(s):
    """Normalize string input"""
    return s.strip().lower() if isinstance(s, str) else str(s).lower()

def get_user_features(user_profile):
    """Extract and encode user features"""
    # Extract from quiz answers
    fitness_level = normalize_string(user_profile.get('skillLevel', user_profile.get('fitnessLevel', 'intermediate')))
    goal = normalize_string(user_profile.get('goal', 'endurance'))
    equipment = normalize_string(user_profile.get('equipment', 'none'))
    height = float(user_profile.get('height', 170))
    weight = float(user_profile.get('weight', 70))
    bmi_category = get_bmi_category(height, weight)
    
    # Encode categorical features
    try:
        fitness_encoded = fitness_encoder.transform([fitness_level])[0]
    except:
        fitness_encoded = fitness_encoder.transform(['intermediate'])[0]
    
    try:
        goal_encoded = goal_encoder.transform([goal])[0]
    except:
        goal_encoded = goal_encoder.transform(['endurance'])[0]
    
    try:
        equipment_encoded = equipment_encoder.transform([equipment])[0]
    except:
        equipment_encoded = equipment_encoder.transform(['none'])[0]
    
    try:
        bmi_encoded = bmi_encoder.transform([bmi_category])[0]
    except:
        bmi_encoded = bmi_encoder.transform(['normal'])[0]
    
    # Normalize numerical features
    numerical_features = scaler.transform([[height, weight]])[0]
    
    return {
        'fitness': fitness_encoded,
        'goal': goal_encoded,
        'equipment': equipment_encoded,
        'bmi': bmi_encoded,
        'numerical': numerical_features,
        'raw': {
            'fitness_level': fitness_level,
            'goal': goal,
            'equipment': equipment,
            'height': height,
            'weight': weight,
            'bmi_category': bmi_category
        }
    }

def predict_exercise_scores(user_features, exercise_names):
    """Predict suitability scores for exercises"""
    n = len(exercise_names)
    
    # Encode exercises
    exercise_encoded = []
    valid_indices = []
    
    for i, ex_name in enumerate(exercise_names):
        try:
            enc = exercise_encoder.transform([ex_name])[0]
            exercise_encoded.append(enc)
            valid_indices.append(i)
        except:
            # Exercise not in training set, skip
            pass
    
    if len(exercise_encoded) == 0:
        return {}
    
    # Prepare batch inputs
    batch_size = len(exercise_encoded)
    
    X = {
        'user_fitness': np.array([user_features['fitness']] * batch_size),
        'user_goal': np.array([user_features['goal']] * batch_size),
        'user_equipment': np.array([user_features['equipment']] * batch_size),
        'user_bmi': np.array([user_features['bmi']] * batch_size),
        'user_numerical': np.array([user_features['numerical']] * batch_size),
        'exercise': np.array(exercise_encoded)
    }
    
    # Predict
    scores = model.predict(X, verbose=0).flatten()
    
    # Map scores to exercise names
    result = {}
    for i, idx in enumerate(valid_indices):
        result[exercise_names[idx]] = float(scores[i])
    
    return result

def filter_exercises_by_constraints(user_profile):
    """Filter exercises based on user constraints"""
    filtered = []
    
    fitness_level = normalize_string(user_profile.get('skillLevel', user_profile.get('fitnessLevel', 'intermediate')))
    goal = normalize_string(user_profile.get('goal', 'endurance'))
    equipment = normalize_string(user_profile.get('equipment', 'none'))
    limitations = user_profile.get('limitations', [])
    
    for exercise in exercise_database:
        # Check fitness level
        if fitness_level not in [normalize_string(lvl) for lvl in exercise.get('fitness_levels', [])]:
            continue
        
        # Check goal
        if goal not in [normalize_string(g) for g in exercise.get('goals', [])]:
            continue
        
        # Check equipment
        if equipment not in [normalize_string(eq) for eq in exercise.get('equipment', [])]:
            continue
        
        # Filter by limitations (basic implementation)
        exercise_name_lower = exercise['name'].lower()
        skip = False
        for limitation in limitations:
            if 'knee' in limitation.lower() and 'knee' in exercise_name_lower:
                skip = True
            if 'back' in limitation.lower() and ('deadlift' in exercise_name_lower or 'row' in exercise_name_lower):
                skip = True
            if 'shoulder' in limitation.lower() and 'shoulder' in exercise_name_lower:
                skip = True
        
        if skip:
            continue
        
        filtered.append(exercise)
    
    return filtered

def build_workout_plan(recommended_exercises, duration_minutes, goal, strategy='balanced'):
    """Build structured workout plan from recommended exercises with strategy"""
    
    # Adjust parameters based on strategy
    if strategy == 'strength':
        sets_base = 4
        rest_time = 60
        intensity_filter = ['high', 'very high', 'moderate']
    elif strategy == 'endurance':
        sets_base = 5
        rest_time = 30
        intensity_filter = ['low', 'moderate', 'medium']
    else:  # balanced
        sets_base = 3
        rest_time = 45
        intensity_filter = None
    
    # Filter by intensity if needed
    if intensity_filter:
        filtered_exercises = [ex for ex in recommended_exercises 
                            if ex.get('intensity', 'moderate').lower() in intensity_filter]
        if len(filtered_exercises) < 4:
            filtered_exercises = recommended_exercises
    else:
        filtered_exercises = recommended_exercises
    
    plan = {
        'planName': f"{goal.title()} {strategy.title()} Workout",
        'exercises': [],
        'totalDuration': duration_minutes,
        'estimatedCalories': int(duration_minutes * 7),  # Rough estimate
        'strategy': strategy
    }
    
    # Select exercises based on duration
    if duration_minutes <= 10:
        n_exercises = 5
    elif duration_minutes <= 20:
        n_exercises = 7
    else:
        n_exercises = 10
    
    # Take top N exercises
    selected = filtered_exercises[:min(n_exercises, len(filtered_exercises))]
    
    # Distribute time across exercises
    time_per_exercise = duration_minutes * 60 // len(selected) if selected else 0
    
    for exercise in selected:
        plan['exercises'].append({
            'name': exercise['name'],
            'sets': exercise.get('sets', sets_base),
            'reps': exercise.get('reps', 12),
            'duration': time_per_exercise,
            'rest': rest_time,
            'intensity': exercise.get('intensity', 'moderate'),
            'description': exercise.get('description', '')[:200]  # Truncate
        })
    
    return plan

# ============================================================================
# MAIN CLI FUNCTION
# ============================================================================

def main():
    """Main CLI function - reads JSON from stdin, prints JSON to stdout"""
    try:
        # Read JSON input from stdin
        data = json.loads(sys.stdin.read())
        
        # Parse duration
        duration_range = data.get('duration', data.get('durationRange', '10-20'))
        if duration_range in DURATION_RANGES:
            duration_minutes = DURATION_RANGES[duration_range][1]  # Use max
        else:
            duration_minutes = 15
        
        # Get user features
        user_features = get_user_features(data)
        
        # Filter exercises by constraints
        candidate_exercises = filter_exercises_by_constraints(data)
        
        if len(candidate_exercises) == 0:
            # Fallback: relax constraints
            candidate_exercises = exercise_database[:200]
        
        # Predict scores for candidates
        exercise_names = [ex['name'] for ex in candidate_exercises]
        scores = predict_exercise_scores(user_features, exercise_names)
        
        # Rank exercises by score
        scored_exercises = []
        for exercise in candidate_exercises:
            if exercise['name'] in scores:
                scored_exercises.append({
                    **exercise,
                    'score': scores[exercise['name']]
                })
        
        # Sort by score (descending)
        scored_exercises.sort(key=lambda x: x['score'], reverse=True)
        
        # Generate 3 DIVERSE workout plans
        plans = []
        
        # Plan 1: BALANCED - Top ML recommendations
        plan1 = build_workout_plan(
            scored_exercises,
            duration_minutes,
            user_features['raw']['goal'],
            strategy='balanced'
        )
        plan1['planName'] = f"{user_features['raw']['fitness_level'].title()} Balanced Workout"
        plan1['description'] = "AI-optimized balanced workout based on your profile"
        plan1['strategy'] = 'balanced'
        plans.append(plan1)
        
        # Plan 2: STRENGTH FOCUS - Prioritize high-intensity exercises
        strength_exercises = [ex for ex in scored_exercises if ex.get('intensity', 'medium') in ['high', 'very high']]
        if len(strength_exercises) < 5:
            strength_exercises = scored_exercises[:20]
        plan2 = build_workout_plan(
            strength_exercises,
            duration_minutes,
            user_features['raw']['goal'],
            strategy='strength'
        )
        plan2['planName'] = f"{user_features['raw']['fitness_level'].title()} Strength Focus"
        plan2['description'] = "High-intensity strength-building workout"
        plan2['strategy'] = 'strength'
        plans.append(plan2)
        
        # Plan 3: ENDURANCE FOCUS - Prioritize medium-intensity, longer duration
        endurance_exercises = [ex for ex in scored_exercises if ex.get('intensity', 'medium') in ['low', 'medium']]
        if len(endurance_exercises) < 5:
            endurance_exercises = scored_exercises[10:30]
        plan3 = build_workout_plan(
            endurance_exercises,
            duration_minutes,
            user_features['raw']['goal'],
            strategy='endurance'
        )
        plan3['planName'] = f"{user_features['raw']['fitness_level'].title()} Endurance Builder"
        plan3['description'] = "Sustained cardio for endurance improvement"
        plan3['strategy'] = 'endurance'
        plans.append(plan3)
        
        # Add metadata to all plans
        for i, plan in enumerate(plans, 1):
            plan['planId'] = i
            plan['skillLevel'] = user_features['raw']['fitness_level']
            plan['goal'] = user_features['raw']['goal']
            plan['equipment'] = user_features['raw']['equipment']
            plan['durationMinutes'] = duration_minutes
            plan['mlGenerated'] = True
            plan['modelVersion'] = 'v2_enhanced_deep_learning'
            plan['confidence'] = scored_exercises[0]['score'] if scored_exercises else 0.85
        
        # Print result as JSON to stdout
        print(json.dumps({'plans': plans}))
        sys.exit(0)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(e)}'
        }))
        sys.exit(1)
    
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'message': 'Failed to generate recommendation'
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()

