/**
 * Exercise Media Mapping
 * Maps exercise names to icons, GIFs, and animation sources
 */

/**
 * @typedef {Object} ExerciseMedia
 * @property {string} icon - Material icon name
 * @property {('lottie'|'gif'|'video')} [animationType]
 * @property {any} [animationSource] - require() path or URL
 * @property {string} [description]
 */

// Exercise media mapping
/** @type {Record<string, ExerciseMedia>} */
export const EXERCISE_MEDIA = {
  // Warm-up exercises
  'Jumping Jacks': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Full body cardio warm-up',
  },
  'Arm Circles': {
    icon: 'rotate-right',
    animationType: 'lottie',
    description: 'Shoulder mobility warm-up',
  },
  'Leg Swings': {
    icon: 'swap-vert',
    animationType: 'lottie',
    description: 'Hip mobility and leg warm-up',
  },
  'Torso Twists': {
    icon: 'rotate-left',
    animationType: 'lottie',
    description: 'Core and spine mobility',
  },
  'Neck Rolls': {
    icon: '360',
    animationType: 'lottie',
    description: 'Neck mobility and relaxation',
  },
  'Shoulder Rotations': {
    icon: 'rotate-right',
    animationType: 'lottie',
    description: 'Shoulder joint mobility',
  },
  'Hip Circles': {
    icon: '360',
    animationType: 'lottie',
    description: 'Hip joint mobility',
  },
  'Ankle Rotations': {
    icon: '360',
    animationType: 'lottie',
    description: 'Ankle mobility and flexibility',
  },
  'Walking Lunges': {
    icon: 'directions-walk',
    animationType: 'lottie',
    description: 'Leg strength and mobility',
  },
  'Butt Kicks': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Hamstring activation',
  },
  'High Knees': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Cardio and leg activation',
  },
  'Side Steps': {
    icon: 'swap-horiz',
    animationType: 'lottie',
    description: 'Lateral movement warm-up',
  },
  'Knee Hugs': {
    icon: 'favorite',
    animationType: 'lottie',
    description: 'Hip flexor and glute stretch',
  },
  'Quad Stretches': {
    icon: 'straighten',
    animationType: 'lottie',
    description: 'Quadriceps flexibility',
  },
  'Hamstring Stretches': {
    icon: 'straighten',
    animationType: 'lottie',
    description: 'Hamstring flexibility',
  },
  
  // Endurance exercises
  'Jogging': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Steady pace running',
  },
  'Cycling': {
    icon: 'pedal-bike',
    animationType: 'lottie',
    description: 'Low impact cardio',
  },
  'Swimming': {
    icon: 'pool',
    animationType: 'lottie',
    description: 'Full body endurance',
  },
  'Rowing Machine': {
    icon: 'rowing',
    animationType: 'lottie',
    description: 'Full body cardio',
  },
  'Elliptical Trainer': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Low impact cardio',
  },
  'Stair Climber': {
    icon: 'stairs',
    animationType: 'lottie',
    description: 'Leg endurance',
  },
  'Jump Rope': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'High intensity cardio',
  },
  'Walking': {
    icon: 'directions-walk',
    animationType: 'lottie',
    description: 'Low intensity cardio',
  },
  'Brisk Walking': {
    icon: 'directions-walk',
    animationType: 'lottie',
    description: 'Moderate intensity cardio',
  },
  'Steady State Running': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Long duration running',
  },
  'Long Distance Running': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Extended endurance running',
  },
  'Cycling Sprints': {
    icon: 'pedal-bike',
    animationType: 'lottie',
    description: 'High intensity cycling intervals',
  },
  'Swimming Laps': {
    icon: 'pool',
    animationType: 'lottie',
    description: 'Structured swimming workout',
  },
  'Rowing Intervals': {
    icon: 'rowing',
    animationType: 'lottie',
    description: 'Interval rowing training',
  },
  'Cross Trainer': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Full body cardio machine',
  },
  'Treadmill Running': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Indoor running',
  },
  'Outdoor Running': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Outdoor running',
  },
  'Bike Riding': {
    icon: 'pedal-bike',
    animationType: 'lottie',
    description: 'Cycling outdoors',
  },
  'Pool Swimming': {
    icon: 'pool',
    animationType: 'lottie',
    description: 'Pool-based swimming',
  },
  
  // Power exercises
  'Burpees': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Full body explosive movement',
  },
  'Box Jumps': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Explosive leg power',
  },
  'Tuck Jumps': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Vertical jump power',
  },
  'Medicine Ball Slams': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Upper body power',
  },
  'Kettlebell Swings': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Hip hinge power',
  },
  'Plyometric Push-ups': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Explosive upper body',
  },
  'Jump Squats': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Explosive leg power',
  },
  'Explosive Lunges': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Dynamic leg power',
  },
  'Power Cleans': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Olympic lift power',
  },
  'Thruster Jumps': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Full body explosive movement',
  },
  'Broad Jumps': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Horizontal jump power',
  },
  'Single Leg Hops': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Unilateral leg power',
  },
  'Clapping Push-ups': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Explosive upper body',
  },
  'Dumbbell Snatches': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Full body power',
  },
  'Wall Ball Throws': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Full body power',
  },
  'Heavy Kettlebell Swings': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Advanced hip power',
  },
  'Advanced Box Jumps': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Advanced explosive power',
  },
  'Plyometric Lunges': {
    icon: 'sports',
    animationType: 'lottie',
    description: 'Dynamic leg power',
  },
  'Jumping Burpees': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Advanced full body power',
  },
  
  // Stamina exercises
  'Circuit Training': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Multi-exercise circuit',
  },
  'Interval Running': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'High-low intensity intervals',
  },
  'Assault Bike': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'High intensity cardio',
  },
  'Shuttle Runs': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Agility and stamina',
  },
  'Fartlek Training': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Variable pace running',
  },
  'Tabata Intervals': {
    icon: 'timer',
    animationType: 'lottie',
    description: '20s on, 10s off intervals',
  },
  'Full Body Circuit': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Complete body circuit',
  },
  'HIIT Circuit': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'High intensity interval circuit',
  },
  'CrossFit WOD': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'CrossFit workout of the day',
  },
  'AMRAP Workouts': {
    icon: 'timer',
    animationType: 'lottie',
    description: 'As many rounds as possible',
  },
  'EMOM Workouts': {
    icon: 'timer',
    animationType: 'lottie',
    description: 'Every minute on the minute',
  },
  'Cycling Intervals': {
    icon: 'pedal-bike',
    animationType: 'lottie',
    description: 'Bike interval training',
  },
  'Swimming Intervals': {
    icon: 'pool',
    animationType: 'lottie',
    description: 'Swim interval training',
  },
  'Stair Running': {
    icon: 'stairs',
    animationType: 'lottie',
    description: 'Stair interval training',
  },
  
  // Fat loss exercises
  'HIIT Sprints': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'High intensity sprint intervals',
  },
  'Battle Ropes': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Upper body HIIT',
  },
  'Mountain Climbers': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Core and cardio',
  },
  'Sprint Intervals': {
    icon: 'directions-run',
    animationType: 'lottie',
    description: 'Maximum intensity sprints',
  },
  'Assault Bike Sprints': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'High intensity bike sprints',
  },
  'Rowing Sprints': {
    icon: 'rowing',
    animationType: 'lottie',
    description: 'High intensity rowing',
  },
  'Weighted Burpees': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Advanced burpee variation',
  },
  'Intense Battle Ropes': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Advanced rope training',
  },
  'Jump Rope Intervals': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'High intensity jump rope',
  },
  'Sprint Burpees': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Fast-paced burpees',
  },
  'Power Snatches': {
    icon: 'fitness-center',
    animationType: 'lottie',
    description: 'Olympic lift variation',
  },
  'Intense Swimming Intervals': {
    icon: 'pool',
    animationType: 'lottie',
    description: 'High intensity swimming',
  },
};

/**
 * Get media for an exercise
 * @param {string} exerciseName
 * @returns {ExerciseMedia|null}
 */
export function getExerciseMedia(exerciseName) {
  return EXERCISE_MEDIA[exerciseName] || null;
}

/**
 * Get icon for an exercise (fallback to fitness-center)
 * @param {string} exerciseName
 * @returns {string}
 */
export function getExerciseIcon(exerciseName) {
  const media = getExerciseMedia(exerciseName);
  return media?.icon || 'fitness-center';
}

