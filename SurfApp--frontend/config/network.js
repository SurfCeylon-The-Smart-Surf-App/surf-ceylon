/**
 * Centralized Network Configuration
 *
 * This is the single source of truth for all network-related configuration.
 * Update the IP address here to match your backend server.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Get the local network IP address
 *
 * IMPORTANT: Update this IP address to match your local machine's IP:
 * 1. Windows: Run `ipconfig` and find your IPv4 Address
 * 2. macOS/Linux: Run `ifconfig` or `ip addr` and find your IP
 * 3. The backend server must be running on this IP address
 */
const LOCAL_NETWORK_IP = "172.20.124.182"; // Update this to your computer's local IP

/**
 * Backend server port
 */
export const BACKEND_PORT = 3000;

/**
 * ML Service port (Python services)
 */
export const ML_SERVICE_PORT = 5003;

/**
 * Get the appropriate backend host based on the platform and environment
 */
const getBackendHost = () => {
  // For production builds, use environment variable if available
  if (process.env.API_HOST) {
    return process.env.API_HOST;
  }

  // Try to auto-detect IP from Expo's debugger host (works in Expo Go)
  const debuggerHost =
    Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    // debuggerHost is usually "192.168.x.x:8081" or "172.20.x.x:8081"
    const ip = debuggerHost.split(":")[0];
    if (ip && ip !== "localhost") {
      console.log("📱 Using device API URL:", `http://${ip}:${BACKEND_PORT}`);
      return ip;
    }
  }

  // Fallback to configured local network IP
  console.log("API_HOST:", LOCAL_NETWORK_IP);
  console.log(
    "Generated API URL:",
    `http://${LOCAL_NETWORK_IP}:${BACKEND_PORT}/api`,
  );

  return LOCAL_NETWORK_IP;
};

/**
 * Base backend URL (includes /api path)
 */
export const API_BASE_URL = `http://${getBackendHost()}:${BACKEND_PORT}/api`;

/**
 * Base backend URL without /api (for socket connections, etc.)
 */
export const BASE_URL = `http://${getBackendHost()}:${BACKEND_PORT}`;

/**
 * ML Service URL (for direct ML service access)
 */
export const ML_SERVICE_URL = `http://${getBackendHost()}:${ML_SERVICE_PORT}`;

/**
 * WebSocket URL (if using WebSockets)
 */
export const WS_URL = `ws://${getBackendHost()}:${BACKEND_PORT}`;

/**
 * Environment flag
 */
export const IS_DEVELOPMENT = __DEV__;

/**
 * API Endpoints - Centralized endpoint definitions
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: `${API_BASE_URL}/auth`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,

  // AI Tutor
  AI_TUTOR: `${API_BASE_URL}/ai-tutor`,
  AI_TUTOR_CHAT: `${API_BASE_URL}/ai-tutor/chat`,
  AI_VIDEO_ANALYSIS: `${API_BASE_URL}/ai-tutor/analyze-video`,

  // AR Recommendations
  AR_RECOMMENDATIONS: `${API_BASE_URL}/ar/recommendations`,
  AR_DRILLS: `${API_BASE_URL}/ar/drills`,
  AR_HEALTH: `${API_BASE_URL}/ar/health`,

  // Spots
  SPOTS: `${API_BASE_URL}/spots`,
  SPOT_DETAILS: (spotId) => `${API_BASE_URL}/spots/${spotId}`,

  // Sessions
  SESSIONS: `${API_BASE_URL}/sessions`,
  SESSION_START: `${API_BASE_URL}/sessions/start`,
  SESSION_END: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/end`,
  USER_SESSIONS: (userId) => `${API_BASE_URL}/sessions/user/${userId}`,

  // Forecast
  FORECAST: `${API_BASE_URL}/forecast`,

  // Posts
  POSTS: `${API_BASE_URL}/posts`,
  POST_DETAILS: (postId) => `${API_BASE_URL}/posts/${postId}`,

  // Messages
  MESSAGES: `${API_BASE_URL}/messages`,
  CONVERSATIONS: `${API_BASE_URL}/messages/conversations`,

  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_PROFILE: (userId) => `${API_BASE_URL}/users/${userId}`,
  USER_POSTS: (userId) => `${API_BASE_URL}/users/${userId}/posts`,

  // Health
  HEALTH: `${API_BASE_URL}/health`,
};

/**
 * Log configuration on startup
 */
if (IS_DEVELOPMENT) {
  console.log("\n🌐 API Configuration:");
  console.log("====================");
  console.log("Platform:", Platform.OS);
  console.log("Base URL:", BASE_URL);
  console.log("API URL:", API_BASE_URL);
  console.log("ML Service:", ML_SERVICE_URL);
  console.log("====================\n");
}

export default {
  API_BASE_URL,
  BASE_URL,
  ML_SERVICE_URL,
  WS_URL,
  API_ENDPOINTS,
  IS_DEVELOPMENT,
};
