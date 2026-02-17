/**
 * ENHANCED Adaptive Progress Intelligence
 * Smarter calculations with plateau detection and personalized recommendations
 */

/**
 * @typedef {Object} WorkoutProgress
 * @property {string} date
 * @property {string} planName
 * @property {number} totalDurationPlanned
 * @property {number} totalDurationActual
 * @property {Array<{name: string, status: string, durationPlanned: number, durationActual?: number, setsPlanned: number, setsCompleted?: number}>} activities
 * @property {number} completionRate
 * @property {number} activitiesCompleted
 * @property {number} activitiesSkipped
 */

/**
 * @typedef {Object} AdaptiveAdjustments
 * @property {number} intensityAdjustment
 * @property {number} restMultiplierAdjustment
 * @property {number} setsAdjustment
 * @property {('easier'|'same'|'harder')} exerciseDifficultyAdjustment
 * @property {string} [recommendation] - New: personalized text recommendation
 * @property {boolean} [plateauDetected] - New: plateau detection
 * @property {boolean} [restDayRecommended] - New: rest day suggestion
 */

/**
 * @typedef {Object} PerformanceTrend
 * @property {('improving'|'plateau'|'declining'|'recovering')} direction
 * @property {number} confidence - 0-1
 * @property {number} lastWorkouts
 */

// ============================================================================
// ENHANCED ADAPTIVE ADJUSTMENTS
// ============================================================================

/**
 * @param {WorkoutProgress[]} recentWorkouts
 * @returns {AdaptiveAdjustments}
 */
