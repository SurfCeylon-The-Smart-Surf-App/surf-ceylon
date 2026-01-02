/**
 * Pose Controller
 * Handles pose analysis operations
 */

const fetch = require("node-fetch");
const { asyncHandler } = require("../middlewares/errorHandler");
const {
  POSE_SERVER_URL,
  POSE_SERVER_TIMEOUT,
} = require("../config/aiConstants");

/**
 * Analyze pose (simple endpoint)
 * POST /api/ai-tutor/pose/analyze
 */
const analyzePose = asyncHandler(async (req, res) => {
  const { drillId, landmarks } = req.body;

  if (!drillId || !landmarks) {
    return res.status(400).json({ error: "Missing drillId or landmarks" });
  }

  // For now, return a simple response
  // In the future, this could use Python MediaPipe for more accurate analysis
  res.json({
    personDetected: true,
    confidence: 0.8,
    feedback: ["Pose analysis completed"],
    score: 75,
  });
});

/**
 * Analyze pose with detailed validation
 * POST /api/ai-tutor/pose-analysis/analyze
 */
const analyzePoseDetailed = asyncHandler(async (req, res) => {
  const { drillId, landmarks, frameData } = req.body;

  if (!drillId || !landmarks) {
    return res.status(400).json({
      error: "Missing required fields: drillId and landmarks",
    });
  }

  // Basic validation: check if landmarks have required keypoints
  const requiredKeys = [
    "leftShoulder",
    "rightShoulder",
    "leftHip",
    "rightHip",
    "nose",
  ];
  const hasRequiredKeys = requiredKeys.every(
    (key) =>
      landmarks[key] &&
      landmarks[key].visibility !== undefined &&
      landmarks[key].visibility >= 0.6
  );

  if (!hasRequiredKeys) {
    return res.json({
      personDetected: false,
      confidence: 0,
      feedback: ["No person detected. Ensure full body is visible."],
      score: 0,
    });
  }

  // Return success response (actual analysis is done client-side for now)
  res.json({
    personDetected: true,
    confidence: 0.85,
    feedback: ["Pose analysis completed"],
    score: 75,
    note: "Client-side analysis is used for real-time performance. Server-side analysis can be enabled for higher accuracy.",
  });
});

/**
 * Detect pose from image frame (MediaPipe)
 * POST /api/ai-tutor/pose/detect
 */
const detectPose = asyncHandler(async (req, res) => {
  const { image, drillId } = req.body;

  if (!image) {
    return res
      .status(400)
      .json({ error: "Missing required field: image (base64 encoded)" });
  }

  try {
    console.log("[pose] Calling pose detection server at:", POSE_SERVER_URL);

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), POSE_SERVER_TIMEOUT);

    const { sessionId } = req.body; // Get sessionId from request

    const response = await fetch(POSE_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, drillId, sessionId }), // Include sessionId
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("[pose] Pose server returned error:", errorData);
      return res.status(response.status).json({
        success: false,
        personDetected: false,
        error: errorData.error || "Pose detection failed",
        landmarks: null,
      });
    }

    const result = await response.json();
    console.log(
      "[pose] Pose detection successful, person detected:",
      result.personDetected
    );

    return res.json(result);
  } catch (error) {
    console.error("[pose] Error calling pose detection server:", error);

    let errorMessage = "Failed to detect pose";
    let errorDetails = error.message || "Unknown error";

    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("ECONNREFUSED")
    ) {
      errorMessage = "Pose detection server is not running";
      errorDetails = `Cannot connect to ${POSE_SERVER_URL}. Please ensure the Python pose detection server is running on port 8001.`;
    } else if (
      error.code === "ETIMEDOUT" ||
      error.message.includes("timeout")
    ) {
      errorMessage = "Pose detection request timed out";
      errorDetails =
        "The pose detection server took too long to respond. Please try again.";
    }

    return res.status(500).json({
      success: false,
      personDetected: false,
      error: errorMessage,
      details: errorDetails,
      landmarks: null,
    });
  }
});

/**
 * Health check for pose analysis service
 * GET /api/ai-tutor/pose-analysis/health
 */
const healthCheck = asyncHandler(async (req, res) => {
  res.json({
    status: "ok",
    service: "pose-analysis",
    mode: "server-side-mediapipe",
    poseServerUrl: POSE_SERVER_URL,
  });
});

module.exports = {
  analyzePose,
  analyzePoseDetailed,
  detectPose,
  healthCheck,
};
