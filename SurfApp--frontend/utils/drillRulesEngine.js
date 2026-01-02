/**
 * Drill-Specific Rules Engine
 * Physics-based checks and correction messages for each drill
 */

import { BodyMetrics, getAngleDifference } from './kinematics.js';
import { PoseLandmarks } from './poseDetection.js';

/**
 * @typedef {Object} DrillRule
 * @property {string} id
 * @property {string} name
 * @property {function(BodyMetrics, PoseLandmarks, any): RuleResult} check
 * @property {number} priority
 */

/**
 * @typedef {Object} RuleResult
 * @property {boolean} passed
 * @property {string} message
 * @property {('error'|'warning'|'info'|'success')} severity
 * @property {number} [targetAngle]
 * @property {number} [currentAngle]
 * @property {string} [correction] - e.g., "Bend knees 15° more"
 */

/**
 * Stance Drill Rules
 * @returns {DrillRule[]}
 */
export function getStanceRules() {
  const STANCE_KNEE_MIN = 90;
  const STANCE_KNEE_MAX = 140;
  const STANCE_HIP_MIN = 140;
  const STANCE_HIP_MAX = 170;
  const STANCE_SHOULDER_LEVEL_TOLERANCE = 5; // degrees

  return [
    {
      id: 'stance_knee_angle',
      name: 'Knee Bend',
      priority: 3,
      check: (metrics) => {
        const kneeAngle = metrics.kneeAngles.average;
        const diff = getAngleDifference(kneeAngle, (STANCE_KNEE_MIN + STANCE_KNEE_MAX) / 2);

        if (kneeAngle >= STANCE_KNEE_MIN && kneeAngle <= STANCE_KNEE_MAX) {
          return {
            passed: true,
            message: 'Knee angle perfect!',
            severity: 'success',
            targetAngle: (STANCE_KNEE_MIN + STANCE_KNEE_MAX) / 2,
            currentAngle: kneeAngle,
          };
        } else if (kneeAngle > STANCE_KNEE_MAX) {
          const correctionDeg = Math.round(kneeAngle - STANCE_KNEE_MAX);
          return {
            passed: false,
            message: `Lower your hips, bend knees ${correctionDeg}° more`,
            severity: 'error',
            targetAngle: STANCE_KNEE_MAX,
            currentAngle: kneeAngle,
            correction: `Bend knees ${correctionDeg}° more`,
          };
        } else {
          const correctionDeg = Math.round(STANCE_KNEE_MIN - kneeAngle);
          return {
            passed: false,
            message: `Stand up slightly, knees too bent (${correctionDeg}° less)`,
            severity: 'warning',
            targetAngle: STANCE_KNEE_MIN,
            currentAngle: kneeAngle,
            correction: `Straighten knees ${correctionDeg}°`,
          };
        }
      },
    },
    {
      id: 'stance_hip_angle',
      name: 'Hip Hinge',
      priority: 3,
      check: (metrics) => {
        const hipAngle = metrics.hipAngles.average;
        const diff = getAngleDifference(hipAngle, (STANCE_HIP_MIN + STANCE_HIP_MAX) / 2);

        if (hipAngle >= STANCE_HIP_MIN && hipAngle <= STANCE_HIP_MAX) {
          return {
            passed: true,
            message: 'Hip angle perfect!',
            severity: 'success',
            targetAngle: (STANCE_HIP_MIN + STANCE_HIP_MAX) / 2,
            currentAngle: hipAngle,
          };
        } else if (hipAngle > STANCE_HIP_MAX) {
          const correctionDeg = Math.round(hipAngle - STANCE_HIP_MAX);
          return {
            passed: false,
            message: `Hinge at hips more, lean forward ${correctionDeg}°`,
            severity: 'error',
            targetAngle: STANCE_HIP_MAX,
            currentAngle: hipAngle,
            correction: `Lean forward ${correctionDeg}° more`,
          };
        } else {
          const correctionDeg = Math.round(STANCE_HIP_MIN - hipAngle);
          return {
            passed: false,
            message: `Straighten up slightly (${correctionDeg}° more upright)`,
            severity: 'warning',
            targetAngle: STANCE_HIP_MIN,
            currentAngle: hipAngle,
            correction: `Straighten ${correctionDeg}°`,
          };
        }
      },
    },
    {
      id: 'stance_shoulder_level',
      name: 'Shoulder Level',
      priority: 2,
      check: (metrics, landmarks) => {
        if (!landmarks.leftShoulder || !landmarks.rightShoulder) {
          return {
            passed: false,
            message: 'Ensure shoulders are visible',
            severity: 'error',
          };
        }

        const shoulderDiff = Math.abs(landmarks.leftShoulder.y - landmarks.rightShoulder.y);
        const shoulderDiffDeg = shoulderDiff * 180; // Rough conversion

        if (shoulderDiffDeg < STANCE_SHOULDER_LEVEL_TOLERANCE) {
          return {
            passed: true,
            message: 'Shoulders level',
            severity: 'success',
          };
        } else {
          return {
            passed: false,
            message: `Level your shoulders (${Math.round(shoulderDiffDeg)}° off)`,
            severity: 'warning',
            correction: 'Level your shoulders',
          };
        }
      },
    },
    {
      id: 'stance_balance',
      name: 'Weight Balance',
      priority: 1,
      check: (metrics, landmarks) => {
        if (!landmarks.leftAnkle || !landmarks.rightAnkle) {
          return {
            passed: false,
            message: 'Ensure feet are visible',
            severity: 'error',
          };
        }

        const centerX = metrics.centerOfMass.x;
        const ankleMidX = ((landmarks.leftAnkle.x + landmarks.rightAnkle.x) / 2);
        const balanceOffset = Math.abs(centerX - ankleMidX);

        if (balanceOffset < 0.05) {
          return {
            passed: true,
            message: 'Weight balanced',
            severity: 'success',
          };
        } else {
          const side = centerX > ankleMidX ? 'right' : 'left';
          return {
            passed: false,
            message: `Shift weight to ${side} foot`,
            severity: 'warning',
            correction: `Balance weight on ${side} foot`,
          };
        }
      },
    },
  ];
}

