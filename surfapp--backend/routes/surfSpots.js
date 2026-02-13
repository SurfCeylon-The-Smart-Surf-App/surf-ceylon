const express = require('express');
const router = express.Router();
const SurfSpot = require('../models/SurfSpot');

// Get all surf spots with full risk data including skill levels
router.get('/', async (req, res) => {
  try {
    console.log('📡 Fetching all surf spots...');
    
    const surfSpots = await SurfSpot.find()
      .select('name location coordinates riskScore riskLevel flagColor lastUpdated totalIncidents skillLevelRisks')
      .sort({ name: 1 });

    console.log(`✅ Found ${surfSpots.length} surf spots`);
    
    // Log first spot for debugging
    if (surfSpots.length > 0) {
      console.log('📊 First spot:', {
        name: surfSpots[0].name,
        hasSkillRisks: !!surfSpots[0].skillLevelRisks,
        skillLevels: surfSpots[0].skillLevelRisks ? Object.keys(surfSpots[0].skillLevelRisks) : []
      });
    }

    res.json({
      success: true,
      count: surfSpots.length,
      data: surfSpots
    });
  } catch (error) {
    console.error('❌ Error fetching surf spots:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching surf spots', 
      error: error.message 
    });
  }
});

// Get specific surf spot details
router.get('/:id', async (req, res) => {
  try {
    const surfSpot = await SurfSpot.findById(req.params.id)
      .populate('recentHazards');

    if (!surfSpot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surf spot not found' 
      });
    }

    res.json({ success: true, data: surfSpot });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching surf spot', 
      error: error.message 
    });
  }
});

// Update risk score (called by ML service)
router.put('/:id/risk-score', async (req, res) => {
  try {
    const { riskScore } = req.body;
    
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
});

module.exports = router;