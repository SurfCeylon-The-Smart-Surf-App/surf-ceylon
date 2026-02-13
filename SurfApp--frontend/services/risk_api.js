import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../utils/constants';
import { Alert, Platform } from 'react-native';

// Create axios instance with auto-detected base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📡 Full URL: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.status);
    // Better logging for different response types
    if (Array.isArray(response.data?.data)) {
      console.log(`✅ Data received: ${response.data.data.length} items`);
    } else if (response.data?.success) {
      console.log(`✅ Operation successful:`, response.data.message || 'OK');
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    console.error('❌ Error details:', error.response?.data || error);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      Alert.alert(
        'Connection Error',
        `Cannot connect to server at ${API_BASE_URL}.\n\n` +
        'Please ensure:\n' +
        '1. Backend server is running on port 5000\n' +
        '2. You are on the same network\n' +
        '3. Check API_BASE_URL in constants.js',
        [{ text: 'OK' }]
      );
    }
    
    return Promise.reject(error);
  }
);

/**
 * Get all surf spots with skill-level risk data
 */
export const getSurfSpots = async () => {
  try {
    console.log('🌊 Fetching surf spots...');
    const response = await api.get(ENDPOINTS.SURF_SPOTS);
    
    // Validate response structure
    if (!response.data) {
      throw new Error('No data received from server');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }

    const spots = response.data.data || [];
    console.log(`✅ Successfully loaded ${spots.length} surf spots`);
    
    // Log first spot structure for debugging
    if (spots.length > 0) {
      console.log('📊 First spot structure:', {
        name: spots[0].name,
        hasCoordinates: !!spots[0].coordinates,
        hasSkillRisks: !!spots[0].skillLevelRisks,
        skillLevels: spots[0].skillLevelRisks ? Object.keys(spots[0].skillLevelRisks) : []
      });
    }

    return response.data;
  } catch (error) {
    console.error('💥 Error in getSurfSpots:', error.message);
    throw new Error(`Failed to fetch surf spots: ${error.message}`);
  }
};

/**
 * Get specific surf spot details
 */
export const getSurfSpotById = async (spotId) => {
  try {
    const response = await api.get(`${ENDPOINTS.SURF_SPOTS}/${spotId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch surf spot: ${error.message}`);
  }
};

/**
 * Submit hazard report
 */
export const submitHazardReport = async (formData) => {
  try {
    // For React Native multipart/form-data, we need to:
    // 1. NOT set Content-Type header (let axios/fetch set it with boundary)
    // 2. Use transformRequest to prevent axios from trying to serialize FormData
    const response = await api.post(ENDPOINTS.HAZARD_REPORTS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data, // Prevent axios from transforming FormData
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to submit hazard report: ${error.message}`);
  }
};

/**
 * Check server health
 */
export const checkServerHealth = async () => {
  try {
    const response = await api.get(ENDPOINTS.HEALTH);
    console.log('💚 Server health:', response.data);
    return response.data;
  } catch (error) {
    console.error('💔 Server health check failed:', error.message);
    throw new Error(`Server health check failed: ${error.message}`);
  }
};

/**
 * Test API connection
 */
export const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    
    const health = await checkServerHealth();
    console.log('🎉 API Connection successful!', health);
    
    return { success: true, data: health };
  } catch (error) {
    console.error('💥 API Connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * API wrapper objects for organized access
 */
export const surfSpotsAPI = {
  getAll: getSurfSpots,
  getById: getSurfSpotById,
};

export const hazardReportsAPI = {
  submit: submitHazardReport,
};

export default api;