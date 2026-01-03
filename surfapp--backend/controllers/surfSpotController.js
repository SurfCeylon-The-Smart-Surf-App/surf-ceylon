const SurfSpot = require('../models/SurfSpot');
const axios = require('axios');

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
