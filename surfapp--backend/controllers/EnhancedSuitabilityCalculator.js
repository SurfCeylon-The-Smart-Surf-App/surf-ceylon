const moment = require("moment");

/**
 * Enhanced Suitability Calculator
 * Calculates surf spot suitability scores based on conditions, user preferences, and session insights
 */
class EnhancedSuitabilityCalculator {
  constructor() {
    // Default weights for suitability calculation
    this.defaultWeights = {
      waveHeight: 0.3,
      wavePeriod: 0.15,
      windSpeed: 0.25,
      windDirection: 0.15,
      tide: 0.1,
      timeOfDay: 0.05,
    };
  }

  /**
   * Calculate enhanced suitability score for a surf spot
   * @param {Object} spot - Spot with metadata
   * @param {Object} forecast - Current forecast conditions
   * @param {Object} userPreferences - User's preferences
   * @param {Object} currentTime - Moment.js time object
   * @returns {Object} Suitability result with score, breakdown, recommendations
   */
  calculateEnhancedSuitability(
    spot,
    forecast,
    userPreferences = {},
    currentTime,
  ) {
    // Validate forecast exists
    if (!forecast || typeof forecast !== "object") {
      console.warn(`No forecast data for spot: ${spot.name || "unknown"}`);
      // Return default poor conditions
      return {
        score: 0,
        suitability: "Unknown",
        breakdown: {},
        recommendations: ["No forecast data available"],
        warnings: ["Unable to calculate suitability - missing forecast data"],
        weights: this.defaultWeights,
        canSurf: false,
      };
    }

    const breakdown = {};
    const recommendations = [];

    // Get adaptive weights based on skill level
    const skillLevel = userPreferences.skillLevel || "Intermediate";
    const weights = this.getAdaptiveWeights(skillLevel);

    // Extract forecast values with defaults
    const waveHeight = forecast.waveHeight ?? 0;
    const wavePeriod = forecast.wavePeriod ?? 0;
    const windSpeed = forecast.windSpeed ?? 0;
    const windDirection = forecast.windDirection ?? 0;
    const tideStatus = forecast.tide?.status || "Unknown";

    // Ensure currentTime is a moment object
    const time = currentTime
      ? moment.isMoment(currentTime)
        ? currentTime
        : moment()
      : moment();

    // 1. Wave Height Score
    const waveHeightScore = this.calculateWaveHeightScore(
      waveHeight,
      spot.optimalWaveHeight,
      userPreferences.learnedWaveHeight,
    );
    breakdown.waveHeight = {
      score: waveHeightScore,
      current: waveHeight,
      optimal: spot.optimalWaveHeight,
      unit: "m",
    };

    // 2. Wave Period Score
    const wavePeriodScore = this.calculateWavePeriodScore(
      wavePeriod,
      10, // optimal period
    );
    breakdown.wavePeriod = {
      score: wavePeriodScore,
      current: wavePeriod,
      optimal: 10,
      unit: "s",
    };

    // 3. Wind Score
    const windScore = this.calculateWindScore(
      windSpeed,
      windDirection,
      spot.offshoreWind || 270,
      userPreferences.learnedWindSpeed,
    );
    breakdown.windSpeed = {
      score: windScore.speedScore,
      current: windSpeed,
      optimal: "5-15",
      unit: "km/h",
    };
    breakdown.windDirection = {
      score: windScore.directionScore,
      current: windDirection,
      optimal: spot.offshoreWind || 270,
      unit: "°",
    };

    // 4. Tide Score
    const tideScore = this.calculateTideScore(tideStatus, spot.optimalTide);
    breakdown.tide = {
      score: tideScore,
      current: tideStatus,
      optimal: spot.optimalTide,
    };

    // 5. Safety Score - Comprehensive skill-based evaluation
    const safetyData = this.calculateSafetyScore(forecast, spot, skillLevel);
    breakdown.safety = safetyData.score;

    // 6. Consistency Score - Wave quality and predictability
    const consistencyScore = this.calculateConsistencyScore(forecast);
    breakdown.consistency = consistencyScore;

    // Calculate weighted score using adaptive weights
    const waveScore = (waveHeightScore * 0.67 + wavePeriodScore * 0.33) * 100;
    const windTotalScore =
      (windScore.speedScore * 0.6 + windScore.directionScore * 0.4) * 100;

    const weightedScore =
      waveScore * weights.wave +
      windTotalScore * weights.wind +
      safetyData.score * weights.safety +
      consistencyScore * weights.consistency;

    // Normalize to 0-100 scale
    let normalizedScore = weightedScore;

    // Region preference bonus
    if (
      userPreferences.preferredRegion &&
      spot.region === userPreferences.preferredRegion
    ) {
      normalizedScore += 5;
    }

    // Session-based bonuses
    let sessionBonuses = [];

    // Favorite spot bonus (+15 points)
    if (
      userPreferences.favoriteSpots &&
      Array.isArray(userPreferences.favoriteSpots)
    ) {
      if (userPreferences.favoriteSpots.includes(spot.name)) {
        normalizedScore += 15;
        sessionBonuses.push({
          type: "favorite_spot",
          points: 15,
          message: "⭐ One of your favorite spots!",
        });
      }
    }

    // Learned wave preference match (+10 points)
    if (userPreferences.learnedWaveHeight && waveHeight) {
      const waveDiff = Math.abs(waveHeight - userPreferences.learnedWaveHeight);
      if (waveDiff <= 0.3) {
        normalizedScore += 10;
        sessionBonuses.push({
          type: "wave_match",
          points: 10,
          message: `🌊 Waves match your preferred ${userPreferences.learnedWaveHeight.toFixed(
            1,
          )}m conditions!`,
        });
      }
    }

    // Learned wind preference match (+5 points)
    if (userPreferences.learnedWindSpeed && windSpeed) {
      const windDiff = Math.abs(windSpeed - userPreferences.learnedWindSpeed);
      if (windDiff <= 5) {
        normalizedScore += 5;
        sessionBonuses.push({
          type: "wind_match",
          points: 5,
          message: `💨 Wind matches your preferred ${userPreferences.learnedWindSpeed.toFixed(
            0,
          )} km/h conditions!`,
        });
      }
    }

    // Safety override: Cap score if conditions are dangerous
    if (!safetyData.canSurf) {
      normalizedScore = Math.min(normalizedScore, 35);
    }

    // Cap final score at 100
    normalizedScore = Math.min(normalizedScore, 100);
    normalizedScore = Math.round(normalizedScore);

    // Add session-based recommendations to the top
    sessionBonuses.forEach((bonus) => {
      recommendations.unshift(bonus.message);
    });

    // Determine suitability level
    let suitability;
    if (normalizedScore >= 80) suitability = "Excellent";
    else if (normalizedScore >= 65) suitability = "Good";
    else if (normalizedScore >= 50) suitability = "Fair";
    else if (normalizedScore >= 35) suitability = "Poor";
    else suitability = "Unsuitable";

    // Can surf determination from safety data
    const canSurf = safetyData.canSurf;

    // Add aggregated scores for frontend radar chart
    breakdown.overall = normalizedScore;
    breakdown.wave = Math.round(waveScore);
    breakdown.wind = Math.round(windTotalScore);
    breakdown.sessionBonuses = sessionBonuses;

    // Generate recommendations without safety warnings
    const smartRecommendations = this.generateSmartRecommendations(
      normalizedScore,
      breakdown,
      safetyData,
      spot,
      time,
    );
    recommendations.push(...smartRecommendations);

    return {
      score: normalizedScore,
      suitability,
      breakdown,
      recommendations,
      warnings: [], // No warnings
      weights,
      canSurf,
      timestamp: time.toISOString(),
    };
  }

