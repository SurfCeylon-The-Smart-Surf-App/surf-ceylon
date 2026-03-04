/**
 * Live Score Bar Component
 * Vertical bar showing correctness score (0-100%) with smooth animations
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * @typedef {Object} LiveScoreBarProps
 * @property {number} score - 0-100
 * @property {number} [height] - Height of the bar in pixels
 */

/**
 * @param {LiveScoreBarProps} props
 */
export default function LiveScoreBar({ score, height = 200 }) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate height change
    Animated.spring(animatedHeight, {
      toValue: score,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    // Fade in/out based on score
    Animated.timing(animatedOpacity, {
      toValue: score > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [score]);

  // Determine color based on score
  const getColor = () => {
    if (score >= 75) return '#34C759'; // Green - Excellent
    if (score >= 50) return '#FFCC00'; // Yellow - Getting better
    return '#FF3B30'; // Red - Needs improvement
  };

  const barHeight = animatedHeight.interpolate({
    inputRange: [0, 100],
    outputRange: [0, height],
  });

  return (
    <View style={[styles.container, { height }]}>
      {/* Background track */}
      <View style={styles.track} />
      
      {/* Animated fill */}
      <Animated.View
        style={[
          styles.fill,
          {
            height: barHeight,
            backgroundColor: getColor(),
            opacity: animatedOpacity,
          },
        ]}
      />
      
      {/* Score text */}
      <View style={styles.scoreLabel}>
        <Text style={styles.scoreText}>{Math.round(score)}%</Text>
      </View>
      
      {/* Gradient overlay for smooth transition */}
      <View style={styles.gradientOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  track: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  scoreLabel: {
    position: 'absolute',
    top: -25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
  },
});

