/**
 * Python Script Runner Utility
 * Combines direct script path execution + JSON-based ML runner
 */

const { spawn } = require("child_process");
const path = require("path");

// ==================== ORIGINAL PYTHON EXECUTABLE LOGIC ====================

const getPythonExecutable = () => {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  const isWin = process.platform === "win32";
  const venvPath = path.resolve(
    __dirname,
    "..",
    "..",
    "surfapp--ml-engine",
    "venv",
  );

  if (isWin) {
    return path.join(venvPath, "Scripts", "python.exe");
  } else {
    return path.join(venvPath, "bin", "python");
  }
};

const PYTHON_EXECUTABLE = getPythonExecutable();

// ==================== SCRIPT PATH CONSTANTS ====================

const ML_ENGINE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "surfapp--ml-engine",
);

const SPOT_RECOMMENDER_SCRIPT = path.resolve(
  ML_ENGINE_PATH,
  "spot_recommender_service.py",
);

const FORECAST_7DAY_SCRIPT = path.resolve(
  ML_ENGINE_PATH,
  "forecast_7day_service.py",
);

const SURF_POSE_ANALYZER_SCRIPT = path.resolve(
  ML_ENGINE_PATH,
  "surf_pose_analyzer_service.py",
);

const AR_PREDICTION_SCRIPT = path.resolve(
  ML_ENGINE_PATH,
  "services",
  "ar_prediction_service.py",
);

const CARDIO_ML_SCRIPT = path.resolve(
  ML_ENGINE_PATH,
  "services",
  "cardio_ml_server.py",
);

// Fallback Python command (used if venv python fails)
const PYTHON_CMD = process.platform === "win32" ? "python" : "python3";

// ==================== GENERIC PYTHON RUNNER ====================

const runPythonScript = (scriptName, args = {}) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ML_ENGINE_PATH, `${scriptName}.py`);

    // Escape backslashes in paths for Windows compatibility
    const escapedArgs = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string") {
        escapedArgs[key] = value.replace(/\\/g, "/");
      } else {
        escapedArgs[key] = value;
      }
    }
    const argsJson = JSON.stringify(escapedArgs);

    console.log(`🐍 Running Python script: ${scriptName}`);
    console.log(`📁 Script path: ${scriptPath}`);
    console.log(`📦 Args: ${argsJson}`);

    const pythonProcess = spawn(
      PYTHON_EXECUTABLE || PYTHON_CMD,
      [
        "-c",
        `
import sys
import json
sys.path.insert(0, r'${ML_ENGINE_PATH.replace(/\\/g, "/")}')

input_args = json.loads(r'''${argsJson}''')

if '${scriptName}' == 'analyze_hazard':
    from analyze_hazard_cnn import analyze_hazard_image
    result = analyze_hazard_image(input_args.get('image_path'), input_args.get('hazard_type'))
elif '${scriptName}' == 'image_hash':
    from image_hash import get_image_hash
    result = get_image_hash(input_args.get('image_path'))
elif '${scriptName}' == 'predict_risk':
    from predict_risk import predict_risk_score
    result = predict_risk_score(input_args.get('spot_name'))
elif '${scriptName}' == 'update_risk_scores':
    from predict_risk import update_all_risk_scores
    result = update_all_risk_scores()
elif '${scriptName}' == 'calculate_skill_risk':
    from calculate_skill_risk import update_all_skill_level_risks
    result = update_all_skill_level_risks()
else:
    result = {'error': 'Unknown script'}

print(json.dumps(result))
        `,
      ],
      {
        cwd: ML_ENGINE_PATH,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
    );

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ Python script error (exit code ${code}):`, stderr);
        reject(new Error(stderr || `Python script exited with code ${code}`));
        return;
      }

      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log(`✅ Python script completed:`, scriptName);
          resolve(result);
        } else {
          console.log(`⚠️ No JSON output from Python script`);
          resolve({ success: true, output: stdout });
        }
      } catch (parseError) {
        console.error("❌ Failed to parse Python output:", stdout);
        reject(
          new Error(`Failed to parse Python output: ${parseError.message}`),
        );
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("❌ Failed to start Python process:", error);
      reject(error);
    });
  });
};

// ==================== ML HELPER FUNCTIONS ====================

const analyzeHazardImage = async (imagePath, hazardType) => {
  try {
    const result = await runPythonScript("analyze_hazard", {
      image_path: imagePath,
      hazard_type: hazardType,
    });

    // Ensure validated field exists
    if (result && typeof result.validated === "undefined") {
      console.warn(
        "⚠️ ML result missing 'validated' field, defaulting to false",
      );
      result.validated = false;
      result.rejectionReason = "invalid_ml_response";
    }

    return result;
  } catch (error) {
    console.error("❌ Hazard analysis failed:", error.message);
    // Return with validated: false so the report gets rejected
    return {
      detectedHazards: [],
      confidenceScore: 0,
      aiSuggestions: "ML analysis could not be performed. Please try again.",
      validated: false,
      rejectionReason: "ml_analysis_failed",
    };
  }
};

const predictRiskScore = async (spotName) => {
  try {
    return await runPythonScript("predict_risk", { spot_name: spotName });
  } catch (error) {
    console.error("❌ Risk prediction failed:", error.message);
    return null;
  }
};

const updateAllRiskScores = async () => {
  try {
    return await runPythonScript("update_risk_scores", {});
  } catch (error) {
    console.error("❌ Risk score update failed:", error.message);
    return null;
  }
};

const updateSkillLevelRisks = async () => {
  try {
    return await runPythonScript("calculate_skill_risk", {});
  } catch (error) {
    console.error("❌ Skill risk update failed:", error.message);
    return null;
  }
};

/**
 * Compute perceptual hash for an image (for duplicate detection)
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} - { success: boolean, hash: string } or { success: false, error: string }
 */
const computeImageHash = async (imagePath) => {
  try {
    const result = await runPythonScript("image_hash", {
      image_path: imagePath,
    });
    return result;
  } catch (error) {
    console.error("❌ Image hash computation failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==================== EXPORTS ====================

module.exports = {
  PYTHON_EXECUTABLE,
  SPOT_RECOMMENDER_SCRIPT,
  FORECAST_7DAY_SCRIPT,
  SURF_POSE_ANALYZER_SCRIPT,
  runPythonScript,
  analyzeHazardImage,
  predictRiskScore,
  updateAllRiskScores,
  updateSkillLevelRisks,
  computeImageHash,
  AR_PREDICTION_SCRIPT,
  CARDIO_ML_SCRIPT,
};