/**
 * Pop-Up Drill Rules
 * @returns {DrillRule[]}
 */
export function getPopUpRules() {
  const PUSH_ELBOW_MAX = 100;
  const DOWN_HIP_MIN = 160;
  const STANCE_KNEE_MIN = 90;
  const STANCE_KNEE_MAX = 140;
  const POPUP_VELOCITY_THRESHOLD = 0.3; // normalized units per second

  return [
    {
      id: 'popup_down_phase',
      name: 'Down Phase',
      priority: 3,
      check: (metrics, landmarks, previousState) => {
        const hipAngle = metrics.hipAngles.average;
        if (hipAngle > DOWN_HIP_MIN) {
          return {
            passed: true,
            message: 'Good start position! Now push up!',
            severity: 'success',
          };
        } else {
          return {
            passed: false,
            message: 'Straighten your body, lie flat',
            severity: 'error',
            correction: 'Lie flat on the ground',
          };
        }
      },
    },
    {
      id: 'popup_push_phase',
      name: 'Push Phase',
      priority: 3,
      check: (metrics, landmarks, previousState) => {
        const elbowAngle = Math.min(metrics.elbowAngles.left, metrics.elbowAngles.right);
        if (elbowAngle < PUSH_ELBOW_MAX) {
          return {
            passed: true,
            message: 'Great push! Now jump to your feet!',
            severity: 'success',
          };
        } else {
          const correctionDeg = Math.round(elbowAngle - PUSH_ELBOW_MAX);
          return {
            passed: false,
            message: `Push harder! Bend elbows ${correctionDeg}° more`,
            severity: 'error',
            targetAngle: PUSH_ELBOW_MAX,
            currentAngle: elbowAngle,
            correction: `Push ${correctionDeg}° more`,
          };
        }
      },
    },
    {
      id: 'popup_velocity',
      name: 'Pop-Up Speed',
      priority: 2,
      check: (metrics, landmarks, previousState) => {
        // This requires velocity tracking from previous frames
        // For now, check if in stance position (landed)
        const kneeAngle = metrics.kneeAngles.average;
        if (kneeAngle >= STANCE_KNEE_MIN && kneeAngle <= STANCE_KNEE_MAX) {
          return {
            passed: true,
            message: 'Perfect landing!',
            severity: 'success',
          };
        } else {
          return {
            passed: false,
            message: 'Faster pop-up! Explode upward',
            severity: 'warning',
            correction: 'Move faster',
          };
        }
      },
    },
    {
      id: 'popup_landing',
      name: 'Landing Stance',
      priority: 3,
      check: (metrics) => {
        const kneeAngle = metrics.kneeAngles.average;
        if (kneeAngle >= STANCE_KNEE_MIN && kneeAngle <= STANCE_KNEE_MAX) {
          return {
            passed: true,
            message: 'Perfect landing stance!',
            severity: 'success',
            targetAngle: (STANCE_KNEE_MIN + STANCE_KNEE_MAX) / 2,
            currentAngle: kneeAngle,
          };
        } else {
          return {
            passed: false,
            message: 'Bend your knees more for landing',
            severity: 'error',
            targetAngle: (STANCE_KNEE_MIN + STANCE_KNEE_MAX) / 2,
            currentAngle: kneeAngle,
            correction: 'Bend knees more',
          };
        }
      },
    },
  ];
}