  // HELPER METHODS

  getAdaptiveWeights(skillLevel) {
    const weightProfiles = {
      Beginner: {
        safety: 0.35,
        wave: 0.3,
        wind: 0.2,
        consistency: 0.15,
      },
      Intermediate: {
        wave: 0.35,
        consistency: 0.25,
        safety: 0.25,
        wind: 0.15,
      },
      Advanced: {
        wave: 0.4,
        consistency: 0.25,
        wind: 0.2,
        safety: 0.15,
      },
    };

    return weightProfiles[skillLevel] || weightProfiles["Intermediate"];
  }

  /**
   * Comprehensive safety score with skill-based evaluation
   */
  calculateSafetyScore(forecast, spot, userSkillLevel) {
    const { waveHeight, windSpeed, windDirection, tide } = forecast;

    let safetyScore = 100;
    const warnings = [];
    const tips = [];

    const safeWaveHeights = {
      Beginner: { max: 1.5, ideal: 1.0 },
      Intermediate: { max: 2.5, ideal: 1.8 },
      Advanced: { max: 5.0, ideal: 2.5 },
    };

    const skillThresholds =
      safeWaveHeights[userSkillLevel] || safeWaveHeights["Intermediate"];

    // Wave height safety
    if (waveHeight > skillThresholds.max) {
      const excess = waveHeight - skillThresholds.max;
      const penalty = Math.min(40, excess * 20);
      safetyScore -= penalty;
      warnings.push(
        `⚠️ Waves too large for ${userSkillLevel} (${waveHeight.toFixed(1)}m)`,
      );
    } else if (waveHeight > skillThresholds.ideal) {
      const excess = waveHeight - skillThresholds.ideal;
      safetyScore -= excess * 10;
      tips.push(
        `💡 Waves on upper end for ${userSkillLevel} - exercise caution`,
      );
    }

    // Wind safety
    if (windSpeed > 35) {
      safetyScore -= 30;
      warnings.push(
        `🌬️ Strong winds (${windSpeed.toFixed(
          1,
        )} km/h) - challenging conditions`,
      );
    } else if (windSpeed > 25) {
      safetyScore -= 15;
      tips.push(`💨 Moderate winds - conditions may be choppy`);
    }

    // Beginner-specific warnings
    if (userSkillLevel === "Beginner") {
      if (windSpeed > 20 && windDirection >= 270 && windDirection <= 360) {
        safetyScore -= 25;
        warnings.push(`⚠️ Strong offshore winds - stay close to shore`);
      }

      if (spot.bottomType === "Reef" || spot.bottomType === "Rock") {
        safetyScore -= 10;
        warnings.push(`🪨 Reef break - wear protection`);
      }
    }

    // Low tide + reef warnings
    if (tide && tide.status === "Low") {
      if (spot.bottomType === "Reef" || spot.bottomType === "Rock") {
        if (waveHeight > 1.0) {
          safetyScore -= 20;
          warnings.push(`⚠️ Low tide on reef - shallow water hazard`);
        } else {
          safetyScore -= 10;
          tips.push(`🌊 Low tide - watch for exposed rocks`);
        }
      }
    }

    // Rip current warnings
    const ripCurrentSpots = ["Arugam Bay", "Pottuvil Point", "Whiskey Point"];
    if (ripCurrentSpots.includes(spot.name) && waveHeight > 1.5) {
      if (userSkillLevel === "Beginner") {
        safetyScore -= 15;
        warnings.push(`⚠️ Strong currents expected - know rip current escape`);
      } else {
        tips.push(`🌊 Be aware of rip currents`);
      }
    }

    let level;
    if (safetyScore >= 80) level = "Safe";
    else if (safetyScore >= 60) level = "Moderate";
    else if (safetyScore >= 40) level = "Caution";
    else level = "Dangerous";

    return {
      score: Math.max(0, Math.round(safetyScore)),
      level,
      warnings,
      tips,
      canSurf: safetyScore >= 30,
    };
  }

