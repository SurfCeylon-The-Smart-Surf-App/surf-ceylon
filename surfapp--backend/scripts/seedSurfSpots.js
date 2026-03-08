/**
 * Auto-Seed Surf Spots for Risk Analyzer
 * 
 * This script automatically seeds the database with Sri Lankan surf spots
 * if no surf spots exist. It runs on server startup and will NOT overwrite
 * existing data.
 * 
 * Author: Risk Analyzer Feature
 */

const SurfSpot = require('../models/SurfSpot');

// Sri Lankan Surf Spots Data with Skill-Level Risk Scores
const SURF_SPOTS_DATA = [
  {
    name: 'Hikkaduwa',
    location: 'Southern Province',
    coordinates: { latitude: 6.1389, longitude: 80.1039 },
    riskScore: 7.5,
    riskLevel: 'High',
    flagColor: 'red',
    totalIncidents: 45,
    skillLevelRisks: {
      beginner: { riskScore: 7.5, riskLevel: 'High', flagColor: 'red', incidents: 25 },
      intermediate: { riskScore: 7.5, riskLevel: 'High', flagColor: 'red', incidents: 15 },
      advanced: { riskScore: 3.0, riskLevel: 'Low', flagColor: 'green', incidents: 5 }
    }
  },
  {
    name: 'Midigama',
    location: 'Southern Province',
    coordinates: { latitude: 5.9622, longitude: 80.3722 },
    riskScore: 7.0,
    riskLevel: 'High',
    flagColor: 'red',
    totalIncidents: 38,
    skillLevelRisks: {
      beginner: { riskScore: 7.0, riskLevel: 'High', flagColor: 'red', incidents: 20 },
      intermediate: { riskScore: 7.3, riskLevel: 'High', flagColor: 'red', incidents: 12 },
      advanced: { riskScore: 4.0, riskLevel: 'Low', flagColor: 'green', incidents: 6 }
    }
  },
  {
    name: 'Mirissa',
    location: 'Southern Province',
    coordinates: { latitude: 5.9466, longitude: 80.4698 },
    riskScore: 6.6,
    riskLevel: 'Medium',
    flagColor: 'yellow',
    totalIncidents: 32,
    skillLevelRisks: {
      beginner: { riskScore: 6.6, riskLevel: 'High', flagColor: 'red', incidents: 18 },
      intermediate: { riskScore: 6.8, riskLevel: 'Medium', flagColor: 'yellow', incidents: 10 },
      advanced: { riskScore: 5.0, riskLevel: 'Low', flagColor: 'green', incidents: 4 }
    }
  },
  {
    name: 'Unawatuna',
    location: 'Southern Province',
    coordinates: { latitude: 6.0108, longitude: 80.2506 },
    riskScore: 8.0,
    riskLevel: 'High',
    flagColor: 'red',
    totalIncidents: 52,
    skillLevelRisks: {
      beginner: { riskScore: 8.0, riskLevel: 'High', flagColor: 'red', incidents: 30 },
      intermediate: { riskScore: 7.4, riskLevel: 'High', flagColor: 'red', incidents: 16 },
      advanced: { riskScore: 6.0, riskLevel: 'Low', flagColor: 'green', incidents: 6 }
    }
  },
  {
    name: 'Ahangama',
    location: 'Southern Province',
    coordinates: { latitude: 5.9722, longitude: 80.3681 },
    riskScore: 6.0,
    riskLevel: 'Medium',
    flagColor: 'yellow',
    totalIncidents: 28,
    skillLevelRisks: {
      beginner: { riskScore: 6.0, riskLevel: 'Medium', flagColor: 'yellow', incidents: 15 },
      intermediate: { riskScore: 6.5, riskLevel: 'Medium', flagColor: 'yellow', incidents: 9 },
      advanced: { riskScore: 4.0, riskLevel: 'Low', flagColor: 'green', incidents: 4 }
    }
  },
  {
    name: 'Arugam Bay',
    location: 'Eastern Province',
    coordinates: { latitude: 6.8403, longitude: 81.8358 },
    riskScore: 5.5,
    riskLevel: 'Medium',
    flagColor: 'yellow',
    totalIncidents: 25,
    skillLevelRisks: {
      beginner: { riskScore: 5.5, riskLevel: 'Medium', flagColor: 'yellow', incidents: 12 },
      intermediate: { riskScore: 6.3, riskLevel: 'Medium', flagColor: 'yellow', incidents: 8 },
      advanced: { riskScore: 5.0, riskLevel: 'Low', flagColor: 'green', incidents: 5 }
    }
  },
  {
    name: 'Matara',
    location: 'Southern Province',
    coordinates: { latitude: 5.9485, longitude: 80.5353 },
    riskScore: 6.2,
    riskLevel: 'Medium',
    flagColor: 'yellow',
    totalIncidents: 22,
    skillLevelRisks: {
      beginner: { riskScore: 6.2, riskLevel: 'Medium', flagColor: 'yellow', incidents: 12 },
      intermediate: { riskScore: 5.5, riskLevel: 'Low', flagColor: 'green', incidents: 7 },
      advanced: { riskScore: 3.0, riskLevel: 'Low', flagColor: 'green', incidents: 3 }
    }
  },
  {
    name: 'Thalpe',
    location: 'Southern Province',
    coordinates: { latitude: 6.0239, longitude: 80.2369 },
    riskScore: 5.8,
    riskLevel: 'Medium',
    flagColor: 'yellow',
    totalIncidents: 20,
    skillLevelRisks: {
      beginner: { riskScore: 5.8, riskLevel: 'Medium', flagColor: 'yellow', incidents: 10 },
      intermediate: { riskScore: 5.8, riskLevel: 'Low', flagColor: 'green', incidents: 7 },
      advanced: { riskScore: 4.0, riskLevel: 'Low', flagColor: 'green', incidents: 3 }
    }
  },
  {
    name: 'Weligama',
    location: 'Southern Province',
    coordinates: { latitude: 5.9750, longitude: 80.4296 },
    riskScore: 6.3,
    riskLevel: 'Medium',
    flagColor: 'yellow',
    totalIncidents: 30,
    skillLevelRisks: {
      beginner: { riskScore: 6.3, riskLevel: 'Medium', flagColor: 'yellow', incidents: 16 },
      intermediate: { riskScore: 6.7, riskLevel: 'Medium', flagColor: 'yellow', incidents: 10 },
      advanced: { riskScore: 4.5, riskLevel: 'Low', flagColor: 'green', incidents: 4 }
    }
  },
  {
    name: 'Kalpitiya',
    location: 'North Western Province',
    coordinates: { latitude: 8.2333, longitude: 79.7667 },
    riskScore: 3.5,
    riskLevel: 'Low',
    flagColor: 'green',
    totalIncidents: 8,
    skillLevelRisks: {
      beginner: { riskScore: 3.5, riskLevel: 'Low', flagColor: 'green', incidents: 4 },
      intermediate: { riskScore: 4.0, riskLevel: 'Low', flagColor: 'green', incidents: 3 },
      advanced: { riskScore: 3.0, riskLevel: 'Low', flagColor: 'green', incidents: 1 }
    }
  },
  {
    name: 'Point Pedro',
    location: 'Northern Province',
    coordinates: { latitude: 9.8167, longitude: 80.2333 },
    riskScore: 4.0,
    riskLevel: 'Low',
    flagColor: 'green',
    totalIncidents: 10,
    skillLevelRisks: {
      beginner: { riskScore: 4.0, riskLevel: 'Low', flagColor: 'green', incidents: 5 },
      intermediate: { riskScore: 4.5, riskLevel: 'Low', flagColor: 'green', incidents: 3 },
      advanced: { riskScore: 3.5, riskLevel: 'Low', flagColor: 'green', incidents: 2 }
    }
  },
  {
    name: 'Trincomalee',
    location: 'Eastern Province',
    coordinates: { latitude: 8.5874, longitude: 81.2152 },
    riskScore: 4.5,
    riskLevel: 'Low',
    flagColor: 'green',
    totalIncidents: 12,
    skillLevelRisks: {
      beginner: { riskScore: 4.5, riskLevel: 'Low', flagColor: 'green', incidents: 6 },
      intermediate: { riskScore: 5.0, riskLevel: 'Low', flagColor: 'green', incidents: 4 },
      advanced: { riskScore: 4.0, riskLevel: 'Low', flagColor: 'green', incidents: 2 }
    }
  }
];

