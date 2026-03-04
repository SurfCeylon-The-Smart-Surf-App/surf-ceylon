/**
 * Legacy config file - now imports from centralized network config
 *
 * UPDATE IP ADDRESS IN: config/network.js
 */

import {
  API_BASE_URL,
  ML_SERVICE_URL,
  IS_DEVELOPMENT,
  API_ENDPOINTS,
} from "../config/network";

// Re-export for backwards compatibility
export { API_BASE_URL, ML_SERVICE_URL, IS_DEVELOPMENT, API_ENDPOINTS };

// Debug logging in development
if (IS_DEVELOPMENT) {
  console.log("📡 API Configuration:");
  console.log("   Backend:", API_BASE_URL);
  console.log("   ML Service:", ML_SERVICE_URL);
}
