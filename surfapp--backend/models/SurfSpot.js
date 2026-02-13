const mongoose = require('mongoose');

const surfSpotSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  location: { 
    type: String, 
    required: true,
    trim: true
  },
  coordinates: {
    latitude: { 
      type: Number, 
      required: true,
      min: -90,
      max: 90
    },
    longitude: { 
      type: Number, 
      required: true,
      min: -180,
      max: 180
    }
  },
  
  // Overall risk (for backward compatibility and general display)
  riskScore: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 10 
  },
  riskLevel: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Low' 
  },
  flagColor: { 
    type: String, 
    enum: ['green', 'yellow', 'red'], 
    default: 'green' 
  },
  
  // Skill-specific risks with custom thresholds
  skillLevelRisks: {
    beginner: {
      incidents: { type: Number, default: 0 },
      riskScore: { type: Number, default: 0, min: 0, max: 10 },
      riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      flagColor: { type: String, enum: ['green', 'yellow', 'red'], default: 'green' }
    },
    intermediate: {
      incidents: { type: Number, default: 0 },
      riskScore: { type: Number, default: 0, min: 0, max: 10 },
      riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      flagColor: { type: String, enum: ['green', 'yellow', 'red'], default: 'green' }
    },
    advanced: {
      incidents: { type: Number, default: 0 },
      riskScore: { type: Number, default: 0, min: 0, max: 10 },
      riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      flagColor: { type: String, enum: ['green', 'yellow', 'red'], default: 'green' }
    }
  },
  
  lastUpdated: { type: Date, default: Date.now },
  totalIncidents: { type: Number, default: 0 },
  recentHazards: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HazardReport' 
  }],
  historicalData: {
    seasonalPatterns: mongoose.Schema.Types.Mixed,
    commonHazards: [String],
    peakRiskMonths: [Number]
  }
});

// Indexes for better query performance
surfSpotSchema.index({ name: 1 });
surfSpotSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

/**
 * Calculate overall risk level based on score
 * Uses default thresholds: 0-3.3 = Low, 3.3-6.6 = Medium, 6.6-10 = High
 */
surfSpotSchema.methods.calculateRiskScore = function() {
  if (this.riskScore <= 3.3) {
    this.riskLevel = 'Low';
    this.flagColor = 'green';
  } else if (this.riskScore <= 6.6) {
    this.riskLevel = 'Medium';
    this.flagColor = 'yellow';
  } else {
    this.riskLevel = 'High';
    this.flagColor = 'red';
  }
};

/**
 * Calculate skill-specific risk level using custom thresholds
 * @param {string} skillLevel - 'beginner', 'intermediate', or 'advanced'
 * @param {number} riskScore - Risk score (0-10)
 * @returns {object} Risk level and flag color
 */
surfSpotSchema.methods.calculateSkillRiskScore = function(skillLevel, riskScore) {
  // Custom thresholds for each skill level
  const thresholds = {
    beginner: {
      low: 5.0,      // 1-5 = Green
      medium: 6.5    // 5-6.5 = Yellow, 6.5-10 = Red
    },
    intermediate: {
      low: 6.0,      // 1-6 = Green
      medium: 7.2    // 6-7.2 = Yellow, 7.2-10 = Red
    },
    advanced: {
      low: 7.0,      // 1-7 = Green
      medium: 8.0    // 7-8 = Yellow, 8-10 = Red
    }
  };

  const threshold = thresholds[skillLevel];
  
  if (!threshold) {
    // Fallback to default thresholds
    return this.calculateRiskScore();
  }

  let riskLevel, flagColor;

  if (riskScore <= threshold.low) {
    riskLevel = 'Low';
    flagColor = 'green';
  } else if (riskScore <= threshold.medium) {
    riskLevel = 'Medium';
    flagColor = 'yellow';
  } else {
    riskLevel = 'High';
    flagColor = 'red';
  }

  // Update the skill-specific risk data
  if (this.skillLevelRisks && this.skillLevelRisks[skillLevel]) {
    this.skillLevelRisks[skillLevel].riskScore = riskScore;
    this.skillLevelRisks[skillLevel].riskLevel = riskLevel;
    this.skillLevelRisks[skillLevel].flagColor = flagColor;
  }

  return { riskLevel, flagColor };
};

/**
 * Update all skill levels at once
 * @param {object} skillScores - Object with beginner, intermediate, advanced scores
 */
surfSpotSchema.methods.updateAllSkillLevels = function(skillScores) {
  if (skillScores.beginner !== undefined) {
    this.calculateSkillRiskScore('beginner', skillScores.beginner);
  }
  if (skillScores.intermediate !== undefined) {
    this.calculateSkillRiskScore('intermediate', skillScores.intermediate);
  }
  if (skillScores.advanced !== undefined) {
    this.calculateSkillRiskScore('advanced', skillScores.advanced);
  }
  
  // Update overall risk score (weighted average: beginner 50%, intermediate 30%, advanced 20%)
  const overallScore = (
    (skillScores.beginner || 0) * 0.5 +
    (skillScores.intermediate || 0) * 0.3 +
    (skillScores.advanced || 0) * 0.2
  );
  
  this.riskScore = overallScore;
  this.calculateRiskScore();
  this.lastUpdated = Date.now();
};

/**
 * Get risk data for a specific skill level
 * @param {string} skillLevel - 'beginner', 'intermediate', or 'advanced'
 * @returns {object} Risk data for the skill level
 */
surfSpotSchema.methods.getRiskForSkill = function(skillLevel) {
  if (this.skillLevelRisks && this.skillLevelRisks[skillLevel]) {
    return {
      riskScore: this.skillLevelRisks[skillLevel].riskScore,
      riskLevel: this.skillLevelRisks[skillLevel].riskLevel,
      flagColor: this.skillLevelRisks[skillLevel].flagColor,
      incidents: this.skillLevelRisks[skillLevel].incidents || 0
    };
  }
  
  // Fallback to overall risk if skill-specific data not available
  return {
    riskScore: this.riskScore,
    riskLevel: this.riskLevel,
    flagColor: this.flagColor,
    incidents: this.totalIncidents
  };
};

/**
 * Pre-save middleware to ensure data consistency
 */
surfSpotSchema.pre('save', function(next) {
  // Ensure skillLevelRisks exists
  if (!this.skillLevelRisks) {
    this.skillLevelRisks = {
      beginner: { incidents: 0, riskScore: 0, riskLevel: 'Low', flagColor: 'green' },
      intermediate: { incidents: 0, riskScore: 0, riskLevel: 'Low', flagColor: 'green' },
      advanced: { incidents: 0, riskScore: 0, riskLevel: 'Low', flagColor: 'green' }
    };
  }
  
  // Update timestamp
  this.lastUpdated = Date.now();
  
  next();
});

/**
 * Virtual for formatted coordinates
 */
surfSpotSchema.virtual('formattedCoordinates').get(function() {
  return `${this.coordinates.latitude.toFixed(4)}°, ${this.coordinates.longitude.toFixed(4)}°`;
});

/**
 * toJSON transformation to include virtuals
 */
surfSpotSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove internal fields
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('SurfSpot', surfSpotSchema);