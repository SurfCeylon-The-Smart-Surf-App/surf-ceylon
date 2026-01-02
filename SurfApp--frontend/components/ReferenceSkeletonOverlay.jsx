/**
 * Reference Skeleton Overlay Component
 * Phase 3.1: AR-style reference skeleton showing ideal pose for each drill
 */

import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { PoseLandmarks, PoseLandmark } from '../utils/poseDetection.js';

const { width, height } = Dimensions.get('window');

/**
 * @typedef {Object} ReferenceSkeletonOverlayProps
 * @property {string} drillId
 * @property {number} screenWidth
 * @property {number} screenHeight
 * @property {number} [opacity]
 */

// Pre-defined ideal landmark positions for each drill (normalized 0-1)
/**
 * @param {string} drillId
 * @returns {PoseLandmarks|null}
 */
const getIdealPose = (drillId) => {
  // Center of screen (normalized coordinates)
  const centerX = 0.5;
  const centerY = 0.5;
  
  switch (drillId) {
    case 'stance':
      // Ideal surf stance: knees bent, hips hinged, balanced
      return {
        nose: { x: centerX, y: centerY - 0.35, z: 0, visibility: 1 },
        leftShoulder: { x: centerX - 0.12, y: centerY - 0.15, z: 0, visibility: 1 },
        rightShoulder: { x: centerX + 0.12, y: centerY - 0.15, z: 0, visibility: 1 },
        leftHip: { x: centerX - 0.08, y: centerY + 0.05, z: 0, visibility: 1 },
        rightHip: { x: centerX + 0.08, y: centerY + 0.05, z: 0, visibility: 1 },
        leftKnee: { x: centerX - 0.06, y: centerY + 0.2, z: 0, visibility: 1 },
        rightKnee: { x: centerX + 0.06, y: centerY + 0.2, z: 0, visibility: 1 },
        leftAnkle: { x: centerX - 0.04, y: centerY + 0.35, z: 0, visibility: 1 },
        rightAnkle: { x: centerX + 0.04, y: centerY + 0.35, z: 0, visibility: 1 },
        leftElbow: { x: centerX - 0.15, y: centerY - 0.05, z: 0, visibility: 1 },
        rightElbow: { x: centerX + 0.15, y: centerY - 0.05, z: 0, visibility: 1 },
        leftWrist: { x: centerX - 0.18, y: centerY + 0.05, z: 0, visibility: 1 },
        rightWrist: { x: centerX + 0.18, y: centerY + 0.05, z: 0, visibility: 1 },
      };
    
    case 'tube_stance':
      // Deep crouch: very low knees and hips
      return {
        nose: { x: centerX, y: centerY - 0.25, z: 0, visibility: 1 },
        leftShoulder: { x: centerX - 0.1, y: centerY - 0.05, z: 0, visibility: 1 },
        rightShoulder: { x: centerX + 0.1, y: centerY - 0.05, z: 0, visibility: 1 },
        leftHip: { x: centerX - 0.06, y: centerY + 0.1, z: 0, visibility: 1 },
        rightHip: { x: centerX + 0.06, y: centerY + 0.1, z: 0, visibility: 1 },
        leftKnee: { x: centerX - 0.04, y: centerY + 0.25, z: 0, visibility: 1 },
        rightKnee: { x: centerX + 0.04, y: centerY + 0.25, z: 0, visibility: 1 },
        leftAnkle: { x: centerX - 0.02, y: centerY + 0.38, z: 0, visibility: 1 },
        rightAnkle: { x: centerX + 0.02, y: centerY + 0.38, z: 0, visibility: 1 },
      };
    
    case 'paddling':
      // Prone position: arched back, head up
      return {
        nose: { x: centerX, y: centerY - 0.2, z: 0, visibility: 1 },
        leftEar: { x: centerX - 0.05, y: centerY - 0.18, z: 0, visibility: 1 },
        rightEar: { x: centerX + 0.05, y: centerY - 0.18, z: 0, visibility: 1 },
        leftShoulder: { x: centerX - 0.12, y: centerY - 0.05, z: 0, visibility: 1 },
        rightShoulder: { x: centerX + 0.12, y: centerY - 0.05, z: 0, visibility: 1 },
        leftHip: { x: centerX - 0.08, y: centerY + 0.15, z: 0, visibility: 1 },
        rightHip: { x: centerX + 0.08, y: centerY + 0.15, z: 0, visibility: 1 },
        leftElbow: { x: centerX - 0.15, y: centerY + 0.05, z: 0, visibility: 1 },
        rightElbow: { x: centerX + 0.15, y: centerY + 0.05, z: 0, visibility: 1 },
      };
    
    default:
      // Default to stance pose
      return getIdealPose('stance');
  }
};

// Helper to create a line between two landmarks
/**
 * @param {PoseLandmark|undefined} p1
 * @param {PoseLandmark|undefined} p2
 * @param {string} key
 * @param {number} opacity
 * @returns {React.ReactElement|null}
 */
