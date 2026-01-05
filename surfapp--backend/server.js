const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

const app = express();

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
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

// New routes from thilina version
app.use("/api/spots", require("./routes/spots"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/forecast", require("./routes/forecast"));
app.use("/api/health", require("./routes/health"));

// Risk Analyzer routes (integrated from surfapp--backend-my)
app.use("/api/surfSpots", require("./routes/surfSpots"));
app.use("/api/hazardReports", require("./routes/hazardReports"));
app.use("/api/incidents", require("./routes/incidents"));

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

// Start server
const server = app.listen(PORT, "0.0.0.0", (err) => {
  if (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📡 Backend accessible at http://0.0.0.0:${PORT}`);
  console.log(`🌐 External access: http://10.18.46.168:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;