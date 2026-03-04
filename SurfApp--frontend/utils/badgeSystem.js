/**
 * ENHANCED Badge Awarding Logic
 * Smart badge checking with progress tracking and notifications
 */

import { Badge, BadgeCategory, getBadgeById, ALL_BADGES } from './badges.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BADGE_PROGRESS_KEY = '@badge_progress';

/**
 * @typedef {Object} BadgeProgress
 * @property {Object<string, {currentValue: number, lastUpdated: string, percentComplete: number}>} [badgeId]
 */

/**
 * @typedef {Object} CardioStats
 * @property {number} totalWorkouts
 * @property {number} totalMinutes
 * @property {number} totalCalories
 * @property {number} currentStreak
 * @property {number} longestStreak
 * @property {number} hiitWorkouts
 * @property {number[]} completionRates
 * @property {number} longestSingleWorkout
 */

/**
 * @typedef {Object} PoseStats
 * @property {string[]} completedDrills
 * @property {Record<string, number[]>} scores
 * @property {number} totalTime
 * @property {number} sessions
 * @property {number} [consecutiveDays]
 */

/**
 * @typedef {Object} ARStats
 * @property {string[]} completedModules
 * @property {number} totalTime
 * @property {number} sessions
 */

// ============================================================================
// BADGE PROGRESS TRACKING
// ============================================================================

/**
 * @returns {Promise<BadgeProgress>}
 */
export async function getBadgeProgress() {
  try {
    const data = await AsyncStorage.getItem(BADGE_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading badge progress:', error);
    return {};
  }
}

/**
 * @param {string} badgeId
 * @param {number} currentValue
 * @param {number} requirement
 * @returns {Promise<void>}
 */
export async function updateBadgeProgress(badgeId, currentValue, requirement) {
  try {
    const progress = await getBadgeProgress();
    progress[badgeId] = {
      currentValue,
      lastUpdated: new Date().toISOString(),
      percentComplete: Math.min(100, (currentValue / requirement) * 100),
    };
    await AsyncStorage.setItem(BADGE_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error updating badge progress:', error);
  }
}

// ============================================================================
// CARDIO BADGE CHECKING (ENHANCED)
// ============================================================================

/**
 * @param {CardioStats} stats
 * @param {string[]} earnedBadges
 * @returns {{newBadges: string[], progress: BadgeProgress}}
 */
export function checkCardioBadges(stats, earnedBadges) {
  const newBadges = [];
  const progress = {};
  const earnedSet = new Set(earnedBadges);

  // Workout count badges
  const workoutBadges = [
    { id: 'cardio_first_step', requirement: 1 },
    { id: 'cardio_early_bird', requirement: 3 },
    { id: 'cardio_warrior', requirement: 10 },
    { id: 'cardio_champion', requirement: 25 },
    { id: 'cardio_legend', requirement: 50 },
    { id: 'cardio_immortal', requirement: 100 },
  ];

  workoutBadges.forEach(({ id, requirement }) => {
    if (stats.totalWorkouts >= requirement && !earnedSet.has(id)) {
      newBadges.push(id);
    }
    progress[id] = {
      currentValue: stats.totalWorkouts,
      lastUpdated: new Date().toISOString(),
      percentComplete: Math.min(100, (stats.totalWorkouts / requirement) * 100),
    };
  });

  // Time-based badges
  const timeBadges = [
    { id: 'cardio_30_min_club', requirement: 30 },
    { id: 'cardio_hour_master', requirement: 60 },
    { id: 'cardio_3_hour_club', requirement: 180 },
    { id: 'cardio_marathon', requirement: 300 },
    { id: 'cardio_ultra_marathon', requirement: 600 },
  ];

  timeBadges.forEach(({ id, requirement }) => {
    if (stats.totalMinutes >= requirement && !earnedSet.has(id)) {
      newBadges.push(id);
    }
    progress[id] = {
      currentValue: stats.totalMinutes,
      lastUpdated: new Date().toISOString(),
      percentComplete: Math.min(100, (stats.totalMinutes / requirement) * 100),
    };
  });

  // Streak badges
  const streakBadges = [
    { id: 'cardio_3_day_streak', requirement: 3 },
    { id: 'cardio_week_warrior', requirement: 7 },
    { id: 'cardio_consistency_king', requirement: 14 },
    { id: 'cardio_30_day_challenge', requirement: 30 },
    { id: 'cardio_unstoppable', requirement: 60 },
  ];

  streakBadges.forEach(({ id, requirement }) => {
    if (stats.currentStreak >= requirement && !earnedSet.has(id)) {
      newBadges.push(id);
    }
    progress[id] = {
      currentValue: stats.currentStreak,
      lastUpdated: new Date().toISOString(),
      percentComplete: Math.min(100, (stats.currentStreak / requirement) * 100),
    };
  });

  // Calorie badges
  const calorieBadges = [
    { id: 'cardio_calorie_crusher', requirement: 500 },
    { id: 'cardio_calorie_inferno', requirement: 2000 },
  ];

  calorieBadges.forEach(({ id, requirement }) => {
    if (stats.totalCalories >= requirement && !earnedSet.has(id)) {
      newBadges.push(id);
    }
    progress[id] = {
      currentValue: stats.totalCalories,
      lastUpdated: new Date().toISOString(),
      percentComplete: Math.min(100, (stats.totalCalories / requirement) * 100),
    };
  });

  // Special badges
  if (
    stats.completionRates.some(rate => rate === 100) &&
    !earnedSet.has('cardio_perfectionist')
  ) {
    newBadges.push('cardio_perfectionist');
  }
  progress['cardio_perfectionist'] = {
    currentValue: Math.max(...stats.completionRates, 0),
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.max(...stats.completionRates, 0),
  };

  if (stats.hiitWorkouts >= 5 && !earnedSet.has('cardio_speed_demon')) {
    newBadges.push('cardio_speed_demon');
  }
  progress['cardio_speed_demon'] = {
    currentValue: stats.hiitWorkouts,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (stats.hiitWorkouts / 5) * 100),
  };

  if (stats.longestSingleWorkout >= 30 && !earnedSet.has('cardio_endurance_beast')) {
    newBadges.push('cardio_endurance_beast');
  }
  progress['cardio_endurance_beast'] = {
    currentValue: stats.longestSingleWorkout,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (stats.longestSingleWorkout / 30) * 100),
  };

  return { newBadges, progress };
}

