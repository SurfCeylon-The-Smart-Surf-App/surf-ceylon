# model_server.py
"""
Enhanced FastAPI Model Server for Cardio Workout Recommendations
Properly uses ALL quiz data for personalized plan generation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn

# Import the smart template system
from .smart_workout_templates import generate_3_plan_variations, GOAL_CATEGORIES

app = FastAPI(title="SurfApp Cardio ML Engine", version="2.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================


class UserDetails(BaseModel):
    height: Optional[float] = 0
    weight: Optional[float] = 0
    bmi: Optional[float] = None


class AdaptiveAdjustments(BaseModel):
    restMultiplierAdjustment: Optional[float] = 0
    setsAdjustment: Optional[int] = 0
    exerciseDifficultyAdjustment: Optional[str] = "same"


class PredictionRequest(BaseModel):
    skillLevel: str  # Beginner/Intermediate/Pro
    goal: List[str]  # Array of goals from frontend
    userDetails: Optional[UserDetails] = None
    # "5-10 minutes", "10-20 minutes", "20+ minutes"
    durationRange: Optional[str] = None
    limitations: Optional[List[str]] = None
    equipment: Optional[str] = "None"  # None/Kettlebell/Gym
    adaptiveAdjustments: Optional[AdaptiveAdjustments] = None


class WorkoutPlan(BaseModel):
    planName: str
    exercises: str
    durationMinutes: int
    skillLevel: str
    goal: str
    equipment: str
    focus: str
    bmiCategory: Optional[str] = "normal"


class PredictionResponse(BaseModel):
    recommendedPlans: List[WorkoutPlan]

# ============================================================================
# GOAL MAPPING
# ============================================================================


def map_frontend_goals_to_quiz_goal(goals: List[str]) -> str:
    """
    Map frontend ML goals to quiz goals
    Frontend sends: ['Endurance', 'Stamina', etc.]
    Need to convert to: 'Improve endurance', 'Build stamina', etc.
    """

    # Mapping from ML goals to quiz goals
    goal_mapping = {
        'Endurance': 'Improve endurance',
        'Power': 'Improve explosive pop-up speed',
        'Fat Loss': 'Fat loss',
        'Stamina': 'Build stamina',
        'Warmup': 'Warm up only',
        'Warm up': 'Warm up only'
    }

    if not goals:
        return 'Improve endurance'  # Default

    # Take the first goal from the list
    primary_goal = goals[0]

    # Map to quiz goal
    quiz_goal = goal_mapping.get(primary_goal, 'Improve endurance')

    return quiz_goal

# ============================================================================
# MAIN PREDICTION ENDPOINT
# ============================================================================


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Generate 3 personalized workout plan variations
    Uses ALL quiz data: skill, goal, duration, BMI, limitations, equipment
    """

    try:
        # Extract parameters
        skill_level = request.skillLevel
        goals = request.goal
        duration_range = request.durationRange or "10-20 minutes"
        equipment = request.equipment or "None"
        limitations = request.limitations or []

        # Extract user details
        height_cm = 0
        weight_kg = 0
        if request.userDetails:
            height_cm = request.userDetails.height or 0
            weight_kg = request.userDetails.weight or 0

        # Extract adaptive adjustments
        adaptive_adjustments = {}
        if request.adaptiveAdjustments:
            adaptive_adjustments = {
                'restMultiplierAdjustment': request.adaptiveAdjustments.restMultiplierAdjustment,
                'setsAdjustment': request.adaptiveAdjustments.setsAdjustment,
                'exerciseDifficultyAdjustment': request.adaptiveAdjustments.exerciseDifficultyAdjustment
            }

        # Map goals to quiz format
        quiz_goal = map_frontend_goals_to_quiz_goal(goals)

        # Validate quiz goal exists in our system
        if quiz_goal not in GOAL_CATEGORIES:
            print(f"⚠️ Unknown goal '{quiz_goal}', using default")
            quiz_goal = 'Improve endurance'

        print(f"\n🎯 Generating plans for:")
        print(f"   Skill: {skill_level}")
        print(f"   Goal: {quiz_goal}")
        print(f"   Duration: {duration_range}")
        print(f"   Equipment: {equipment}")
        print(f"   BMI: height={height_cm}cm, weight={weight_kg}kg")
        print(f"   Limitations: {limitations}")
        print(f"   Adaptive: {adaptive_adjustments}")

        # Generate 3 truly different plan variations
        plans = generate_3_plan_variations(
            skill_level=skill_level,
            goal=quiz_goal,
            duration_range=duration_range,
            height_cm=height_cm,
            weight_kg=weight_kg,
            limitations=limitations,
            equipment=equipment,
            adaptive_adjustments=adaptive_adjustments
        )

        # Convert to response format
        workout_plans = [
            WorkoutPlan(
                planName=plan['planName'],
                exercises=plan['exercises'],
                durationMinutes=plan['durationMinutes'],
                skillLevel=plan['skillLevel'],
                goal=plan['goal'],
                equipment=plan['equipment'],
                focus=plan['focus'],
                bmiCategory=plan.get('bmiCategory', 'normal')
            )
            for plan in plans
        ]

        print(f"\n✅ Generated {len(workout_plans)} unique plans:")
        for i, plan in enumerate(workout_plans, 1):
            print(f"   {i}. {plan.planName} ({plan.durationMinutes} min)")
            print(f"      {plan.exercises[:100]}...")

        return PredictionResponse(recommendedPlans=workout_plans)

    except Exception as e:
        print(f"\n❌ Error generating plans: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to generate plans: {str(e)}")

# ============================================================================
# HEALTH CHECK
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0",
        "service": "cardio-ml-engine",
        "features": [
            "Smart template generation",
            "BMI-based adjustments",
            "Equipment filtering",
            "Limitation filtering",
            "Adaptive learning",
            "3 unique plan variations"
        ]
    }


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "SurfApp Cardio ML Engine v2.0",
        "endpoints": {
            "POST /predict": "Generate personalized workout plans",
            "GET /health": "Health check",
            "GET /goals": "List available goals"
        },
        "documentation": "/docs"
    }


@app.get("/goals")
async def list_goals():
    """List all available workout goals"""
    return {
        "available_goals": list(GOAL_CATEGORIES.keys()),
        "goal_details": {
            goal: {
                "primary_categories": config['primary'],
                "secondary_categories": config['secondary'],
                "warmup_ratio": config['warmup_ratio']
            }
            for goal, config in GOAL_CATEGORIES.items()
        }
    }

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🏋️ SurfApp Cardio ML Engine v2.0")
    print("="*60)
    print("\n🚀 Starting server on http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    print("\n✨ Features:")
    print("   - Smart template-based generation")
    print("   - Uses ALL 5 quiz questions")
    print("   - BMI-based personalization")
    print("   - Equipment and limitation filtering")
    print("   - Adaptive learning from workout history")
    print("   - Generates 3 truly unique plan variations")
    print("\n" + "="*60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
