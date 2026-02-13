const mongoose = require('mongoose');

const hazardReportSchema = new mongoose.Schema({
  surfSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurfSpot',
    required: true
  },
  reporterName: {
    type: String,
    default: 'Anonymous'
  },
  hazardType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  media: [{
    type: { type: String, enum: ['image', 'video'] },
    url: String,
    filename: String
  }],
  analysisResult: {
    detectedHazards: [String],
    confidenceScore: Number,
    aiSuggestions: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
  }
});

module.exports = mongoose.model('HazardReport', hazardReportSchema);