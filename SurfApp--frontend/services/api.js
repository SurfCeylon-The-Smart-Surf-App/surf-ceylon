import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * ============================================================
 * API BASE URL (DYNAMIC CONFIGURATION)
 * ============================================================
 * Using PC's network IP for physical device testing
 * - Physical Device: 172.24.130.182 (your PC's IP on local network)
 * - Backend Port: 3000
 */
const API_HOST = "172.20.124.182";
const API_PORT = 3000;
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

console.log(`[API] Using backend: ${API_BASE_URL}`);

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */
export const checkBackendHealth = async () => {
  try {
    const res = await api.get("/health", { timeout: 5000 });
    return res.status === 200;
  } catch (err) {
    console.warn("[API] Backend health check failed");
    return false;
  }
};

/**
 * ============================================================
 * RESPONSE INTERCEPTOR (LIGHT LOGGING)
 * ============================================================
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      console.warn("[API] Backend unreachable. Check IP / WiFi / Firewall");
    }
    return Promise.reject(error);
  }
);

/**
 * ============================================================
 * POSE API (NATIVE EDGE AI – STUB)
 * ============================================================
 */
export const poseAPI = {
  detectPose: async () => {
    return {
      success: true,
      personDetected: false,
      landmarks: null,
    };
  },

  healthCheck: async () => {
    return { status: "ok", mode: "native_edge_ai" };
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
    const goalArray = Array.isArray(goal) ? goal : [goal];

    const response = await api.post("/api/ai-tutor/recommend", {
      skillLevel,
      goal: goalArray,
      userDetails,
      durationRange,
      limitations,
      equipment: equipment || "None",
      adaptiveAdjustments,
    });

    return response.data;
  },
};

/**
 * ============================================================
 * PROGRESS API
 * ============================================================
 */
export const progressAPI = {
  saveProgress: async (category, data, completedDrills, scores, badges) => {
    const body =
      category && data
        ? { category, data }
        : { completedDrills, scores, badges };

    const response = await api.post("/api/ai-tutor/progress/save", body);
    return response.data;
  },

  loadProgress: async () => {
    const response = await api.get("/api/ai-tutor/progress/load");
    return response.data;
  },
};

/**
 * ============================================================
 * GAMIFICATION API
 * ============================================================
 */
export const gamificationAPI = {
  awardPoints: async (points, badge, streak) => {
    const response = await api.post("/api/ai-tutor/gamification/award", {
      points,
      badge,
      streak,
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/api/ai-tutor/gamification/stats");
    return response.data;
  },
};

/**
 * ============================================================
 * SESSION API
 * ============================================================
 */
export const sessionAPI = {
  saveSession: async (sessionData) => {
    const userId = await AsyncStorage.getItem("userId");

    const response = await api.post("/api/sessions/save", {
      userId,
      ...sessionData,
    });

    return response.data;
  },

  getSessions: async (options) => {
    const response = await api.get("/api/sessions", { params: options });
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await api.get(`/api/sessions/${sessionId}`);
    return response.data;
  },
};

export default api;
