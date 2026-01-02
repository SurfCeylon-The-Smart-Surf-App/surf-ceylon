/**
 * Pose Detection Utility
 * Provides pose analysis functions for surf drills
 * Uses landmark-based detection similar to MediaPipe Pose
 */

/**
 * @typedef {Object} PoseLandmark
 * @property {number} x
 * @property {number} y
 * @property {number} [z]
 * @property {number} [visibility]
 */

/**
 * @typedef {Object} PoseLandmarks
 * @property {PoseLandmark} [nose]
 * @property {PoseLandmark} [leftEye]
 * @property {PoseLandmark} [rightEye]
 * @property {PoseLandmark} [leftEar]
 * @property {PoseLandmark} [rightEar]
 * @property {PoseLandmark} [leftShoulder]
 * @property {PoseLandmark} [rightShoulder]
 * @property {PoseLandmark} [leftElbow]
 * @property {PoseLandmark} [rightElbow]
 * @property {PoseLandmark} [leftWrist]
 * @property {PoseLandmark} [rightWrist]
 * @property {PoseLandmark} [leftHip]
 * @property {PoseLandmark} [rightHip]
 * @property {PoseLandmark} [leftKnee]
 * @property {PoseLandmark} [rightKnee]
 * @property {PoseLandmark} [leftAnkle]
 * @property {PoseLandmark} [rightAnkle]
 */

/**
 * @typedef {Object} PoseAnalysisResult
 * @property {boolean} personDetected
 * @property {number} confidence - 0-1
 * @property {string[]} feedback
 * @property {number} score - 0-100
 * @property {Object.<string, {detected: boolean, confidence: number}>} keypoints
 */

// Confidence thresholds - Optimized for maximum detection sensitivity
const MIN_DETECTION_CONFIDENCE = 0.2;  // Very low for maximum sensitivity
const MIN_TRACKING_CONFIDENCE = 0.2;   // Very low for better tracking
const MIN_VISIBILITY_THRESHOLD = 0.2;  // Very lenient - accept low visibility landmarks
const REQUIRED_KEYPOINTS_COUNT = 2;     // Minimum for preview (very lenient)
const MIN_KEYPOINTS_FOR_PREVIEW = 1;    // Show preview with just 1 keypoint

/**
 * Check if a person is detected in the frame with progressive validation
 * Uses multi-stage detection: 2 → 4 → 6 keypoints for better accuracy
 * @param {PoseLandmarks} landmarks
 * @returns {boolean}
 */
export function isPersonDetected(landmarks) {
  return isPersonDetectedProgressive(landmarks).detected;
}

/**
 * Progressive person detection with confidence levels
 * Returns detection status and confidence for UI feedback
 * @param {PoseLandmarks} landmarks
 * @returns {{detected: boolean, confidence: number, stage: 'none'|'preview'|'partial'|'full'}}
 */