const createLine = (p1, p2, key, opacity) => {
  if (!p1 || !p2) return null;
  
  const dx = (p2.x - p1.x) * width;
  const dy = (p2.y - p1.y) * height;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  return (
    <View
      key={key}
      style={{
        position: 'absolute',
        left: p1.x * width,
        top: p1.y * height,
        width: length,
        height: 2,
        backgroundColor: '#00FF00',
        opacity: opacity * 0.5, // Reference skeleton is semi-transparent
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
};

// Helper to create a joint marker
/**
 * @param {PoseLandmark|undefined} p
 * @param {string} key
 * @param {number} opacity
 * @returns {React.ReactElement|null}
 */
const createJoint = (p, key, opacity) => {
  if (!p) return null;
  
  return (
    <View
      key={key}
      style={{
        position: 'absolute',
        left: p.x * width - 3,
        top: p.y * height - 3,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00FF00',
        opacity: opacity * 0.5,
      }}
    />
  );
};

/**
 * @param {ReferenceSkeletonOverlayProps} props
 */
export default function ReferenceSkeletonOverlay({
  drillId,
  screenWidth,
  screenHeight,
  opacity = 0.4,
}) {
  const idealPose = getIdealPose(drillId);
  
  if (!idealPose) {
    return null;
  }
  
  const skeletonLines = [];
  const skeletonJoints = [];
  
  // Head connections
  if (idealPose.nose) {
    if (idealPose.leftShoulder) skeletonLines.push(createLine(idealPose.nose, idealPose.leftShoulder, 'nose-leftShoulder', opacity));
    if (idealPose.rightShoulder) skeletonLines.push(createLine(idealPose.nose, idealPose.rightShoulder, 'nose-rightShoulder', opacity));
  }
  
  // Torso
  if (idealPose.leftShoulder && idealPose.rightShoulder) {
    skeletonLines.push(createLine(idealPose.leftShoulder, idealPose.rightShoulder, 'shoulders', opacity));
  }
  if (idealPose.leftShoulder && idealPose.leftHip) {
    skeletonLines.push(createLine(idealPose.leftShoulder, idealPose.leftHip, 'leftShoulder-leftHip', opacity));
  }
  if (idealPose.rightShoulder && idealPose.rightHip) {
    skeletonLines.push(createLine(idealPose.rightShoulder, idealPose.rightHip, 'rightShoulder-rightHip', opacity));
  }
  if (idealPose.leftHip && idealPose.rightHip) {
    skeletonLines.push(createLine(idealPose.leftHip, idealPose.rightHip, 'hips', opacity));
  }
  
  // Left arm
  if (idealPose.leftShoulder && idealPose.leftElbow) {
    skeletonLines.push(createLine(idealPose.leftShoulder, idealPose.leftElbow, 'leftShoulder-leftElbow', opacity));
  }
  if (idealPose.leftElbow && idealPose.leftWrist) {
    skeletonLines.push(createLine(idealPose.leftElbow, idealPose.leftWrist, 'leftElbow-leftWrist', opacity));
  }
  
  // Right arm
  if (idealPose.rightShoulder && idealPose.rightElbow) {
    skeletonLines.push(createLine(idealPose.rightShoulder, idealPose.rightElbow, 'rightShoulder-rightElbow', opacity));
  }
  if (idealPose.rightElbow && idealPose.rightWrist) {
    skeletonLines.push(createLine(idealPose.rightElbow, idealPose.rightWrist, 'rightElbow-rightWrist', opacity));
  }
  
  // Left leg
  if (idealPose.leftHip && idealPose.leftKnee) {
    skeletonLines.push(createLine(idealPose.leftHip, idealPose.leftKnee, 'leftHip-leftKnee', opacity));
  }
  if (idealPose.leftKnee && idealPose.leftAnkle) {
    skeletonLines.push(createLine(idealPose.leftKnee, idealPose.leftAnkle, 'leftKnee-leftAnkle', opacity));
  }
  
  // Right leg
  if (idealPose.rightHip && idealPose.rightKnee) {
    skeletonLines.push(createLine(idealPose.rightHip, idealPose.rightKnee, 'rightHip-rightKnee', opacity));
  }
  if (idealPose.rightKnee && idealPose.rightAnkle) {
    skeletonLines.push(createLine(idealPose.rightKnee, idealPose.rightAnkle, 'rightKnee-rightAnkle', opacity));
  }
  
  // Joints
  if (idealPose.nose) skeletonJoints.push(createJoint(idealPose.nose, 'joint-nose', opacity));
  if (idealPose.leftShoulder) skeletonJoints.push(createJoint(idealPose.leftShoulder, 'joint-leftShoulder', opacity));
  if (idealPose.rightShoulder) skeletonJoints.push(createJoint(idealPose.rightShoulder, 'joint-rightShoulder', opacity));
  if (idealPose.leftHip) skeletonJoints.push(createJoint(idealPose.leftHip, 'joint-leftHip', opacity));
  if (idealPose.rightHip) skeletonJoints.push(createJoint(idealPose.rightHip, 'joint-rightHip', opacity));
  if (idealPose.leftKnee) skeletonJoints.push(createJoint(idealPose.leftKnee, 'joint-leftKnee', opacity));
  if (idealPose.rightKnee) skeletonJoints.push(createJoint(idealPose.rightKnee, 'joint-rightKnee', opacity));
  if (idealPose.leftAnkle) skeletonJoints.push(createJoint(idealPose.leftAnkle, 'joint-leftAnkle', opacity));
  if (idealPose.rightAnkle) skeletonJoints.push(createJoint(idealPose.rightAnkle, 'joint-rightAnkle', opacity));
  
  return (
    <View style={styles.container} pointerEvents="none">
      {skeletonLines.filter(Boolean)}
      {skeletonJoints.filter(Boolean)}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Reference Pose</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4, // Below user skeleton (zIndex: 5) but above guide rectangle
    pointerEvents: 'none',
  },
  labelContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  label: {
    color: '#00FF00',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

