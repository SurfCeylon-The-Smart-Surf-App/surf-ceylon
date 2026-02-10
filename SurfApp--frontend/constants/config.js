// API Configuration
// Update this IP address to match your backend server

// Your local network IP address
const LOCAL_IP = "172.20.124.182";

// Backend server port
const BACKEND_PORT = "3000";

// API Base URL
export const API_BASE_URL = `http://${LOCAL_IP}:${BACKEND_PORT}/api`;

// ML Service URL (for direct access if needed)
export const ML_SERVICE_URL = `http://${LOCAL_IP}:5003`;

// Environment
export const IS_DEVELOPMENT = __DEV__;

// Export individual endpoints for convenience
export const API_ENDPOINTS = {
  // Auth
  AUTH: `${API_BASE_URL}/auth`,
  
  // AI Tutor
  AI_TUTOR: `${API_BASE_URL}/ai-tutor`,
  
  // AR Recommendations
  AR_RECOMMENDATIONS: `${API_BASE_URL}/ar/recommendations`,
  AR_DRILLS: `${API_BASE_URL}/ar/drills`,
  AR_HEALTH: `${API_BASE_URL}/ar/health`,
  
  // Spots
  SPOTS: `${API_BASE_URL}/spots`,
  
  // Sessions
  SESSIONS: `${API_BASE_URL}/sessions`,
  
  // Forecast
  FORECAST: `${API_BASE_URL}/forecast`,
  
  // Posts
  POSTS: `${API_BASE_URL}/posts`,
  
  // Messages
  MESSAGES: `${API_BASE_URL}/messages`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
};

// Debug logging in development
if (IS_DEVELOPMENT) {
  console.log('📡 API Configuration:');
  console.log('   Backend:', API_BASE_URL);
  console.log('   ML Service:', ML_SERVICE_URL);
}