  /**
   * Calculate consistency score
   */
  calculateConsistencyScore(forecast) {
    const { wavePeriod, windSpeed, waveHeight } = forecast;

    let consistencyScore = 50;

    // Wave period consistency
    if (wavePeriod >= 14) consistencyScore += 35;
    else if (wavePeriod >= 12) consistencyScore += 25;
    else if (wavePeriod >= 10) consistencyScore += 15;
    else if (wavePeriod >= 8) consistencyScore += 5;
    else consistencyScore -= 20;

    // Wind stability
    if (windSpeed >= 8 && windSpeed <= 15) consistencyScore += 20;
    else if (windSpeed >= 5 && windSpeed <= 20) consistencyScore += 10;
    else if (windSpeed < 5) consistencyScore += 5;
    else if (windSpeed > 30) consistencyScore -= 30;
    else if (windSpeed > 20) consistencyScore -= 15;

    // Wave height sweet spot
    if (waveHeight >= 1.0 && waveHeight <= 2.5) consistencyScore += 10;
    else if (waveHeight < 0.5) consistencyScore -= 10;
    else if (waveHeight > 4.0) consistencyScore -= 10;

    return Math.max(0, Math.min(100, consistencyScore));
  }

  /**
   * Generate smart contextual recommendations (no crowd or time references, no safety warnings)
   */
  generateSmartRecommendations(
    score,
    breakdown,
    safetyData,
    spot,
    currentTime,
  ) {
    const recommendations = [];

    // Overall assessment
    if (score >= 80) {
      recommendations.push(
        "🌊 Excellent conditions! This is a great choice right now.",
      );
    } else if (score >= 65) {
      recommendations.push("✅ Good conditions - should be a fun session!");
    } else if (score >= 50) {
      recommendations.push("👌 Fair conditions - manageable but not ideal.");
    } else {
      recommendations.push(
        "⚠️ Challenging conditions - consider alternatives.",
      );
    }

    // Wave quality tips
    if (breakdown.consistency >= 70) {
      recommendations.push(
        "📊 Consistent swell - expect clean, organized sets",
      );
    } else if (breakdown.consistency < 40) {
      recommendations.push("🌊 Choppy conditions - waves may be inconsistent");
    }

    // Wind conditions
    if (breakdown.wind >= 80) {
      recommendations.push("💨 Offshore winds - excellent grooming conditions");
    } else if (breakdown.wind < 40) {
      recommendations.push(
        "💨 Onshore winds - expect choppy, less favorable conditions",
      );
    }

    // Wave quality based on breakdown
    if (breakdown.wave >= 80) {
      recommendations.push("🌊 Perfect wave size and period for great surfing");
    }

    return recommendations.slice(0, 4);
  }

