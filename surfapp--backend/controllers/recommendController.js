/**
 * Recommend Controller
 * Handles ML-based workout recommendations
 */

const fetch = require('node-fetch');
const firebaseAdmin = require('../config/firebaseAdmin');
const { asyncHandler } = require('../middlewares/errorHandler');
const { MODEL_SERVER_URL, MODEL_SERVER_TIMEOUT, SKILL_MAP, GOAL_MAP } = require('../config/aiConstants');

/**
 * Normalize string for model input
 */
const normalize = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

/**
 * Get workout recommendations from ML model
 * POST /api/ai-tutor/recommend
 */
const getRecommendation = asyncHandler(async (req, res) => {
  const { skillLevel, goal, userId, userDetails, durationRange, limitations, adaptiveAdjustments } = req.body || {};

  if (!skillLevel || !goal || (Array.isArray(goal) && goal.length === 0)) {
    return res.status(400).json({ error: 'Missing required fields: skillLevel and goal' });
  }

  // Normalize inputs to match model training vocab
  const normalizedSkill = SKILL_MAP[normalize(skillLevel)] || 'Beginner';
  
  // Handle goal as array or string
  const goalArray = Array.isArray(goal) ? goal : [goal];
  const normalizedGoals = goalArray.map(g => GOAL_MAP[normalize(g)] || g).filter(Boolean);

  console.log('[recommend] incoming', { skillLevel, goal, userId, userDetails, durationRange, limitations });
  console.log('[recommend] normalized', { skillLevel: normalizedSkill, goals: normalizedGoals });
  console.log('[recommend] modelUrl', MODEL_SERVER_URL);

  const payload = { skillLevel: normalizedSkill, goal: normalizedGoals };
  
  // Attach optional user details (bmi, age, weight, height, goals, etc.)
  if (userDetails && typeof userDetails === 'object') {
    payload.userDetails = userDetails;
  }
  
  // Attach durationRange and limitations for template-based generation
  if (durationRange) {
    payload.durationRange = durationRange;
  }
  if (limitations && Array.isArray(limitations) && limitations.length > 0) {
    payload.limitations = limitations;
  }
  // Attach adaptive adjustments for adaptive plan generation
  if (adaptiveAdjustments && typeof adaptiveAdjustments === 'object') {
    payload.adaptiveAdjustments = adaptiveAdjustments;
  }

  try {
    console.log('[recommend] Calling model server at:', MODEL_SERVER_URL);
    console.log('[recommend] Payload:', JSON.stringify(payload, null, 2));
    
    // Use AbortController for timeout with node-fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MODEL_SERVER_TIMEOUT);
    
    const resp = await fetch(MODEL_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!resp.ok) {
      let json;
      try {
        json = await resp.json();
      } catch (parseError) {
        json = { error: 'Failed to parse model server response', status: resp.status };
      }
      
      const errorPayload = {
        error: (json && (json.error || (json.detail && (json.detail.error || json.detail.message)) || json.message)) || 'Model server error',
        details: (json && (json.details || (json.detail && json.detail.details) || json.detail)) || `HTTP ${resp.status}`,
        status: resp.status
      };
      console.error('[recommend] Model server returned error:', errorPayload);
      return res.status(resp.status >= 400 && resp.status < 600 ? resp.status : 500).json(errorPayload);
    }

    const json = await resp.json();
    console.log('[recommend] Model server response received successfully');

    // Optionally persist plan to Firestore if firebase is initialized and userId provided
    if (firebaseAdmin.isInitialized() && userId) {
      try {
        const db = firebaseAdmin.firestore();
        const planDoc = db.collection('users').doc(userId).collection('plans').doc();
        await planDoc.set({
          requestedAt: new Date().toISOString(),
          skillLevel,
          goal,
          userDetails: userDetails || null,
          recommendedExercises: json.recommendedExercises || [],
          modelVersion: json.meta ? json.meta.modelVersion : null
        });
      } catch (e) {
        console.error('[recommend] Failed to save plan to Firestore', e.message || e);
      }
    }

    return res.json(json);
  } catch (e) {
    console.error('[recommend] Error calling model server:', e);
    console.error('[recommend] Error message:', e.message);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to call model server';
    let errorDetails = e.message || 'Unknown error';
    
    if (e.code === 'ECONNREFUSED' || e.message.includes('ECONNREFUSED')) {
      errorMessage = 'Model server is not running';
      errorDetails = `Cannot connect to ${MODEL_SERVER_URL}. Please ensure the Python model server is running on port 8000.`;
    } else if (e.code === 'ETIMEDOUT' || e.message.includes('timeout')) {
      errorMessage = 'Model server request timed out';
      errorDetails = 'The model server took too long to respond. Please try again.';
    } else if (e.message.includes('fetch')) {
      errorMessage = 'Network error connecting to model server';
      errorDetails = e.message;
    }
    
    return res.status(500).json({ 
      error: errorMessage, 
      details: errorDetails,
      modelUrl: MODEL_SERVER_URL,
      code: e.code
    });
  }
});

module.exports = {
  getRecommendation
};