/**
 * Paddling Drill Rules
 * @returns {DrillRule[]}
 */
export function getPaddlingRules() {
  const PADDLE_ARCH_MAX = 165;

  return [
    {
      id: 'paddle_back_arch',
      name: 'Back Arch',
      priority: 3,
      check: (metrics, landmarks) => {
        // Back arch angle (ear-shoulder-hip)
        if (!landmarks.leftEar || !landmarks.leftShoulder || !landmarks.leftHip) {
          return {
            passed: false,
            message: 'Ensure head and torso are visible',
            severity: 'error',
          };
        }

        // Simplified: use hip angle as proxy for back arch
        const hipAngle = metrics.hipAngles.average;
        if (hipAngle < PADDLE_ARCH_MAX) {
          return {
            passed: true,
            message: 'Good back arch!',
            severity: 'success',
            targetAngle: PADDLE_ARCH_MAX,
            currentAngle: hipAngle,
          };
        } else {
          const correctionDeg = Math.round(hipAngle - PADDLE_ARCH_MAX);
          return {
            passed: false,
            message: `Lift your chest and head! Arch back ${correctionDeg}° more`,
            severity: 'error',
            targetAngle: PADDLE_ARCH_MAX,
            currentAngle: hipAngle,
            correction: `Arch back ${correctionDeg}° more`,
          };
        }
      },
    },
    {
      id: 'paddle_head_up',
      name: 'Head Position',
      priority: 2,
      check: (metrics, landmarks) => {
        if (!landmarks.nose || !landmarks.leftShoulder || !landmarks.rightShoulder) {
          return {
            passed: false,
            message: 'Ensure head and shoulders are visible',
            severity: 'error',
          };
        }

        const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
        const headIsUp = landmarks.nose.y < shoulderY;

        if (headIsUp) {
          return {
            passed: true,
            message: 'Head up, looking forward!',
            severity: 'success',
          };
        } else {
          return {
            passed: false,
            message: 'Look forward! Lift your head',
            severity: 'error',
            correction: 'Lift head and look forward',
          };
        }
      },
    },
  ];
}

/**
 * Bottom Turn Drill Rules
 * @returns {DrillRule[]}
 */
export function getBottomTurnRules() {
  const TURN_KNEE_MAX = 120;
  const TURN_SHOULDER_ROTATION_MIN = 10; // degrees

  return [
    {
      id: 'turn_knee_compression',
      name: 'Knee Compression',
      priority: 3,
      check: (metrics) => {
        const kneeAngle = metrics.kneeAngles.average;
        if (kneeAngle < TURN_KNEE_MAX) {
          return {
            passed: true,
            message: 'Good compression!',
            severity: 'success',
            targetAngle: TURN_KNEE_MAX,
            currentAngle: kneeAngle,
          };
        } else {
          const correctionDeg = Math.round(kneeAngle - TURN_KNEE_MAX);
          return {
            passed: false,
            message: `Bend knees DEEPER! Compress ${correctionDeg}° more`,
            severity: 'error',
            targetAngle: TURN_KNEE_MAX,
            currentAngle: kneeAngle,
            correction: `Bend knees ${correctionDeg}° more`,
          };
        }
      },
    },
    {
      id: 'turn_shoulder_rotation',
      name: 'Shoulder Rotation',
      priority: 3,
      check: (metrics) => {
        if (metrics.shoulderRotation >= TURN_SHOULDER_ROTATION_MIN) {
          return {
            passed: true,
            message: 'Good rotation!',
            severity: 'success',
            targetAngle: TURN_SHOULDER_ROTATION_MIN,
            currentAngle: metrics.shoulderRotation,
          };
        } else {
          const correctionDeg = Math.round(TURN_SHOULDER_ROTATION_MIN - metrics.shoulderRotation);
          return {
            passed: false,
            message: `Rotate shoulders more! Turn ${correctionDeg}° more`,
            severity: 'error',
            targetAngle: TURN_SHOULDER_ROTATION_MIN,
            currentAngle: metrics.shoulderRotation,
            correction: `Rotate ${correctionDeg}° more`,
          };
        }
      },
    },
  ];
}

/**
 * Pumping Drill Rules
 * @returns {DrillRule[]}
 */
