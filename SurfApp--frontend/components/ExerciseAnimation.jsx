import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getExerciseMedia } from '../utils/exerciseMedia.js';

// Lottie support - optional (not installed due to Kotlin compatibility issues)
// Will use icon animations instead

/**
 * @typedef {Object} ExerciseAnimationProps
 * @property {string} exerciseName
 * @property {number} [size]
 * @property {boolean} [fullScreen]
 */

// Animation mapping for different exercises
const EXERCISE_ICONS = {
  'Jumping Jacks': 'fitness-center',
  'Arm Circles': 'rotate-right',
  'Leg Swings': 'directions-walk',
  'Torso Twists': 'rotate-left',
  'High Knees': 'directions-run',
  'Burpees': 'fitness-center',
  'Mountain Climbers': 'fitness-center',
  'Jump Rope': 'fitness-center',
  'Jogging': 'directions-run',
  'Cycling': 'directions-bike',
  'Swimming': 'pool',
  'Rowing Machine': 'rowing',
  'Box Jumps': 'fitness-center',
  'Tuck Jumps': 'fitness-center',
  'Jump Squats': 'fitness-center',
  'Kettlebell Swings': 'fitness-center',
  'Battle Ropes': 'fitness-center',
  'Sprint': 'directions-run',
  'Walking': 'directions-walk',
  'Stair': 'stairs',
  'Push-up': 'fitness-center',
  'Lunge': 'directions-walk',
  'Squat': 'fitness-center',
};

/**
 * @param {ExerciseAnimationProps} props
 */
export default function ExerciseAnimation({ exerciseName, size = 120, fullScreen = false }) {
  const media = getExerciseMedia(exerciseName);
  
  // Note: Lottie animations disabled due to Kotlin compatibility issues
  // Using icon animations instead - can be enabled later when Lottie package is fixed
  // if (fullScreen && media?.animationSource && media.animationType === 'lottie') {
  //   // Lottie support would go here
  // }
  
  // Use icon animation (always)
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Rotating animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulsing animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Bouncing animation (for jumping exercises)
    const isJumpingExercise = exerciseName.toLowerCase().includes('jump') || 
                              exerciseName.toLowerCase().includes('burpee') ||
                              exerciseName.toLowerCase().includes('sprint');
    
    let bounceAnimation;
    if (isJumpingExercise) {
      bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -15,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    }

    rotateAnimation.start();
    scaleAnimation.start();
    if (bounceAnimation) {
      bounceAnimation.start();
    }

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
      if (bounceAnimation) {
        bounceAnimation.stop();
      }
    };
  }, [exerciseName]);

  const getIconName = () => {
    // Use media icon if available
    if (media?.icon) {
      return media.icon;
    }
    // Find matching icon
    for (const [key, icon] of Object.entries(EXERCISE_ICONS)) {
      if (exerciseName.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return 'fitness-center'; // Default icon
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animationContainer,
          {
            width: size,
            height: size,
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <Icon name={getIconName()} size={size * 0.6} color="#007AFF" />
        </Animated.View>
      </Animated.View>
      <View style={styles.circle}>
        <View style={styles.innerCircle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fullScreenContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#e3f2fd',
    opacity: 0.5,
    zIndex: 1,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#bbdefb',
    opacity: 0.3,
    position: 'absolute',
    top: 20,
    left: 20,
  },
});

