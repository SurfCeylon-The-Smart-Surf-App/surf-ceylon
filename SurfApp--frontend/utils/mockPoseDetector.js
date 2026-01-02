/**
 * Mock Pose Detector
 * Simulates MediaPipe pose detection for React Native
 * In production, this would be replaced with actual MediaPipe integration
 */

import { PoseLandmarks, PoseLandmark } from './poseDetection.js';

/**
 * Generate mock pose landmarks based on camera frame
 * This simulates what MediaPipe would return
 * 
 * IMPORTANT: In production, this should be replaced with actual MediaPipe integration
 * For now, this simulates realistic pose detection with proper visibility checks
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {boolean} [hasPerson=true]
 * @returns {PoseLandmarks|null}
 */
export function generateMockLandmarks(
  frameWidth,
  frameHeight,
  hasPerson = true
) {
  // Strict check: if no person should be detected, return null immediately
  // 0% chance to detect if no person visible
  if (!hasPerson) {
    return null;
  }
  
  // Simulate occasional detection failures (3% chance) for realism
  // In real MediaPipe, this would happen when person is not fully visible
  if (Math.random() < 0.03) {
    return null;
  }

  // Simulate a person in the center of the frame
  const centerX = 0.5;
  const centerY = 0.5;
  const personHeight = 0.6; // 60% of frame height
  const personWidth = 0.3; // 30% of frame width

  // Generate realistic landmark positions
  const landmarks = {
    // Face
    nose: {
      x: centerX,
      y: centerY - personHeight * 0.3,
      visibility: 0.9,
    },
    leftEye: {
      x: centerX - 0.02,
      y: centerY - personHeight * 0.32,
      visibility: 0.85,
    },
    rightEye: {
      x: centerX + 0.02,
      y: centerY - personHeight * 0.32,
      visibility: 0.85,
    },
    leftEar: {
      x: centerX - 0.04,
      y: centerY - personHeight * 0.3,
      visibility: 0.8,
    },
    rightEar: {
      x: centerX + 0.04,
      y: centerY - personHeight * 0.3,
      visibility: 0.8,
    },

    // Upper body
    leftShoulder: {
      x: centerX - personWidth * 0.4,
      y: centerY - personHeight * 0.15,
      visibility: 0.9,
    },
    rightShoulder: {
      x: centerX + personWidth * 0.4,
      y: centerY - personHeight * 0.15,
      visibility: 0.9,
    },
    leftElbow: {
      x: centerX - personWidth * 0.5,
      y: centerY,
      visibility: 0.85,
    },
    rightElbow: {
      x: centerX + personWidth * 0.5,
      y: centerY,
      visibility: 0.85,
    },
    leftWrist: {
      x: centerX - personWidth * 0.45,
      y: centerY + personHeight * 0.15,
      visibility: 0.8,
    },
    rightWrist: {
      x: centerX + personWidth * 0.45,
      y: centerY + personHeight * 0.15,
      visibility: 0.8,
    },

    // Torso
    leftHip: {
      x: centerX - personWidth * 0.25,
      y: centerY + personHeight * 0.2,
      visibility: 0.9,
    },
    rightHip: {
      x: centerX + personWidth * 0.25,
      y: centerY + personHeight * 0.2,
      visibility: 0.9,
    },

    // Lower body
    leftKnee: {
      x: centerX - personWidth * 0.2,
      y: centerY + personHeight * 0.5,
      visibility: 0.85,
    },
    rightKnee: {
      x: centerX + personWidth * 0.2,
      y: centerY + personHeight * 0.5,
      visibility: 0.85,
    },
    leftAnkle: {
      x: centerX - personWidth * 0.15,
      y: centerY + personHeight * 0.8,
      visibility: 0.8,
    },
    rightAnkle: {
      x: centerX + personWidth * 0.15,
      y: centerY + personHeight * 0.8,
      visibility: 0.8,
    },
  };

  return landmarks;
}

/**
 * Add realistic variation to landmarks to simulate movement
 * @param {PoseLandmarks} landmarks
 * @param {number} [variationAmount=0.02]
 * @returns {PoseLandmarks}
 */
