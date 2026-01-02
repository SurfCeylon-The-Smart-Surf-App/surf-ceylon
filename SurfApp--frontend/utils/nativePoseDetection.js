/**
 * Native Pose Detection Utilities
 * Translates raw ML Kit indices (0-32) into semantic body parts.
 */

// Standard MediaPipe/ML Kit Pose Landmark Indices
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Robust converter for Native Pose results
 * Handles both Array (Index-based) and Object (Key-based) formats
 */
export function convertNativePoseToLandmarks(nativePose) {
  if (!nativePose) return null;

  // 1. Handle different plugin output structures
  let rawLandmarks = nativePose;
  if (nativePose.landmarks) rawLandmarks = nativePose.landmarks;
  
  // If it's empty, return null
  if (Array.isArray(rawLandmarks) && rawLandmarks.length === 0) return null;
  
  // 2. Helper to extract point based on format
  const getPoint = (source, index, name) => {
    let pt;
    
    if (Array.isArray(source)) {
      // It's an array, access by index
      pt = source[index];
    } else if (source && typeof source === 'object') {
      // It's an object, try accessing by name or index
      pt = source[name] || source[index];
    }

    if (!pt) return undefined;

    // Normalize x/y if they are not already 0-1 (optional check)
    // Most VisionCamera plugins return normalized 0-1 coords. 
    // If x > 1, it's pixel coords, but our UI handles scaling.
    return {
      x: pt.x,
      y: pt.y,
      z: pt.z || 0,
      visibility: pt.visibility || (pt.inFrameConfidence ? pt.inFrameConfidence : 1.0)
    };
  };

  // 3. Map to Surf App Format
  return {
    nose: getPoint(rawLandmarks, POSE_LANDMARKS.NOSE, 'nose'),
    leftEye: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_EYE, 'leftEye'),
    rightEye: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_EYE, 'rightEye'),
    leftEar: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_EAR, 'leftEar'),
    rightEar: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_EAR, 'rightEar'),
    leftShoulder: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_SHOULDER, 'leftShoulder'),
    rightShoulder: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_SHOULDER, 'rightShoulder'),
    leftElbow: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_ELBOW, 'leftElbow'),
    rightElbow: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_ELBOW, 'rightElbow'),
    leftWrist: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_WRIST, 'leftWrist'),
    rightWrist: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_WRIST, 'rightWrist'),
    leftHip: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_HIP, 'leftHip'),
    rightHip: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_HIP, 'rightHip'),
    leftKnee: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_KNEE, 'leftKnee'),
    rightKnee: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_KNEE, 'rightKnee'),
    leftAnkle: getPoint(rawLandmarks, POSE_LANDMARKS.LEFT_ANKLE, 'leftAnkle'),
    rightAnkle: getPoint(rawLandmarks, POSE_LANDMARKS.RIGHT_ANKLE, 'rightAnkle'),
  };
}

export function calculateStabilityScore(landmarks) {
  if (!landmarks) return 0.0;
  return 1.0; 
}

export const DEFAULT_POSE_OPTIONS = {
  mode: 'stream',
  detectMode: 'stream',
  modelComplexity: 1, 
};