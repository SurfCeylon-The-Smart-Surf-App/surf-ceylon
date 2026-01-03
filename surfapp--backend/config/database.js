const mongoose = require("mongoose");

let isMongoConnected = false;

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/surf_ai";
    const conn = await mongoose.connect(mongoUri, {
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
    // Don't exit process - allow app to run without MongoDB
  }
};

const getConnectionStatus = () => isMongoConnected;

module.exports = { connectDatabase, getConnectionStatus };
