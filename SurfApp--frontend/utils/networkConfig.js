/**
 * Legacy network config - now imports from centralized config
 *
 * UPDATE IP ADDRESS IN: config/network.js
 */

import { API_BASE_URL, BASE_URL } from "../config/network";

// Get API base URL from centralized config
export const getStaticApiBaseUrl = () => {
  return API_BASE_URL;
};

// Get image base URL from centralized config
export const getStaticImageBaseUrl = () => {
  return BASE_URL;
};

export default {
  getStaticApiBaseUrl,
  getStaticImageBaseUrl,
};
