const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(helmet()); //Security headers (XSS, clickjacking protection)
app.use(morgan("combined")); //HTTP request logging
app.use(cors()); //Cross-origin resource sharing for React Native frontend
app.use(express.json({ limit: "10mb" }));  //JSON request body parsing - Increased for pose detection images
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

// MongoDB Connection
const { connectDatabase, getConnectionStatus } = require("./config/database");

connectDatabase().then(() => {
  // Load spot metadata after database connection attempt
  const { loadSpotMetadata } = require("./config/spotMetadata");
  loadSpotMetadata();
});

// Middleware to check MongoDB connection status
app.use((req, res, next) => {
  req.isMongoConnected = getConnectionStatus();
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/messages", require("./routes/messages"));

// New routes from spot recomendder and real-time surf forecasting
app.use("/api/spots", require("./routes/spots")); 
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/forecast", require("./routes/forecast"));
app.use("/api/health", require("./routes/health"));
app.use("/api/video-analysis", require("./routes/videoAnalysis"));

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

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
