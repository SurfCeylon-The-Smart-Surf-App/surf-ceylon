/**
 * Kinematics Utilities
 * Enhanced 3D angle calculations and body metrics for pose analysis
 */

import { PoseLandmarks, PoseLandmark } from './poseDetection.js';

/**
 * @typedef {Object} BodyMetrics
 * @property {{left: number, right: number, average: number}} kneeAngles
 * @property {{left: number, right: number, average: number}} hipAngles
 * @property {{left: number, right: number}} elbowAngles
 * @property {number} shoulderRotation - Degrees of rotation
 * @property {{forward: number, lateral: number}} bodyLean - Positive = leaning forward/right
 * @property {{x: number, y: number, z: number}} centerOfMass
 */

/**
 * @typedef {Object} VelocityVector
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} magnitude
 */

/**
 * Calculate 3D angle between three points
 * Uses x, y, z coordinates for true 3D angle calculation
 * @param {PoseLandmark} p1
 * @param {PoseLandmark} p2
 * @param {PoseLandmark} p3
 * @returns {number}
 */
export function calculate3DAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) {
    return 0;
  }

  // Create vectors from p2 to p1 and p2 to p3
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: (p1.z || 0) - (p2.z || 0),
  };
  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: (p3.z || 0) - (p2.z || 0),
  };

  // Calculate dot product
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  // Calculate magnitudes
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  // Calculate angle in radians, then convert to degrees
  const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
  return (angleRad * 180) / Math.PI;
}

/**
 * Calculate 2D angle between three points (for backward compatibility)
 * @param {PoseLandmark} p1
 * @param {PoseLandmark} p2
 * @param {PoseLandmark} p3
 * @returns {number}
 */
export function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) {
    return 0;
  }

  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) -
    Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  return angle > 180.0 ? 360 - angle : angle;
}

/**
 * Calculate joint velocity from previous and current positions
 * @param {{x: number, y: number, z?: number}} currentPos
 * @param {{x: number, y: number, z?: number}} previousPos
 * @param {number} timeDelta - seconds
 * @returns {VelocityVector}
 */
export function calculateJointVelocity(currentPos, previousPos, timeDelta) {
  if (timeDelta <= 0) {
    return { x: 0, y: 0, z: 0, magnitude: 0 };
  }

  const dx = currentPos.x - previousPos.x;
  const dy = currentPos.y - previousPos.y;
  const dz = (currentPos.z || 0) - (previousPos.z || 0);

  const vx = dx / timeDelta;
  const vy = dy / timeDelta;
  const vz = dz / timeDelta;

  const magnitude = Math.sqrt(vx ** 2 + vy ** 2 + vz ** 2);

  return { x: vx, y: vy, z: vz, magnitude };
}

/**
 * Calculate comprehensive body metrics from landmarks
 * @param {PoseLandmarks} landmarks
 * @returns {BodyMetrics|null}
 */
