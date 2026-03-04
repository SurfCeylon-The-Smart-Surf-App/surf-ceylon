import { SKILL_RISK_THRESHOLDS } from './constants';

// ==================== SKILL-SPECIFIC RISK HELPERS ====================

/**
 * Get risk level from score based on skill level
 * @param {number} score - Risk score (0-10)
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced', or 'overall'
 * @returns {object} Risk level details with color, emoji, etc.
 */
export const getRiskLevelForSkill = (score, skillLevel = 'overall') => {
  const numScore = Number(score) || 0;
  const thresholds = SKILL_RISK_THRESHOLDS[skillLevel] || SKILL_RISK_THRESHOLDS.overall;
  
  let level, color, bgColor, textColor, flag, emoji;
  
  if (numScore <= thresholds.low) {
    level = 'Low';
    color = '#10b981';
    bgColor = '#d1fae5';
    textColor = '#065f46';
    flag = 'green';
    emoji = '🟢';
  } else if (numScore <= thresholds.medium) {
    level = 'Medium';
    color = '#f59e0b';
    bgColor = '#fef3c7';
    textColor = '#92400e';
    flag = 'yellow';
    emoji = '🟡';
  } else {
    level = 'High';
    color = '#ef4444';
    bgColor = '#fee2e2';
    textColor = '#991b1b';
    flag = 'red';
    emoji = '🔴';
  }
  
  return { level, color, bgColor, textColor, flag, emoji, score: numScore };
};

/**
 * Get flag color from risk score based on skill level
 * @param {number} score - Risk score (0-10)
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced', or 'overall'
 * @returns {string} Flag color ('green', 'yellow', or 'red')
 */
export const getFlagColorForSkill = (score, skillLevel = 'overall') => {
  const numScore = Number(score) || 0;
  const thresholds = SKILL_RISK_THRESHOLDS[skillLevel] || SKILL_RISK_THRESHOLDS.overall;
  
  if (numScore <= thresholds.low) return 'green';
  if (numScore <= thresholds.medium) return 'yellow';
  return 'red';
};

/**
 * Get risk emoji from score based on skill level
 * @param {number} score - Risk score (0-10)
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced', or 'overall'
 * @returns {string} Risk emoji ('🟢', '🟡', or '🔴')
 */
export const getRiskEmojiForSkill = (score, skillLevel = 'overall') => {
  const flagColor = getFlagColorForSkill(score, skillLevel);
  
  switch(flagColor) {
    case 'green': return '🟢';
    case 'yellow': return '🟡';
    case 'red': return '🔴';
    default: return '⚪';
  }
};

/**
 * Get risk description for skill level
 * @param {number} score - Risk score (0-10)
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced', or 'overall'
 * @returns {string} Human-readable description
 */
export const getRiskDescriptionForSkill = (score, skillLevel = 'overall') => {
  const riskLevel = getRiskLevelForSkill(score, skillLevel);
  const thresholds = SKILL_RISK_THRESHOLDS[skillLevel] || SKILL_RISK_THRESHOLDS.overall;
  
  const descriptions = {
    beginner: {
      Low: `Safe for beginners (1-${thresholds.low})`,
      Medium: `Caution for beginners (${thresholds.low}-${thresholds.medium})`,
      High: `Dangerous for beginners (${thresholds.medium}-10)`
    },
    intermediate: {
      Low: `Safe for intermediates (1-${thresholds.low})`,
      Medium: `Moderate risk (${thresholds.low}-${thresholds.medium})`,
      High: `High risk (${thresholds.medium}-10)`
    },
    advanced: {
      Low: `Low risk for advanced (1-${thresholds.low})`,
      Medium: `Moderate challenge (${thresholds.low}-${thresholds.medium})`,
      High: `High risk (${thresholds.medium}-10)`
    },
    overall: {
      Low: 'Generally safe conditions',
      Medium: 'Caution advised',
      High: 'Dangerous conditions'
    }
  };
  
  return descriptions[skillLevel]?.[riskLevel.level] || descriptions.overall[riskLevel.level];
};

/**
 * Get threshold ranges for a skill level
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced', or 'overall'
 * @returns {object} Threshold ranges with labels
 */
