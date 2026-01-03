import { Platform } from "react-native";
import Constants from "expo-constants";
import { getApiUrl } from "../data/config";

// Dynamic network configuration for development
// Automatically detects the dev server IP from Expo
const getDevServerHost = () => {
  // For Expo dev server, extract host from manifest
  const { expoConfig } = Constants;
  if (expoConfig?.hostUri) {
    // hostUri format: "192.168.1.x:8081" - extract just the IP
    return expoConfig.hostUri.split(":")[0];
  }
  return null;
};

// Fallback to manual configuration if Expo host detection fails
const MANUAL_HOST = "172.20.10.5"; // Update this if your IP changes

const API_HOST =
  Platform.OS === "android"
    ? "10.0.2.2" // Android emulator special IP to reach host machine
    : Platform.OS === "web"
    ? "localhost"
    : getDevServerHost() || MANUAL_HOST; // iOS/physical devices: auto-detect or fallback

const API_PORT = 3000;

console.log("Platform.OS:", Platform.OS);
console.log("API_HOST:", API_HOST);

// Get API base URL
export const getStaticApiBaseUrl = () => {
  const url = `http://${API_HOST}:${API_PORT}/api`;
  console.log("Generated API URL:", url);
  return url;
};

// Get image base URL
export const getStaticImageBaseUrl = () => {
  return `http://${API_HOST}:${API_PORT}`;
};

export default {
  getStaticApiBaseUrl,
  getStaticImageBaseUrl,
};
