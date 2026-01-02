/**
 * Angle Arc Overlay Component
 * Phase 2.3: Visual angle arcs showing current vs target angles at joints
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
// Note: react-native-svg may not be installed - using fallback rendering
// import Svg, { Path, Circle, Text as SvgText, Line } from 'react-native-svg';
import { PoseLandmark } from '../utils/poseDetection.js';

/**
 * @typedef {Object} AngleArcOverlayProps
 * @property {PoseLandmark} joint
 * @property {PoseLandmark} point1
 * @property {PoseLandmark} point2
 * @property {number} currentAngle
 * @property {number} targetAngle
 * @property {[number, number]} targetRange
 * @property {number} screenWidth
 * @property {number} screenHeight
 * @property {string} [color]
 */

/**
 * @param {AngleArcOverlayProps} props
 */
export default function AngleArcOverlay({
  joint,
  point1,
  point2,
  currentAngle,
  targetAngle,
  targetRange,
  screenWidth,
  screenHeight,
  color,
}) {
  if (!joint || !point1 || !point2) {
    return null;
  }

  // Convert normalized coordinates to screen pixels
  const jointX = joint.x * screenWidth;
  const jointY = joint.y * screenHeight;
  const point1X = point1.x * screenWidth;
  const point1Y = point1.y * screenHeight;
  const point2X = point2.x * screenWidth;
  const point2Y = point2.y * screenHeight;

  // Calculate angle difference
  const angleDiff = Math.abs(currentAngle - targetAngle);
  
  // Determine color based on angle difference
  let arcColor = '#34C759'; // Green - within target
  if (angleDiff > 20) {
    arcColor = '#FF3B30'; // Red - way off
  } else if (angleDiff > 10) {
    arcColor = '#FFCC00'; // Yellow - close but not perfect
  }

  // Use provided color if specified
  if (color) {
    arcColor = color;
  }

  // Calculate arc radius (distance from joint to midpoint of the two points)
  const midX = (point1X + point2X) / 2;
  const midY = (point1Y + point2Y) / 2;
  const radius = Math.sqrt(
    Math.pow(midX - jointX, 2) + Math.pow(midY - jointY, 2)
  ) * 0.6; // 60% of distance for arc

  // Calculate angles for the two vectors
  const angle1 = Math.atan2(point1Y - jointY, point1X - jointX) * (180 / Math.PI);
  const angle2 = Math.atan2(point2Y - jointY, point2X - jointX) * (180 / Math.PI);

  // Normalize angles to 0-360
  const normalizedAngle1 = angle1 < 0 ? angle1 + 360 : angle1;
  const normalizedAngle2 = angle2 < 0 ? angle2 + 360 : angle2;

  // Create arc path
  const startAngle = Math.min(normalizedAngle1, normalizedAngle2);
  const endAngle = Math.max(normalizedAngle1, normalizedAngle2);
  const sweepAngle = endAngle - startAngle;

  // Convert to radians for SVG
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate arc path
  const x1 = jointX + radius * Math.cos(startRad);
  const y1 = jointY + radius * Math.sin(startRad);
  const x2 = jointX + radius * Math.cos(endRad);
  const y2 = jointY + radius * Math.sin(endRad);

  // Large arc flag (1 if sweep > 180)
  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  // Calculate target angle line
  const targetRad = (targetAngle * Math.PI) / 180;
  const targetX = jointX + radius * 1.2 * Math.cos(targetRad);
  const targetY = jointY + radius * 1.2 * Math.sin(targetRad);

  // Simplified version using View components (fallback if react-native-svg not available)
  // For full SVG support, install: npm install react-native-svg
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.jointMarker,
          {
            left: jointX - 6,
            top: jointY - 6,
            backgroundColor: arcColor,
          },
        ]}
      />
      <View
        style={[
          styles.angleText,
          {
            left: jointX - 30,
            top: jointY - radius - 30,
          },
        ]}
      >
        <Text style={[styles.angleTextContent, { color: arcColor }]}>
          {Math.round(currentAngle)}° / {Math.round(targetAngle)}°
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  jointMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.8,
  },
  angleText: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  angleTextContent: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

