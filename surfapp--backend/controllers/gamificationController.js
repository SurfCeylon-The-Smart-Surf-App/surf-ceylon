/**
 * Enhanced Gamification Controller
 * Handles points, badges, streaks, and achievements
 */


const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * ✅ ENHANCED: Award points/badges to user with validation
 * POST /api/gamification/award
 */
const awardPoints = asyncHandler(async (req, res) => {
  console.log('[gamification] Award request (auth removed)');
  
  const { 
    points = 0, 
    badge = null, 
    streak = null,
    achievement = null, // ✅ NEW
    metadata = {} // ✅ NEW: Additional context
  } = req.body;
  
  try {
    // Validate points
    if (points && (typeof points !== 'number' || points < 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid points value' 
      });
    }
    
    // Validate badge format
    if (badge && typeof badge !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid badge format' 
      });
    }
    
    // Validate streak
    if (streak && (typeof streak !== 'number' || streak < 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid streak value' 
      });
    }
    
    // Since auth is removed, gamification is stored locally in frontend
    console.log('[gamification] Award data received (stored locally in app):', {
      points,
      badge,
      streak,
      achievement,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    // ✅ NEW: Return detailed award information
    const response = {
      success: true,
      message: 'Award stored locally',
      award: {
        points,
        badge,
        streak,
        achievement,
        timestamp: new Date().toISOString(),
      },
      // ✅ NEW: Include level-up information
      levelUp: points >= 100 ? {
        newLevel: Math.floor(points / 100),
        message: 'Level up! 🎉'
      } : null
    };
    
    res.json(response);
  } catch (err) {
    console.error('[gamification] Error awarding:', err);
    throw err;
  }
});

/**
 * ✅ ENHANCED: Get gamification stats with detailed breakdown
 * GET /api/gamification/stats
 */
const getStats = asyncHandler(async (req, res) => {
  console.log('[gamification] Stats request (auth removed)');
  
  try {
    // Since auth is removed, gamification is stored locally in frontend
    console.log('[gamification] Stats loaded from local storage');
    
    // ✅ NEW: Return structured stats format
    const stats = {
      success: true,
      gamification: {
        totalPoints: 0,
        currentLevel: 0,
        badges: [],
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
        stats: {
          totalWorkouts: 0,
          totalMinutes: 0,
          totalCalories: 0,
          averageCompletionRate: 0,
        },
        // ✅ NEW: Progress to next level/badge
        progress: {
          nextLevel: {
            pointsNeeded: 100,
            progress: 0
          },
          nextBadge: {
            name: 'First Workout',
            requirement: 'Complete 1 workout',
            progress: 0
          }
        }
      }
    };
    
    res.json(stats);
  } catch (err) {
    console.error('[gamification] Error getting stats:', err);
    throw err;
  }
});

/**
 * ✅ NEW: Update streak
 * POST /api/gamification/streak
 */
const updateStreak = asyncHandler(async (req, res) => {
  console.log('[gamification] Update streak request');
  
  const { lastWorkoutDate, currentDate } = req.body;
  
  try {
    // Calculate if streak should continue
    const last = new Date(lastWorkoutDate);
    const current = new Date(currentDate);
    const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    let streakStatus = 'maintained';
    let message = '';
    
    if (diffDays === 1) {
      streakStatus = 'increased';
      message = 'Streak increased! 🔥';
    } else if (diffDays > 1) {
      streakStatus = 'broken';
      message = 'Streak broken. Start a new one today! 💪';
    } else if (diffDays === 0) {
      streakStatus = 'same_day';
      message = 'Great! Another workout today! 👍';
    }
    
    console.log('[gamification] Streak status:', streakStatus);
    
    res.json({
      success: true,
      streakStatus,
      message,
      diffDays
    });
  } catch (err) {
    console.error('[gamification] Error updating streak:', err);
    throw err;
  }
});

/**
 * ✅ NEW: Check badge eligibility
 * POST /api/gamification/check-badges
 */