export const getThresholdRanges = (skillLevel = 'overall') => {
  const thresholds = SKILL_RISK_THRESHOLDS[skillLevel] || SKILL_RISK_THRESHOLDS.overall;
  
  return {
    low: { 
      min: 1, 
      max: thresholds.low, 
      label: `1-${thresholds.low}`,
      color: '#10b981',
      emoji: '🟢'
    },
    medium: { 
      min: thresholds.low, 
      max: thresholds.medium, 
      label: `${thresholds.low}-${thresholds.medium}`,
      color: '#f59e0b',
      emoji: '🟡'
    },
    high: { 
      min: thresholds.medium, 
      max: 10, 
      label: `${thresholds.medium}-10`,
      color: '#ef4444',
      emoji: '🔴'
    }
  };
};

/**
 * Format risk score with skill-specific context
 * @param {number} score - Risk score (0-10)
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced', or 'overall'
 * @returns {string} Formatted string like "7.5/10 🔴 High"
 */
export const formatRiskScoreForSkill = (score, skillLevel = 'overall') => {
  const riskLevel = getRiskLevelForSkill(score, skillLevel);
  return `${score}/10 ${riskLevel.emoji} ${riskLevel.level}`;
};

/**
 * Get risk data for a surf spot based on skill level
 * Safely extracts risk data from spot object
 * @param {object} spot - Surf spot object
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced'
 * @returns {object} Risk data for the selected skill level
 */
export const getRiskDataForSkill = (spot, skillLevel) => {
  if (!spot) {
    return {
      score: 0,
      level: 'Unknown',
      flag: '#9ca3af',
      incidents: 0
    };
  }

  // Try to get skill-specific risk data
  const risks = spot.skillLevelRisks || {};
  const skillData = risks[skillLevel];

  if (skillData && typeof skillData.riskScore === 'number') {
    return {
      score: skillData.riskScore,
      level: skillData.riskLevel || 'Unknown',
      flag: skillData.flagColor || '#9ca3af',
      incidents: skillData.incidents || 0
    };
  }

  // Fallback to overall spot data
  return {
    score: spot.riskScore || 0,
    level: spot.riskLevel || 'Unknown',
    flag: spot.flagColor || '#9ca3af',
    incidents: spot.totalIncidents || 0
  };
};

/**
 * Get marker color based on flag color
 * @param {string} flagColor - 'green', 'yellow', or 'red'
 * @returns {string} Hex color code
 */
export const getMarkerColor = (flagColor) => {
  switch(flagColor) {
    case 'green': return '#10b981';
    case 'yellow': return '#f59e0b';
    case 'red': return '#ef4444';
    default: return '#6b7280';
  }
};

/**
 * Get skill level display info
 * @param {string} skillLevel - 'beginner', 'intermediate', 'advanced'
 * @returns {object} Display information
 */
export const getSkillLevelInfo = (skillLevel) => {
  const info = {
    beginner: {
      label: 'Beginner',
      icon: '🏄‍♀️',
      description: 'New to surfing',
      color: '#3b82f6'
    },
    intermediate: {
      label: 'Intermediate',
      icon: '🏄',
      description: 'Some experience',
      color: '#8b5cf6'
    },
    advanced: {
      label: 'Advanced',
      icon: '🏄‍♂️',
      description: 'Experienced surfer',
      color: '#ec4899'
    }
  };

  return info[skillLevel] || info.beginner;
};

// ==================== DATE & TIME HELPERS ====================

/**
 * Format date relative to now
 * @param {string|Date} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return target.toLocaleDateString();
};

/**
 * Format time duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate required field
 * @param {any} value - Value to check
 * @returns {boolean} Is valid
 */
export const isRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// ==================== FILE HELPERS ====================

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} Extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};

// ==================== COORDINATE HELPERS ====================

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// ==================== EXPORT ALL ====================

export default {
  // Risk calculation
  getRiskLevelForSkill,
  getFlagColorForSkill,
  getRiskEmojiForSkill,
  getRiskDescriptionForSkill,
  getThresholdRanges,
  formatRiskScoreForSkill,
  getRiskDataForSkill,
  getMarkerColor,
  getSkillLevelInfo,
  
  // Date & time
  formatRelativeDate,
  formatDuration,
  
  // Validation
  isValidEmail,
  isRequired,
  
  // Files
  formatFileSize,
  getFileExtension,
  
  // Coordinates
  calculateDistance,
};