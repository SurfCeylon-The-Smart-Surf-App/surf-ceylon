import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Using PC's actual IP for physical device testing
  const host = '172.24.130.182'; // Your PC's IP on local network
  return `http://${host}:3000/api`;
};

export const API_URL = getApiUrl();
