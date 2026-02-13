const express = require('express');
const router = express.Router();
const HazardReport = require('../models/HazardReport');
const SurfSpot = require('../models/SurfSpot');
const upload = require('../config/multer');
const path = require('path');

// Import Python runner utility (executes ML scripts directly)
const { analyzeHazardImage, updateAllRiskScores } = require('../config/python');

// Multer error handling middleware
const handleMulterUpload = (req, res, next) => {
  upload.array('media', 5)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    }
    next();
  });
};

// Submit hazard report (NO AUTHENTICATION REQUIRED)
router.post('/', handleMulterUpload, async (req, res) => {
  try {
    console.log('📥 Received hazard report request');
    console.log('📥 Body:', req.body);
    console.log('📥 Files:', req.files?.length || 0, 'files');
    
    const { surfSpotId, hazardType, description, severity, reporterName } = req.body;
    
    // Verify surf spot exists
    const surfSpot = await SurfSpot.findById(surfSpotId);
    if (!surfSpot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surf spot not found' 
      });
    }

    // Process uploaded media
    const mediaFiles = req.files ? req.files.map(file => ({
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      url: `/uploads/hazards/${file.filename}`,
      filename: file.filename
    })) : [];

    // Create hazard report
    const hazardReport = new HazardReport({
      surfSpot: surfSpotId,
      reporterName: reporterName || 'Anonymous',
      hazardType,
      description,
      severity,
      media: mediaFiles
    });

    // If media exists, analyze using Python ML scripts directly
    if (mediaFiles.length > 0) {
      try {
        // Find first image file for analysis
        const imageFile = mediaFiles.find(m => m.type === 'image');
        if (imageFile) {
          const imagePath = path.join(__dirname, '../uploads/hazards', imageFile.filename);
          console.log('🤖 Running ML analysis on:', imagePath);
          
          // Call Python script directly (no Flask server needed)
          const analysisResult = await analyzeHazardImage(imagePath, hazardType);
          hazardReport.analysisResult = analysisResult;
          console.log('✅ ML Analysis result:', analysisResult);
        }
      } catch (mlError) {
        console.error('⚠️ ML analysis error (non-blocking):', mlError.message);
        // Continue even if ML analysis fails
      }
    }

    await hazardReport.save();

    // Add to surf spot's recent hazards
    surfSpot.recentHazards.push(hazardReport._id);
    if (surfSpot.recentHazards.length > 10) {
      surfSpot.recentHazards.shift();
    }
    await surfSpot.save();

    // Trigger risk score recalculation using Python script directly
    try {
      console.log('🔄 Updating risk scores...');
      await updateAllRiskScores();
      console.log('✅ Risk scores updated');
    } catch (error) {
      console.error('⚠️ Risk score update error (non-blocking):', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Hazard report submitted successfully',
      data: hazardReport
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting hazard report', 
      error: error.message 
    });
  }
});

// Get hazard reports for a surf spot
router.get('/spot/:spotId', async (req, res) => {
  try {
    const { spotId } = req.params;
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const reports = await HazardReport.find({
      surfSpot: spotId,
      reportDate: { $gte: yesterday },
      status: { $ne: 'rejected' }
    }).sort({ reportDate: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching hazard reports', 
      error: error.message 
    });
  }
});

module.exports = router;