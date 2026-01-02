/**
 * AI Surf Tutor Routes
 * Consolidated routes for AI Surf Tutor features
 */

const express = require("express");
const router = express.Router();

// Import controllers
const gamificationController = require("../controllers/gamificationController");
const poseController = require("../controllers/poseController");
const progressController = require("../controllers/progressController");
const recommendController = require("../controllers/recommendController");

// ============================================================================
// Gamification Routes
// ============================================================================
router.post("/gamification/award", gamificationController.awardPoints);
router.get("/gamification/stats", gamificationController.getStats);
router.post("/gamification/streak", gamificationController.updateStreak);
router.post(
  "/gamification/check-badges",
  gamificationController.checkBadgeEligibility
);
router.get("/gamification/leaderboard", gamificationController.getLeaderboard);
router.post(
  "/gamification/calculate-points",
  gamificationController.calculatePoints
);

// ============================================================================
// Pose Detection & Analysis Routes
// ============================================================================
// Pose detection endpoint (MediaPipe)
router.post("/pose/detect", poseController.detectPose);

// Pose analysis endpoint (legacy)
router.post("/pose/analyze", poseController.analyzePose);

// Detailed pose analysis
router.post("/pose-analysis/analyze", poseController.analyzePoseDetailed);

// Health check
router.get("/pose-analysis/health", poseController.healthCheck);

// ============================================================================
// Progress Tracking Routes
// ============================================================================
router.post("/progress/save", progressController.saveProgress);
router.get("/progress/load", progressController.loadProgress);

// ============================================================================
// Workout Recommendation Routes
// ============================================================================
router.post("/recommend", recommendController.getRecommendation);

module.exports = router;
