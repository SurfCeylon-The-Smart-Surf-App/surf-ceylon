# smart_workout_templates.py
"""
Professional Cardio Workout Template Generator
Generates truly personalized, diverse workout plans using ALL quiz data
"""

import random
import math
from typing import List, Dict, Tuple, Optional

# ============================================================================
# EXERCISE DATABASE WITH FULL METADATA
# ============================================================================

EXERCISES_DB = {
    # WARM-UP EXERCISES
    'Jumping Jacks': {
        'category': 'warmup', 'duration': 60, 'sets': 2, 'rest': 15,
        'intensity': 'low', 'equipment': 'None',
        'exclude_limitations': [],
        'skill_min': 'Beginner', 'impact': 'medium'
    },
    'Arm Circles': {
        'category': 'warmup', 'duration': 45, 'sets': 2, 'rest': 10,
        'intensity': 'low', 'equipment': 'None',
        'exclude_limitations': ['Shoulder injury', 'Rotator cuff issues'],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    'Leg Swings': {
        'category': 'warmup', 'duration': 60, 'sets': 2, 'rest': 10,
        'intensity': 'low', 'equipment': 'None',
        'exclude_limitations': ['Hip problems', 'Groin injury'],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    'High Knees': {
        'category': 'warmup', 'duration': 45, 'sets': 2, 'rest': 15,
        'intensity': 'medium', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Hip problems'],
        'skill_min': 'Beginner', 'impact': 'medium'
    },
    'Butt Kicks': {
        'category': 'warmup', 'duration': 45, 'sets': 2, 'rest': 15,
        'intensity': 'medium', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Hamstring injury'],
        'skill_min': 'Beginner', 'impact': 'medium'
    },
    'Torso Twists': {
        'category': 'warmup', 'duration': 50, 'sets': 2, 'rest': 10,
        'intensity': 'low', 'equipment': 'None',
        'exclude_limitations': ['Lower back issues'],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    
    # ENDURANCE EXERCISES
    'Brisk Walking': {
        'category': 'endurance', 'duration': 300, 'sets': 2, 'rest': 30,
        'intensity': 'low', 'equipment': 'None',
        'exclude_limitations': ['Ankle injury'],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    'Jogging': {
        'category': 'endurance', 'duration': 240, 'sets': 2, 'rest': 45,
        'intensity': 'medium', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints'],
        'skill_min': 'Beginner', 'impact': 'medium'
    },
    'Cycling': {
        'category': 'endurance', 'duration': 300, 'sets': 2, 'rest': 60,
        'intensity': 'medium', 'equipment': 'Gym',
        'exclude_limitations': ['Knee discomfort'],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    'Swimming': {
        'category': 'endurance', 'duration': 360, 'sets': 2, 'rest': 60,
        'intensity': 'medium', 'equipment': 'Gym',
        'exclude_limitations': ['Shoulder injury', 'Rotator cuff issues'],
        'skill_min': 'Intermediate', 'impact': 'low'
    },
    'Rowing Machine': {
        'category': 'endurance', 'duration': 240, 'sets': 2, 'rest': 60,
        'intensity': 'medium', 'equipment': 'Gym',
        'exclude_limitations': ['Lower back issues', 'Knee discomfort'],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    'Elliptical Trainer': {
        'category': 'endurance', 'duration': 300, 'sets': 2, 'rest': 45,
        'intensity': 'medium', 'equipment': 'Gym',
        'exclude_limitations': [],
        'skill_min': 'Beginner', 'impact': 'low'
    },
    'Stair Climber': {
        'category': 'endurance', 'duration': 180, 'sets': 2, 'rest': 60,
        'intensity': 'high', 'equipment': 'Gym',
        'exclude_limitations': ['Knee discomfort', 'Hip problems'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    'Jump Rope': {
        'category': 'endurance', 'duration': 120, 'sets': 3, 'rest': 30,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints', 'Calf strain'],
        'skill_min': 'Beginner', 'impact': 'high'
    },
    'Steady State Running': {
        'category': 'endurance', 'duration': 480, 'sets': 1, 'rest': 0,
        'intensity': 'medium', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    'Long Distance Running': {
        'category': 'endurance', 'duration': 900, 'sets': 1, 'rest': 0,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints', 'Hip problems'],
        'skill_min': 'Pro', 'impact': 'high'
    },
    
    # POWER EXERCISES
    'Burpees': {
        'category': 'power', 'duration': 45, 'sets': 3, 'rest': 45,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Wrist pain', 'Shoulder injury', 'Knee discomfort', 'Lower back issues'],
        'skill_min': 'Beginner', 'impact': 'high'
    },
    'Jump Squats': {
        'category': 'power', 'duration': 40, 'sets': 3, 'rest': 45,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Hip problems'],
        'skill_min': 'Beginner', 'impact': 'high'
    },
    'Box Jumps': {
        'category': 'power', 'duration': 45, 'sets': 3, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'Gym',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Hip problems', 'Achilles tendon issues'],
        'skill_min': 'Intermediate', 'impact': 'very_high'
    },
    'Tuck Jumps': {
        'category': 'power', 'duration': 30, 'sets': 3, 'rest': 45,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Hip problems', 'Lower back issues'],
        'skill_min': 'Intermediate', 'impact': 'very_high'
    },
    'Medicine Ball Slams': {
        'category': 'power', 'duration': 60, 'sets': 3, 'rest': 45,
        'intensity': 'high', 'equipment': 'Gym',
        'exclude_limitations': ['Shoulder injury', 'Lower back issues', 'Wrist pain'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    'Kettlebell Swings': {
        'category': 'power', 'duration': 90, 'sets': 3, 'rest': 60,
        'intensity': 'high', 'equipment': 'Kettlebell',
        'exclude_limitations': ['Lower back issues', 'Shoulder injury', 'Wrist pain'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    'Plyometric Push-ups': {
        'category': 'power', 'duration': 40, 'sets': 3, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Wrist pain', 'Shoulder injury', 'Elbow pain'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    'Explosive Lunges': {
        'category': 'power', 'duration': 60, 'sets': 3, 'rest': 45,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Hip problems', 'Ankle injury'],
        'skill_min': 'Intermediate', 'impact': 'high'
    },
    'Broad Jumps': {
        'category': 'power', 'duration': 45, 'sets': 3, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Hip problems'],
        'skill_min': 'Intermediate', 'impact': 'very_high'
    },
    'Power Cleans': {
        'category': 'power', 'duration': 90, 'sets': 4, 'rest': 90,
        'intensity': 'very_high', 'equipment': 'Gym',
        'exclude_limitations': ['Wrist pain', 'Shoulder injury', 'Lower back issues', 'Knee discomfort'],
        'skill_min': 'Pro', 'impact': 'high'
    },
    
    # STAMINA/HIIT EXERCISES
    'Mountain Climbers': {
        'category': 'stamina', 'duration': 60, 'sets': 3, 'rest': 30,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Wrist pain', 'Shoulder injury', 'Hip problems'],
        'skill_min': 'Beginner', 'impact': 'medium'
    },
    'HIIT Sprints': {
        'category': 'stamina', 'duration': 120, 'sets': 3, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints', 'Hip problems'],
        'skill_min': 'Intermediate', 'impact': 'high'
    },
    'Battle Ropes': {
        'category': 'stamina', 'duration': 45, 'sets': 4, 'rest': 45,
        'intensity': 'very_high', 'equipment': 'Gym',
        'exclude_limitations': ['Shoulder injury', 'Elbow pain', 'Wrist pain', 'Lower back issues'],
        'skill_min': 'Intermediate', 'impact': 'low'
    },
    'Assault Bike': {
        'category': 'stamina', 'duration': 120, 'sets': 3, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'Gym',
        'exclude_limitations': ['Knee discomfort'],
        'skill_min': 'Intermediate', 'impact': 'low'
    },
    'Shuttle Runs': {
        'category': 'stamina', 'duration': 120, 'sets': 3, 'rest': 45,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints'],
        'skill_min': 'Beginner', 'impact': 'high'
    },
    'Tabata Intervals': {
        'category': 'stamina', 'duration': 240, 'sets': 2, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': [],
        'skill_min': 'Intermediate', 'impact': 'high'
    },
    'Circuit Training': {
        'category': 'stamina', 'duration': 360, 'sets': 2, 'rest': 90,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': [],
        'skill_min': 'Beginner', 'impact': 'medium'
    },
    'Interval Running': {
        'category': 'stamina', 'duration': 240, 'sets': 2, 'rest': 60,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints'],
        'skill_min': 'Intermediate', 'impact': 'high'
    },
    'Rowing Intervals': {
        'category': 'stamina', 'duration': 180, 'sets': 3, 'rest': 60,
        'intensity': 'high', 'equipment': 'Gym',
        'exclude_limitations': ['Lower back issues', 'Knee discomfort'],
        'skill_min': 'Intermediate', 'impact': 'low'
    },
    'Fartlek Training': {
        'category': 'stamina', 'duration': 360, 'sets': 2, 'rest': 90,
        'intensity': 'high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    
    # FAT LOSS EXERCISES
    'Sprint Intervals': {
        'category': 'fatloss', 'duration': 120, 'sets': 4, 'rest': 45,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Shin splints'],
        'skill_min': 'Intermediate', 'impact': 'high'
    },
    'Jumping Burpees': {
        'category': 'fatloss', 'duration': 45, 'sets': 4, 'rest': 45,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Wrist pain', 'Shoulder injury', 'Knee discomfort', 'Ankle injury'],
        'skill_min': 'Intermediate', 'impact': 'very_high'
    },
    'High Intensity Cycling': {
        'category': 'fatloss', 'duration': 180, 'sets': 3, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'Gym',
        'exclude_limitations': ['Knee discomfort'],
        'skill_min': 'Intermediate', 'impact': 'low'
    },
    'Kettlebell HIIT': {
        'category': 'fatloss', 'duration': 120, 'sets': 4, 'rest': 60,
        'intensity': 'very_high', 'equipment': 'Kettlebell',
        'exclude_limitations': ['Lower back issues', 'Shoulder injury', 'Wrist pain'],
        'skill_min': 'Intermediate', 'impact': 'medium'
    },
    'Jump Rope HIIT': {
        'category': 'fatloss', 'duration': 90, 'sets': 4, 'rest': 30,
        'intensity': 'very_high', 'equipment': 'None',
        'exclude_limitations': ['Knee discomfort', 'Ankle injury', 'Calf strain'],
        'skill_min': 'Beginner', 'impact': 'high'
    }
}

# ============================================================================
# GOAL-TO-CATEGORY MAPPING
# ============================================================================

GOAL_CATEGORIES = {
    'Warm up only': {
        'primary': ['warmup'],
        'secondary': [],
        'warmup_ratio': 1.0,
        'rest_multiplier': 1.2
    },
    'Improve endurance': {
        'primary': ['endurance'],
        'secondary': ['warmup', 'stamina'],
        'warmup_ratio': 0.15,
        'rest_multiplier': 0.8
    },
    'Improve explosive pop-up speed': {
        'primary': ['power'],
        'secondary': ['warmup', 'stamina'],
        'warmup_ratio': 0.15,
        'rest_multiplier': 1.2
    },
    'Build stamina': {
        'primary': ['stamina', 'endurance'],
        'secondary': ['warmup', 'power'],
        'warmup_ratio': 0.15,
        'rest_multiplier': 0.7
    },
    'Fat loss': {
        'primary': ['fatloss', 'stamina'],
        'secondary': ['warmup', 'power'],
        'warmup_ratio': 0.1,
        'rest_multiplier': 0.6
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_bmi_category(height_cm: float, weight_kg: float) -> str:
    """Calculate BMI category"""
    if height_cm == 0 or weight_kg == 0:
        return 'normal'
    
    bmi = weight_kg / ((height_cm / 100) ** 2)
    
    if bmi < 18.5:
        return 'underweight'
    elif 18.5 <= bmi < 25:
        return 'normal'
    elif 25 <= bmi < 30:
        return 'overweight'
    else:
        return 'obese'

def get_duration_target(duration_range: str) -> int:
    """Get target duration in seconds"""
    mapping = {
        '5-10 minutes': 450,   # 7.5 min
        '10-20 minutes': 900,  # 15 min
        '20+ minutes': 1500    # 25 min
    }
    return mapping.get(duration_range, 900)

def filter_exercises(
    exercises_db: Dict,
    skill_level: str,
    equipment: str,
    limitations: List[str],
    categories: List[str]
) -> List[Tuple[str, Dict]]:
    """Filter exercises based on user constraints"""
    
    skill_order = ['Beginner', 'Intermediate', 'Pro']
    user_skill_index = skill_order.index(skill_level)
    
    filtered = []
    
    for ex_name, ex_data in exercises_db.items():
        # Check skill level
        ex_skill_index = skill_order.index(ex_data['skill_min'])
        if ex_skill_index > user_skill_index:
            continue
        
        # Check equipment
        if ex_data['equipment'] != 'None':
            if equipment == 'None':
                continue
            elif equipment == 'Kettlebell' and ex_data['equipment'] not in ['None', 'Kettlebell']:
                continue
            # Gym has access to everything
        
        # Check limitations
        if any(lim in ex_data['exclude_limitations'] for lim in limitations):
            continue
        
        # Check category
        if ex_data['category'] in categories:
            filtered.append((ex_name, ex_data))
    
    return filtered

# ============================================================================
# MAIN GENERATION FUNCTION
# ============================================================================

def generate_workout_plan(
    skill_level: str,
    goal: str,
    duration_range: str,
    height_cm: float = 0,
    weight_kg: float = 0,
    limitations: List[str] = None,
    equipment: str = 'None',
    adaptive_adjustments: Dict = None,
    variation_type: str = 'balanced'  # 'balanced', 'intensity', 'endurance'
) -> Dict:
    """
    Generate a single, personalized workout plan using ALL quiz data
    
    Args:
        skill_level: Beginner/Intermediate/Pro
        goal: Quiz goal (Warm up only, Improve endurance, etc.)
        duration_range: 5-10 minutes, 10-20 minutes, 20+ minutes
        height_cm: User height for BMI calculation
        weight_kg: User weight for BMI calculation
        limitations: List of physical limitations
        equipment: None/Kettlebell/Gym
        adaptive_adjustments: Dict with intensity/rest/sets adjustments
        variation_type: Type of plan variation to generate
    
    Returns:
        Dict with plan details
    """
    
    if limitations is None:
        limitations = []
    if adaptive_adjustments is None:
        adaptive_adjustments = {}
    
    # Get configurations
    target_duration = get_duration_target(duration_range)
    bmi_category = get_bmi_category(height_cm, weight_kg)
    goal_config = GOAL_CATEGORIES.get(goal, GOAL_CATEGORIES['Improve endurance'])
    
    # Calculate modifiers based on skill, BMI, and adaptive learning
    rest_multiplier = goal_config['rest_multiplier']
    sets_adjustment = adaptive_adjustments.get('setsAdjustment', 0)
    intensity_adjustment = adaptive_adjustments.get('restMultiplierAdjustment', 0)
    
    # BMI adjustments
    if bmi_category == 'overweight' or bmi_category == 'obese':
        rest_multiplier *= 1.3
    elif bmi_category == 'underweight':
        rest_multiplier *= 1.1
    
    # Apply adaptive adjustments
    rest_multiplier *= (1 + intensity_adjustment)
    
    # Variation type adjustments
    if variation_type == 'intensity':
        rest_multiplier *= 0.8
        sets_adjustment += 1
    elif variation_type == 'endurance':
        rest_multiplier *= 1.2
        sets_adjustment -= 1
    
    # Get exercise pools
    all_categories = goal_config['primary'] + goal_config['secondary']
    available_exercises = filter_exercises(
        EXERCISES_DB,
        skill_level,
        equipment,
        limitations,
        all_categories
    )
    
    if not available_exercises:
        # Fallback to basic exercises
        available_exercises = filter_exercises(
            EXERCISES_DB,
            'Beginner',
            'None',
            [],
            ['warmup', 'endurance']
        )
    
    # Separate warm-up and main exercises
    warmup_pool = [(n, d) for n, d in available_exercises if d['category'] == 'warmup']
    main_pool = [(n, d) for n, d in available_exercises if d['category'] in goal_config['primary']]
    secondary_pool = [(n, d) for n, d in available_exercises 
                     if d['category'] in goal_config['secondary'] and d['category'] != 'warmup']
    
    # Build workout
    selected_exercises = []
    total_time = 0
    
    # 1. Add warm-up exercises
    warmup_target = target_duration * goal_config['warmup_ratio']
    warmup_added = 0
    
    random.shuffle(warmup_pool)
    for ex_name, ex_data in warmup_pool[:3]:  # Max 3 warm-up exercises
        if warmup_added >= warmup_target:
            break
        
        duration = ex_data['duration']
        sets = ex_data['sets']
        rest = int(ex_data['rest'] * rest_multiplier)
        
        exercise_time = (duration * sets) + (rest * (sets - 1))
        
        selected_exercises.append(ex_name)
        warmup_added += exercise_time
        total_time += exercise_time
    
    # 2. Add main exercises
    remaining_time = target_duration - total_time
    main_added = 0
    
    # Mix primary and secondary (70% primary, 30% secondary)
    combined_pool = []
    random.shuffle(main_pool)
    random.shuffle(secondary_pool)
    
    for i in range(max(len(main_pool), len(secondary_pool))):
        if i < len(main_pool):
            combined_pool.append(main_pool[i])
        if i < len(secondary_pool) and random.random() < 0.3:  # 30% chance
            combined_pool.append(secondary_pool[i])
    
    for ex_name, ex_data in combined_pool:
        if total_time >= target_duration * 1.1:  # Don't exceed by more than 10%
            break
        
        duration = ex_data['duration']
        sets = max(1, ex_data['sets'] + sets_adjustment)
        rest = int(ex_data['rest'] * rest_multiplier)
        
        exercise_time = (duration * sets) + (rest * (sets - 1))
        
        # Don't add if it overshoots too much
        if total_time + exercise_time > target_duration * 1.15:
            continue
        
        selected_exercises.append(ex_name)
        total_time += exercise_time
    
    # Format result
    exercises_str = ';'.join(selected_exercises)
    actual_duration_min = round(total_time / 60)
    
    # Create descriptive name
    variation_suffix = {
        'balanced': 'Optimized',
        'intensity': 'High Intensity',
        'endurance': 'Endurance Focus'
    }[variation_type]
    
    plan_name = f"{skill_level} {goal} Plan - {variation_suffix}"
    
    return {
        'planName': plan_name,
        'exercises': exercises_str,
        'durationMinutes': actual_duration_min,
        'skillLevel': skill_level,
        'goal': goal,
        'equipment': equipment,
        'focus': goal,
        'bmiCategory': bmi_category
    }

# ============================================================================
# GENERATE 3 DISTINCT VARIATIONS
# ============================================================================

def generate_3_plan_variations(
    skill_level: str,
    goal: str,
    duration_range: str,
    height_cm: float = 0,
    weight_kg: float = 0,
    limitations: List[str] = None,
    equipment: str = 'None',
    adaptive_adjustments: Dict = None
) -> List[Dict]:
    """
    Generate 3 truly different workout plan variations
    """
    
    # Set different random seeds for each variation to ensure diversity
    variations = []
    
    # Plan 1: Balanced (default)
    random.seed(hash(f"{skill_level}{goal}{duration_range}1"))
    plan1 = generate_workout_plan(
        skill_level, goal, duration_range, height_cm, weight_kg,
        limitations, equipment, adaptive_adjustments, 'balanced'
    )
    variations.append(plan1)
    
    # Plan 2: Higher intensity (shorter rest, more sets)
    random.seed(hash(f"{skill_level}{goal}{duration_range}2"))
    plan2 = generate_workout_plan(
        skill_level, goal, duration_range, height_cm, weight_kg,
        limitations, equipment, adaptive_adjustments, 'intensity'
    )
    variations.append(plan2)
    
    # Plan 3: Endurance focus (longer activities, fewer sets)
    random.seed(hash(f"{skill_level}{goal}{duration_range}3"))
    plan3 = generate_workout_plan(
        skill_level, goal, duration_range, height_cm, weight_kg,
        limitations, equipment, adaptive_adjustments, 'endurance'
    )
    variations.append(plan3)
    
    # Reset random seed
    random.seed()
    
    return variations

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Test generation
    test_params = {
        'skill_level': 'Intermediate',
        'goal': 'Improve endurance',
        'duration_range': '10-20 minutes',
        'height_cm': 175,
        'weight_kg': 75,
        'limitations': ['Knee discomfort'],
        'equipment': 'Gym',
        'adaptive_adjustments': {
            'setsAdjustment': 0,
            'restMultiplierAdjustment': 0.1
        }
    }
    
    plans = generate_3_plan_variations(**test_params)
    
    print("✅ Generated 3 distinct workout plans:\n")
    for i, plan in enumerate(plans, 1):
        print(f"Plan {i}: {plan['planName']}")
        print(f"Duration: {plan['durationMinutes']} min")
        print(f"Exercises: {plan['exercises']}")
        print(f"BMI Category: {plan['bmiCategory']}")
        print()