export function calculateAdaptiveAdjustments(recentWorkouts) {
  if (!recentWorkouts || !Array.isArray(recentWorkouts) || recentWorkouts.length === 0) {
    return {
      intensityAdjustment: 0,
      restMultiplierAdjustment: 0,
      setsAdjustment: 0,
      exerciseDifficultyAdjustment: 'same',
      recommendation: 'Complete a few workouts to get personalized recommendations!',
    };
  }

  // Calculate key metrics
  const avgCompletionRate = recentWorkouts.reduce((sum, w) => sum + (w.completionRate || 0), 0) / recentWorkouts.length;
  
  const avgDurationRatio = recentWorkouts.reduce((sum, w) => {
    if (w.totalDurationPlanned > 0) {
      return sum + (w.totalDurationActual / w.totalDurationPlanned);
    }
    return sum;
  }, 0) / recentWorkouts.length;

  // Analyze performance trend
  const trend = analyzePerformanceTrend(recentWorkouts);
  
  // Detect plateau
  const plateauDetected = detectPlateau(recentWorkouts);
  
  // Check if rest day is needed
  const restDayNeeded = shouldRecommendRestDay(recentWorkouts);
  
  // Track skipped activities
  const skippedActivities = getSkippedActivitiesMap(recentWorkouts);
  const mostSkipped = getMostSkippedActivity(recentWorkouts);

  // Initialize adjustments
  const adjustments = {
    intensityAdjustment: 0,
    restMultiplierAdjustment: 0,
    setsAdjustment: 0,
    exerciseDifficultyAdjustment: 'same',
    plateauDetected,
    restDayRecommended: restDayNeeded,
  };

  // ============================================================================
  // SMART ADJUSTMENT RULES
  // ============================================================================

  // EXCELLENT PERFORMANCE (85%+ completion, consistently finishing early)
  if (avgCompletionRate >= 85 && avgDurationRatio >= 0.95) {
    adjustments.intensityAdjustment = 1;
    adjustments.setsAdjustment = 1;
    adjustments.restMultiplierAdjustment = -0.1; // Shorter rest
    adjustments.exerciseDifficultyAdjustment = 'harder';
    adjustments.recommendation = "🔥 You're crushing it! Let's increase the intensity.";
  }
  // GOOD PERFORMANCE (70-85% completion)
  else if (avgCompletionRate >= 70 && avgCompletionRate < 85) {
    adjustments.restMultiplierAdjustment = -0.05; // Slightly shorter rest
    adjustments.recommendation = "💪 Great work! Keep pushing yourself.";
  }
  // STRUGGLING (50-70% completion)
  else if (avgCompletionRate >= 50 && avgCompletionRate < 70) {
    adjustments.restMultiplierAdjustment = 0.15; // Longer rest
    adjustments.setsAdjustment = 0;
    adjustments.recommendation = "📊 Making progress! Focus on completing each activity.";
  }
  // DIFFICULTY (<50% completion)
  else if (avgCompletionRate < 50) {
    adjustments.restMultiplierAdjustment = 0.25; // Much longer rest
    adjustments.setsAdjustment = -1; // Fewer sets
    adjustments.exerciseDifficultyAdjustment = 'easier';
    adjustments.recommendation = "🎯 Let's adjust the intensity to help you build consistency.";
  }

  // PLATEAU DETECTION - Shake things up
  if (plateauDetected) {
    adjustments.recommendation = "🔄 Time to mix it up! Try a different workout style to break through the plateau.";
    adjustments.exerciseDifficultyAdjustment = 'harder';
    adjustments.setsAdjustment += 1;
  }

  // REST DAY RECOMMENDATION
  if (restDayNeeded) {
    adjustments.recommendation = "😌 Your body needs recovery. Consider taking a rest day or doing light stretching.";
    adjustments.restMultiplierAdjustment += 0.3;
  }

  // IMPROVING TREND
  if (trend.direction === 'improving' && trend.confidence > 0.7) {
    adjustments.recommendation = "📈 You're on an upward trend! Keep up the amazing work!";
  }

  // DECLINING TREND
  if (trend.direction === 'declining' && trend.confidence > 0.7) {
    adjustments.recommendation = "💙 Don't get discouraged! Rest and recovery are part of the journey.";
    adjustments.restMultiplierAdjustment += 0.2;
  }

  // SPECIFIC ACTIVITY FEEDBACK
  if (mostSkipped) {
    adjustments.recommendation = (adjustments.recommendation || '') + 
      `\n\nNote: You often skip "${mostSkipped}". Consider replacing it with a similar exercise.`;
  }

  // FINISHING TOO FAST
  if (avgDurationRatio < 0.7 && avgCompletionRate >= 75) {
    adjustments.recommendation = "⚡ You're finishing faster than planned! Let's increase the challenge.";
    adjustments.intensityAdjustment += 1;
    adjustments.setsAdjustment += 1;
  }

  // TAKING TOO LONG
  if (avgDurationRatio > 1.3 && avgCompletionRate < 70) {
    adjustments.recommendation = "⏱️ Take your time! Quality over quantity.";
    adjustments.restMultiplierAdjustment += 0.2;
  }

  return adjustments;
}

// ============================================================================
// PERFORMANCE TREND ANALYSIS
// ============================================================================

/**
 * @param {WorkoutProgress[]} workouts
 * @returns {PerformanceTrend}
 */
function analyzePerformanceTrend(workouts) {
  if (workouts.length < 3) {
    return { direction: 'recovering', confidence: 0, lastWorkouts: workouts.length };
  }

  const recentRates = workouts.slice(-5).map(w => w.completionRate || 0);
  const olderRates = workouts.slice(-10, -5).map(w => w.completionRate || 0);

  if (olderRates.length === 0) {
    return { direction: 'recovering', confidence: 0.5, lastWorkouts: workouts.length };
  }

  const recentAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
  const olderAvg = olderRates.reduce((a, b) => a + b, 0) / olderRates.length;

  const difference = recentAvg - olderAvg;
  const confidence = Math.min(1, Math.abs(difference) / 20); // 20% difference = 100% confidence

  if (difference > 5) {
    return { direction: 'improving', confidence, lastWorkouts: workouts.length };
  } else if (difference < -5) {
    return { direction: 'declining', confidence, lastWorkouts: workouts.length };
  } else if (Math.abs(difference) < 3) {
    return { direction: 'plateau', confidence: 0.8, lastWorkouts: workouts.length };
  } else {
    return { direction: 'recovering', confidence: 0.5, lastWorkouts: workouts.length };
  }
}