export function isPersonDetectedProgressive(landmarks) {
  // Core keypoints for basic detection (minimum required)
  const coreKeypoints = [
    landmarks.nose,
    landmarks.leftShoulder,
    landmarks.rightShoulder,
    landmarks.leftHip,
    landmarks.rightHip,
  ];

  // Extended keypoints for full validation
  const extendedKeypoints = [
    ...coreKeypoints,
    landmarks.leftKnee,
    landmarks.rightKnee,
    landmarks.leftElbow,
    landmarks.rightElbow,
  ];

  // Count points - accept ANY visibility (very lenient)
  // We'll check visibility later, but first just see if landmarks exist
  const coreDetected = coreKeypoints.filter(
    (point) => point !== null && point !== undefined
  );

  const extendedDetected = extendedKeypoints.filter(
    (point) => point !== null && point !== undefined
  );
  
  // Also count points with any visibility >= 0.1 (very lenient)
  const coreDetectedWithVisibility = coreKeypoints.filter(
    (point) =>
      point &&
      point.visibility !== undefined &&
      point.visibility >= 0.1  // Very low threshold
  );

  const extendedDetectedWithVisibility = extendedKeypoints.filter(
    (point) =>
      point &&
      point.visibility !== undefined &&
      point.visibility >= 0.1  // Very low threshold
  );

  // Stage 1: Preview (1+ keypoints) - Show skeleton preview
  if (extendedDetected.length >= MIN_KEYPOINTS_FOR_PREVIEW && extendedDetected.length < REQUIRED_KEYPOINTS_COUNT) {
    const confidence = Math.min(50, (extendedDetectedWithVisibility.length / REQUIRED_KEYPOINTS_COUNT) * 50);
    return {
      detected: false,
      confidence,
      stage: 'preview',
    };
  }

  // Stage 2: Partial (2+ keypoints) - Basic detection
  if (coreDetected.length >= REQUIRED_KEYPOINTS_COUNT || extendedDetectedWithVisibility.length >= REQUIRED_KEYPOINTS_COUNT) {
    // Calculate confidence based on number of detected points with visibility
    const confidence = Math.min(100, (extendedDetectedWithVisibility.length / extendedKeypoints.length) * 100);
    
    // Basic geometric validation for partial detection (very lenient)
    const lShoulder = landmarks.leftShoulder;
    const rShoulder = landmarks.rightShoulder;
    const lHip = landmarks.leftHip;
    const rHip = landmarks.rightHip;

    // If we have at least 2 keypoints with visibility, accept it
    if (extendedDetectedWithVisibility.length >= 2) {
      // Very lenient geometric checks - only reject obvious non-human shapes
      if (lShoulder && rShoulder && lHip && rHip) {
        const shoulderVerticalDiff = Math.abs(lShoulder.y - rShoulder.y);
        const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
        const avgHipY = (lHip.y + rHip.y) / 2;
        const shoulderToHipDistance = avgHipY - avgShoulderY;
        const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);

        // Very lenient validation - only reject obviously wrong shapes
        if (
          shoulderVerticalDiff < 0.3 && // Shoulders roughly horizontal (very lenient)
          shoulderToHipDistance > 0.05 && // Hips below shoulders (very lenient)
          shoulderToHipDistance < 1.0 && // Realistic body proportions (very lenient)
          shoulderWidth > 0.01 && // Shoulders not too close (very lenient)
          shoulderWidth < 0.8 // Shoulders not too far (very lenient)
        ) {
          return {
            detected: true,
            confidence,
            stage: extendedDetectedWithVisibility.length >= 6 ? 'full' : 'partial',
          };
        }
      }
      
      // If we have 2+ keypoints but geometry check failed, still return partial
      // This helps with edge cases
      if (extendedDetectedWithVisibility.length >= 2) {
        return {
          detected: true,
          confidence: Math.max(30, confidence * 0.7), // Lower confidence but still detected
          stage: 'partial',
        };
      }
    }
  }

  return {
    detected: false,
    confidence: 0,
    stage: 'none',
  };
}


/**
 * Calculate angle between three points
 * @param {PoseLandmark} point1
 * @param {PoseLandmark} point2
 * @param {PoseLandmark} point3
 * @returns {number}
 */
export function calculateAngle(
  point1,
  point2,
  point3
) {
  const radians =
    Math.atan2(point3.y - point2.y, point3.x - point2.x) -
    Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  return angle > 180.0 ? 360 - angle : angle;
}

/**
 * Calculate knee angle (hip-knee-ankle)
 * @param {PoseLandmark} hip
 * @param {PoseLandmark} knee
 * @param {PoseLandmark} ankle
 * @returns {number}
 */
export function calculateKneeAngle(
  hip,
  knee,
  ankle
) {
  return calculateAngle(hip, knee, ankle);
}

/**
 * Calculate hip angle (shoulder-hip-knee)
 * @param {PoseLandmark} shoulder
 * @param {PoseLandmark} hip
 * @param {PoseLandmark} knee
 * @returns {number}
 */
export function calculateHipAngle(
  shoulder,
  hip,
  knee
) {
  return calculateAngle(shoulder, hip, knee);
}

/**
 * Calculate head angle (nose-shoulder-hip)
 * @param {PoseLandmark} nose
 * @param {PoseLandmark} shoulder
 * @param {PoseLandmark} hip
 * @returns {number}
 */
export function calculateHeadAngle(
  nose,
  shoulder,
  hip
) {
  return calculateAngle(nose, shoulder, hip);
}

/**
 * Get angle difference and direction for feedback
 * @param {number} current
 * @param {number} targetMin
 * @param {number} targetMax
 * @returns {{degrees: number, direction: 'more'|'less'|'perfect', message: string}}
 */
export function getAngleDifference(
  current,
  targetMin,
  targetMax
) {
  if (current >= targetMin && current <= targetMax) {
    return { degrees: 0, direction: 'perfect', message: 'Perfect!' };
  }
  
  if (current < targetMin) {
    const diff = targetMin - current;
    return { 
      degrees: Math.round(diff), 
      direction: 'more', 
      message: `Increase by ${Math.round(diff)}°` 
    };
  } else {
    const diff = current - targetMax;
    return { 
      degrees: Math.round(diff), 
      direction: 'less', 
      message: `Decrease by ${Math.round(diff)}°` 
    };
  }
}

