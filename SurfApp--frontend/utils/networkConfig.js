import { Platform } from "react-native";

// Simple network configuration for development
// For Android Emulator, use 10.0.2.2 to access host machine's localhost
// For iOS/physical devices, use your WiFi IP address
const API_HOST =
  Platform.OS === "android"
    ? "10.0.2.2"
    : Platform.OS === "web"
    ? "localhost"
    : "172.20.10.2";
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
