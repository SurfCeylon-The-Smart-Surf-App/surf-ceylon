import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * INSTRUCTIONS:
 * 1. For Android Emulator: Uses 10.0.2.2 automatically
 * 2. For iOS Simulator: Uses localhost automatically
 * 3. For Physical Device: Set your computer's IP below
 */

// 🔧 CONFIGURE THIS FOR PHYSICAL DEVICE TESTING
// Find your computer's IP from backend startup logs
// Example: const DEVICE_API_URL = 'http://192.168.1.100:5000';
const DEVICE_API_URL = 'http://192.168.1.152:5000'; // Leave empty for emulator/simulator

/**
 * Get the API base URL based on platform
 */
const getApiBaseUrl = () => {
  // If testing on physical device, use the configured URL
  if (DEVICE_API_URL) {
    console.log('📱 Using device API URL:', DEVICE_API_URL);
    return DEVICE_API_URL;
  }

  // Auto-detect for emulator/simulator
  if (Platform.OS === 'android') {
    console.log('🤖 Android emulator detected, using 10.0.2.2:5000');
    return 'http://10.0.2.2:5000';
  } else if (Platform.OS === 'ios') {
    console.log('🍎 iOS simulator detected, using localhost:5000');
    return 'http://localhost:5000';
  } else {
    console.log('🌐 Web platform detected, using localhost:5000');
    return 'http://localhost:5000';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const ENDPOINTS = {
  HEALTH: '/api/health',
  SERVER_INFO: '/api/server-info',
  SURF_SPOTS: '/api/surf-spots',
  HAZARD_REPORTS: '/api/hazard-reports',
  INCIDENTS: '/api/incidents',
};

// Skill Levels
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

// Skill-Specific Risk Thresholds
export const SKILL_RISK_THRESHOLDS = {
  beginner: {
    low: 5.0,      // 1-5 = Green
    medium: 6.5    // 5-6.5 = Yellow, 6.5-10 = Red
  },
  intermediate: {
    low: 6.0,      // 1-6 = Green
    medium: 7.2    // 6-7.2 = Yellow, 7.2-10 = Red
  },
  advanced: {
    low: 7.0,      // 1-7 = Green
    medium: 8.0    // 7-8 = Yellow, 8-10 = Red
  },
  overall: {
    low: 3.3,      // Default overall thresholds
    medium: 6.6
  }
};

// Expected Risk Distributions (for validation)
export const EXPECTED_DISTRIBUTIONS = {
  beginner: {
    green: ['Kalpitiya', 'Point Pedro', 'Trincomalee'],
    yellow: ['Ahangama', 'Arugam Bay', 'Matara', 'Thalpe', 'Weligama'],
    red: ['Hikkaduwa', 'Midigama', 'Mirissa', 'Unawatuna']
  },
  intermediate: {
    green: ['Kalpitiya', 'Point Pedro', 'Trincomalee', 'Matara', 'Thalpe'],
    yellow: ['Ahangama', 'Arugam Bay', 'Mirissa', 'Weligama'],
    red: ['Hikkaduwa', 'Midigama', 'Unawatuna']
  },
  advanced: {
    green: 'All spots should be green',
    yellow: [],
    red: []
  }
};

// Risk Level Constants
export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const FLAG_COLORS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

// Hazard Types
export const HAZARD_TYPES = [
  'Rip Current',
  'High Surf',
  'Reef Cuts',
  'Jellyfish',
  'Sea Urchins',
  'Strong Winds',
  'Poor Visibility',
  'Overcrowding',
  'Equipment Issues',
  'Marine Life',
  'Other',
];

export const SEVERITY_LEVELS = ['low', 'medium', 'high'];

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@user_data',
  THEME: '@theme',
  LANGUAGE: '@language',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  FAVORITE_SPOTS: '@favorite_spots',
  NOTIFICATION_SETTINGS: '@notification_settings',
  SELECTED_SKILL_LEVEL: '@selected_skill_level',
};

// Log configuration on startup
console.log('\n🌐 API Configuration:');
console.log('====================');
console.log('Platform:', Platform.OS);
console.log('Base URL:', API_BASE_URL);
console.log('\n📊 Skill Thresholds:');
console.log('Beginner:     Green (1-5) | Yellow (5-6.5) | Red (6.5-10)');
console.log('Intermediate: Green (1-6) | Yellow (6-7.2) | Red (7.2-10)');
console.log('Advanced:     Green (1-7) | Yellow (7-8)   | Red (8-10)');
console.log('====================\n');