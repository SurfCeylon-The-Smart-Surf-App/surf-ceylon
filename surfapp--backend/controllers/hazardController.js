const HazardReport = require('../models/HazardReport');
const SurfSpot = require('../models/SurfSpot');
const User = require('../models/User');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

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

    // If media exists, send to ML model for analysis
    if (mediaFiles.length > 0) {
      try {
        const formData = new FormData();
        mediaFiles.forEach(media => {
          if (media.type === 'image') {
            formData.append('images', fs.createReadStream(`uploads/hazards/${media.filename}`));
          }
        });
        formData.append('hazard_type', hazardType);

        const mlResponse = await axios.post(
          `${process.env.ML_API_URL}/analyze-hazard`,
          formData,
          { headers: formData.getHeaders() }
        );

        hazardReport.analysisResult = mlResponse.data;
      } catch (mlError) {
        console.error('ML analysis error:', mlError.message);
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

    // Trigger risk score recalculation
    try {
      await axios.post(`${process.env.ML_API_URL}/update-risk-score`, {
        surf_spot_id: surfSpotId
      });
    } catch (error) {
      console.error('Risk score update error:', error.message);
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