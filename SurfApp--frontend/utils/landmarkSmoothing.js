/**
 * Landmark Smoothing Utility
 * Implements moving average filter to reduce jitter in pose landmarks
 */

import { PoseLandmarks, PoseLandmark } from './poseDetection.js';

/**
 * @typedef {Object} SmoothingBuffer
 * @property {PoseLandmark[]} points
 * @property {number} maxSize
 */

// Global smoothing buffers for each landmark key
const smoothingBuffers = new Map();

/**
 * Initialize smoothing buffer for a landmark key
 * @param {string} key
 * @param {number} [maxSize=5]
 * @returns {SmoothingBuffer}
 */
function initBuffer(key, maxSize = 5) {
  if (!smoothingBuffers.has(key)) {
    smoothingBuffers.set(key, {
      points: [],
      maxSize,
    });
  }
  return smoothingBuffers.get(key);
}

/**
 * Apply moving average filter to a single landmark point
 * @param {string} key
 * @param {PoseLandmark|null|undefined} current
 * @param {number} [alpha=0.4] - Smoothing factor (0.0 = no smoothing, 1.0 = full smoothing)
 * @returns {PoseLandmark|null}
 */
function smoothLandmark(key, current, alpha = 0.4) {
  if (!current) {
    return null;
  }

  const buffer = initBuffer(key, 5);
  
  // Add current to buffer
  buffer.points.push(current);
  
  // Keep buffer size limited
  if (buffer.points.length > buffer.maxSize) {
    buffer.points.shift();
  }

  // If buffer is too small, return current
  if (buffer.points.length < 2) {
    return current;
  }

  // Calculate moving average
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let sumVisibility = 0;
  let count = 0;

  for (const point of buffer.points) {
    if (point && point.x !== undefined && point.y !== undefined) {
      sumX += point.x;
      sumY += point.y;
      sumZ += point.z || 0;
      sumVisibility += point.visibility || 1.0;
      count++;
    }
  }

  if (count === 0) {
    return current;
  }

  // Calculate average
  const avgX = sumX / count;
  const avgY = sumY / count;
  const avgZ = sumZ / count;
  const avgVisibility = sumVisibility / count;

  // Exponential moving average (EMA) - blend current with average
  return {
    x: current.x * (1 - alpha) + avgX * alpha,
    y: current.y * (1 - alpha) + avgY * alpha,
    z: (current.z || 0) * (1 - alpha) + avgZ * alpha,
    visibility: (current.visibility || 1.0) * (1 - alpha) + avgVisibility * alpha,
  };
}

/**
 * Apply smoothing to all landmarks in a pose
 * @param {PoseLandmarks} landmarks
 * @param {number} [alpha=0.3]
 * @returns {PoseLandmarks}
 */
export function smoothLandmarks(landmarks, alpha = 0.3) {
  const smoothed = {};

  // Smooth each landmark
  const keys = [
    'nose',
    'leftEye',
    'rightEye',
    'leftEar',
    'rightEar',
    'leftShoulder',
    'rightShoulder',
    'leftElbow',
    'rightElbow',
    'leftWrist',
    'rightWrist',
    'leftHip',
    'rightHip',
    'leftKnee',
    'rightKnee',
    'leftAnkle',
    'rightAnkle',
  ];

  for (const key of keys) {
    const original = landmarks[key];
    smoothed[key] = smoothLandmark(key, original, alpha);
  }

  return smoothed;
}

/**
 * Clear all smoothing buffers (useful when switching drills or resetting)
 */
export function clearSmoothingBuffers() {
  smoothingBuffers.clear();
}

