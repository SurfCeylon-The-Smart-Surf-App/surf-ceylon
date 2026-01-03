const express = require('express');
const router = express.Router();
const HazardReport = require('../models/HazardReport');
const SurfSpot = require('../models/SurfSpot');
const multer = require('../config/multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Submit hazard report (NO AUTHENTICATION REQUIRED)
router.post('/', multer.array('media', 5), async (req, res) => {
  try {
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
    const mediaFiles = req.files.map(file => ({
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      url: `/uploads/hazards/${file.filename}`,
      filename: file.filename
    }));

    // Create hazard report
    const hazardReport = new HazardReport({
      surfSpot: surfSpotId,
      reporterName: reporterName || 'Anonymous',
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
      }
    }

    await hazardReport.save();

    // Add to surf spot's recent hazards
    surfSpot.recentHazards.push(hazardReport._id);
    if (surfSpot.recentHazards.length > 10) {
      surfSpot.recentHazards.shift();
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