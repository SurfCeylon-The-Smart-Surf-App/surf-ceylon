/**
 * XP System Utilities
 * Calculate XP, levels, and manage categorized progress
 */

/**
 * @typedef {Object} XPCalculationResult
 * @property {number} xpEarned
 * @property {number} newLevel
 * @property {number} xpToNext
 * @property {boolean} leveledUp
 */

/**
 * @typedef {Object} DrillSessionData
 * @property {string} drillId
 * @property {number} score - 0-100
 * @property {number} stabilityScore - 0-1
 * @property {number} duration - seconds
 * @property {boolean} completed
 */

/**
 * Calculate XP earned from a pose drill session
 * Based on form correctness, stability score, and drill completion
 * @param {DrillSessionData} sessionData
 * @returns {number}
 */
export function calculatePoseXP(sessionData) {
  let xp = 0;
  
  // Base XP for completing drill
  if (sessionData.completed) {
    xp += 2;
  }
  
  // XP based on form correctness
  if (sessionData.score >= 90) {
    xp += 10; // Perfect form
  } else if (sessionData.score >= 70) {
    xp += 5; // Good form
  } else if (sessionData.score >= 50) {
    xp += 2; // Needs improvement
  }
  
  // Bonus XP for stability
  if (sessionData.stabilityScore > 0.9) {
    xp += 3; // Very stable
  } else if (sessionData.stabilityScore > 0.7) {
    xp += 1; // Stable
  }
  
  // Bonus XP for duration (1 XP per 30 seconds, max 5 XP)
  const durationBonus = Math.min(5, Math.floor(sessionData.duration / 30));
  xp += durationBonus;
  
  return xp;
}

/**
 * Calculate XP earned from cardio session
 * Based on heart rate zones, duration, and reps
 * @param {number} duration - seconds
 * @param {Record<string, number>} [heartRateZones] - time in each zone
 * @param {number} [reps]
 * @returns {number}
 */
export function calculateCardioXP(duration, heartRateZones, reps) {
  let xp = 0;
  
  // Base XP for duration (1 XP per minute, max 20 XP)
  const durationXP = Math.min(20, Math.floor(duration / 60));
  xp += durationXP;
  
  // Bonus XP for heart rate zones
  if (heartRateZones) {
    // High intensity zone (80%+ max HR) gives more XP
    if (heartRateZones.high) {
      xp += Math.floor(heartRateZones.high / 60) * 2; // 2 XP per minute in high zone
    }
    if (heartRateZones.moderate) {
      xp += Math.floor(heartRateZones.moderate / 60); // 1 XP per minute in moderate zone
    }
  }
  
  // Bonus XP for reps
  if (reps) {
    xp += Math.min(10, Math.floor(reps / 10)); // 1 XP per 10 reps, max 10 XP
  }
  
  return xp;
}

/**
 * Calculate XP earned from AR drill session
 * Based on completion and accuracy
 * @param {boolean} completed
 * @param {number} accuracy - 0-100
 * @returns {number}
 */
export function calculateARXP(completed, accuracy) {
  let xp = 0;
  
  if (completed) {
    xp += 5; // Base completion XP
    
    // Bonus XP for accuracy
    if (accuracy >= 90) {
      xp += 10;
    } else if (accuracy >= 70) {
      xp += 5;
    } else if (accuracy >= 50) {
      xp += 2;
    }
  }
  
  return xp;
}

/**
 * Calculate level from total XP
 * Returns level, XP for current level, and XP needed for next level
 * @param {number} totalXP
 * @returns {{level: number, xpForCurrentLevel: number, xpToNext: number}}
 */
export function calculateLevelFromXP(totalXP) {
  const baseXPPerLevel = 100;
  let currentLevel = 1;
  let xpForCurrentLevel = 0;
  let xpNeeded = baseXPPerLevel;
  
  while (totalXP >= xpNeeded) {
    currentLevel++;
    xpForCurrentLevel = xpNeeded;
    // After level 10, increase XP needed by 20% per level
    if (currentLevel <= 10) {
      xpNeeded += baseXPPerLevel;
    } else {
      xpNeeded += Math.floor(baseXPPerLevel * Math.pow(1.2, currentLevel - 10));
    }
  }
  
  return {
    level: currentLevel,
    xpForCurrentLevel,
    xpToNext: xpNeeded - totalXP,
  };
}

/**
 * Calculate XP and level progression
 * @param {number} currentXP
 * @param {number} currentLevel
 * @param {number} xpEarned
 * @returns {XPCalculationResult}
 */
export function calculateXPProgression(currentXP, currentLevel, xpEarned) {
  const newTotalXP = currentXP + xpEarned;
  const levelInfo = calculateLevelFromXP(newTotalXP);
  const leveledUp = levelInfo.level > currentLevel;
  
  return {
    xpEarned,
    newLevel: levelInfo.level,
    xpToNext: levelInfo.xpToNext,
    leveledUp,
  };
}

/**
 * Format XP for display
 * @param {number} xp
 * @returns {string}
 */
export function formatXP(xp) {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * Get category display name
 * @param {string} category
 * @returns {string}
 */
export function getCategoryDisplayName(category) {
  const names = {
    pose: 'Pose Estimation',
    cardio: 'Cardio',
    ar: 'AR Drills',
    poseEstimation: 'Pose Estimation', // Legacy support
  };
  return names[category] || category;
}

