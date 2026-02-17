const express = require('express');
const router = express.Router();
const axios = require('axios');

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_AR_SERVICE_URL || 'http://localhost:5003';

/**
 * POST /api/ar/recommendations
 * Get personalized surfboard recommendations for AR visualization
 * 
 * Body:
 * {
 *   "height_cm": 175,
 *   "weight_kg": 75,
 *   "age": 28,
 *   "experience_level": "Intermediate",
 *   "gender": "Male",
 *   "drill_id": "cutback"
 * }
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { height_cm, weight_kg, age, experience_level, gender, drill_id } = req.body;

    // Validate required fields
    if (!height_cm || !weight_kg || !age || !experience_level) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: height_cm, weight_kg, age, experience_level'
      });
    }

    // Validate ranges
    if (height_cm < 100 || height_cm > 250) {
      return res.status(400).json({
        success: false,
        error: 'Height must be between 100-250 cm'
      });
    }

    if (weight_kg < 30 || weight_kg > 200) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be between 30-200 kg'
      });
    }

    if (age < 10 || age > 100) {
      return res.status(400).json({
        success: false,
        error: 'Age must be between 10-100 years'
      });
    }

    const validExperienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro', 'First-timer'];
    if (!validExperienceLevels.includes(experience_level)) {
      return res.status(400).json({
        success: false,
        error: `Experience level must be one of: ${validExperienceLevels.join(', ')}`
      });
    }

    // Call ML prediction service
    console.log(`🤖 Calling ML service for AR recommendations...`);
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/ar/predict`, {
      height_cm,
      weight_kg,
      age,
      experience_level,
      gender: gender || 'Male'
    }, {
      timeout: 10000 // 10 second timeout
    });

    if (!mlResponse.data.success) {
      throw new Error(mlResponse.data.error || 'ML prediction failed');
    }

    // Enhance response with drill information
    const response = {
      success: true,
      data: {
        ...mlResponse.data.data,
        drill: {
          id: drill_id || 'general',
          selected: drill_id || null
        },
        timestamp: new Date().toISOString()
      }
    };

    console.log(`✅ AR recommendations generated successfully`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating AR recommendations:', error.message);

    // Check if ML service is unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        error: 'AI recommendation service temporarily unavailable. Please try again later.',
        details: 'ML service connection failed'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AR recommendations',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/ar/drills
 * Get list of available AR surfing drills
 */
router.get('/drills', async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/ar/drills`, {
      timeout: 5000
    });

    res.json(mlResponse.data);

  } catch (error) {
    console.error('❌ Error fetching drills:', error.message);

    // Fallback to static drill list if ML service is down
    res.json({
      success: true,
      drills: [
        {
          id: "catch-wave",
          name: "Catching a Wave",
          description: "Learn wave timing and positioning",
          difficulty: "Beginner",
          icon: "waves"
        },
        {
          id: "pop-up",
          name: "Pop-Up Technique",
          description: "Master the pop-up motion",
          difficulty: "Beginner",
          icon: "sports-surfing"
        },
        {
          id: "bottom-turn",
          name: "Bottom Turn",
          description: "Essential wave riding technique",
          difficulty: "Intermediate",
          icon: "arrow-downward"
        },
        {
          id: "cutback",
          name: "Cutback",
          description: "Advanced maneuver to stay in the power zone",
          difficulty: "Advanced",
          icon: "swap-horiz"
        }
      ],
      source: 'fallback'
    });
  }
});

/**
 * GET /api/ar/health
 * Health check for AR service
 */
router.get('/health', async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/ar/health`, {
      timeout: 3000
    });

    res.json({
      backend: 'healthy',
      ml_service: mlResponse.data
    });

  } catch (error) {
    res.status(503).json({
      backend: 'healthy',
      ml_service: 'unavailable',
      error: error.message
    });
  }
});

module.exports = router;
