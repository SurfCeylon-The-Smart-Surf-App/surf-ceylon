import { Platform } from "react-native";
import Constants from "expo-constants";
import { getApiUrl } from "../data/config";

// Get API base URL - uses config.js which handles device URL override
export const getStaticApiBaseUrl = () => {
  const url = getApiUrl(); // Use the centralized config that handles DEVICE_API_URL
  console.log("Generated API URL:", url);
  return url;
};

// Get image base URL
export const getStaticImageBaseUrl = () => {
  const apiUrl = getApiUrl(); // Get the API URL from config
  // Remove '/api' suffix to get base URL
  return apiUrl.replace('/api', '');
};

export default {
  getStaticApiBaseUrl,
  getStaticImageBaseUrl,
};