/**
 * Calculate distance between two points
 * @param {PoseLandmark} point1
 * @param {PoseLandmark} point2
 * @returns {number}
 */
export function calculateDistance(
  point1,
  point2
) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get landmark coordinates safely
 * @param {PoseLandmarks} landmarks
 * @param {keyof PoseLandmarks} key
 * @returns {PoseLandmark|null}
 */
export function getLandmark(
  landmarks,
  key
) {
  const landmark = landmarks[key];
  if (
    !landmark ||
    (landmark.visibility !== undefined &&
      landmark.visibility < MIN_VISIBILITY_THRESHOLD)
  ) {
    return null;
  }
  return landmark;
}

/**
 * Analyze stance drill
 * @param {PoseLandmarks} landmarks
 * @returns {PoseAnalysisResult}
 */
export function analyzeStance(landmarks) {
  const feedback = [];
  let score = 0;
  const keypoints = {};

  // Check required landmarks
  const lShoulder = getLandmark(landmarks, 'leftShoulder');
  const rShoulder = getLandmark(landmarks, 'rightShoulder');
  const lHip = getLandmark(landmarks, 'leftHip');
  const rHip = getLandmark(landmarks, 'rightHip');
  const lKnee = getLandmark(landmarks, 'leftKnee');
  const rKnee = getLandmark(landmarks, 'rightKnee');
  const lAnkle = getLandmark(landmarks, 'leftAnkle');
  const rAnkle = getLandmark(landmarks, 'rightAnkle');

  if (!lShoulder || !rShoulder || !lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure full body is visible'],
      score: 0,
      keypoints: {},
    };
  }

  // Calculate angles
  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const leftHipAngle = calculateAngle(lShoulder, lHip, lKnee);
  const rightHipAngle = calculateAngle(rShoulder, rHip, rKnee);
  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  // Stance requirements: knee 90-140 deg, hip 140-170 deg
  const STANCE_KNEE_MIN = 90;
  const STANCE_KNEE_MAX = 140;
  const STANCE_HIP_MIN = 140;
  const STANCE_HIP_MAX = 170;

  const kneeCorrect = avgKneeAngle >= STANCE_KNEE_MIN && avgKneeAngle <= STANCE_KNEE_MAX;
  const hipCorrect = avgHipAngle >= STANCE_HIP_MIN && avgHipAngle <= STANCE_HIP_MAX;

  keypoints.knee = { detected: true, confidence: kneeCorrect ? 1 : 0.5 };
  keypoints.hip = { detected: true, confidence: hipCorrect ? 1 : 0.5 };

  if (kneeCorrect && hipCorrect) {
    feedback.push('GREAT STANCE!');
    score = 95;
  } else {
    if (!kneeCorrect) {
      if (avgKneeAngle < STANCE_KNEE_MIN) {
        feedback.push('Bend knees more');
      } else {
        feedback.push('Straighten knees slightly');
      }
    }
    if (!hipCorrect) {
      if (avgHipAngle < STANCE_HIP_MIN) {
        feedback.push('Hinge at hips more');
      } else {
        feedback.push('Straighten hips slightly');
      }
    }
    score = (kneeCorrect ? 50 : 0) + (hipCorrect ? 45 : 0);
  }

  return {
    personDetected: true,
    confidence: 0.9,
    feedback,
    score: Math.round(score),
    keypoints,
  };
}

/**
 * Analyze pop-up drill
 * @param {PoseLandmarks} landmarks
 * @param {string} [previousStage]
 * @returns {PoseAnalysisResult}
 */