/**
 * Seed surf spots into the database
 * Only seeds if no surf spots exist (safe to run multiple times)
 */
const seedSurfSpots = async () => {
  try {
    // Check if surf spots already exist
    const existingCount = await SurfSpot.countDocuments();
    
    if (existingCount > 0) {
      console.log(`🏄 Surf Spots: ${existingCount} spots already exist. Skipping seed.`);
      return { seeded: false, count: existingCount };
    }

    console.log('🌱 Seeding surf spots for Risk Analyzer...');

    // Insert all surf spots
    const result = await SurfSpot.insertMany(
      SURF_SPOTS_DATA.map(spot => ({
        ...spot,
        lastUpdated: new Date(),
        recentHazards: [],
        historicalData: {
          seasonalPatterns: {},
          commonHazards: [],
          peakRiskMonths: []
        }
      }))
    );

    console.log(`✅ Successfully seeded ${result.length} surf spots for Risk Analyzer`);
    
    // Log summary
    console.log('📍 Seeded locations:');
    result.forEach(spot => {
      console.log(`   - ${spot.name} (${spot.location}) - Risk: ${spot.riskLevel}`);
    });

    return { seeded: true, count: result.length };

  } catch (error) {
    // Handle duplicate key error gracefully (in case of race condition)
    if (error.code === 11000) {
      console.log('🏄 Surf Spots: Data already exists (duplicate detected). Skipping seed.');
      return { seeded: false, count: 0, duplicate: true };
    }
    
    console.error('❌ Error seeding surf spots:', error.message);
    // Don't throw - allow server to continue starting
    return { seeded: false, error: error.message };
  }
};

module.exports = { seedSurfSpots };