  // Helper methods

  calculateWaveHeightScore(waveHeight, skillLevel = "Intermediate") {
    // Skill-based optimal wave height ranges
    const optimalRanges = {
      Beginner: { min: 0.5, ideal: 1.0, max: 1.5 },
      Intermediate: { min: 1.0, ideal: 1.5, max: 2.5 },
      Advanced: { min: 1.5, ideal: 2.5, max: 5.0 },
    };

    const range = optimalRanges[skillLevel] || optimalRanges["Intermediate"];

    if (waveHeight < range.min) {
      return Math.max(0, waveHeight / range.min);
    } else if (waveHeight <= range.ideal) {
      return 1.0;
    } else if (waveHeight <= range.max) {
      return (
        1.0 - ((waveHeight - range.ideal) / (range.max - range.ideal)) * 0.3
      );
    } else {
      return Math.max(0, 0.7 - ((waveHeight - range.max) / range.max) * 0.5);
    }
  }

  calculateWavePeriodScore(wavePeriod) {
    // Optimal: 12-16s (groundswell)
    // Good: 8-12s (clean swell)
    // Poor: <8s (wind swell)
    if (wavePeriod >= 12 && wavePeriod <= 16) return 1.0;
    if (wavePeriod >= 8 && wavePeriod < 12)
      return 0.7 + ((wavePeriod - 8) / 4) * 0.3;
    if (wavePeriod > 16) return Math.max(0.7, 1.0 - (wavePeriod - 16) / 10);
    return Math.max(0.3, (wavePeriod / 8) * 0.7);
  }

  calculateWindScore(windSpeed, windDirection, optimalDirection = null) {
    // Speed scoring (km/h)
    let speedScore;
    if (windSpeed < 5)
      speedScore = 0.6; // Too light
    else if (windSpeed <= 15)
      speedScore = 1.0; // Optimal
    else if (windSpeed <= 25)
      speedScore = 0.7; // Moderate
    else if (windSpeed <= 35)
      speedScore = 0.4; // Strong
    else speedScore = 0.1; // Very strong

    // Direction scoring
    let directionScore = 0.7; // Default neutral
    if (optimalDirection) {
      const diff = Math.abs(windDirection - optimalDirection);
      const normalizedDiff = Math.min(diff, 360 - diff);
      if (normalizedDiff <= 45) directionScore = 1.0;
      else if (normalizedDiff <= 90) directionScore = 0.8;
      else if (normalizedDiff <= 135) directionScore = 0.6;
      else directionScore = 0.4;
    }

    return { speedScore, directionScore };
  }

  calculateTideScore(tideStatus, optimalTide) {
    if (!optimalTide || optimalTide === "Any") return 0.8;

    const tideMatch = {
      Low: { Low: 1.0, Mid: 0.7, High: 0.4 },
      Mid: { Low: 0.7, Mid: 1.0, High: 0.7 },
      High: { Low: 0.4, Mid: 0.7, High: 1.0 },
    };

    return tideMatch[tideStatus]?.[optimalTide] || 0.7;
  }
}

module.exports = EnhancedSuitabilityCalculator;
