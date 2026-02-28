const SurfSpot = require('../models/SurfSpot');
const axios = require('axios');
const os = require('os');

exports.getAllSurfSpots = async (req, res) => {
  try {
    const surfSpots = await SurfSpot.find()
      .select('name location coordinates riskScore riskLevel flagColor lastUpdated')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: surfSpots.length,
      data: surfSpots
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching surf spots', 
      error: error.message 
    });
  }
};

exports.getSurfSpotById = async (req, res) => {
  try {
    const surfSpot = await SurfSpot.findById(req.params.id)
      .populate('recentHazards');

    if (!surfSpot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surf spot not found' 
      });
    }

    res.json({
      success: true,
      data: surfSpot
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching surf spot', 
      error: error.message 
    });
  }
};

exports.updateRiskScore = async (req, res) => {
  try {
    const { riskScore, riskFactors } = req.body;
    
    const surfSpot = await SurfSpot.findById(req.params.id);
    
    if (!surfSpot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surf spot not found' 
      });
    }

    surfSpot.riskScore = riskScore;
    surfSpot.calculateRiskScore();
    surfSpot.lastUpdated = Date.now();

    await surfSpot.save();

    res.json({
      success: true,
      message: 'Risk score updated',
      data: {
        riskScore: surfSpot.riskScore,
        riskLevel: surfSpot.riskLevel,
        flagColor: surfSpot.flagColor
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating risk score', 
      error: error.message 
    });
  }
};

// ==================== SERVER STATUS FUNCTIONS ====================

/**
 * Welcome/Root route
 */
exports.getWelcome = (req, res) => {
  res.json({
    message: "Welcome to SurfCeylon API",
    version: "1.0.0",
  });
};

/**
 * Health check endpoint
 */
exports.getHealthCheck = (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    mongoConnected: req.isMongoConnected,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
};

/**
 * Server info endpoint (for mobile dev)
 */
exports.getServerInfo = (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  res.json({
    host: addresses[0] || "localhost",
    port: process.env.PORT || 5001,
    addresses: addresses,
  });
};