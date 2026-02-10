import { Platform } from "react-native";
import Constants from "expo-constants";

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

// Using PC's actual IP for physical device testing
const MANUAL_HOST = "172.20.124.182"; // Your PC's IP on local network

const API_HOST = "172.20.124.182"; // Fixed IP for physical device testing

const API_PORT = 3000;

console.log("Platform.OS:", Platform.OS);
console.log("API_HOST:", API_HOST);

// Get API base URL (without /api suffix - routes already include it)
export const getStaticApiBaseUrl = () => {
  const url = `http://${API_HOST}:${API_PORT}`;
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
