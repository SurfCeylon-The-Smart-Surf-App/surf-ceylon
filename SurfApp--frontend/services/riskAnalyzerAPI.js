import axios from 'axios';
import { getRiskAnalyzerBaseUrl } from '../utils/riskAnalyzerConstants';

// Create axios instance for Risk Analyzer API
const riskAnalyzerAPI = axios.create({
  baseURL: getRiskAnalyzerBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
riskAnalyzerAPI.interceptors.request.use(
  (config) => {
    console.log(`📡 Risk Analyzer API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📡 Full URL: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
riskAnalyzerAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    console.error('❌ Error details:', error.response?.data || error);
    return Promise.reject(error);
  }
);

/**
 * Get all surf spots with skill-level risk data
 */
export const getSurfSpots = async (skillLevel = null) => {
  try {
    console.log('🌊 Fetching surf spots for Risk Analyzer...');
    const url = skillLevel 
      ? `/api/surfSpots?skillLevel=${skillLevel}` 
      : '/api/surfSpots';
    
    const response = await riskAnalyzerAPI.get(url);
    
    // Validate response structure
    if (!response.data) {
      throw new Error('No data received from server');
    }

    const spots = response.data.spots || response.data.data || [];
    console.log(`✅ Successfully loaded ${spots.length} surf spots`);
    
    return {
      success: true,
      data: spots,
      message: response.data.message
    };
  } catch (error) {
    console.error('💥 Error in getSurfSpots:', error.message);
    throw new Error(`Failed to fetch surf spots: ${error.message}`);
  }
};

/**
 * Get specific surf spot details by ID
 */
export const getSurfSpotById = async (spotId) => {
  try {
    console.log(`🏄 Fetching surf spot details for ID: ${spotId}`);
    const response = await riskAnalyzerAPI.get(`/api/surfSpots/${spotId}`);
    return {
      success: true,
      data: response.data.spot || response.data,
    };
  } catch (error) {
    console.error('💥 Error in getSurfSpotById:', error.message);
    throw new Error(`Failed to fetch surf spot: ${error.message}`);
  }
};

/**
 * Submit hazard report
 */
export const reportHazard = async (formData) => {
  try {
    console.log('⚠️ Submitting hazard report...');
    const response = await riskAnalyzerAPI.post('/api/hazardReports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Hazard report submitted successfully');
    return {
      success: true,
      data: response.data.report || response.data,
      message: response.data.message || 'Hazard report submitted successfully'
    };
  } catch (error) {
    console.error('💥 Error in reportHazard:', error.message);
    throw new Error(`Failed to submit hazard report: ${error.message}`);
  }
};

/**
 * Get hazard reports for a specific spot
 */
export const getHazardReports = async (spotId) => {
  try {
    console.log(`📋 Fetching hazard reports for spot: ${spotId}`);
    const response = await riskAnalyzerAPI.get(`/api/hazardReports?spotId=${spotId}`);
    return {
      success: true,
      data: response.data.reports || response.data.data || [],
    };
  } catch (error) {
    console.error('💥 Error in getHazardReports:', error.message);
    throw new Error(`Failed to fetch hazard reports: ${error.message}`);
  }
};

/**
 * Get incidents for a specific spot
 */
export const getIncidents = async (spotId) => {
  try {
    console.log(`📊 Fetching incidents for spot: ${spotId}`);
    const response = await riskAnalyzerAPI.get(`/api/incidents?spotId=${spotId}`);
    return {
      success: true,
      data: response.data.incidents || response.data.data || [],
    };
  } catch (error) {
    console.error('💥 Error in getIncidents:', error.message);
    throw new Error(`Failed to fetch incidents: ${error.message}`);
  }
};

/**
 * Check server health
 */
export const checkServerHealth = async () => {
  try {
    const response = await riskAnalyzerAPI.get('/api/health');
    console.log('💚 Server health:', response.data);
    return {
      success: true,
      data: response.data
    };
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
    console.log('🔍 Testing Risk Analyzer API connection...');
    console.log('🔍 API Base URL:', getRiskAnalyzerBaseUrl());
    
    const health = await checkServerHealth();
    console.log('🎉 API Connection successful!', health);
    
    return { success: true, data: health };
  } catch (error) {
    console.error('💥 API Connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default riskAnalyzerAPI;