const checkBadgeEligibility = asyncHandler(async (req, res) => {
  console.log('[gamification] Check badge eligibility');
  
  const { workoutCount, totalMinutes, streak, completionRate } = req.body;
  
  try {
    const eligibleBadges = [];
    
    // Check various badge criteria
    if (workoutCount >= 1 && workoutCount < 5) {
      eligibleBadges.push({
        id: 'first_workout',
        name: 'First Steps',
        tier: 'bronze',
        progress: 100
      });
    }
    
    if (workoutCount >= 5 && workoutCount < 10) {
      eligibleBadges.push({
        id: 'dedication_5',
        name: 'Dedication',
        tier: 'bronze',
        progress: 100
      });
    }
    
    if (streak >= 3 && streak < 7) {
      eligibleBadges.push({
        id: 'streak_3',
        name: 'Consistent',
        tier: 'bronze',
        progress: 100
      });
    }
    
    if (streak >= 7) {
      eligibleBadges.push({
        id: 'streak_7',
        name: 'Week Warrior',
        tier: 'silver',
        progress: 100
      });
    }
    
    if (totalMinutes >= 60 && totalMinutes < 300) {
      eligibleBadges.push({
        id: 'time_60',
        name: 'Hour Achiever',
        tier: 'bronze',
        progress: 100
      });
    }
    
    if (completionRate >= 80) {
      eligibleBadges.push({
        id: 'completion_80',
        name: 'Finisher',
        tier: 'silver',
        progress: 100
      });
    }
    
    console.log('[gamification] Eligible badges:', eligibleBadges);
    
    res.json({
      success: true,
      eligibleBadges,
      count: eligibleBadges.length
    });
  } catch (err) {
    console.error('[gamification] Error checking badges:', err);
    throw err;
  }
});

/**
 * ✅ NEW: Get leaderboard (if multiplayer features added later)
 * GET /api/gamification/leaderboard
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  console.log('[gamification] Leaderboard request');
  
  const { period = 'all_time', limit = 10 } = req.query;
  
  try {
    // Placeholder for future leaderboard feature
    const leaderboard = {
      success: true,
      period,
      entries: [],
      userRank: null,
      message: 'Leaderboard feature coming soon!'
    };
    
    res.json(leaderboard);
  } catch (err) {
    console.error('[gamification] Error getting leaderboard:', err);
    throw err;
  }
});

/**
 * ✅ NEW: Calculate points for workout
 * POST /api/gamification/calculate-points
 */
const calculatePoints = asyncHandler(async (req, res) => {
  console.log('[gamification] Calculate points request');
  
  const { 
    workoutDuration, // minutes
    activitiesCompleted,
    completionRate,
    streak
  } = req.body;
  
  try {
    // Base points calculation
    let points = 0;
    
    // Points for duration (1 point per minute)
    points += Math.floor(workoutDuration);
    
    // Bonus for activities completed (5 points each)
    points += activitiesCompleted * 5;
    
    // Completion rate bonus (up to 20 points)
    points += Math.floor(completionRate / 5);
    
    // Streak multiplier
    let multiplier = 1.0;
    if (streak >= 7) multiplier = 1.5;
    else if (streak >= 3) multiplier = 1.2;
    
    points = Math.floor(points * multiplier);
    
    // ✅ Calculate bonus achievements
    const bonuses = [];
    
    if (completionRate === 100) {
      bonuses.push({ type: 'perfect', points: 50, message: 'Perfect completion! 🌟' });
      points += 50;
    }
    
    if (workoutDuration >= 30) {
      bonuses.push({ type: 'endurance', points: 20, message: '30+ minutes! 💪' });
      points += 20;
    }
    
    if (streak >= 7) {
      bonuses.push({ type: 'streak', points: 30, message: '7-day streak! 🔥' });
      points += 30;
    }
    
    console.log('[gamification] Calculated points:', points, 'Bonuses:', bonuses);
    
    res.json({
      success: true,
      points,
      multiplier,
      bonuses,
      breakdown: {
        base: Math.floor(workoutDuration),
        activities: activitiesCompleted * 5,
        completion: Math.floor(completionRate / 5),
        streak: Math.floor((points / multiplier - Math.floor(workoutDuration) - activitiesCompleted * 5 - Math.floor(completionRate / 5)))
      }
    });
  } catch (err) {
    console.error('[gamification] Error calculating points:', err);
    throw err;
  }
});

module.exports = {
  awardPoints,
  getStats,
  updateStreak, // ✅ NEW
  checkBadgeEligibility, // ✅ NEW
  getLeaderboard, // ✅ NEW
  calculatePoints, // ✅ NEW
};
