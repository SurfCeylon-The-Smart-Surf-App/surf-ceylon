const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// MongoDB connection URI (from .env or fallback)
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smart_surf_db";

let isMongoConnected = false;

/**
 * Original connectDatabase function (enhanced with dotenv + fallback URI)
 */
const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isMongoConnected = true;
  } catch (error) {
    console.error("Database connection error:", error);
    console.warn(
      "⚠️  MongoDB connection failed - Some features may be disabled"
    );
    isMongoConnected = false;
    // Do NOT exit process (keeps original behavior)
  }
};

/**
 * New connectDB function (kept unchanged in name)
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connection successful");
    isMongoConnected = true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    isMongoConnected = false;
    // Removed process.exit(1) to preserve original behavior
  }
};

/**
 * Original status checker
 */
const getConnectionStatus = () => isMongoConnected;

// Export all functions
module.exports = {
  connectDatabase,
  connectDB,
  getConnectionStatus,
};
