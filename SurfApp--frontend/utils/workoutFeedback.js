/**
 * ENHANCED Workout Feedback Generator
 * Contextual, motivational feedback with emojis and personality
 */

import { WorkoutProgress } from './adaptiveProgress.js';
import { getMostSkippedActivity } from './adaptiveProgress.js';

/**
 * @param {WorkoutProgress} workout
 * @param {WorkoutProgress[]} history
 * @returns {string[]}
 */
export function generateWorkoutFeedback(workout, history) {
  const feedback = [];

  // ============================================================================
  // COMPLETION RATE FEEDBACK (Enhanced with emojis & motivation)
  // ============================================================================

  if (workout.completionRate === 100) {
    feedback.push("🌟 PERFECT! You completed every single activity! You're unstoppable!");
  } else if (workout.completionRate >= 90) {
    feedback.push("🎯 Outstanding! " + Math.round(workout.completionRate) + "% completion - you're killing it!");
  } else if (workout.completionRate >= 85) {
    feedback.push("💪 Excellent work! " + Math.round(workout.completionRate) + "% completion is fantastic!");
  } else if (workout.completionRate >= 70) {
    feedback.push("👏 Great job! You completed " + Math.round(workout.completionRate) + "% of your workout.");
  } else if (workout.completionRate >= 50) {
    feedback.push("📊 Good effort! You're at " + Math.round(workout.completionRate) + "% - every workout counts!");
  } else if (workout.completionRate >= 30) {
    feedback.push("🎯 You showed up, and that's what matters! Keep building consistency.");
  } else {
    feedback.push("💙 Starting is the hardest part - you did it! Tomorrow is a new opportunity.");
  }

  // ============================================================================
  // STREAK FEEDBACK (Gamified & Encouraging)
  // ============================================================================

  const streak = calculateStreak(history);
  
  if (streak === 1) {
    feedback.push("🔥 Streak started! Come back tomorrow to keep the fire burning!");
  } else if (streak >= 2 && streak < 3) {
    feedback.push("🔥 " + streak + "-day streak! You're building momentum!");
  } else if (streak >= 3 && streak < 7) {
    feedback.push("🔥🔥 " + streak + "-day streak! You're on fire!");
  } else if (streak >= 7 && streak < 14) {
    feedback.push("🔥🔥🔥 AMAZING! " + streak + " days in a row! You're a consistency champion!");
  } else if (streak >= 14 && streak < 30) {
    feedback.push("🔥🔥🔥🔥 INCREDIBLE! " + streak + " days straight! Your dedication is inspiring!");
  } else if (streak >= 30) {
    feedback.push("🔥🔥🔥🔥🔥 LEGENDARY! " + streak + " days in a row! You're an absolute beast!");
  }

  // ============================================================================
  // MILESTONE CELEBRATIONS
  // ============================================================================

  const totalWorkouts = history.length;
  
  if (totalWorkouts === 1) {
    feedback.push("🎉 First workout complete! This is the beginning of something amazing!");
  } else if (totalWorkouts === 5) {
    feedback.push("🎊 5 workouts down! You're officially building a habit!");
  } else if (totalWorkouts === 10) {
    feedback.push("🏆 10 WORKOUTS! You've proven your commitment!");
  } else if (totalWorkouts === 25) {
    feedback.push("💎 25 workouts! You're in the top tier of dedication!");
  } else if (totalWorkouts === 50) {
    feedback.push("👑 50 WORKOUTS! You're a cardio KING/QUEEN!");
  } else if (totalWorkouts === 100) {
    feedback.push("🌟 100 WORKOUTS!!! You're a LEGEND! This is beyond incredible!");
  } else if (totalWorkouts % 10 === 0 && totalWorkouts > 10) {
    feedback.push("🎯 Workout #" + totalWorkouts + " complete! Keep stacking those wins!");
  }

  // ============================================================================
  // IMPROVEMENT FEEDBACK (Trend Analysis)
  // ============================================================================

  if (history.length >= 2) {
    const previousWorkout = history[history.length - 2];
    const improvement = workout.completionRate - previousWorkout.completionRate;

    if (improvement > 20) {
      feedback.push("📈 HUGE improvement! +" + Math.round(improvement) + "% from last workout!");
    } else if (improvement > 10) {
      feedback.push("📈 Great progress! +" + Math.round(improvement) + "% completion improvement!");
    } else if (improvement > 0) {
      feedback.push("📈 Nice! You improved by " + Math.round(improvement) + "% since last time!");
    } else if (improvement < -10) {
      feedback.push("💙 Today was tougher, and that's okay! Rest and recovery are part of growth.");
    }
  }

  if (history.length >= 5) {
    const last5Avg = history.slice(-5).reduce((sum, w) => sum + w.completionRate, 0) / 5;
    const previous5Avg = history.slice(-10, -5).reduce((sum, w) => sum + w.completionRate, 0) / 5;
    
    if (last5Avg > previous5Avg + 10) {
      feedback.push("🚀 You're trending upward! Your recent workouts are " + Math.round(last5Avg - previous5Avg) + "% better!");
    }
  }

  // ============================================================================
  // SKIPPED ACTIVITIES FEEDBACK (Constructive)
  // ============================================================================

  const skippedActivities = workout.activities.filter(a => a.status === 'skipped');
  
  if (skippedActivities.length === 0 && workout.activitiesCompleted > 0) {
    feedback.push("✅ No skips! You completed every activity - that's dedication!");
  } else if (skippedActivities.length === 1) {
    feedback.push("💡 You skipped " + skippedActivities[0].name + " - listen to your body!");
  } else if (skippedActivities.length > 1) {
    const mostSkipped = getMostSkippedActivity(history);
    if (mostSkipped && skippedActivities.some(a => a.name === mostSkipped)) {
      feedback.push("🔄 " + mostSkipped + " is often skipped. Consider trying a modified version!");
    }
  }

  // ============================================================================
  // DURATION FEEDBACK (Time Management)
  // ============================================================================

  if (workout.totalDurationPlanned > 0) {
    const durationRatio = workout.totalDurationActual / workout.totalDurationPlanned;
    
    if (durationRatio >= 1.3) {
      feedback.push("⏱️ You took your time and pushed through - that's mental toughness!");
    } else if (durationRatio <= 0.7 && workout.completionRate >= 80) {
      feedback.push("⚡ Speed demon! You finished faster than planned!");
    } else if (Math.abs(durationRatio - 1) < 0.1) {
      feedback.push("🎯 Perfect pacing! Right on target with your planned time!");
    }
  }

  // ============================================================================
  // TIME-BASED MILESTONES
  // ============================================================================

  const totalMinutes = history.reduce((sum, w) => sum + w.totalDurationActual, 0);
  
  if (totalMinutes >= 60 && totalMinutes < 70) {
    feedback.push("⏰ You've completed 1 hour of cardio! That's commitment!");
  } else if (totalMinutes >= 300 && totalMinutes < 310) {
    feedback.push("⏰ 5 HOURS of cardio! You're a cardio warrior!");
  } else if (totalMinutes >= 600 && totalMinutes < 610) {
    feedback.push("⏰ 10 HOURS! You're in elite territory!");
  }

  // ============================================================================
  // PERSONAL RECORDS
  // ============================================================================

  const personalBest = Math.max(...history.map(w => w.completionRate), 0);
  if (workout.completionRate >= personalBest && workout.completionRate > 80) {
    feedback.push("🏅 NEW PERSONAL BEST! This is your highest completion rate ever!");
  }

  const longestWorkout = Math.max(...history.map(w => w.totalDurationActual), 0);
  if (workout.totalDurationActual >= longestWorkout && workout.totalDurationActual > 20) {
    feedback.push("🏅 LONGEST WORKOUT! You just set a new personal record!");
  }

  // ============================================================================
  // CONSISTENCY REWARDS
  // ============================================================================

  const recentWorkouts = history.slice(-7);
  if (recentWorkouts.length >= 5 && recentWorkouts.every(w => w.completionRate >= 70)) {
    feedback.push("🎖️ 5+ consecutive workouts with 70%+ completion! You're unstoppable!");
  }

  // ============================================================================
  // MOTIVATIONAL CLOSING
  // ============================================================================

  const motivationalQuotes = [
    "Remember: Every workout counts, no matter how small! 💪",
    "You're stronger than you were yesterday! 🌟",
    "Consistency beats perfection. Keep showing up! 🔥",
    "Your future self will thank you for this! 🙏",
    "Progress, not perfection. You're doing amazing! ✨",
    "The only bad workout is the one that didn't happen! 🎯",
    "You showed up. That's 90% of the battle! 🏆",
  ];

  // Add random motivational quote (20% chance)
  if (Math.random() < 0.2) {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    feedback.push(randomQuote);
  }

  return feedback;
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

/**
 * @param {WorkoutProgress[]} workouts
 * @returns {number}
 */
function calculateStreak(workouts) {
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

