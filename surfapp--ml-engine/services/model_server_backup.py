from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
import json
import csv
from datetime import datetime
import pandas as pd
import sys

# Add training directory to path for workout_templates
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'training'))
from workout_templates import generate_3_plan_variations, get_exercise_pool_by_goal


BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'models'))
CSV_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'data', 'cardio_plans_1000.csv'))


class AdaptiveAdjustments(BaseModel):
    intensityAdjustment: int = 0
    restMultiplierAdjustment: float = 0.0
    setsAdjustment: int = 0
    exerciseDifficultyAdjustment: str = 'same'  # 'easier' | 'same' | 'harder'

class PredictRequest(BaseModel):
    skillLevel: str
    goal: list[str]  # Now accepts multiple goals as array
    # Optional user details that can help personalize recommendations
    # e.g. {"bmi": 22.5, "age": 32, "weight": 72.5, "height": 175}
    userDetails: dict = None
    # New fields for template-based generation
    durationRange: str = None  # '5-10 minutes', '10-20 minutes', '20+ minutes'
    limitations: list[str] = None  # List of limitations
    adaptiveAdjustments: dict = None  # Adaptive adjustments from user history


app = FastAPI(title='Surf AI Model Server')

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_safe(filename):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    return joblib.load(path)


# Load artifacts once at startup
try:
    model = load_safe('recommender_model.joblib')
    skill_encoder = load_safe('skill_encoder.joblib')
    goal_encoder = load_safe('goal_encoder.joblib')
    exercise_encoder = load_safe('exercise_encoder.joblib')
    
    # Load CSV data for structured plan details
    plans_df = None
    if os.path.exists(CSV_PATH):
        try:
            plans_df = pd.read_csv(CSV_PATH)
        except Exception as e:
            print(f"Warning: Could not load CSV data: {e}")
except Exception as e:
    # If startup fails, we still create the app but raise on requests
    model = None
    skill_encoder = None
    goal_encoder = None
    exercise_encoder = None
    plans_df = None
    startup_error = str(e)
else:
    startup_error = None


@app.get('/health')
def health():
    return {"status": "ok", "modelLoaded": model is not None}


@app.post('/predict')
def predict(req: PredictRequest):
    if startup_error:
        raise HTTPException(status_code=500, detail={"error": "Model server startup error", "details": startup_error})

    try:
        # Use template-based generation if durationRange is provided
        if req.durationRange:
            # Map ML goals to quiz goals
            goal_mapping = {
                'Endurance': 'Improve endurance',
                'Power': 'Improve explosive pop-up speed',
                'Fat Loss': 'Improve endurance',
                'Stamina': 'Improve endurance',
            }
            
            # Get primary goal and map it
            primary_goal = req.goal[0] if isinstance(req.goal, list) and len(req.goal) > 0 else req.goal
            quiz_goal = goal_mapping.get(primary_goal, 'Improve endurance')
            
            # Extract BMI/height/weight from userDetails
            height = None
            weight = None
            bmi = None
            if req.userDetails and isinstance(req.userDetails, dict):
                height = req.userDetails.get('height')
                weight = req.userDetails.get('weight')
                bmi = req.userDetails.get('bmi')
            
            # Extract adaptive adjustments
            adaptive_adjustments = None
            if req.adaptiveAdjustments and isinstance(req.adaptiveAdjustments, dict):
                adaptive_adjustments = {
                    'rest_multiplier_adjustment': req.adaptiveAdjustments.get('restMultiplierAdjustment', 0),
                    'sets_adjustment': req.adaptiveAdjustments.get('setsAdjustment', 0),
                    'exercise_difficulty': req.adaptiveAdjustments.get('exerciseDifficultyAdjustment', 'same'),
                }
            
            # Generate 3 plan variations using templates with BMI integration and adaptive adjustments
            recommended_plans = generate_3_plan_variations(
                skill_level=req.skillLevel,
                goal=quiz_goal,
                duration_range=req.durationRange,
                limitations=req.limitations if req.limitations else None,
                height=height,
                weight=weight,
                bmi=bmi,
                adaptive_adjustments=adaptive_adjustments
            )
            
            return {
                "recommendedPlans": recommended_plans,
                "recommendedExercises": [plan['exercises'] for plan in recommended_plans],
                "meta": {
                    "modelVersion": "v2.0-template",
                    "timestamp": datetime.utcnow().isoformat() + 'Z',
                    "method": "template-based"
                }
            }
        
        # Fallback to ML model if durationRange not provided (backward compatibility)
        skill_encoded = skill_encoder.transform([req.skillLevel])[0]
        primary_goal = req.goal[0] if isinstance(req.goal, list) and len(req.goal) > 0 else req.goal
        all_goals = req.goal if isinstance(req.goal, list) else [req.goal]
        
        try:
            goal_encoded = goal_encoder.transform([primary_goal])[0]
        except Exception:
            goal_encoded = goal_encoder.transform(['Endurance'])[0]

        features = [skill_encoded, goal_encoded]

        model_n = getattr(model, 'n_features_in_', None)
        numeric_keys = ['bmi', 'age', 'weight', 'height']
        if req.userDetails and isinstance(req.userDetails, dict):
            for k in numeric_keys:
                if k in req.userDetails:
                    try:
                        v = float(req.userDetails[k])
                        features.append(v)
                    except Exception:
                        pass

        if model_n is not None:
            if len(features) > model_n:
                features = features[:model_n]
            elif model_n > len(features):
                needed = model_n - len(features)
                features.extend([0.0] * needed)

        prediction_code = model.predict([features])
        predicted = exercise_encoder.inverse_transform(prediction_code)
        if hasattr(predicted, '__iter__') and not isinstance(predicted, str):
            recommended = list(predicted)
        else:
            recommended = [predicted]

        # Generate 3 plans from ML predictions
        recommended_plans = []
        for idx, exercise_str in enumerate(recommended[:3]):
            exercises_list = exercise_str.split(';') if isinstance(exercise_str, str) else [str(exercise_str)]
            goals_str = ', '.join(all_goals) if isinstance(all_goals, list) else str(all_goals)
            plan = {
                "planName": f"{req.skillLevel} {goals_str} Plan #{idx + 1}",
                "skillLevel": req.skillLevel,
                "goal": goals_str,
                "equipment": "None",
                "durationMinutes": 30,
                "focus": goals_str,
                "exercises": exercises_list
            }
            recommended_plans.append(plan)

        return {
            "recommendedPlans": recommended_plans,
            "recommendedExercises": recommended,
            "meta": {"modelVersion": "v1.0", "timestamp": datetime.utcnow().isoformat() + 'Z', "usedFeatures": len(features), "method": "ml-based"}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "Prediction failed", "details": str(e)})
