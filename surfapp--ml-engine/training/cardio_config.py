"""
Centralized Configuration for Cardio ML System
"""

import os
from pathlib import Path

# ============================================================================
# PATHS
# ============================================================================
BASE_DIR = Path(__file__).parent
ML_ENGINE_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = ML_ENGINE_DIR / "artifacts"
MODELS_DIR = ML_ENGINE_DIR / "models"

# Create directories
DATA_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# ============================================================================
# KAGGLE DATASET
# ============================================================================
KAGGLE_DATASET = "adnanelouardi/600k-fitness-exercise-and-workout-program-dataset"
RAW_DATA_PATH = DATA_DIR / "kaggle_raw"
PROCESSED_DATA_PATH = DATA_DIR / "processed"

# ============================================================================
# MODEL CONFIGURATION
# ============================================================================
MODEL_NAME = "cardio_recommender_v1"
MODEL_PATH = MODELS_DIR / f"{MODEL_NAME}.keras"
EXERCISE_DB_PATH = ARTIFACTS_DIR / "exercise_database.json"
SCALER_PATH = ARTIFACTS_DIR / "user_scaler.pkl"
ENCODER_PATH = ARTIFACTS_DIR / "label_encoders.pkl"

# ============================================================================
# TRAINING PARAMETERS
# ============================================================================
EMBEDDING_DIM = 64
HIDDEN_LAYERS = [256, 128, 64, 32]
DROPOUT_RATE = 0.3
LEARNING_RATE = 0.001
BATCH_SIZE = 64
EPOCHS = 50
VALIDATION_SPLIT = 0.2
EARLY_STOPPING_PATIENCE = 10

# ============================================================================
# QUIZ PARAMETER MAPPINGS
# ============================================================================

# Fitness Levels from frontend quiz
FITNESS_LEVELS = ["beginner", "intermediate", "pro"]

# Goals from frontend quiz
GOALS = ["endurance", "power", "warm-up"]

# Duration ranges from frontend quiz (in minutes)
DURATION_RANGES = {
    "5-10": (5, 10),
    "10-20": (10, 20),
    "20+": (20, 30)
}

# Equipment from frontend quiz
EQUIPMENT_OPTIONS = ["none", "kettlebell", "gym"]

# Physical limitations from frontend quiz
LIMITATIONS = [
    "knee_pain",
    "back_pain",
    "shoulder_injury",
    "heart_condition",
    "asthma",
    "pregnancy",
    "high_blood_pressure",
    "joint_problems"
]

# ============================================================================
# EXERCISE CATEGORIES (from Kaggle dataset)
# ============================================================================

# Primary categories for cardio workouts
CARDIO_CATEGORIES = [
    "cardio",
    "hiit",
    "circuit training",
    "plyometrics",
    "warmup",
    "cooldown"
]

# Exercise intensity levels
INTENSITY_LEVELS = ["low", "moderate", "high", "very_high"]

# ============================================================================
# BMI CATEGORIES
# ============================================================================
def get_bmi_category(height_cm, weight_kg):
    """Calculate BMI category"""
    if not height_cm or not weight_kg:
        return "normal"
    
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    
    if bmi < 18.5:
        return "underweight"
    elif bmi < 25:
        return "normal"
    elif bmi < 30:
        return "overweight"
    else:
        return "obese"

# ============================================================================
# EQUIPMENT MAPPING (Kaggle → Frontend)
# ============================================================================
EQUIPMENT_MAPPING = {
    "none": ["bodyweight", "no equipment", "none"],
    "kettlebell": ["kettlebell", "dumbbell", "free weights"],
    "gym": ["machine", "cable", "barbell", "equipment", "gym"]
}

# ============================================================================
# RECOMMENDATION SETTINGS
# ============================================================================
TOP_K_EXERCISES = 20  # Retrieve top K exercises per user
MIN_EXERCISES_PER_PLAN = 4
MAX_EXERCISES_PER_PLAN = 8
DIVERSITY_WEIGHT = 0.3  # Balance between relevance and diversity

print(f"✅ Config loaded: Models → {MODELS_DIR}")
print(f"✅ Exercise DB → {EXERCISE_DB_PATH}")
