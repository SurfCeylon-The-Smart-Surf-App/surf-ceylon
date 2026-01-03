const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  site: {
    type: String,
    required: true
  },
  incidentType: {
    type: String,
    required: true
  },
  victimDetails: String,
  circumstances: String,
  source: String,
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'severe', 'fatal'],
    default: 'moderate'
  },
  month: Number,
  year: Number,
  season: String
});

// Index for faster queries
incidentSchema.index({ site: 1, date: -1 });

module.exports = mongoose.model('Incident', incidentSchema);