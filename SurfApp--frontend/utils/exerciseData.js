/**
 * Enhanced Exercise Data Mapping
 * Contains duration, rest, sets, description, calorie estimation, and limitation exclusions
 */

/**
 * @typedef {Object} ExerciseData
 * @property {string} name
 * @property {number} duration - seconds
 * @property {number} rest - seconds
 * @property {number} sets
 * @property {string} description
 * @property {string[]} excludedLimitations - Limitations that should exclude this exercise
 * @property {string} [icon] - Material icon name
 * @property {('lottie'|'gif'|'video')} [animationType] - Type of animation
 * @property {any} [animationSource] - Animation source (require() path)
 * @property {number} [caloriesPerMinute] - Estimated calories burned per minute
 * @property {('beginner'|'intermediate'|'advanced')} [difficulty] - Exercise difficulty
 * @property {string[]} [muscleGroups] - Target muscle groups
 * @property {('None'|'Kettlebell'|'Gym')} [equipment] - Required equipment
 * @property {('low'|'moderate'|'high'|'very-high')} [intensity] - Exercise intensity
 * @property {('warmup'|'endurance'|'power'|'stamina'|'fatLoss')} [category] - Exercise category
 */

// Limitation categories
export const LIMITATION_CATEGORIES = {
  KNEE: ['Knee discomfort', 'Knee injury', 'Knee surgery recovery'],
  BACK: ['Lower back tightness', 'Lower back pain', 'Upper back pain'],
  SHOULDER: ['Shoulder injury', 'Shoulder pain', 'Rotator cuff issues'],
  ANKLE: ['Ankle injury', 'Ankle pain', 'Ankle instability'],
  WRIST: ['Wrist injury', 'Wrist pain', 'Carpal tunnel'],
  HIP: ['Hip discomfort', 'Hip pain', 'Hip injury'],
  RESPIRATORY: ['Asthma', 'Breathing difficulties'],
  CARDIOVASCULAR: ['Heart conditions', 'High blood pressure'],
  NECK: ['Neck pain', 'Neck injury'],
  ELBOW: ['Elbow pain', 'Tennis elbow', 'Golfer\'s elbow'],
};

// ✅ NEW: Calorie estimation constants (calories per minute)
const CALORIE_RATES = {
  LOW_INTENSITY: 5,      // Walking, stretching
  MODERATE: 8,           // Jogging, cycling
  HIGH: 12,              // Running, HIIT
  VERY_HIGH: 15,         // Sprints, burpees, intense cardio
};

