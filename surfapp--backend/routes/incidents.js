const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// Get incidents for a surf spot
router.get('/spot/:spotName', incidentController.getIncidentsBySpot);

// Get all incidents (with pagination)
router.get('/', incidentController.getAllIncidents);

module.exports = router;