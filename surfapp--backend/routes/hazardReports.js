const express = require('express');
const router = express.Router();
const HazardReport = require('../models/HazardReport');
const SurfSpot = require('../models/SurfSpot');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs'); // Added for file cleanup and validation

// Import Python runner utility (executes ML scripts directly)
const { analyzeHazardImage, updateAllRiskScores, computeImageHash } = require('../config/python');

/**
 * Middleware: Multer error handling
 * Ensures file limits and types are respected before hitting the route logic
 */
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

// --- ROUTES ---

/**
 * @route   POST /api/hazards
 * @desc    Submit a hazard report with ML image validation
 * @access  Public
 */
router.post('/', handleMulterUpload, async (req, res) => {
  try {
    console.log('📥 Received hazard report request');
    const { surfSpotId, hazardType, description, severity, reporterName } = req.body;

    // 1. Verify surf spot exists
    const surfSpot = await SurfSpot.findById(surfSpotId);
    if (!surfSpot) {
      return res.status(404).json({
        success: false,
        message: 'Surf spot not found'
      });
    }

    // 2. Map uploaded files to media objects
    const mediaFiles = req.files ? req.files.map(file => ({
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      url: `/uploads/hazards/${file.filename}`,
      filename: file.filename,
      path: file.path // Store local path for potential cleanup
    })) : [];

    // 3. Initialize the report object
    const hazardReport = new HazardReport({
      surfSpot: surfSpotId,
      reporterName: reporterName || 'Anonymous',
      hazardType,
      description,
      severity,
      media: mediaFiles
    });

    // 4. ML Image Analysis & Validation Gatekeeper
    if (mediaFiles.length > 0) {
      const imageFile = mediaFiles.find(m => m.type === 'image');
      if (imageFile) {
        try {
          const imagePath = path.resolve(imageFile.path);
          console.log('🤖 Running ML analysis on:', imagePath);

          // Execute Python ML script
          const analysisResult = await analyzeHazardImage(imagePath, hazardType);
          hazardReport.analysisResult = analysisResult;

          // --- REJECTION LOGIC ---
          // If ML determines this is not a valid hazard scene
          if (analysisResult.validated === false) {
            console.warn('🚫 Report rejected: Image validation failed.');

            // Clean up all uploaded files for this request
            req.files.forEach(file => {
              try {
                if (fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                  console.log(`🗑️ Deleted invalid file: ${file.filename}`);
                }
              } catch (e) {
                console.error(`⚠️ Failed to delete ${file.filename}:`, e.message);
              }
            });

            // Return 422 with AI-generated rejection details
            return res.status(422).json({
              success: false,
              message: analysisResult.aiSuggestions || 'The image does not appear to contain a valid surf hazard.',
              rejectionReason: analysisResult.rejectionReason
            });
          }
          // --- END REJECTION LOGIC ---

          // --- DUPLICATE DETECTION ---
          // Compute perceptual hash for the image
          console.log('🔍 Computing image hash for duplicate detection...');
          const hashResult = await computeImageHash(imagePath);
          
          if (hashResult.success && hashResult.hash) {
            const imageHash = hashResult.hash;
            console.log(`📋 Image hash: ${imageHash}`);
            
            // Check if this hash already exists in the database
            const existingReport = await HazardReport.findOne({
              imageHash: imageHash,
              status: { $ne: 'rejected' }  // Don't count rejected reports
            });
            
            if (existingReport) {
              console.warn('🚫 Report rejected: Duplicate image detected.');
              
              // Clean up uploaded files
              req.files.forEach(file => {
                try {
                  if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Deleted duplicate file: ${file.filename}`);
                  }
                } catch (e) {
                  console.error(`⚠️ Failed to delete ${file.filename}:`, e.message);
                }
              });
              
              return res.status(422).json({
                success: false,
                message: 'This image has already been submitted as a hazard report.',
                rejectionReason: 'duplicate_image'
              });
            }
            
            // Store hash in the report for future duplicate checks
            hazardReport.imageHash = imageHash;
          }
          // --- END DUPLICATE DETECTION ---

          console.log('✅ ML Analysis passed:', analysisResult);
        } catch (mlError) {
          console.error('⚠️ ML analysis system error (non-blocking):', mlError.message);
          // We proceed even if the script fails to ensure the app stays functional
        }
      }
    }

    // 5. Persist to Database
    await hazardReport.save();

    // 6. Update Surf Spot association
    surfSpot.recentHazards.push(hazardReport._id);
    if (surfSpot.recentHazards.length > 10) {
      surfSpot.recentHazards.shift();
    }
    await surfSpot.save();

    // 7. Trigger Risk Score Recalculation (Async/Direct)
    try {
      console.log('🔄 Triggering global risk score update...');
      await updateAllRiskScores();
      console.log('✅ Risk scores synchronized');
    } catch (error) {
      console.error('⚠️ Risk score update failed:', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Hazard report submitted successfully',
      data: hazardReport
    });

  } catch (error) {
    console.error('🔥 Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error submitting hazard report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/hazards/spot/:spotId
 * @desc    Fetch active hazards for a specific spot from the last 24 hours
 * @access  Public
 */
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