export function analyzePopUp(landmarks, previousStage) {
  const feedback = [];
  let score = 0;

  const lShoulder = getLandmark(landmarks, 'leftShoulder');
  const lHip = getLandmark(landmarks, 'leftHip');
  const lKnee = getLandmark(landmarks, 'leftKnee');
  const lElbow = getLandmark(landmarks, 'leftElbow');
  const lWrist = getLandmark(landmarks, 'leftWrist');
  const rElbow = getLandmark(landmarks, 'rightElbow');
  const rWrist = getLandmark(landmarks, 'rightWrist');

  if (!lShoulder || !lHip || !lKnee || !lElbow || !lWrist || !rElbow || !rWrist) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure full body is visible'],
      score: 0,
      keypoints: {},
    };
  }

  const hipAngle = calculateAngle(lShoulder, lHip, lKnee);
  const DOWN_HIP_MIN = 160;

  if (hipAngle > DOWN_HIP_MIN) {
    // Check push-up stage
    const lElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const rElbowAngle = calculateAngle(landmarks.rightShoulder, rElbow, rWrist);
    const PUSH_ELBOW_MAX = 100;

    if (lElbowAngle < PUSH_ELBOW_MAX && rElbowAngle < PUSH_ELBOW_MAX) {
      feedback.push('Now JUMP to your feet!');
      score = 70;
    } else {
      feedback.push('Push with your arms!');
      score = 40;
    }
  } else {
    feedback.push('Straighten your body');
    score = 20;
  }

  return {
    personDetected: true,
    confidence: 0.85,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Analyze paddling drill
 * @param {PoseLandmarks} landmarks
 * @returns {PoseAnalysisResult}
 */
export function analyzePaddling(landmarks) {
  const feedback = [];
  let score = 0;

  const lEar = getLandmark(landmarks, 'leftEar');
  const lShoulder = getLandmark(landmarks, 'leftShoulder');
  const lHip = getLandmark(landmarks, 'leftHip');
  const nose = getLandmark(landmarks, 'nose');
  const rShoulder = getLandmark(landmarks, 'rightShoulder');

  if (!lEar || !lShoulder || !lHip || !nose || !rShoulder) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure torso and head visible'],
      score: 0,
      keypoints: {},
    };
  }

  const backArchAngle = calculateAngle(lEar, lShoulder, lHip);
  const PADDLE_ARCH_MAX = 165;
  const backIsArched = backArchAngle < PADDLE_ARCH_MAX;

  const shoulderY = (lShoulder.y + rShoulder.y) / 2;
  const headIsUp = nose.y < shoulderY;

  if (backIsArched && headIsUp) {
    feedback.push('GOOD PADDLE POSTURE!');
    score = 95;
  } else {
    if (!backIsArched) {
      const archDiff = PADDLE_ARCH_MAX - backArchAngle;
      feedback.push(`Lift your chest and head! Arch your back ${Math.round(archDiff)}° more (current: ${Math.round(backArchAngle)}°, target: <${PADDLE_ARCH_MAX}°)`);
    }
    if (!headIsUp) {
      feedback.push('Look forward! Raise your head so your nose is above your shoulders');
    }
    score = (backIsArched ? 50 : 0) + (headIsUp ? 45 : 0);
  }

  return {
    personDetected: true,
    confidence: 0.9,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Analyze bottom turn drill
 * @param {PoseLandmarks} landmarks
 * @returns {PoseAnalysisResult}
 */
export function analyzeBottomTurn(landmarks) {
  const feedback = [];
  let score = 0;

  const lShoulder = getLandmark(landmarks, 'leftShoulder');
  const rShoulder = getLandmark(landmarks, 'rightShoulder');
  const lHip = getLandmark(landmarks, 'leftHip');
  const rHip = getLandmark(landmarks, 'rightHip');
  const lKnee = getLandmark(landmarks, 'leftKnee');
  const rKnee = getLandmark(landmarks, 'rightKnee');
  const lAnkle = getLandmark(landmarks, 'leftAnkle');
  const rAnkle = getLandmark(landmarks, 'rightAnkle');

  if (!lShoulder || !rShoulder || !lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure full body is visible'],
      score: 0,
      keypoints: {},
    };
  }

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const TURN_KNEE_MAX = 120;
  const kneesCompressed = avgKneeAngle < TURN_KNEE_MAX;

  const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
  const shouldersRotated = shoulderWidth < 0.15;

  if (kneesCompressed && shouldersRotated) {
    feedback.push('GOOD TURN POSTURE!');
    score = 95;
  } else {
    if (!kneesCompressed) {
      feedback.push('Bend knees DEEPER!');
    }
    if (!shouldersRotated) {
      feedback.push('Rotate shoulders more!');
    }
    score = (kneesCompressed ? 50 : 0) + (shouldersRotated ? 45 : 0);
  }

  return {
    personDetected: true,
    confidence: 0.9,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Analyze pumping drill
 * @param {PoseLandmarks} landmarks
 * @param {'HIGH'|'LOW'} [previousState]
 * @returns {PoseAnalysisResult}
 */
export function analyzePumping(
  landmarks,
  previousState
) {
  const feedback = [];
  let score = 0;

  const lHip = getLandmark(landmarks, 'leftHip');
  const rHip = getLandmark(landmarks, 'rightHip');
  const lKnee = getLandmark(landmarks, 'leftKnee');
  const rKnee = getLandmark(landmarks, 'rightKnee');
  const lAnkle = getLandmark(landmarks, 'leftAnkle');
  const rAnkle = getLandmark(landmarks, 'rightAnkle');

  if (!lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure legs are visible'],
      score: 0,
      keypoints: {},
    };
  }

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const PUMP_KNEE_LOW_MAX = 110;
  const PUMP_KNEE_HIGH_MIN = 140;

  const currentState = avgKneeAngle < PUMP_KNEE_LOW_MAX ? 'LOW' : 'HIGH';

  if (previousState && currentState !== previousState) {
    // Transition detected - good pumping motion
    feedback.push('Good pumping motion!');
    score = 85;
  } else if (currentState === 'HIGH') {
    feedback.push('Action: Compress DOWN!');
    score = 50;
  } else {
    feedback.push('Action: Extend UP!');
    score = 50;
  }

  return {
    personDetected: true,
    confidence: 0.85,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Analyze tube stance drill
 * @param {PoseLandmarks} landmarks
 * @returns {PoseAnalysisResult}
 */
export function analyzeTubeStance(landmarks) {
  const feedback = [];
  let score = 0;

  const lHip = getLandmark(landmarks, 'leftHip');
  const rHip = getLandmark(landmarks, 'rightHip');
  const lKnee = getLandmark(landmarks, 'leftKnee');
  const rKnee = getLandmark(landmarks, 'rightKnee');
  const lAnkle = getLandmark(landmarks, 'leftAnkle');
  const rAnkle = getLandmark(landmarks, 'rightAnkle');
  const lShoulder = getLandmark(landmarks, 'leftShoulder');
  const rShoulder = getLandmark(landmarks, 'rightShoulder');

  if (!lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle || !lShoulder || !rShoulder) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure full body is visible'],
      score: 0,
      keypoints: {},
    };
  }

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const leftHipAngle = calculateAngle(lShoulder, lHip, lKnee);
  const rightHipAngle = calculateAngle(rShoulder, rHip, rKnee);
  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  const TUBE_KNEE_MAX = 90;
  const TUBE_HIP_MAX = 100;

  const kneesLow = avgKneeAngle < TUBE_KNEE_MAX;
  const hipsLow = avgHipAngle < TUBE_HIP_MAX;

  if (kneesLow && hipsLow) {
    feedback.push('GREAT TUBE STANCE!');
    score = 95;
  } else {
    if (!kneesLow) {
      const kneeDiff = avgKneeAngle - TUBE_KNEE_MAX;
      feedback.push(`Get LOWER! Bend knees ${Math.round(kneeDiff)}° more (current: ${Math.round(avgKneeAngle)}°, target: <${TUBE_KNEE_MAX}°)`);
    }
    if (!hipsLow) {
      const hipDiff = avgHipAngle - TUBE_HIP_MAX;
      feedback.push(`Crouch! Bring chest to knees! Lower hips ${Math.round(hipDiff)}° more (current: ${Math.round(avgHipAngle)}°, target: <${TUBE_HIP_MAX}°)`);
    }
    score = (kneesLow ? 50 : 0) + (hipsLow ? 45 : 0);
  }

  return {
    personDetected: true,
    confidence: 0.9,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Analyze falling drill
 * @param {PoseLandmarks} landmarks
 * @param {{x: number, y: number}} [previousHipMid]
 * @returns {PoseAnalysisResult}
 */
export function analyzeFalling(
  landmarks,
  previousHipMid
) {
  const feedback = [];
  let score = 0;

  const lHip = getLandmark(landmarks, 'leftHip');
  const rHip = getLandmark(landmarks, 'rightHip');
  const lWrist = getLandmark(landmarks, 'leftWrist');
  const rWrist = getLandmark(landmarks, 'rightWrist');
  const nose = getLandmark(landmarks, 'nose');

  if (!lHip || !rHip || !lWrist || !rWrist || !nose) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure hips, hands and head are visible'],
      score: 0,
      keypoints: {},
    };
  }

  const hipMid = {
    x: (lHip.x + rHip.x) / 2,
    y: (lHip.y + rHip.y) / 2,
  };

  let fallingDetected = false;
  if (previousHipMid) {
    const dx = Math.abs(hipMid.x - previousHipMid.x);
    const dy = hipMid.y - previousHipMid.y;
    if (dx > 0.06 || dy > 0.05) {
      fallingDetected = true;
    }
  }

  const leftDist = calculateDistance(lWrist, nose);
  const rightDist = calculateDistance(rWrist, nose);
  const handsCover = leftDist < 0.12 && rightDist < 0.12;

  if (fallingDetected && handsCover) {
    feedback.push('Safe fall: GOOD');
    score = 95;
  } else {
    if (!fallingDetected) {
      feedback.push('No falling motion detected');
    }
    if (!handsCover) {
      feedback.push('Cover your head!');
    }
    score = (fallingDetected ? 50 : 0) + (handsCover ? 45 : 0);
  }

  return {
    personDetected: true,
    confidence: 0.85,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Analyze cutback drill
 * @param {PoseLandmarks} landmarks
 * @returns {PoseAnalysisResult}
 */
export function analyzeCutback(landmarks) {
  const feedback = [];
  let score = 0;

  const lShoulder = getLandmark(landmarks, 'leftShoulder');
  const rShoulder = getLandmark(landmarks, 'rightShoulder');
  const lHip = getLandmark(landmarks, 'leftHip');
  const rHip = getLandmark(landmarks, 'rightHip');
  const nose = getLandmark(landmarks, 'nose');
  const lKnee = getLandmark(landmarks, 'leftKnee');
  const rKnee = getLandmark(landmarks, 'rightKnee');
  const lAnkle = getLandmark(landmarks, 'leftAnkle');
  const rAnkle = getLandmark(landmarks, 'rightAnkle');

  if (!lShoulder || !rShoulder || !lHip || !rHip || !nose || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['Ensure shoulders, hips, head and legs are visible'],
      score: 0,
      keypoints: {},
    };
  }

  // Calculate rotation angle
  const shAng = Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x);
  const hipAng = Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x);
  const rotDeg = Math.abs(((shAng - hipAng) * 180.0) / Math.PI);

  const hipMidX = (lHip.x + rHip.x) / 2;
  const noseAhead = Math.abs(nose.x - hipMidX) > 0.05;

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const avgKnee = (leftKneeAngle + rightKneeAngle) / 2;
  const STANCE_KNEE_MIN = 90;
  const STANCE_KNEE_MAX = 140;
  const stanceOk = avgKnee >= STANCE_KNEE_MIN && avgKnee <= STANCE_KNEE_MAX;

  if (rotDeg >= 10 && noseAhead && stanceOk) {
    feedback.push('GOOD CUTBACK!');
    score = 95;
  } else {
    if (rotDeg < 10) {
      feedback.push('Turn head and shoulders first!');
    }
    if (!noseAhead) {
      feedback.push('Lead with head toward the turn!');
    }
    if (!stanceOk) {
      feedback.push('Stay low and balanced!');
    }
    score = (rotDeg >= 10 ? 35 : 0) + (noseAhead ? 30 : 0) + (stanceOk ? 30 : 0);
  }

  return {
    personDetected: true,
    confidence: 0.9,
    feedback,
    score: Math.round(score),
    keypoints: {},
  };
}

