const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { PYTHON_EXECUTABLE } = require("../config/python");

// Path to surf pose analyzer service
const SURF_POSE_ANALYZER_SCRIPT = path.resolve(
  __dirname,
  "..",
  "..",
  "surfapp--ml-engine",
  "surf_pose_analyzer_service.py",
);

/**
 * Analyze uploaded surf video
 * POST /api/video-analysis/analyze
 */
const analyzeVideo = async (req, res) => {
  try {
    console.log("📹 Received video analysis request");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No video file uploaded. Please upload a video.",
      });
    }

    const videoPath = req.file.path;
    const videoSize = req.file.size;

    console.log(`  Video: ${req.file.originalname}`);
    console.log(`  Size: ${(videoSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Path: ${videoPath}`);

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (videoSize > MAX_SIZE) {
      fs.unlinkSync(videoPath);
      return res.status(400).json({
        success: false,
        error: "Video file too large. Maximum size is 50MB.",
      });
    }

    const allowedExtensions = [".mp4", ".mov", ".avi", ".webm"];
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      fs.unlinkSync(videoPath);
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
      });
    }

    console.log("🐍 Calling Python ML service...");

    const pythonProcess = spawn(
      PYTHON_EXECUTABLE,
      [SURF_POSE_ANALYZER_SCRIPT, videoPath],
      {
        cwd: path.resolve(__dirname, "..", "..", "surfapp--ml-engine"),
      },
    );

    let pythonOutput = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
      console.log(`[ML LOG]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      // Clean up uploaded video file
      try {
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
          console.log("🗑️  Cleaned up temporary video file");
        }
      } catch (cleanupError) {
        console.error(
          "Warning: Could not delete temporary file:",
          cleanupError,
        );
      }

      try {
        // --- THE FIX: Extract ONLY the valid JSON using Regex ---
        const jsonMatch = pythonOutput.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          console.error("Raw Python Output:", pythonOutput);
          throw new Error("Could not find valid JSON in Python output.");
        }

        const analysisResult = JSON.parse(jsonMatch[0]);
        // --------------------------------------------------------

        // If Python returned success: false (Video rejected by YOLO)
        if (!analysisResult.success) {
          console.log(
            "⚠️ Video rejected by ML:",
            analysisResult.error || analysisResult.message,
          );
          return res.status(400).json(analysisResult);
        }

        console.log(
          "✅ Analysis complete:",
          analysisResult.classification?.pose,
        );
        return res.json({
          success: true,
          data: analysisResult,
          timestamp: new Date().toISOString(),
        });
      } catch (parseError) {
        // If Python crashed completely without printing valid JSON
        console.error("❌ Failed to parse Python output:", parseError);
        return res.status(500).json({
          success: false,
          error: "Failed to process analysis results.",
          details: pythonError.substring(0, 200),
        });
      }
    });
  } catch (error) {
    console.error("❌ Video analysis error:", error);

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error(
          "Warning: Could not delete temporary file:",
          cleanupError,
        );
      }
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error during video analysis.",
      message: error.message,
    });
  }
};

const getAnalysisHistory = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: [],
      message: "Analysis history feature coming soon",
    });
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch analysis history",
    });
  }
};

const healthCheck = async (req, res) => {
  try {
    const scriptExists = fs.existsSync(SURF_POSE_ANALYZER_SCRIPT);
    const modelDir = path.resolve(
      __dirname,
      "..",
      "..",
      "surfapp--ml-engine",
      "models",
    );
    const modelPath = path.join(modelDir, "surf_model.pkl");
    const encoderPath = path.join(modelDir, "label_encoder.pkl");

    const modelExists = fs.existsSync(modelPath);
    const encoderExists = fs.existsSync(encoderPath);
    const isHealthy = scriptExists && modelExists && encoderExists;

    return res.json({
      success: true,
      status: isHealthy ? "healthy" : "degraded",
      checks: {
        pythonScript: scriptExists,
        surfModel: modelExists,
        labelEncoder: encoderExists,
      },
      message: isHealthy
        ? "Video analysis service is ready"
        : "Some ML components are missing",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeVideo,
  getAnalysisHistory,
  healthCheck,
};