export function addVariation(
  landmarks,
  variationAmount = 0.02
) {
  const varied = { ...landmarks };

  Object.keys(varied).forEach((key) => {
    const landmark = varied[key];
    if (landmark) {
      const variation = (Math.random() - 0.5) * variationAmount;
      landmark.x += variation;
      landmark.y += variation * 0.5; // Less vertical variation
    }
  });

  return varied;
}

/**
 * Simulate different poses for different drills
 * @param {PoseLandmarks} landmarks
 * @param {string} drillId
 * @returns {PoseLandmarks}
 */
export function adjustLandmarksForDrill(
  landmarks,
  drillId
) {
  const adjusted = { ...landmarks };

  switch (drillId) {
    case 'stance':
      // Slight knee bend, balanced stance
      if (adjusted.leftKnee && adjusted.leftHip && adjusted.leftAnkle) {
        adjusted.leftKnee.y = adjusted.leftHip.y + (adjusted.leftAnkle.y - adjusted.leftHip.y) * 0.6;
      }
      if (adjusted.rightKnee && adjusted.rightHip && adjusted.rightAnkle) {
        adjusted.rightKnee.y = adjusted.rightHip.y + (adjusted.rightAnkle.y - adjusted.rightHip.y) * 0.6;
      }
      break;

    case 'popup':
      // Lower body position (lying down)
      if (adjusted.leftHip) adjusted.leftHip.y += 0.1;
      if (adjusted.rightHip) adjusted.rightHip.y += 0.1;
      break;

    case 'paddling':
      // Arch back, head up
      if (adjusted.leftShoulder) adjusted.leftShoulder.y -= 0.05;
      if (adjusted.rightShoulder) adjusted.rightShoulder.y -= 0.05;
      if (adjusted.nose) adjusted.nose.y -= 0.08;
      break;

    case 'bottom_turn':
      // Deep knee bend, rotated
      if (adjusted.leftKnee && adjusted.leftHip && adjusted.leftAnkle) {
        adjusted.leftKnee.y = adjusted.leftHip.y + (adjusted.leftAnkle.y - adjusted.leftHip.y) * 0.4;
      }
      if (adjusted.rightKnee && adjusted.rightHip && adjusted.rightAnkle) {
        adjusted.rightKnee.y = adjusted.rightHip.y + (adjusted.rightAnkle.y - adjusted.rightHip.y) * 0.4;
      }
      if (adjusted.leftShoulder) adjusted.leftShoulder.x -= 0.05;
      if (adjusted.rightShoulder) adjusted.rightShoulder.x -= 0.05;
      break;

    case 'tube_stance':
      // Very deep crouch
      if (adjusted.leftKnee && adjusted.leftHip && adjusted.leftAnkle) {
        adjusted.leftKnee.y = adjusted.leftHip.y + (adjusted.leftAnkle.y - adjusted.leftHip.y) * 0.3;
      }
      if (adjusted.rightKnee && adjusted.rightHip && adjusted.rightAnkle) {
        adjusted.rightKnee.y = adjusted.rightHip.y + (adjusted.rightAnkle.y - adjusted.rightHip.y) * 0.3;
      }
      if (adjusted.leftHip) adjusted.leftHip.y += 0.1;
      if (adjusted.rightHip) adjusted.rightHip.y += 0.1;
      break;

    case 'falling':
      // Hands near head
      if (adjusted.leftWrist && adjusted.nose) {
        adjusted.leftWrist.x = adjusted.nose.x - 0.03;
        adjusted.leftWrist.y = adjusted.nose.y - 0.02;
      }
      if (adjusted.rightWrist && adjusted.nose) {
        adjusted.rightWrist.x = adjusted.nose.x + 0.03;
        adjusted.rightWrist.y = adjusted.nose.y - 0.02;
      }
      break;

    case 'cutback':
      // Rotated shoulders
      if (adjusted.leftShoulder) adjusted.leftShoulder.x -= 0.08;
      if (adjusted.rightShoulder) adjusted.rightShoulder.x -= 0.08;
      if (adjusted.nose) adjusted.nose.x -= 0.05;
      break;
  }

  return adjusted;
}

