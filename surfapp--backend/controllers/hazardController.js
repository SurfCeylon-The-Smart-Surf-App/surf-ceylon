const HazardReport = require('../models/HazardReport');
const SurfSpot = require('../models/SurfSpot');
const User = require('../models/User');
const path = require('path');

// Import Python runner utility (executes ML scripts directly)
const { analyzeHazardImage, updateAllRiskScores } = require('../utils/pythonRunner');

exports.submitHazardReport = async (req, res) => {
  try {
    const { surfSpotId, hazardType, description, severity } = req.body;
    
    // Verify surf spot exists
    const surfSpot = await SurfSpot.findById(surfSpotId);
    if (!surfSpot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Surf spot not found' 
      });
    }

    // Process uploaded media
    const mediaFiles = req.files.map(file => ({
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      url: `/uploads/hazards/${file.filename}`,
      filename: file.filename
    }));

    // Create hazard report
    const hazardReport = new HazardReport({
      reportedBy: req.user.userId,
      surfSpot: surfSpotId,
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
        // Continue even if ML fails
      }
    }

    await hazardReport.save();

    // Add to surf spot's recent hazards
    surfSpot.recentHazards.push(hazardReport._id);
    if (surfSpot.recentHazards.length > 10) {
      surfSpot.recentHazards.shift(); // Keep only last 10
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

    // Update user reputation
    const user = await User.findById(req.user.userId);
    user.reputationScore += 5;
    await user.save();

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
};

exports.getHazardReportsBySpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    
    // Get reports from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const reports = await HazardReport.find({
      surfSpot: spotId,
      reportDate: { $gte: yesterday },
      status: { $ne: 'rejected' }
    })
    .populate('reportedBy', 'name reputationScore')
    .sort({ reportDate: -1 });

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
};

exports.verifyHazardReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'verified' or 'rejected'

    const report = await HazardReport.findById(id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hazard report not found' 
      });
    }

    // Check if user is admin or instructor
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && user.role !== 'instructor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to verify reports' 
      });
    }

    report.status = status;
    report.verified = status === 'verified';
    report.verifiedBy = req.user.userId;
    
    await report.save();

    // Update reporter reputation
    const reporter = await User.findById(report.reportedBy);
    if (status === 'verified') {
      reporter.reputationScore += 10;
    } else {
      reporter.reputationScore -= 5;
    }
    await reporter.save();

    res.json({
      success: true,
      message: `Report ${status}`,
      data: report
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying report', 
      error: error.message 
    });
  }
};

// ===== backend/routes/incidents.js =====
const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// Get incidents for a surf spot
router.get('/spot/:spotName', incidentController.getIncidentsBySpot);

// Get all incidents (with pagination)
router.get('/', incidentController.getAllIncidents);

module.exports = router;