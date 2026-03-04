/**
 * Recommend Controller
 * Handles ML-based workout recommendations using Deep Learning Model
 */

const { spawn } = require('child_process');
const path = require('path');
const { PYTHON_EXECUTABLE, CARDIO_ML_SCRIPT } = require('../config/python');

/**
 * Async handler wrapper to catch async errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

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

  // Call Python ML script via spawn
  const pythonProcess = spawn(PYTHON_EXECUTABLE, [CARDIO_ML_SCRIPT], {
    cwd: path.resolve(__dirname, '..', '..', 'surfapp--ml-engine')
  });

  let pythonOutput = '';
  let pythonError = '';
  let hasResponded = false;

  // Set timeout (30 seconds)
  const timeout = setTimeout(() => {
    if (!hasResponded) {
      pythonProcess.kill();
      console.error('[recommend] Python process timed out');
      res.status(504).json({ 
        error: 'ML prediction timed out' 
      });
      hasResponded = true;
    }
  }, 30000);

  // Send input data to Python via stdin
  const payload = {
    skillLevel: userFitnessLevel,
    fitnessLevel: userFitnessLevel,
    goal: userGoal,
    equipment: userEquipment,
    duration: userDuration,
    durationRange: userDuration,
    height: userHeight,
    weight: userWeight,
    limitations: userLimitations,
    userId
  };
  
  console.log("[recommend] Sending to Python:", JSON.stringify(payload, null, 2));
  pythonProcess.stdin.write(JSON.stringify(payload));
  pythonProcess.stdin.end();

  pythonProcess.stdout.on('data', (data) => pythonOutput += data.toString());
  pythonProcess.stderr.on('data', (data) => {
    pythonError += data.toString();
    console.log(`[CARDIO ML LOG]: ${data.toString().trim()}`);
  });

  pythonProcess.on('error', (err) => {
    clearTimeout(timeout);
    if (!hasResponded) {
      console.error('[recommend] Failed to spawn Python process:', err);
      res.status(500).json({ 
        error: 'Failed to start ML prediction service',
        details: err.message 
      });
      hasResponded = true;
    }
  });

  pythonProcess.on('exit', (code) => {
    clearTimeout(timeout);
    if (hasResponded) return;
    hasResponded = true;

    if (code !== 0) {
      console.error(`[recommend] Python exited with code ${code}`);
      console.error('[recommend] Python stderr:', pythonError);
      return res.status(500).json({
        error: 'ML prediction failed',
        details: pythonError || 'Unknown error',
        exitCode: code
      });
    }

    try {
      console.log('[recommend] Python stdout:', pythonOutput);
      const mlResponse = JSON.parse(pythonOutput);
      
      // ML server returns {plans: [...]} with multiple plans
      const workoutPlans = mlResponse.plans || [mlResponse];
      console.log("[recommend] Generated plans:", workoutPlans.length);
      if (workoutPlans.length > 0) {
        console.log("[recommend] First plan:", workoutPlans[0].planName);
        console.log("[recommend] Exercises in first plan:", workoutPlans[0].exercises?.length || 0);
      }

      // Frontend expects { recommendedPlans: [...] } format
      const responsePayload = {
        recommendedPlans: workoutPlans
      };

      console.log("[recommend] Sending response with", workoutPlans.length, "plans");
      return res.json(responsePayload);
    } catch (err) {
      console.error('[recommend] Failed to parse Python output:', err);
      console.error('[recommend] Python stdout:', pythonOutput);
      return res.status(500).json({
        error: 'Failed to parse ML prediction response',
        details: err.message
      });
    }
  });
});

module.exports = {
  getRecommendation,
  asyncHandler,
};
