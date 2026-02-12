import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 🔧 CONFIGURE THIS FOR PHYSICAL DEVICE TESTING
// Use the same IP as your computer (same as in riskAnalyzerConstants.js)
const DEVICE_API_URL = 'http://10.121.69.168:3000/api';

const getApiUrl = () => {
  // If testing on physical device, use the configured URL
  if (DEVICE_API_URL) {
    console.log('📱 Using device API URL:', DEVICE_API_URL);
    return DEVICE_API_URL;
  }

  // Default to localhost for web or if detection fails
  let host = '127.0.0.1';

  // Special handling for Android Emulator
  if (Platform.OS === 'android') {
    host = '10.0.2.2';
  }

  // Try to get the host from Expo constants (works for Expo Go and Dev Builds)
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  
  if (debuggerHost) {
    // debuggerHost is usually "192.168.x.x:8081"
    // We want just the IP part
    const ip = debuggerHost.split(':')[0];
    if (ip) {
      host = ip;
    }
  }

  return `http://${host}:3000/api`;
};

export { getApiUrl };
export const API_URL = getApiUrl();