/**
 * Main pose analysis function
 * @param {string} drillId
 * @param {PoseLandmarks} landmarks
 * @param {any} [previousData]
 * @returns {PoseAnalysisResult}
 */
export function analyzePose(
  drillId,
  landmarks,
  previousData
) {
  // First check if person is detected
  if (!isPersonDetected(landmarks)) {
    return {
      personDetected: false,
      confidence: 0,
      feedback: ['No person detected. Step into view.'],
      score: 0,
      keypoints: {},
    };
  }

  // Route to specific drill analysis
  switch (drillId) {
    case 'stance':
      return analyzeStance(landmarks);
    case 'popup':
      return analyzePopUp(landmarks, previousData?.stage);
    case 'paddling':
      return analyzePaddling(landmarks);
    case 'bottom_turn':
      return analyzeBottomTurn(landmarks);
    case 'pumping':
      return analyzePumping(landmarks, previousData?.pumpState);
    case 'tube_stance':
      return analyzeTubeStance(landmarks);
    case 'falling':
      return analyzeFalling(landmarks, previousData?.hipMid);
    case 'cutback':
      return analyzeCutback(landmarks);
    default:
      return {
        personDetected: true,
        confidence: 0.5,
        feedback: ['Drill analysis not available'],
        score: 0,
        keypoints: {},
      };
  }
}

