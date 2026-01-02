import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ============================================================
 * AI SURF TUTOR API
 * ============================================================
 * API endpoints for AI Surf Tutor features
 */

// Get API base URL from network config or use default
const getApiBaseUrl = () => {
  try {
    const networkConfig = require('./networkConfig');
    return networkConfig.API_BASE_URL || 'http://localhost:5001';
  } catch (error) {
    return 'http://localhost:5001';
  }
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Axios instance for AI Tutor
 */
const aiTutorAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Response interceptor
 */
aiTutorAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.warn('[AI Tutor API] Backend unreachable. Check connection.');
    }
    return Promise.reject(error);
  }
);

/**
 * ============================================================
 * POSE API
 * ============================================================
 */
export const poseAPI = {
  detectPose: async (imageData, drillId, sessionId) => {
    try {
      const response = await aiTutorAPI.post('/api/ai-tutor/pose/detect', {
        image: imageData,
        drillId,
        sessionId,
      });
      return response.data;
    } catch (error) {
      console.error('[Pose API] Detect pose error:', error);
      return {
        success: false,
        personDetected: false,
        landmarks: null,
        error: error.message,
      };
    }
  },

  analyzePose: async (drillId, landmarks) => {
    try {
      const response = await aiTutorAPI.post('/api/ai-tutor/pose/analyze', {
        drillId,
        landmarks,
      });
      return response.data;
    } catch (error) {
      console.error('[Pose API] Analyze pose error:', error);
      throw error;
    }
  },

  healthCheck: async () => {
    try {
      const response = await aiTutorAPI.get('/api/ai-tutor/pose-analysis/health');
      return response.data;
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  },
};

/**
 * ============================================================
 * CARDIO PLANS API
 * ============================================================
 */
export const cardioAPI = {
  getRecommendations: async (
    skillLevel,
    goal,
    userDetails,
    durationRange,
    limitations,
    equipment,
    adaptiveAdjustments
  ) => {
    try {
      const goalArray = Array.isArray(goal) ? goal : [goal];

      const response = await aiTutorAPI.post('/api/ai-tutor/recommend', {
        skillLevel,
        goal: goalArray,
        userDetails,
        durationRange,
        limitations,
        equipment: equipment || 'None',
        adaptiveAdjustments,
      });

      return response.data;
    } catch (error) {
      console.error('[Cardio API] Get recommendations error:', error);
      throw error;
    }
  },
};

/**
 * ============================================================
 * PROGRESS API
 * ============================================================
 */
export const progressAPI = {
  saveProgress: async (category, data, completedDrills, scores, badges) => {
    try {
      const body = category && data
        ? { category, data }
        : { completedDrills, scores, badges };

      const response = await aiTutorAPI.post('/api/ai-tutor/progress/save', body);
      return response.data;
    } catch (error) {
      console.error('[Progress API] Save progress error:', error);
      throw error;
    }
  },

  loadProgress: async () => {
    try {
      const response = await aiTutorAPI.get('/api/ai-tutor/progress/load');
      return response.data;
    } catch (error) {
      console.error('[Progress API] Load progress error:', error);
      throw error;
    }
  },
};

/**
 * ============================================================
 * GAMIFICATION API
 * ============================================================
 */
export const gamificationAPI = {
  awardPoints: async (points, badge, streak, achievement, metadata) => {
    try {
      const response = await aiTutorAPI.post('/api/ai-tutor/gamification/award', {
        points,
        badge,
        streak,
        achievement,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error('[Gamification API] Award points error:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await aiTutorAPI.get('/api/ai-tutor/gamification/stats');
      return response.data;
    } catch (error) {
      console.error('[Gamification API] Get stats error:', error);
      throw error;
    }
  },

  updateStreak: async (lastWorkoutDate, currentDate) => {
    try {
      const response = await aiTutorAPI.post('/api/ai-tutor/gamification/streak', {
        lastWorkoutDate,
        currentDate,
      });
      return response.data;
    } catch (error) {
      console.error('[Gamification API] Update streak error:', error);
      throw error;
    }
  },

  checkBadgeEligibility: async (workoutCount, totalMinutes, streak, completionRate) => {
    try {
      const response = await aiTutorAPI.post('/api/ai-tutor/gamification/check-badges', {
        workoutCount,
        totalMinutes,
        streak,
        completionRate,
      });
      return response.data;
    } catch (error) {
      console.error('[Gamification API] Check badge eligibility error:', error);
      throw error;
    }
  },

  calculatePoints: async (workoutDuration, activitiesCompleted, completionRate, streak) => {
    try {
      const response = await aiTutorAPI.post('/api/ai-tutor/gamification/calculate-points', {
        workoutDuration,
        activitiesCompleted,
        completionRate,
        streak,
      });
      return response.data;
    } catch (error) {
      console.error('[Gamification API] Calculate points error:', error);
      throw error;
    }
  },
};

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */
export const checkAITutorHealth = async () => {
  try {
    const res = await aiTutorAPI.get('/api/health', { timeout: 5000 });
    return res.status === 200;
  } catch (err) {
    console.warn('[AI Tutor API] Backend health check failed');
    return false;
  }
};

export default aiTutorAPI;