// ============================================================================
// PLATEAU DETECTION
// ============================================================================

/**
 * @param {WorkoutProgress[]} workouts
 * @returns {boolean}
 */
function detectPlateau(workouts) {
  if (workouts.length < 5) return false;

  const last5Rates = workouts.slice(-5).map(w => w.completionRate || 0);
  const avg = last5Rates.reduce((a, b) => a + b, 0) / last5Rates.length;
  
  // Check if all workouts are within ±5% of average (very consistent = plateau)
  const isConsistent = last5Rates.every(rate => Math.abs(rate - avg) < 5);
  
  // Check if not improving over time
  const first2Avg = (last5Rates[0] + last5Rates[1]) / 2;
  const last2Avg = (last5Rates[3] + last5Rates[4]) / 2;
  const notImproving = last2Avg - first2Avg < 2;

  return isConsistent && notImproving && avg < 90; // Plateau if consistent but not at peak
}

// ============================================================================
// REST DAY RECOMMENDATION
// ============================================================================

/**
 * @param {WorkoutProgress[]} workouts
 * @returns {boolean}
 */
function shouldRecommendRestDay(workouts) {
  if (workouts.length < 3) return false;

  // Check last 3 workouts
  const last3 = workouts.slice(-3);
  
  // Recommend rest if completion rate is declining AND user is working out frequently
  const rates = last3.map(w => w.completionRate || 0);
  const declining = rates[0] > rates[1] && rates[1] > rates[2];
  
  // Check if working out consecutive days
  const dates = last3.map(w => new Date(w.date));
  const consecutiveDays = dates.every((date, i) => {
    if (i === 0) return true;
    const prevDate = dates[i - 1];
    const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  });

  return declining && consecutiveDays && rates[2] < 60;
}

// ============================================================================
// SKIPPED ACTIVITIES ANALYSIS
// ============================================================================

/**
 * @param {WorkoutProgress[]} workouts
 * @returns {Record<string, number>}
 */
function getSkippedActivitiesMap(workouts) {
  const skippedCounts = {};
  
  workouts.forEach(workout => {
    if (workout && workout.activities && Array.isArray(workout.activities)) {
      workout.activities.forEach(activity => {
        if (activity && activity.status === 'skipped') {
          skippedCounts[activity.name] = (skippedCounts[activity.name] || 0) + 1;
        }
      });
    }
  });
  
  return skippedCounts;
}

/**
 * @param {WorkoutProgress[]} workouts
 * @returns {string|null}
 */
export function getMostSkippedActivity(workouts) {
  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    return null;
  }
  
  const skippedCounts = getSkippedActivitiesMap(workouts);
  
  let maxCount = 0;
  let mostSkipped = null;
  
  Object.entries(skippedCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostSkipped = name;
    }
  });
  
  return mostSkipped;
}

// ============================================================================
// CALORIE ESTIMATION
// ============================================================================

/**
 * @param {number} durationMinutes
 * @param {('low'|'medium'|'high'|'very_high')} intensity
 * @param {number} [weight] - kg
 * @returns {number}
 */
export function estimateCaloriesBurned(durationMinutes, intensity, weight) {
  // Base calories per minute by intensity
  const baseCalPerMin = {
    low: 5,
    medium: 8,
    high: 12,
    very_high: 15,
  };

  let calories = durationMinutes * baseCalPerMin[intensity];

  // Adjust for weight (rough estimate)
  if (weight) {
    const weightMultiplier = weight / 70; // 70kg is baseline
    calories *= weightMultiplier;
  }

  return Math.round(calories);
}