export function getPumpingRules() {
  const PUMP_KNEE_LOW_MAX = 110;
  const PUMP_KNEE_HIGH_MIN = 140;

  return [
    {
      id: 'pump_compression',
      name: 'Compression Phase',
      priority: 3,
      check: (metrics, landmarks, previousState) => {
        const kneeAngle = metrics.kneeAngles.average;
        const pumpState = previousState?.pumpState || 'HIGH';

        if (pumpState === 'HIGH') {
          // Should compress down
          if (kneeAngle < PUMP_KNEE_LOW_MAX) {
            return {
              passed: true,
              message: 'Good compression!',
              severity: 'success',
              targetAngle: PUMP_KNEE_LOW_MAX,
              currentAngle: kneeAngle,
            };
          } else {
            return {
              passed: false,
              message: 'Compress DOWN! Bend knees more',
              severity: 'error',
              targetAngle: PUMP_KNEE_LOW_MAX,
              currentAngle: kneeAngle,
              correction: 'Bend knees more',
            };
          }
        } else {
          // Should extend up
          if (kneeAngle > PUMP_KNEE_HIGH_MIN) {
            return {
              passed: true,
              message: 'Good extension!',
              severity: 'success',
              targetAngle: PUMP_KNEE_HIGH_MIN,
              currentAngle: kneeAngle,
            };
          } else {
            return {
              passed: false,
              message: 'Extend UP! Straighten legs',
              severity: 'error',
              targetAngle: PUMP_KNEE_HIGH_MIN,
              currentAngle: kneeAngle,
              correction: 'Straighten legs',
            };
          }
        }
      },
    },
  ];
}

/**
 * Tube Stance Drill Rules
 * @returns {DrillRule[]}
 */
export function getTubeStanceRules() {
  const TUBE_KNEE_MAX = 90;
  const TUBE_HIP_MAX = 100;

  return [
    {
      id: 'tube_knee_depth',
      name: 'Knee Depth',
      priority: 3,
      check: (metrics) => {
        const kneeAngle = metrics.kneeAngles.average;
        if (kneeAngle < TUBE_KNEE_MAX) {
          return {
            passed: true,
            message: 'Knees low enough!',
            severity: 'success',
            targetAngle: TUBE_KNEE_MAX,
            currentAngle: kneeAngle,
          };
        } else {
          const correctionDeg = Math.round(kneeAngle - TUBE_KNEE_MAX);
          return {
            passed: false,
            message: `Get LOWER! Bend knees ${correctionDeg}° more`,
            severity: 'error',
            targetAngle: TUBE_KNEE_MAX,
            currentAngle: kneeAngle,
            correction: `Bend knees ${correctionDeg}° more`,
          };
        }
      },
    },
    {
      id: 'tube_hip_depth',
      name: 'Hip Depth',
      priority: 3,
      check: (metrics) => {
        const hipAngle = metrics.hipAngles.average;
        if (hipAngle < TUBE_HIP_MAX) {
          return {
            passed: true,
            message: 'Hips low enough!',
            severity: 'success',
            targetAngle: TUBE_HIP_MAX,
            currentAngle: hipAngle,
          };
        } else {
          const correctionDeg = Math.round(hipAngle - TUBE_HIP_MAX);
          return {
            passed: false,
            message: `Crouch! Bring chest to knees (${correctionDeg}° more)`,
            severity: 'error',
            targetAngle: TUBE_HIP_MAX,
            currentAngle: hipAngle,
            correction: `Crouch ${correctionDeg}° more`,
          };
        }
      },
    },
  ];
}

/**
 * Get rules for a specific drill
 * @param {string} drillId
 * @returns {DrillRule[]}
 */
export function getDrillRules(drillId) {
  switch (drillId) {
    case 'stance':
      return getStanceRules();
    case 'popup':
      return getPopUpRules();
    case 'paddling':
      return getPaddlingRules();
    case 'bottom_turn':
      return getBottomTurnRules();
    case 'pumping':
      return getPumpingRules();
    case 'tube_stance':
      return getTubeStanceRules();
    default:
      return [];
  }
}

/**
 * Evaluate all rules for a drill and return results
 * @param {string} drillId
 * @param {BodyMetrics} metrics
 * @param {PoseLandmarks} landmarks
 * @param {any} [previousState]
 * @returns {RuleResult[]}
 */
export function evaluateDrillRules(drillId, metrics, landmarks, previousState) {
  const rules = getDrillRules(drillId);
  return rules
    .map((rule) => rule.check(metrics, landmarks, previousState))
    .sort((a, b) => {
      // Sort by priority (higher first), then by severity
      const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

