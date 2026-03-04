const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const os = require("os");
require("dotenv").config();

const app = express();

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet());

// HTTP request logging
app.use(morgan("combined"));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", req.body);
  }
  next();
});

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== DATABASE CONNECTION ====================

const { connectDatabase, getConnectionStatus } = require("./config/database");

connectDatabase().then(() => {
  const { loadSpotMetadata } = require("./config/spotMetadata");
  loadSpotMetadata();
});

// Middleware to check MongoDB connection status
app.use((req, res, next) => {
  req.isMongoConnected = getConnectionStatus();
  next();
});

// ==================== ROUTES ====================

// Original routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/messages", require("./routes/messages"));

app.use("/api/spots", require("./routes/spots"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/forecast", require("./routes/forecast"));
app.use("/api/health", require("./routes/health"));
app.use("/api/video-analysis", require("./routes/videoAnalysis"));

// New Surf Risk Analyzer routes
app.use("/api/surf-spots", require("./routes/surfSpots"));
app.use("/api/hazard-reports", require("./routes/hazardReports"));
app.use("/api/incidents", require("./routes/incidents"));

// ==================== DEFAULT ROUTE ====================

const surfSpotController = require('./controllers/surfSpotController');

app.get("/", surfSpotController.getWelcome);

// ==================== ENHANCED HEALTH CHECK ====================

app.get("/api/health-check", surfSpotController.getHealthCheck);

// ==================== SERVER INFO (FOR MOBILE DEV) ====================

app.get("/api/server-info", surfSpotController.getServerInfo);

// ==================== 404 HANDLER ====================
// AI Surf Tutor routes (from Sabri's implementation)
app.use("/api/ai-tutor", require("./routes/aiTutor"));

// AR Surfboard Recommendations (ML-powered)
app.use("/api/ar", require("./routes/arRecommendations"));

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to SurfCeylon API",
    version: "1.0.0",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, "0.0.0.0", () => {
  const networkInterfaces = os.networkInterfaces();

  console.log("\n🚀 ================================");
  console.log("   SurfCeylon API Server");
  console.log("   ================================\n");
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);

  console.log("📱 Access URLs:");
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Local:    http://127.0.0.1:${PORT}`);

  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`   Network:  http://${net.address}:${PORT}`);
      }
    }
  }

  console.log("\n📋 Available endpoints:");
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/health-check`);
  console.log(`   GET  /api/server-info`);
  console.log(`   GET  /api/surf-spots`);
  console.log(`   POST /api/hazard-reports`);
  console.log("   ... and more\n");
  console.log("================================\n");
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

module.exports = app;