// ============================================================================
// POSE BADGE CHECKING (ENHANCED)
// ============================================================================

/**
 * @param {PoseStats} stats
 * @param {string[]} earnedBadges
 * @returns {{newBadges: string[], progress: BadgeProgress}}
 */
export function checkPoseBadges(stats, earnedBadges) {
  const newBadges = [];
  const progress = {};
  const earnedSet = new Set(earnedBadges || []);

  // Novice badge
  if (stats.completedDrills.length >= 1 && !earnedSet.has('pose_novice')) {
    newBadges.push('pose_novice');
  }
  progress['pose_novice'] = {
    currentValue: stats.completedDrills.length,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (stats.completedDrills.length / 1) * 100),
  };

  // Warrior badge
  if (stats.completedDrills.length >= 8 && !earnedSet.has('pose_warrior')) {
    newBadges.push('pose_warrior');
  }
  progress['pose_warrior'] = {
    currentValue: stats.completedDrills.length,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (stats.completedDrills.length / 8) * 100),
  };

  // High score badges
  const hasHighScore = Object.values(stats.scores || {}).some(scores =>
    scores.some(score => score >= 90)
  );
  if (hasHighScore && !earnedSet.has('pose_perfectionist')) {
    newBadges.push('pose_perfectionist');
  }

  const allDrillsHaveHighScore =
    Object.values(stats.scores || {}).every(scores => scores.some(score => score >= 90)) &&
    Object.keys(stats.scores || {}).length >= 8;
  if (allDrillsHaveHighScore && !earnedSet.has('pose_master')) {
    newBadges.push('pose_master');
  }

  // Time badge
  const totalMinutes = Math.floor(stats.totalTime / 60);
  if (totalMinutes >= 60 && !earnedSet.has('pose_marathon')) {
    newBadges.push('pose_marathon');
  }
  progress['pose_marathon'] = {
    currentValue: totalMinutes,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (totalMinutes / 60) * 100),
  };

  // Consistency badge
  if (stats.consecutiveDays && stats.consecutiveDays >= 7 && !earnedSet.has('pose_consistent')) {
    newBadges.push('pose_consistent');
  }
  progress['pose_consistent'] = {
    currentValue: stats.consecutiveDays || 0,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, ((stats.consecutiveDays || 0) / 7) * 100),
  };

  return { newBadges, progress };
}

