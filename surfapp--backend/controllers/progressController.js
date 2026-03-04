/**
 * Progress Controller
 * Handles user progress tracking operations
 */

const { asyncHandler } = require("./recommendController");

/**
 * Save user progress
 * POST /api/ai-tutor/progress/save
 */
const saveProgress = asyncHandler(async (req, res) => {
  console.log("[progress] Save progress request (auth removed)");

  // Support both legacy format and new categorized format
  const { category, data, completedDrills, scores, badges } = req.body;

  try {
    let progressData;
    if (category && data) {
      // New categorized format
      progressData = {
        category,
        data: {
          completedDrills: data.completedDrills || [],
          scores: data.scores || {},
          totalTime: data.totalTime || 0,
          sessions: data.sessions || 1,
          badges: data.badges || [],
        },
      };
    } else {
      // Legacy format (for backward compatibility)
      progressData = {
        completedDrills: completedDrills || [],
        scores: scores || {},
        badges: badges || [],
      };
    }

    // Since auth is removed, progress is stored locally in frontend
    // This endpoint can return success without database operations
    console.log("[progress] Progress data received (stored locally in app)");
    res.json({ success: true, message: "Progress stored locally" });
  } catch (err) {
    throw err;
  }
});

/**
 * Load user progress
 * GET /api/ai-tutor/progress/load
 */
const loadProgress = asyncHandler(async (req, res) => {
  console.log("[progress] Load progress request (auth removed)");

  try {
    // Since auth is removed, progress is stored locally in frontend
    // Return empty progress structure
    console.log("[progress] Progress loaded from local storage");
    res.json({ progress: {} });
  } catch (err) {
    throw err;
  }
});

module.exports = {
  saveProgress,
  loadProgress,
};
