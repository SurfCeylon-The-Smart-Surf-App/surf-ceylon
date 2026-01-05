const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  analyzeVideo,
  getAnalysisHistory,
  healthCheck,
} = require("../controllers/videoAnalysisController");
const { auth } = require("../middlewares/auth");

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "uploads", "videos");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `surf-video-${uniqueSuffix}${ext}`);
  },
});

// File filter to only accept video files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only MP4, MOV, AVI, and WEBM videos are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// Routes
router.post("/analyze", auth, upload.single("video"), analyzeVideo);
router.get("/history", auth, getAnalysisHistory);
router.get("/health", healthCheck);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 50MB.",
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`,
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  next();
});

module.exports = router;