// ============================================================================
// AR BADGE CHECKING
// ============================================================================

/**
 * @param {ARStats} stats
 * @param {string[]} earnedBadges
 * @returns {{newBadges: string[], progress: BadgeProgress}}
 */
export function checkARBadges(stats, earnedBadges) {
  const newBadges = [];
  const progress = {};
  const earnedSet = new Set(earnedBadges);

  if (stats.completedModules.length >= 1 && !earnedSet.has('ar_explorer')) {
    newBadges.push('ar_explorer');
  }
  progress['ar_explorer'] = {
    currentValue: stats.completedModules.length,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (stats.completedModules.length / 1) * 100),
  };

  if (stats.completedModules.length >= 5 && !earnedSet.has('ar_master')) {
    newBadges.push('ar_master');
  }
  progress['ar_master'] = {
    currentValue: stats.completedModules.length,
    lastUpdated: new Date().toISOString(),
    percentComplete: Math.min(100, (stats.completedModules.length / 5) * 100),
  };

  return { newBadges, progress };
}

// ============================================================================
// BADGE NOTIFICATION
// ============================================================================

/**
 * @typedef {Object} BadgeNotification
 * @property {Badge} badge
 * @property {boolean} isNew
 * @property {number} progress
 */

/**
 * @param {string} badgeId
 * @param {boolean} isNew
 * @param {number} progress
 * @returns {BadgeNotification|null}
 */
export function createBadgeNotification(badgeId, isNew, progress) {
  const badge = getBadgeById(badgeId);
  if (!badge) return null;

  return {
    badge,
    isNew,
    progress,
  };
}

// ============================================================================
// HELPER: Calculate Cardio Stats from Workout History
// ============================================================================

/**
 * @param {any[]} workouts
 * @returns {CardioStats}
 */
export function calculateCardioStats(workouts) {
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.totalDurationActual || 0), 0);
  
  // Estimate calories (rough: 10 cal/min for cardio)
  const totalCalories = Math.floor(totalMinutes * 10);

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(workouts);
  const longestStreak = calculateLongestStreak(workouts);

  // Count HIIT workouts (workouts with "HIIT", "Sprint", "Interval" in name)
  const hiitWorkouts = workouts.filter(w => 
    (w.planName || '').toLowerCase().includes('hiit') ||
    (w.planName || '').toLowerCase().includes('sprint') ||
    (w.planName || '').toLowerCase().includes('interval')
  ).length;

  // Completion rates
  const completionRates = workouts.map(w => w.completionRate || 0);

  // Longest single workout
  const longestSingleWorkout = Math.max(...workouts.map(w => w.totalDurationActual || 0), 0);

  return {
    totalWorkouts,
    totalMinutes,
    totalCalories,
    currentStreak,
    longestStreak,
    hiitWorkouts,
    completionRates,
    longestSingleWorkout,
  };
}

/**
 * @param {any[]} workouts
 * @returns {number}
 */
function calculateCurrentStreak(workouts) {
  if (workouts.length === 0) return 0;

  const sorted = [...workouts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const workout of sorted) {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
      currentDate = new Date(workoutDate);
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

/**
 * @param {any[]} workouts
 * @returns {number}
 */
function calculateLongestStreak(workouts) {
  if (workouts.length === 0) return 0;

  const sorted = [...workouts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date);
    const currDate = new Date(sorted[i].date);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