// Exercise data mapping with enhanced metadata
/** @type {Record<string, ExerciseData>} */
export const EXERCISE_DATA = {
  // ========== WARM-UP EXERCISES ==========
  'Jumping Jacks': {
    name: 'Jumping Jacks',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Stand with feet together, jump while spreading legs and raising arms overhead',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 8,
    difficulty: 'beginner',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'warmup',
  },
  'Arm Circles': {
    name: 'Arm Circles',
    duration: 30,
    rest: 10,
    sets: 2,
    description: 'Stand with arms extended, rotate arms in large circles forward and backward',
    excludedLimitations: [...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.ELBOW],
    caloriesPerMinute: 3,
    difficulty: 'beginner',
    muscleGroups: ['Shoulders', 'Arms'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Leg Swings': {
    name: 'Leg Swings',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Hold onto support, swing leg forward and backward to warm up hip flexors',
    excludedLimitations: [...LIMITATION_CATEGORIES.HIP, ...LIMITATION_CATEGORIES.KNEE],
    caloriesPerMinute: 4,
    difficulty: 'beginner',
    muscleGroups: ['Hip Flexors', 'Legs'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Torso Twists': {
    name: 'Torso Twists',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Stand with feet shoulder-width apart, rotate torso left and right',
    excludedLimitations: [...LIMITATION_CATEGORIES.BACK, ...LIMITATION_CATEGORIES.NECK],
    caloriesPerMinute: 4,
    difficulty: 'beginner',
    muscleGroups: ['Core', 'Obliques'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Neck Rolls': {
    name: 'Neck Rolls',
    duration: 20,
    rest: 10,
    sets: 2,
    description: 'Gently roll neck in circular motion to release tension',
    excludedLimitations: [...LIMITATION_CATEGORIES.NECK],
    caloriesPerMinute: 2,
    difficulty: 'beginner',
    muscleGroups: ['Neck'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Shoulder Rotations': {
    name: 'Shoulder Rotations',
    duration: 30,
    rest: 10,
    sets: 2,
    description: 'Rotate shoulders forward and backward in circular motion',
    excludedLimitations: [...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.ELBOW],
    caloriesPerMinute: 3,
    difficulty: 'beginner',
    muscleGroups: ['Shoulders'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Hip Circles': {
    name: 'Hip Circles',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Stand on one leg, rotate hip in circular motion',
    excludedLimitations: [...LIMITATION_CATEGORIES.HIP, ...LIMITATION_CATEGORIES.KNEE],
    caloriesPerMinute: 4,
    difficulty: 'beginner',
    muscleGroups: ['Hips', 'Core'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Ankle Rotations': {
    name: 'Ankle Rotations',
    duration: 20,
    rest: 10,
    sets: 2,
    description: 'Lift foot and rotate ankle in circular motion',
    excludedLimitations: [...LIMITATION_CATEGORIES.ANKLE],
    caloriesPerMinute: 2,
    difficulty: 'beginner',
    muscleGroups: ['Ankles'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Walking Lunges': {
    name: 'Walking Lunges',
    duration: 45,
    rest: 30,
    sets: 2,
    description: 'Step forward into lunge position, alternate legs while walking forward',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.HIP, ...LIMITATION_CATEGORIES.ANKLE],
    caloriesPerMinute: 7,
    difficulty: 'intermediate',
    muscleGroups: ['Legs', 'Glutes', 'Core'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'warmup',
  },
  'Butt Kicks': {
    name: 'Butt Kicks',
    duration: 30,
    rest: 20,
    sets: 2,
    description: 'Run in place, kicking heels toward glutes',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 9,
    difficulty: 'beginner',
    muscleGroups: ['Hamstrings', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'warmup',
  },
  'High Knees': {
    name: 'High Knees',
    duration: 30,
    rest: 20,
    sets: 2,
    description: 'Run in place, lifting knees toward chest',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.HIP, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 10,
    difficulty: 'intermediate',
    muscleGroups: ['Hip Flexors', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'warmup',
  },
  'Side Steps': {
    name: 'Side Steps',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Step sideways, bringing feet together, repeat in both directions',
    excludedLimitations: [...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.KNEE],
    caloriesPerMinute: 6,
    difficulty: 'beginner',
    muscleGroups: ['Legs', 'Glutes'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'warmup',
  },
  'Knee Hugs': {
    name: 'Knee Hugs',
    duration: 20,
    rest: 10,
    sets: 2,
    description: 'Stand and pull knee to chest, hold briefly, alternate legs',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.HIP, ...LIMITATION_CATEGORIES.BACK],
    caloriesPerMinute: 3,
    difficulty: 'beginner',
    muscleGroups: ['Hip Flexors', 'Glutes'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Quad Stretches': {
    name: 'Quad Stretches',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Stand and pull foot toward glutes, hold stretch',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE],
    caloriesPerMinute: 2,
    difficulty: 'beginner',
    muscleGroups: ['Quadriceps'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },
  'Hamstring Stretches': {
    name: 'Hamstring Stretches',
    duration: 30,
    rest: 15,
    sets: 2,
    description: 'Sit or stand, extend leg and lean forward to stretch hamstring',
    excludedLimitations: [...LIMITATION_CATEGORIES.BACK],
    caloriesPerMinute: 2,
    difficulty: 'beginner',
    muscleGroups: ['Hamstrings'],
    equipment: 'None',
    intensity: 'low',
    category: 'warmup',
  },

  // ========== ENDURANCE EXERCISES ==========
  'Jogging': {
    name: 'Jogging',
    duration: 180,
    rest: 60,
    sets: 1,
    description: 'Light running at comfortable pace',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY, ...LIMITATION_CATEGORIES.CARDIOVASCULAR],
    caloriesPerMinute: 10,
    difficulty: 'beginner',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Cycling': {
    name: 'Cycling',
    duration: 300,
    rest: 60,
    sets: 1,
    description: 'Stationary or outdoor cycling',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.BACK],
    caloriesPerMinute: 8,
    difficulty: 'beginner',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Swimming': {
    name: 'Swimming',
    duration: 300,
    rest: 60,
    sets: 1,
    description: 'Swim laps at moderate pace',
    excludedLimitations: [...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 11,
    difficulty: 'intermediate',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Rowing Machine': {
    name: 'Rowing Machine',
    duration: 180,
    rest: 60,
    sets: 2,
    description: 'Rowing machine at moderate intensity',
    excludedLimitations: [...LIMITATION_CATEGORIES.BACK, ...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.WRIST],
    caloriesPerMinute: 10,
    difficulty: 'intermediate',
    muscleGroups: ['Back', 'Arms', 'Legs', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Elliptical Trainer': {
    name: 'Elliptical Trainer',
    duration: 300,
    rest: 60,
    sets: 1,
    description: 'Low-impact cardio on elliptical machine',
    excludedLimitations: [],
    caloriesPerMinute: 7,
    difficulty: 'beginner',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Stair Climber': {
    name: 'Stair Climber',
    duration: 180,
    rest: 60,
    sets: 2,
    description: 'Climb stairs at steady pace',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 9,
    difficulty: 'intermediate',
    muscleGroups: ['Legs', 'Glutes', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Jump Rope': {
    name: 'Jump Rope',
    duration: 60,
    rest: 30,
    sets: 3,
    description: 'Jump rope at steady rhythm',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 12,
    difficulty: 'intermediate',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'high',
    category: 'endurance',
  },
  'Walking': {
    name: 'Walking',
    duration: 300,
    rest: 30,
    sets: 1,
    description: 'Brisk walking at moderate pace',
    excludedLimitations: [],
    caloriesPerMinute: 5,
    difficulty: 'beginner',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'low',
    category: 'endurance',
  },
  'Brisk Walking': {
    name: 'Brisk Walking',
    duration: 300,
    rest: 30,
    sets: 1,
    description: 'Fast-paced walking',
    excludedLimitations: [],
    caloriesPerMinute: 6,
    difficulty: 'beginner',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'endurance',
  },
  'Steady State Running': {
    name: 'Steady State Running',
    duration: 600,
    rest: 120,
    sets: 1,
    description: 'Continuous running at steady pace',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY, ...LIMITATION_CATEGORIES.CARDIOVASCULAR],
    caloriesPerMinute: 12,
    difficulty: 'intermediate',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'high',
    category: 'endurance',
  },

  // ========== POWER EXERCISES ==========
  'Burpees': {
    name: 'Burpees',
    duration: 30,
    rest: 30,
    sets: 3,
    description: 'Squat, jump back to plank, push-up, jump forward, jump up',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.BACK, ...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.WRIST, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 15,
    difficulty: 'advanced',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'very-high',
    category: 'power',
  },
  'Box Jumps': {
    name: 'Box Jumps',
    duration: 30,
    rest: 45,
    sets: 3,
    description: 'Jump onto box or platform, step down',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 14,
    difficulty: 'advanced',
    muscleGroups: ['Legs', 'Glutes', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'very-high',
    category: 'power',
  },
  'Kettlebell Swings': {
    name: 'Kettlebell Swings',
    duration: 30,
    rest: 30,
    sets: 3,
    description: 'Swing kettlebell from between legs to chest height',
    excludedLimitations: [...LIMITATION_CATEGORIES.BACK, ...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.WRIST],
    caloriesPerMinute: 13,
    difficulty: 'intermediate',
    muscleGroups: ['Full Body', 'Core'],
    equipment: 'Kettlebell',
    intensity: 'high',
    category: 'power',
  },
  'Jump Squats': {
    name: 'Jump Squats',
    duration: 30,
    rest: 30,
    sets: 3,
    description: 'Squat down, explode up into jump',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.BACK, ...LIMITATION_CATEGORIES.RESPIRATORY],
    caloriesPerMinute: 14,
    difficulty: 'intermediate',
    muscleGroups: ['Legs', 'Glutes', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'very-high',
    category: 'power',
  },

  // ========== STAMINA EXERCISES ==========
  'HIIT Circuit': {
    name: 'HIIT Circuit',
    duration: 30,
    rest: 30,
    sets: 6,
    description: 'High-intensity interval training circuit',
    excludedLimitations: [...LIMITATION_CATEGORIES.RESPIRATORY, ...LIMITATION_CATEGORIES.CARDIOVASCULAR],
    caloriesPerMinute: 15,
    difficulty: 'advanced',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'very-high',
    category: 'stamina',
  },
  'Tabata Intervals': {
    name: 'Tabata Intervals',
    duration: 20,
    rest: 10,
    sets: 8,
    description: '20 seconds work, 10 seconds rest, repeat 8 times',
    excludedLimitations: [...LIMITATION_CATEGORIES.RESPIRATORY, ...LIMITATION_CATEGORIES.CARDIOVASCULAR],
    caloriesPerMinute: 16,
    difficulty: 'advanced',
    muscleGroups: ['Full Body', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'very-high',
    category: 'stamina',
  },

  // ========== FAT LOSS EXERCISES ==========
  'HIIT Sprints': {
    name: 'HIIT Sprints',
    duration: 30,
    rest: 60,
    sets: 6,
    description: 'High-intensity sprint intervals',
    excludedLimitations: [...LIMITATION_CATEGORIES.KNEE, ...LIMITATION_CATEGORIES.ANKLE, ...LIMITATION_CATEGORIES.RESPIRATORY, ...LIMITATION_CATEGORIES.CARDIOVASCULAR],
    caloriesPerMinute: 16,
    difficulty: 'advanced',
    muscleGroups: ['Legs', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'very-high',
    category: 'fatLoss',
  },
  'Battle Ropes': {
    name: 'Battle Ropes',
    duration: 30,
    rest: 30,
    sets: 4,
    description: 'Wave battle ropes up and down',
    excludedLimitations: [...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.BACK, ...LIMITATION_CATEGORIES.WRIST],
    caloriesPerMinute: 14,
    difficulty: 'intermediate',
    muscleGroups: ['Arms', 'Shoulders', 'Core', 'Cardiovascular'],
    equipment: 'Gym',
    intensity: 'very-high',
    category: 'fatLoss',
  },
  'Mountain Climbers': {
    name: 'Mountain Climbers',
    duration: 30,
    rest: 30,
    sets: 3,
    description: 'Plank position, alternate bringing knees to chest',
    excludedLimitations: [...LIMITATION_CATEGORIES.WRIST, ...LIMITATION_CATEGORIES.SHOULDER, ...LIMITATION_CATEGORIES.BACK],
    caloriesPerMinute: 13,
    difficulty: 'intermediate',
    muscleGroups: ['Core', 'Cardiovascular'],
    equipment: 'None',
    intensity: 'high',
    category: 'fatLoss',
  },
};

/**
 * Get exercise data by name
 * @param {string} exerciseName
 * @returns {ExerciseData|null}
 */
export function getExerciseData(exerciseName) {
  return EXERCISE_DATA[exerciseName] || null;
}

/**
 * Get default exercise data if not found
 * @param {string} exerciseName
 * @returns {ExerciseData}
 */
export function getDefaultExerciseData(exerciseName) {
  return {
    name: exerciseName,
    duration: 45,
    rest: 20,
    sets: 2,
    description: `${exerciseName} exercise`,
    excludedLimitations: [],
    caloriesPerMinute: 8,
    difficulty: 'intermediate',
    muscleGroups: ['Full Body'],
    equipment: 'None',
    intensity: 'moderate',
    category: 'endurance',
  };
}

/**
 * ✅ NEW: Calculate total calories burned for an exercise
 * @param {string} exerciseName
 * @param {number} durationSeconds
 * @param {number} [sets=1]
 * @returns {number}
 */
export function calculateCaloriesBurned(exerciseName, durationSeconds, sets = 1) {
  const exerciseData = getExerciseData(exerciseName) || getDefaultExerciseData(exerciseName);
  const durationMinutes = (durationSeconds * sets) / 60;
  const caloriesPerMinute = exerciseData.caloriesPerMinute || 8;
  
  return Math.round(durationMinutes * caloriesPerMinute);
}

/**
 * ✅ NEW: Get exercises by equipment
 * @param {('None'|'Kettlebell'|'Gym')} equipment
 * @returns {ExerciseData[]}
 */
export function getExercisesByEquipment(equipment) {
  return Object.values(EXERCISE_DATA).filter(
    exercise => exercise.equipment === equipment || exercise.equipment === 'None'
  );
}

/**
 * ✅ NEW: Get exercises by difficulty
 * @param {('beginner'|'intermediate'|'advanced')} difficulty
 * @returns {ExerciseData[]}
 */
export function getExercisesByDifficulty(difficulty) {
  return Object.values(EXERCISE_DATA).filter(exercise => exercise.difficulty === difficulty);
}

/**
 * ✅ NEW: Get exercises by category
 * @param {('warmup'|'endurance'|'power'|'stamina'|'fatLoss')} category
 * @returns {ExerciseData[]}
 */
export function getExercisesByCategory(category) {
  return Object.values(EXERCISE_DATA).filter(exercise => exercise.category === category);
}

/**
 * Check if exercise should be excluded based on limitations
 * @param {string} exerciseName
 * @param {string[]} limitations
 * @returns {boolean}
 */
export function isExerciseExcluded(exerciseName, limitations) {
  const exerciseData = getExerciseData(exerciseName);
  if (!exerciseData) return false;
  
  return limitations.some(limitation => 
    exerciseData.excludedLimitations.includes(limitation)
  );
}

/**
 * Filter exercises based on limitations
 * @param {string[]} exercises
 * @param {string[]} limitations
 * @returns {string[]}
 */
export function filterExercisesByLimitations(exercises, limitations) {
  if (!limitations || limitations.length === 0 || limitations.includes('None')) {
    return exercises;
  }
  
  return exercises.filter(exercise => !isExerciseExcluded(exercise, limitations));
}

/**
 * ✅ NEW: Get recommended exercises based on profile
 * @param {('beginner'|'intermediate'|'advanced')} fitnessLevel
 * @param {('None'|'Kettlebell'|'Gym')} equipment
 * @param {string[]} limitations
 * @param {('warmup'|'endurance'|'power'|'stamina'|'fatLoss')} [category]
 * @returns {ExerciseData[]}
 */
export function getRecommendedExercises(fitnessLevel, equipment, limitations, category) {
  let exercises = Object.values(EXERCISE_DATA);
  
  // Filter by difficulty
  exercises = exercises.filter(ex => {
    if (fitnessLevel === 'beginner') return ex.difficulty === 'beginner' || ex.difficulty === 'intermediate';
    if (fitnessLevel === 'intermediate') return ex.difficulty === 'beginner' || ex.difficulty === 'intermediate' || ex.difficulty === 'advanced';
    return true; // Pro gets all
  });
  
  // Filter by equipment
  exercises = exercises.filter(ex => ex.equipment === 'None' || ex.equipment === equipment);
  
  // Filter by limitations
  exercises = exercises.filter(ex => {
    return !limitations.some(limitation => ex.excludedLimitations.includes(limitation));
  });
  
  // Filter by category if specified
  if (category) {
    exercises = exercises.filter(ex => ex.category === category);
  }
  
  return exercises;
}

