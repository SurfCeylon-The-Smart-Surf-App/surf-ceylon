/**
 * AI Surf Tutor Constants and Configuration
 * Centralized configuration file for the Surf AI features
 */

module.exports = {
  // Model Server
  MODEL_SERVER_URL:
    process.env.MODEL_SERVER_URL || "http://127.0.0.1:8000/predict",
  MODEL_SERVER_TIMEOUT: 30000, // 30 seconds

  // Pose Detection Server
  POSE_SERVER_URL:
    process.env.POSE_SERVER_URL || "http://127.0.0.1:8001/detect",
  POSE_SERVER_TIMEOUT: 20000, // 20 seconds (increased for slower connections and complex model)

  // User Validation
  ALLOWED_SKILL_LEVELS: ["Beginner", "Intermediate", "Advanced", "Pro"],
  ALLOWED_GOALS: [
    "Endurance",
    "Strength",
    "Flexibility",
    "Balance",
    "Power",
    "Stamina",
    "Fat Loss",
  ],

  // Goal and Skill Mapping for ML Model
  SKILL_MAP: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Pro",
    pro: "Pro",
  },
  GOAL_MAP: {
    endurance: "Endurance",
    power: "Power",
    strength: "Power",
    "fat loss": "Fat Loss",
    stamina: "Stamina",
    flexibility: "Endurance",
    balance: "Stamina",
  },
};
