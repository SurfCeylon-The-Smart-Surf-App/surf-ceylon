/**
 * Recommend Controller
 * Handles ML-based workout recommendations using Deep Learning Model
 */

const fetch = require("node-fetch");

const { asyncHandler } = require("../middlewares/errorHandler");

// ML Cardio Server Configuration
const ML_CARDIO_SERVER_URL = process.env.ML_CARDIO_SERVER_URL || "http://127.0.0.1:5006/api/ai-tutor/recommend";
const ML_SERVER_TIMEOUT = 30000; // 30 seconds

/**
 * Normalize string for model input
 */
const normalize = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");

/**
 * Get workout recommendations from ML model
 * POST /api/ai-tutor/recommend
 */
const getRecommendation = asyncHandler(async (req, res) => {
  // Log the raw request body for debugging
  console.log("[recommend] ========== NEW REQUEST ==========");
  console.log("[recommend] Raw request body:", JSON.stringify(req.body, null, 2));
  console.log("[recommend] Body type:", typeof req.body);
  console.log("[recommend] Body keys:", Object.keys(req.body || {}));
  
  const {
    skillLevel,
    fitnessLevel,
    goal,
    userId,
    equipment,
    duration,
    durationRange,
    userDetails,
    height,
    weight,
    limitations,
    adaptiveAdjustments,
  } = req.body || {};

  console.log("[recommend] Destructured values:");
  console.log("  - skillLevel:", skillLevel, typeof skillLevel);
  console.log("  - fitnessLevel:", fitnessLevel, typeof fitnessLevel);
  console.log("  - goal:", goal, typeof goal, Array.isArray(goal));
  console.log("  - equipment:", equipment, typeof equipment);
  console.log("  - durationRange:", durationRange, typeof durationRange);

  // Use fitnessLevel or skillLevel (frontend uses both)
  let userFitnessLevel = skillLevel || fitnessLevel || 'intermediate';
  console.log("[recommend] userFitnessLevel before normalize:", userFitnessLevel, typeof userFitnessLevel);
  
  if (typeof userFitnessLevel === 'string') {
    userFitnessLevel = normalize(userFitnessLevel);
    console.log("[recommend] userFitnessLevel after normalize:", userFitnessLevel);
  }
  
  // Handle goal as array or string
  let userGoal = 'endurance';
  if (Array.isArray(goal) && goal.length > 0) {
    console.log("[recommend] Goal is array, first element:", goal[0], typeof goal[0]);
    userGoal = typeof goal[0] === 'string' ? normalize(goal[0]) : 'endurance';
  } else if (typeof goal === 'string') {
    userGoal = normalize(goal);
  }
  console.log("[recommend] userGoal final:", userGoal);
  
  let userEquipment = equipment || 'none';
  if (typeof userEquipment === 'string') {
    userEquipment = normalize(userEquipment);
  }
  
  // Handle duration - durationRange is like "5-10" or "10-20"
  let userDuration = duration || durationRange || '10-20';
  
  // Extract height/weight from userDetails if provided
  const userHeight = height || userDetails?.height || 170;
  const userWeight = weight || userDetails?.weight || 70;
  const userLimitations = Array.isArray(limitations) ? limitations : [];

  console.log("[recommend] Parsed values:", {
    userFitnessLevel,
    userGoal,
    userEquipment,
    userDuration,
    userHeight,
    userWeight,
    userLimitations
  });

  if (!userFitnessLevel || !userGoal || userFitnessLevel === '' || userGoal === '') {
    console.error("[recommend] Validation failed - missing or empty fields");
    return res
      .status(400)
      .json({ error: "Missing required fields: skillLevel/fitnessLevel and goal" });
  }

  console.log("[recommend] ML Cardio Request:", {
    fitnessLevel: userFitnessLevel,
    goal: userGoal,
    equipment: userEquipment,
    duration: userDuration,
    height: userHeight,
    weight: userWeight,
    limitations: userLimitations
  });

  // Prepare payload for ML server
  const payload = {
    skillLevel: userFitnessLevel,
    fitnessLevel: userFitnessLevel,
    goal: userGoal,
    equipment: userEquipment,
    duration: userDuration,
    height: userHeight,
    weight: userWeight,
    limitations: userLimitations
  };

  try {
    console.log("[recommend] Calling ML Cardio Server at:", ML_CARDIO_SERVER_URL);
    console.log("[recommend] Payload:", JSON.stringify(payload, null, 2));

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      ML_SERVER_TIMEOUT
    );

    const resp = await fetch(ML_CARDIO_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      let json;
      try {
        json = await resp.json();
      } catch (parseError) {
        json = {
          error: "Failed to parse ML server response",
          status: resp.status,
        };
      }

      const errorPayload = {
        error: json?.error || json?.message || "ML server error",
        details: json?.details || `HTTP ${resp.status}`,
        status: resp.status,
      };
      console.error("[recommend] ML server returned error:", errorPayload);
      return res
        .status(resp.status >= 400 && resp.status < 600 ? resp.status : 500)
        .json(errorPayload);
    }

    const mlResponse = await resp.json();
    console.log("[recommend] ML server response received successfully");
    
    // ML server returns {plans: [...]} with multiple plans
    const workoutPlans = mlResponse.plans || [mlResponse];
    console.log("[recommend] Generated plans:", workoutPlans.length);
    if (workoutPlans.length > 0) {
      console.log("[recommend] First plan:", workoutPlans[0].planName);
      console.log("[recommend] Exercises in first plan:", workoutPlans[0].exercises?.length || 0);
    }

    // Optionally persist plan to Firestore (disabled - firebaseAdmin not configured)
    // if (firebaseAdmin.isInitialized() && userId) {
    //   try {
    //     const db = firebaseAdmin.firestore();
    //     for (const plan of workoutPlans) {
    //       const planDoc = db
    //         .collection("users")
    //         .doc(userId)
    //         .collection("cardio_plans")
    //         .doc();
    //       await planDoc.set({
    //         createdAt: new Date().toISOString(),
    //         ...plan,
    //         userId,
    //       });
    //     }
    //     console.log("[recommend] Plans saved to Firestore");
    //   } catch (e) {
    //     console.error("[recommend] Failed to save plans to Firestore:", e.message);
    //   }
    // }

    // Frontend expects { recommendedPlans: [...] } format
    const responsePayload = {
      recommendedPlans: workoutPlans
    };

    console.log("[recommend] Sending response with", workoutPlans.length, "plans");
    return res.json(responsePayload);
  } catch (e) {
    console.error("[recommend] Error calling ML server:", e);
    console.error("[recommend] Error message:", e.message);

    // Provide specific error messages
    let errorMessage = "Failed to call ML cardio server";
    let errorDetails = e.message || "Unknown error";

    if (e.code === "ECONNREFUSED" || e.message?.includes("ECONNREFUSED")) {
      errorMessage = "ML cardio server is not running";
      errorDetails = `Cannot connect to ${ML_CARDIO_SERVER_URL}. Please ensure the Python ML server is running on port 5001.`;
    } else if (e.code === "ETIMEDOUT" || e.message?.includes("timeout")) {
      errorMessage = "ML server request timed out";
      errorDetails = "The ML server took too long to respond. Please try again.";
    } else if (e.message?.includes("fetch")) {
      errorMessage = "Network error connecting to ML server";
      errorDetails = e.message;
    }

    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      serverUrl: ML_CARDIO_SERVER_URL,
      code: e.code,
    });
  }
});

module.exports = {
  getRecommendation,
};