export function calculateBodyMetrics(landmarks) {
  if (!landmarks) {
    return null;
  }

  // Knee angles (hip-knee-ankle)
  const leftKneeAngle = landmarks.leftHip && landmarks.leftKnee && landmarks.leftAnkle
    ? calculate3DAngle(landmarks.leftHip, landmarks.leftKnee, landmarks.leftAnkle)
    : 0;
  const rightKneeAngle = landmarks.rightHip && landmarks.rightKnee && landmarks.rightAnkle
    ? calculate3DAngle(landmarks.rightHip, landmarks.rightKnee, landmarks.rightAnkle)
    : 0;

  // Hip angles (shoulder-hip-knee)
  const leftHipAngle = landmarks.leftShoulder && landmarks.leftHip && landmarks.leftKnee
    ? calculate3DAngle(landmarks.leftShoulder, landmarks.leftHip, landmarks.leftKnee)
    : 0;
  const rightHipAngle = landmarks.rightShoulder && landmarks.rightHip && landmarks.rightKnee
    ? calculate3DAngle(landmarks.rightShoulder, landmarks.rightHip, landmarks.rightKnee)
    : 0;

  // Elbow angles (shoulder-elbow-wrist)
  const leftElbowAngle = landmarks.leftShoulder && landmarks.leftElbow && landmarks.leftWrist
    ? calculate3DAngle(landmarks.leftShoulder, landmarks.leftElbow, landmarks.leftWrist)
    : 0;
  const rightElbowAngle = landmarks.rightShoulder && landmarks.rightElbow && landmarks.rightWrist
    ? calculate3DAngle(landmarks.rightShoulder, landmarks.rightElbow, landmarks.rightWrist)
    : 0;

  // Shoulder rotation (angle between shoulder line and horizontal)
  let shoulderRotation = 0;
  if (landmarks.leftShoulder && landmarks.rightShoulder) {
    const shoulderAngle = Math.atan2(
      landmarks.rightShoulder.y - landmarks.leftShoulder.y,
      landmarks.rightShoulder.x - landmarks.leftShoulder.x
    );
    shoulderRotation = Math.abs((shoulderAngle * 180) / Math.PI);
    if (shoulderRotation > 90) {
      shoulderRotation = 180 - shoulderRotation;
    }
  }

  // Body lean (forward/backward and lateral)
  let bodyLean = { forward: 0, lateral: 0 };
  if (landmarks.leftShoulder && landmarks.rightShoulder && landmarks.leftHip && landmarks.rightHip) {
    const avgShoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
    const avgHipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
    const avgShoulderX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2;
    const avgHipX = (landmarks.leftHip.x + landmarks.rightHip.x) / 2;

    // Forward lean: difference in Y (positive = leaning forward)
    bodyLean.forward = avgShoulderY - avgHipY;

    // Lateral lean: difference in X (positive = leaning right)
    bodyLean.lateral = avgShoulderX - avgHipX;
  }

  // Center of mass (weighted average of major body parts)
  let centerOfMass = { x: 0, y: 0, z: 0 };
  const keyPoints = [
    landmarks.nose,
    landmarks.leftShoulder,
    landmarks.rightShoulder,
    landmarks.leftHip,
    landmarks.rightHip,
    landmarks.leftKnee,
    landmarks.rightKnee,
  ].filter(Boolean);

  if (keyPoints.length > 0) {
    const sumX = keyPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = keyPoints.reduce((sum, p) => sum + p.y, 0);
    const sumZ = keyPoints.reduce((sum, p) => sum + (p.z || 0), 0);
    centerOfMass = {
      x: sumX / keyPoints.length,
      y: sumY / keyPoints.length,
      z: sumZ / keyPoints.length,
    };
  }

  return {
    kneeAngles: {
      left: leftKneeAngle,
      right: rightKneeAngle,
      average: (leftKneeAngle + rightKneeAngle) / 2,
    },
    hipAngles: {
      left: leftHipAngle,
      right: rightHipAngle,
      average: (leftHipAngle + rightHipAngle) / 2,
    },
    elbowAngles: {
      left: leftElbowAngle,
      right: rightElbowAngle,
    },
    shoulderRotation,
    bodyLean,
    centerOfMass,
  };
}

/**
 * Calculate knee angle (hip-knee-ankle)
 * @param {PoseLandmark} hip
 * @param {PoseLandmark} knee
 * @param {PoseLandmark} ankle
 * @returns {number}
 */
export function calculateKneeAngle(hip, knee, ankle) {
  return calculate3DAngle(hip, knee, ankle);
}

/**
 * Calculate hip angle (shoulder-hip-knee)
 * @param {PoseLandmark} shoulder
 * @param {PoseLandmark} hip
 * @param {PoseLandmark} knee
 * @returns {number}
 */
export function calculateHipAngle(shoulder, hip, knee) {
  return calculate3DAngle(shoulder, hip, knee);
}

/**
 * Get angle difference from target
 * Returns positive if current > target, negative if current < target
 * @param {number} currentAngle
 * @param {number} targetAngle
 * @returns {number}
 */
export function getAngleDifference(currentAngle, targetAngle) {
  return currentAngle - targetAngle;
}

