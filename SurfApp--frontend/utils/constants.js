/**
 * Application Constants
 *
 * API Configuration is now centralized in: config/network.js
 * Update IP address there for all API calls
 */

import { API_BASE_URL, BASE_URL } from "../config/network";

// Re-export for backwards compatibility
export { API_BASE_URL, BASE_URL };

// API Endpoints (legacy - prefer using API_ENDPOINTS from config/network)
// Note: No /api prefix here since API_BASE_URL already includes it
export const ENDPOINTS = {
  HEALTH: "/health",
  SERVER_INFO: "/server-info",
  SURF_SPOTS: "/surf-spots",
  HAZARD_REPORTS: "/hazard-reports",
  INCIDENTS: "/incidents",
};

// Skill Levels
export const SKILL_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

// Skill-Specific Risk Thresholds
export const SKILL_RISK_THRESHOLDS = {
  beginner: {
    low: 5.0, // 1-5 = Green
    medium: 6.5, // 5-6.5 = Yellow, 6.5-10 = Red
  },
  intermediate: {
    low: 6.0, // 1-6 = Green
    medium: 7.2, // 6-7.2 = Yellow, 7.2-10 = Red
  },
  advanced: {
    low: 7.0, // 1-7 = Green
    medium: 8.0, // 7-8 = Yellow, 8-10 = Red
  },
  overall: {
    low: 3.3, // Default overall thresholds
    medium: 6.6,
  },
};

// Expected Risk Distributions (for validation)
export const EXPECTED_DISTRIBUTIONS = {
  beginner: {
    green: ["Kalpitiya", "Point Pedro", "Trincomalee"],
    yellow: ["Ahangama", "Arugam Bay", "Matara", "Thalpe", "Weligama"],
    red: ["Hikkaduwa", "Midigama", "Mirissa", "Unawatuna"],
  },
  intermediate: {
    green: ["Kalpitiya", "Point Pedro", "Trincomalee", "Matara", "Thalpe"],
    yellow: ["Ahangama", "Arugam Bay", "Mirissa", "Weligama"],
    red: ["Hikkaduwa", "Midigama", "Unawatuna"],
  },
  advanced: {
    green: "All spots should be green",
    yellow: [],
    red: [],
  },
};

// Risk Level Constants
export const RISK_LEVELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const FLAG_COLORS = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
};

// Hazard Types
export const HAZARD_TYPES = [
  "Rip Current",
  "Large Wave",
  "Reef Cuts",
  "Jellyfish",
  "Sea Urchins",
  "Shark",
  "Marine Life",
  "Other",
];

export const SEVERITY_LEVELS = ["low", "medium", "high"];

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "@auth_token",
  USER: "@user_data",
  THEME: "@theme",
  LANGUAGE: "@language",
  ONBOARDING_COMPLETE: "@onboarding_complete",
  FAVORITE_SPOTS: "@favorite_spots",
  NOTIFICATION_SETTINGS: "@notification_settings",
  SELECTED_SKILL_LEVEL: "@selected_skill_level",
};

// Skill thresholds info
console.log("\n📊 Skill Thresholds:");
console.log("Beginner:     Green (1-5) | Yellow (5-6.5) | Red (6.5-10)");
console.log("Intermediate: Green (1-6) | Yellow (6-7.2) | Red (7.2-10)");
console.log("Advanced:     Green (1-7) | Yellow (7-8)   | Red (8-10)");
console.log("====================\n");
