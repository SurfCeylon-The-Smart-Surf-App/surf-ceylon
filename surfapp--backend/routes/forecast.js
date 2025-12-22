const express = require("express");
const router = express.Router();
const { getForecastChart } = require("../controllers/forecastController");

// Route with spot name parameter
router.get("/:spotName", getForecastChart);

// Default route
router.get("/", getForecastChart);

module.exports = router;
