import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

// Conditionally import camera only if not in Expo Go
let Camera, useCameraDevice;
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  try {
    const cameraModule = require('react-native-vision-camera');
    Camera = cameraModule.Camera;
    useCameraDevice = cameraModule.useCameraDevice;
  } catch (e) {
    console.log('Camera module not available:', e.message);
  }
}

// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import { analyzePose, PoseLandmarks, PoseLandmark, isPersonDetectedProgressive } from '../utils/poseDetection.js';
import { smoothLandmarks, clearSmoothingBuffers } from '../utils/landmarkSmoothing.js';
import { 
  calculateStabilityScore, 
  convertNativePoseToLandmarks, 
  DEFAULT_POSE_OPTIONS 
} from '../utils/nativePoseDetection.js';
import { speakGuidance, resetVoiceGuidance, stopSpeaking } from '../utils/voiceGuidance.js';
import { calculateBodyMetrics } from '../utils/kinematics.js';
import { evaluateDrillRules } from '../utils/drillRulesEngine.js';
import AngleArcOverlay from './AngleArcOverlay.jsx';
import ReferenceSkeletonOverlay from './ReferenceSkeletonOverlay.jsx';
import LiveScoreBar from './LiveScoreBar.jsx';

// Animated component wrappers
const AnimatedView = Animated.View;
const AnimatedText = Animated.Text;

const { width, height } = Dimensions.get('window');

/**
 * Helper function to calculate overlap between two rectangles
 * @param {Object} box1 - First rectangle with x, y, width, height
 * @param {Object} box2 - Second rectangle with x, y, width, height
 * @returns {number} Overlap ratio (0-1)
 */
function calculateOverlap(box1, box2) {
  const overlapX = Math.max(0,
    Math.min(box1.x + box1.width, box2.x + box2.width) -
    Math.max(box1.x, box2.x)
  );
  const overlapY = Math.max(0,
    Math.min(box1.y + box1.height, box2.y + box2.height) -
    Math.max(box1.y, box2.y)
  );
  const overlapArea = overlapX * overlapY;
  const box1Area = box1.width * box1.height;
  return box1Area > 0 ? overlapArea / box1Area : 0;
}

/**
 * Dynamic Guide Rectangle Component - Phase 1.2
 * @param {Object} props - Component props
 * @param {Object|null} props.personBoundingBox - Person bounding box with x, y, width, height, centerX, centerY
 * @param {Object} props.guideRectangle - Guide rectangle with x, y, width, height, centerX, centerY
 * @param {string} props.calibrationStatus - Calibration status: 'not_detected' | 'detecting' | 'positioning' | 'too_close' | 'too_far' | 'off_center' | 'ready'
 * @param {number} props.detectionQuality - Detection quality (0-1)
 * @param {number} props.screenWidth - Screen width
 * @param {number} props.screenHeight - Screen height
 */
function DynamicGuideRectangle({
  personBoundingBox,
  guideRectangle,
  calibrationStatus,
  detectionQuality,
  screenWidth,
  screenHeight,
}) {
  // Calculate rectangle position in pixels
  const rectX = guideRectangle.x * screenWidth;
  const rectY = guideRectangle.y * screenHeight;
  const rectWidth = guideRectangle.width * screenWidth;
  const rectHeight = guideRectangle.height * screenHeight;
  
  // Determine color based on calibration status
  let borderColor = '#FF3B30'; // Red - default
  let backgroundColor = 'rgba(255, 59, 48, 0.1)'; // Red tint
  let statusText = 'Position yourself here';
  
  if (personBoundingBox) {
    const overlap = calculateOverlap(personBoundingBox, guideRectangle);
    
    if (calibrationStatus === 'ready') {
      borderColor = '#34C759'; // Green
      backgroundColor = 'rgba(52, 199, 89, 0.1)';
      statusText = 'Perfect! Ready to start';
    } else if (calibrationStatus === 'positioning' || overlap > 0.5) {
      borderColor = '#FFCC00'; // Yellow
      backgroundColor = 'rgba(255, 204, 0, 0.1)';
      statusText = 'Almost there...';
    } else if (calibrationStatus === 'too_close') {
      borderColor = '#FF9500'; // Orange
      backgroundColor = 'rgba(255, 149, 0, 0.1)';
      statusText = 'Step back';
    } else if (calibrationStatus === 'too_far') {
      borderColor = '#FF9500';
      backgroundColor = 'rgba(255, 149, 0, 0.1)';
      statusText = 'Move closer';
    } else if (calibrationStatus === 'off_center') {
      borderColor = '#FFCC00';
      backgroundColor = 'rgba(255, 204, 0, 0.1)';
      statusText = 'Center yourself';
    } else {
      borderColor = '#FF3B30'; // Red
      backgroundColor = 'rgba(255, 59, 48, 0.1)';
      statusText = 'Position yourself here';
    }
  }
  
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
      pointerEvents: 'none',
    }} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          left: rectX,
          top: rectY,
          width: rectWidth,
          height: rectHeight,
          borderWidth: 3,
          borderStyle: 'dashed',
          borderRadius: 12,
          borderColor,
          backgroundColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      />
      <Text
        style={{
          position: 'absolute',
          top: rectY - 30,
          left: rectX + rectWidth / 2,
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
          color: borderColor,
          textShadowColor: '#000',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
          transform: [{ translateX: -100 }], // Center horizontally
        }}
      >
        {statusText}
      </Text>
      {detectionQuality > 0 && (
        <Text
          style={{
            position: 'absolute',
            top: rectY + rectHeight + 10,
            left: rectX + rectWidth / 2,
            fontSize: 12,
            color: '#fff',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            transform: [{ translateX: -40 }], // Center horizontally
          }}
        >
          Quality: {Math.round(detectionQuality * 100)}%
        </Text>
      )}
    </View>
  );
}

// All 8 surf drills with detailed information
const drills = [
  {
    id: 'stance',
    name: 'Stance',
    shortName: 'Stance',
    description: 'Hold a balanced surf stance',
    instruction: 'Keep knees bent (90-140 deg), hips hinged (140-170 deg), and maintain balance',
    icon: 'directions-walk',
    color: '#34C759',
    key: '1',
  },
  {
    id: 'popup',
    name: 'Pop-Up',
    shortName: 'Pop-Up',
    description: 'Practice the pop-up motion',
    instruction: 'Lie down, push up, then jump to your feet in one fluid motion',
    icon: 'arrow-upward',
    color: '#007AFF',
    key: '2',
  },
  {
    id: 'paddling',
    name: 'Paddling',
    shortName: 'Paddle',
    description: 'Arch back & look forward',
    instruction: 'Keep your back arched (less than 165 deg), head up, and look forward while paddling',
    icon: 'rowing',
    color: '#5AC8FA',
    key: '3',
  },
  {
    id: 'bottom_turn',
    name: 'Bottom Turn',
    shortName: 'Bottom Turn',
    description: 'Compress & rotate for bottom turn',
    instruction: 'Bend knees deep (less than 120 deg), rotate shoulders more than hips',
    icon: 'rotate-right',
    color: '#FF9500',
    key: '4',
  },
  {
    id: 'pumping',
    name: 'Pumping',
    shortName: 'Pump',
    description: 'Practice pumping motion (Up/Down)',
    instruction: 'Compress down (less than 110 deg), then extend up (more than 140 deg) in rhythmic motion',
    icon: 'trending-up',
    color: '#FF2D55',
    key: '5',
  },
  {
    id: 'tube_stance',
    name: 'Tube Stance',
    shortName: 'Tube',
    description: 'Hold deep crouch for tube',
    instruction: 'Get LOW! Bend knees (less than 90 deg) and hips (less than 100 deg) for deep crouch',
    icon: 'waves',
    color: '#AF52DE',
    key: '6',
  },
  {
    id: 'falling',
    name: 'Falling',
    shortName: 'Falling',
    description: 'Fall safely & cover your head',
    instruction: 'When falling, immediately cover your head with both hands',
    icon: 'warning',
    color: '#FF3B30',
    key: '7',
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortName: 'Cutback',
    description: 'Lead turn with head & shoulders',
    instruction: 'Turn head and shoulders first, keep stance balanced, lead with your head',
    icon: 'swap-horiz',
    color: '#FFCC00',
    key: '8',
  },
];

/**
 * @typedef {Object} FeedbackItem
 * @property {string} text - Feedback text
 * @property {'success'|'warning'|'error'|'info'} type - Feedback type
 * @property {number} priority - Higher priority = shown first
 */

/**
 * @typedef {Object} DrillStats
 * @property {number} correctTime - Time in correct position (ms)
 * @property {number} totalTime - Total practice time (ms)
 * @property {number} reps - Number of successful reps
 * @property {number} bestScore - Best score achieved (0-100)
 */

/**
 * Pose Practice Screen Component
 * Main component for pose practice functionality
 */
export default function PosePracticeScreen() {
  const { useRouter } = require('expo-router');
  const router = useRouter();
  
  /** @type {[string|null, function]} */
  const [selectedDrill, setSelectedDrill] = useState(null);
  /** @type {[boolean, function]} */
  const [isRecording, setIsRecording] = useState(false);
  /** @type {[boolean, function]} */
  const [hasPermission, setHasPermission] = useState(false);
  /** @type {[boolean, function]} */
  const [showDrillMenu, setShowDrillMenu] = useState(false);
  /** @type {[FeedbackItem[], function]} */
  const [feedback, setFeedback] = useState([]);
  /** @type {[number, function]} 0-100 score */
  const [score, setScore] = useState(0);
  /** @type {[boolean, function]} */
  const [personDetected, setPersonDetected] = useState(false);
  /** @type {[Record<string, DrillStats>, function]} */
  const [drillStats, setDrillStats] = useState({});
  /** @type {[number|null, function]} */
  const [practiceStartTime, setPracticeStartTime] = useState(null);
  /** @type {[number, function]} seconds */
  const [drillTimer, setDrillTimer] = useState(0);
  /** @type {React.MutableRefObject<NodeJS.Timeout|null>} */
  const timerIntervalRef = useRef(null);
  /** @type {[boolean, function]} */
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  
  /** @type {React.MutableRefObject<Camera|null>} */
  const camera = useRef(null);
  const frontDevice = useCameraDevice ? useCameraDevice('front') : null;
  const backDevice = useCameraDevice ? useCameraDevice('back') : null;
  const device = isFrontCamera ? frontDevice : backDevice;
  /** @type {Animated.Value} */
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  /** @type {Animated.Value} */
  const feedbackAnimation = useRef(new Animated.Value(0)).current;
  /** @type {React.MutableRefObject<Object>} */
  const previousDataRef = useRef({});
  /** @type {React.MutableRefObject<number>} */
  const frameCountRef = useRef(0);
  /** @type {React.MutableRefObject<number>} */
  const lastAnalysisTimeRef = useRef(0);
  /** @type {React.MutableRefObject<number>} Temporal validation: count consecutive frames with human */
  const humanFramesDetectedRef = useRef(0);
  /** @type {React.MutableRefObject<boolean>} */
  const lastPersonDetectedRef = useRef(false);
  /** @type {React.MutableRefObject<boolean>} Prevent concurrent API calls */
  const isProcessingRef = useRef(false);
  /** @type {React.MutableRefObject<boolean>} Track if camera is ready for photo capture */
  const cameraReadyRef = useRef(false);
  /** @type {React.MutableRefObject<NodeJS.Timeout|null>} Track pose detection interval */
  const poseDetectionIntervalRef = useRef(null);
  /** @type {[boolean, function]} Toggle for real vs mock */
  const [useRealPoseDetection, setUseRealPoseDetection] = useState(true);
  /** @type {[boolean, function]} UI loading state */
  const [isProcessingPose, setIsProcessingPose] = useState(false);
  /** @type {[string, function]} 'connected' | 'disconnected' | 'error' */
  const [connectionStatus, setConnectionStatus] = useState('connected');
  /** @type {[PoseLandmarks|null, function]} For skeleton visualization */
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  /** @type {[boolean, function]} Toggle skeleton overlay */
  const [showSkeleton, setShowSkeleton] = useState(true);
  /** @type {[number, function]} 0-100 */
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  /** @type {[string, function]} 'none' | 'preview' | 'partial' | 'full' */
  const [detectionStage, setDetectionStage] = useState('none');
  /** @type {[Object|null, function]} Phase 2.3: For angle arcs */
  const [currentBodyMetrics, setCurrentBodyMetrics] = useState(null);
  /** @type {[boolean, function]} Phase 3.1: Toggle reference skeleton */
  const [showReferenceSkeleton, setShowReferenceSkeleton] = useState(true);
  /** @type {[Object, function]} */
  const [sessionStats, setSessionStats] = useState({
    totalFrames: 0,
    detectedFrames: 0,
    averageScore: 0,
    bestScore: 0,
  });
  /** @type {React.MutableRefObject<number[]>} Last 30 scores for smoothing */
  const scoreHistoryRef = useRef([]);
  /** @type {React.MutableRefObject<NodeJS.Timeout|null>} For debouncing feedback */
  const feedbackTimeoutRef = useRef(null);
  /** @type {[number, function]} */
  const [averageScore, setAverageScore] = useState(0);
  /** @type {[string, function]} 'up' | 'down' | 'stable' */
  const [scoreTrend, setScoreTrend] = useState('stable');
  
  // Phase 4.3: Session replay - store landmark history
  /** @type {React.MutableRefObject<Array<{timestamp: number, landmarks: PoseLandmarks|null, score: number, feedback: string[]}>>} */
  const landmarksHistoryRef = useRef([]);
  /** @type {React.MutableRefObject<number>} */
  const lastLandmarkSaveRef = useRef(0);
  /** @type {number} Save every 100ms (10 FPS) */
  const LANDMARK_SAVE_INTERVAL = 100;
  
  // Phase 3.3: Shared state for immediate stop
  /** @type {React.MutableRefObject<boolean>} Shared flag for immediate stop */
  const isStoppingRef = useRef(false);
  
  // Phase 1.2: Dynamic visual guidance state
  /** @type {[Object|null, function]} Person bounding box with x, y, width, height, centerX, centerY */
  const [personBoundingBox, setPersonBoundingBox] = useState(null);
  /** @type {[string, function]} 'not_detected' | 'detecting' | 'positioning' | 'too_close' | 'too_far' | 'off_center' | 'ready' */
  const [calibrationStatus, setCalibrationStatus] = useState('not_detected');
  /** @type {[number, function]} */
  const [detectionQuality, setDetectionQuality] = useState(0);
  /** @type {[Object, function]} Body completeness with head, torso, legs, feet booleans */
  const [bodyCompleteness, setBodyCompleteness] = useState({ head: false, torso: false, legs: false, feet: false });
  
  // Guide rectangle: center 50% of screen (normalized 0-1)
  const guideRectangle = {
    x: 0.25,  // Start at 25% from left
    y: 0.15,  // Start at 15% from top
    width: 0.5,  // 50% width
    height: 0.7,  // 70% height
    centerX: 0.5,
    centerY: 0.5
  };

  // Initialize stats for all drills
  useEffect(() => {
    /** @type {Record<string, DrillStats>} */
    const initialStats = {};
    drills.forEach((drill) => {
      initialStats[drill.id] = {
        correctTime: 0,
        totalTime: 0,
        reps: 0,
        bestScore: 0,
      };
    });
    setDrillStats(initialStats);
  }, []);

  // Animate score changes
  useEffect(() => {
    Animated.spring(scoreAnimation, {
      toValue: score,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [score]);

  // Animate feedback appearance
  useEffect(() => {
    if (feedback.length > 0) {
      Animated.sequence([
        Animated.timing(feedbackAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      feedbackAnimation.setValue(0);
    }
  }, [feedback]);

  /**
   * Pose processing function - handles both server and mock data
   * @param {string} base64Image - Base64 encoded image
   * @returns {Promise<void>}
   */
  const processPoseFromFrame = async (base64Image) => {
    if (!selectedDrill) {
      return;
    }

    try {
      setIsProcessingPose(true);
      setConnectionStatus('connected');

      // Try server-based detection first, fallback to mock if it fails
      /** @type {PoseLandmarks|null} */
      let landmarks = null;
      
      try {
        // Call pose detection API with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000) // Reduced timeout
        );
        
        const { poseAPI } = require('../services/api.js');
        // Generate session ID for velocity tracking (use practiceStartTime as unique ID)
        const sessionId = practiceStartTime ? `session_${practiceStartTime}` : `session_${Date.now()}`;
        const result = await Promise.race([
          poseAPI.detectPose(base64Image, selectedDrill, sessionId),
          timeoutPromise
        ]);
        
        // Process landmarks even if backend says personDetected: false
        // Backend may return landmarks for preview even if not fully detected
        if (result.success && result.landmarks) {
          landmarks = {
            nose: result.landmarks.nose,
            leftEye: result.landmarks.leftEye,
            rightEye: result.landmarks.rightEye,
            leftEar: result.landmarks.leftEar,
            rightEar: result.landmarks.rightEar,
            leftShoulder: result.landmarks.leftShoulder,
            rightShoulder: result.landmarks.rightShoulder,
            leftElbow: result.landmarks.leftElbow,
            rightElbow: result.landmarks.rightElbow,
            leftWrist: result.landmarks.leftWrist,
            rightWrist: result.landmarks.rightWrist,
            leftHip: result.landmarks.leftHip,
            rightHip: result.landmarks.rightHip,
            leftKnee: result.landmarks.leftKnee,
            rightKnee: result.landmarks.rightKnee,
            leftAnkle: result.landmarks.leftAnkle,
            rightAnkle: result.landmarks.rightAnkle,
          };
          
          // Extract new detection data from backend response
          if (result.boundingBox) {
            setPersonBoundingBox(result.boundingBox);
          }
          if (result.calibrationStatus) {
            setCalibrationStatus(result.calibrationStatus);
          }
          if (result.detectionQuality !== undefined) {
            setDetectionQuality(result.detectionQuality);
          }
          if (result.bodyCompleteness) {
            setBodyCompleteness(result.bodyCompleteness);
          }
        } else {
          // Reset detection data if no landmarks
          setPersonBoundingBox(null);
          setCalibrationStatus('not_detected');
          setDetectionQuality(0);
          setBodyCompleteness({ head: false, torso: false, legs: false, feet: false });
        }
      } catch (serverError) {
        // Fallback to mock
        const { generateMockLandmarks, adjustLandmarksForDrill, addVariation } = require('../utils/mockPoseDetector.js');
        landmarks = generateMockLandmarks(width, height, true);
        if (landmarks && selectedDrill) {
          landmarks = adjustLandmarksForDrill(landmarks, selectedDrill);
          landmarks = addVariation(landmarks, 0.01);
        }
      }
      
      if (!landmarks) {
        humanFramesDetectedRef.current = 0;
        lastPersonDetectedRef.current = false;
        setPersonDetected(false);
        // Don't show error feedback - let the no-person overlay handle it
        setScore(0);
        return;
      }
      
      // Apply smoothing filter to reduce jitter
      const smoothedLandmarks = smoothLandmarks(landmarks, 0.4);
      
      // Phase 1.4: Two-Stage Detection Logic (FIXED)
      // Stage 1: Preview - Accept ANY landmarks, show skeleton preview
      const detectionResult = isPersonDetectedProgressive(smoothedLandmarks);
      setDetectionConfidence(detectionResult.confidence);
      
      // CRITICAL FIX: Show skeleton preview even with low confidence (preview/partial/full stages)
      // Always show skeleton if we have ANY landmarks, regardless of calibration status
      if (detectionResult.stage !== 'none' && smoothedLandmarks) {
        setCurrentLandmarks(smoothedLandmarks);
        // Update detection stage based on detection result
        setDetectionStage(detectionResult.stage);
        // Set personDetected to true for visualization (even if not ready for scoring)
        setPersonDetected(detectionResult.stage === 'preview' || detectionResult.stage === 'partial' || detectionResult.stage === 'full');
      } else {
        setCurrentLandmarks(null);
        setDetectionStage('none');
        setPersonDetected(false);
      }
      
      // Stage 2: Action - Require high quality detection for scoring
      // Check if ready for action (calibration passed) - RELAXED REQUIREMENTS
      const isReadyForAction = 
        (calibrationStatus === 'ready' || calibrationStatus === 'positioning') && // Allow positioning stage
        detectionQuality > 0.5 && // Lowered from 0.7 to 0.5
        (bodyCompleteness.torso || bodyCompleteness.legs) && // Only require torso OR legs (not both)
        personBoundingBox !== null &&
        calculateOverlap(personBoundingBox, guideRectangle) > 0.5; // Lowered from 0.7 to 0.5
      
      if (isReadyForAction && detectionResult.stage === 'full') {
        setDetectionStage('full');
      } else if (detectionResult.stage === 'partial' || detectionResult.stage === 'full') {
        setDetectionStage('partial');
      } else if (detectionResult.stage === 'preview') {
        setDetectionStage('preview');
      }
      
      // Calculate stability score
      const stabilityScore = calculateStabilityScore(smoothedLandmarks);
      const stabilityPercent = (stabilityScore * 100).toFixed(1);
      console.log(`[Pose] Stability score: ${stabilityPercent}%`);
      
      // Phase 2.1 & 2.2: Calculate body metrics and evaluate drill rules
      const bodyMetrics = calculateBodyMetrics(smoothedLandmarks);
      setCurrentBodyMetrics(bodyMetrics); // Store for angle arcs overlay (Phase 2.3)
      const ruleResults = bodyMetrics && selectedDrill
        ? evaluateDrillRules(selectedDrill, bodyMetrics, smoothedLandmarks, previousDataRef.current)
        : [];
      
      // Only analyze pose and score if ready for action
      if (isReadyForAction) {
        // Analyze pose using our existing logic
        const analysis = analyzePose(selectedDrill, smoothedLandmarks, previousDataRef.current);
        
        // Phase 2.2: Enhance feedback with drill rules engine results
        if (ruleResults.length > 0) {
          // Merge rule-based feedback with existing analysis feedback
          const ruleFeedback = ruleResults
            .filter(r => !r.passed && r.severity !== 'success')
            .slice(0, 2) // Top 2 most important corrections
            .map(r => ({
              text: r.message,
              type: r.severity === 'error' ? 'error' : r.severity === 'warning' ? 'warning' : 'info',
              priority: r.severity === 'error' ? 3 : r.severity === 'warning' ? 2 : 1,
            }));
          
          // Combine with existing feedback, prioritizing rule-based feedback
          // Convert rule feedback to strings and combine with existing feedback
          const ruleFeedbackTexts = ruleFeedback.map(f => f.text);
          analysis.feedback = [...ruleFeedbackTexts, ...analysis.feedback].slice(0, 3);
        }
        
        // Temporal validation (relaxed for better detection)
        if (analysis.personDetected) {
          humanFramesDetectedRef.current++;
          lastPersonDetectedRef.current = true;
        } else {
          humanFramesDetectedRef.current = Math.max(0, humanFramesDetectedRef.current - 1); // Gradual decrease instead of reset
          if (humanFramesDetectedRef.current === 0) {
            lastPersonDetectedRef.current = false;
          }
        }

        const REQUIRED_CONSECUTIVE_FRAMES = 1; // Lowered from 2 to 1 for faster detection
        const confirmedPersonDetected = humanFramesDetectedRef.current >= REQUIRED_CONSECUTIVE_FRAMES && analysis.personDetected;
        // Only update personDetected if we're ready for action (scoring), otherwise keep it from preview stage
        if (isReadyForAction) {
          setPersonDetected(confirmedPersonDetected);
        }
        
        if (confirmedPersonDetected && analysis.personDetected) {
          /** @type {FeedbackItem[]} */
          const newFeedback = analysis.feedback.map((text) => {
            /** @type {'success'|'warning'|'error'|'info'} */
            let type = 'info';
            let priority = 1;
          
            if (text.includes('GREAT') || text.includes('GOOD')) {
              type = 'success';
              priority = 3;
            } else if (text.includes('!') || text.includes('more') || text.includes('Adjust')) {
              type = 'warning';
              priority = 2;
            } else if (text.includes('Ensure') || text.includes('No person')) {
              type = 'error';
              priority = 1;
            }
            
            return { text, type, priority };
          });
          
          // Debounce feedback updates (200ms) for performance
          if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
          }
          feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback(newFeedback);
          }, 200);
          
          // Update score inline (updateScore function defined later)
          const newScore = Math.min(100, Math.max(0, Math.round(analysis.score)));
          setScore(newScore);
          
          // Update stats
          if (selectedDrill) {
            setDrillStats((prev) => {
              const stats = prev[selectedDrill] || { correctTime: 0, totalTime: 0, reps: 0, bestScore: 0 };
              return {
                ...prev,
                [selectedDrill]: {
                  ...stats,
                  bestScore: Math.max(stats.bestScore, newScore),
                  correctTime: newScore > 70 ? stats.correctTime + 100 : stats.correctTime,
                },
              };
            });
          }
          
          // Update score history and calculate trends (throttled)
          scoreHistoryRef.current.push(newScore);
          if (scoreHistoryRef.current.length > 30) {
            scoreHistoryRef.current.shift();
          }
          
          // Phase 4.3: Save landmark history for replay (throttled to 10 FPS)
          const now = Date.now();
          if (now - lastLandmarkSaveRef.current >= LANDMARK_SAVE_INTERVAL) {
            landmarksHistoryRef.current.push({
              timestamp: now - (practiceStartTime || now),
              landmarks: smoothedLandmarks,
              score: newScore,
              feedback: newFeedback.map(f => f.text),
            });
            lastLandmarkSaveRef.current = now;
            
            // Limit history to last 5 minutes (300 seconds * 10 FPS = 3000 entries)
            if (landmarksHistoryRef.current.length > 3000) {
              landmarksHistoryRef.current.shift();
            }
          }
          
          // Calculate moving average (last 5 scores) - memoized
          const recentScores = scoreHistoryRef.current.slice(-5);
          const avg = recentScores.length > 0 
            ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length 
            : newScore;
          setAverageScore(Math.round(avg));
          
          // Calculate trend (compare last 5 vs previous 5)
          if (scoreHistoryRef.current.length >= 10) {
            const recent = scoreHistoryRef.current.slice(-5);
            const previous = scoreHistoryRef.current.slice(-10, -5);
            const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
            const previousAvg = previous.reduce((sum, s) => sum + s, 0) / previous.length;
            const diff = recentAvg - previousAvg;
            if (diff > 2) setScoreTrend('up');
            else if (diff < -2) setScoreTrend('down');
            else setScoreTrend('stable');
          }
          
          // Update previous data for drills that need state tracking
          if (selectedDrill === 'pumping') {
            previousDataRef.current.pumpState = analysis.score > 70 ? 'HIGH' : 'LOW';
          } else if (selectedDrill === 'falling') {
            const lHip = smoothedLandmarks.leftHip;
            const rHip = smoothedLandmarks.rightHip;
            if (lHip && rHip) {
              previousDataRef.current.hipMid = {
                x: (lHip.x + rHip.x) / 2,
                y: (lHip.y + rHip.y) / 2,
              };
            }
          }
        }
      } else {
        // Provide helpful feedback based on detection stage
        if (detectionResult.stage === 'preview') {
          setFeedback([{
            text: `Detecting... (${Math.round(detectionResult.confidence)}% confidence). Step fully into view.`,
            type: 'info',
            priority: 1,
          }]);
        } else if (detectionResult.stage === 'partial') {
          setFeedback([{
            text: `Almost there! (${Math.round(detectionResult.confidence)}% confidence). Show more of your body.`,
            type: 'warning',
            priority: 1,
          }]);
        } else if (humanFramesDetectedRef.current > 0 && humanFramesDetectedRef.current < 2) {
          setFeedback([{
            text: `Detecting person... (${humanFramesDetectedRef.current}/2)`,
            type: 'info',
            priority: 1,
          }]);
        } else {
          setFeedback([{
            text: 'No person detected. Step into view and ensure good lighting.',
            type: 'error',
            priority: 1,
          }]);
        }
        setScore(0);
      }
    } catch (error) {
      console.error('[Pose] Error processing pose:', error);
      setConnectionStatus('error');
    } finally {
      setIsProcessingPose(false);
    }
  };

  // Fallback to improved server-based processing with better network handling
  // This will be replaced with native processing after development build
  useEffect(() => {
    if (!isRecording || !selectedDrill) {
      return;
    }

    const TARGET_FPS = 10; // Conservative FPS to ensure stability
    const INTERVAL_MS = 1000 / TARGET_FPS; // ~100ms

    // Clear any existing interval
    if (poseDetectionIntervalRef.current) {
      clearInterval(poseDetectionIntervalRef.current);
    }

    poseDetectionIntervalRef.current = setInterval(async () => {
      if (!isProcessingRef.current && camera.current && cameraReadyRef.current) {
        try {
          isProcessingRef.current = true;
          
          // Take photo and convert to base64
          const photo = await camera.current.takePhoto({
            flash: 'off',
          });

          const photoUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
          
          // Simple base64 conversion
          const response = await fetch(photoUri);
          const blob = await response.blob();
          
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result;
              const base64Data = result.includes(',') ? result.split(',')[1] : result;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Call the improved pose detection
          await processPoseFromFrame(base64);
          
        } catch (error) {
          // Enhanced error handling
          if (error.message?.includes('Camera is closed')) {
            // Camera closed - expected, ignore
            return;
          } else if (error.message?.includes('timeout') || error.message?.includes('Network')) {
            // Network/timeout errors - show user-friendly message
            setConnectionStatus('error');
            if (personDetected) {
              setFeedback([{
                text: 'Connection issue. Trying to reconnect...',
                type: 'warning',
                priority: 1,
              }]);
            }
          } else {
            // Other errors - log but don't break the flow
            console.warn('[Pose] Processing error:', error.message);
            setConnectionStatus('error');
          }
        } finally {
          isProcessingRef.current = false;
        }
      }
    }, INTERVAL_MS);

    return () => {
      if (poseDetectionIntervalRef.current) {
        clearInterval(poseDetectionIntervalRef.current);
        poseDetectionIntervalRef.current = null;
      }
    };
  }, [isRecording, selectedDrill]);


  // Native processing doesn't need interval-based capture
  // Frame processor handles everything at 30 FPS natively

  // Reset state when recording stops or drill changes
  useEffect(() => {
    if (!isRecording || !selectedDrill) {
      setPersonDetected(false);
      setFeedback([]);
      setScore(0);
      humanFramesDetectedRef.current = 0;
      lastPersonDetectedRef.current = false;
      isProcessingRef.current = false;
      clearSmoothingBuffers();
    }
  }, [isRecording, selectedDrill]);


  /**
   * Update score and stats
   * @param {number} newScore - New score value (0-100)
   */
  const updateScore = (newScore) => {
    setScore(Math.min(100, Math.max(0, Math.round(newScore))));
    
    // Update stats
    if (selectedDrill) {
      setDrillStats((prev) => {
        const stats = prev[selectedDrill] || { correctTime: 0, totalTime: 0, reps: 0, bestScore: 0 };
        return {
          ...prev,
          [selectedDrill]: {
            ...stats,
            bestScore: Math.max(stats.bestScore, newScore),
            totalTime: stats.totalTime + 100,
            correctTime: newScore > 70 ? stats.correctTime + 100 : stats.correctTime,
          },
        };
      });
    }
  };

  React.useEffect(() => {
    checkCameraPermission();
  }, []);
  
  // Phase 1.3: Voice guidance when calibration status changes
  React.useEffect(() => {
    if (isRecording && calibrationStatus) {
      speakGuidance(calibrationStatus, bodyCompleteness);
    }
    
    // Cleanup on unmount
    return () => {
      stopSpeaking();
    };
  }, [calibrationStatus, isRecording, bodyCompleteness]);
  
  // Reset voice guidance when stopping practice
  React.useEffect(() => {
    if (!isRecording) {
      resetVoiceGuidance();
    }
  }, [isRecording]);

  const checkCameraPermission = async () => {
    try {
      const status = await Camera.getCameraPermissionStatus();
      
      if (status === 'granted') {
        setHasPermission(true);
      } else {
        const newStatus = await Camera.requestCameraPermission();
        setHasPermission(newStatus === 'granted');
      }
    } catch (error) {
      // Permission error handled silently
    }
  };

  /**
   * Handle starting practice for a drill
   * @param {string} drillId - Drill ID to start
   */
  const handleStartPractice = (drillId) => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required for pose practice');
      return;
    }
    // Clear smoothing buffers when starting new practice
    clearSmoothingBuffers();
    setSelectedDrill(drillId);
    setIsRecording(true);
    setShowDrillMenu(false);
    setFeedback([]);
    setScore(0);
    setDrillTimer(0);
    setPracticeStartTime(Date.now());
    
    // Start timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(() => {
      setDrillTimer((prev) => prev + 1);
    }, 1000);
  };

  const handleStopPractice = async () => {
    // Phase 3.3: Set stopping flag immediately (shared state stops everything)
    isStoppingRef.current = true;
    
    // Stop recording immediately
    setIsRecording(false);
    
    // Clear all intervals and timeouts
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (poseDetectionIntervalRef.current) {
      clearInterval(poseDetectionIntervalRef.current);
      poseDetectionIntervalRef.current = null;
    }
    
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    
    // Stop any ongoing processing
    isProcessingRef.current = false;
    
    // Calculate session statistics
    const practiceTime = practiceStartTime ? Date.now() - practiceStartTime : 0;
    const finalTimer = drillTimer; // Use timer state
    
    if (selectedDrill) {
      const stats = drillStats[selectedDrill] || { correctTime: 0, totalTime: 0, reps: 0, bestScore: 0 };
      const accuracy = stats.totalTime > 0 ? (stats.correctTime / stats.totalTime) * 100 : 0;
      
      // Update stats with timer
      setDrillStats((prev) => {
        const updated = { ...prev };
        updated[selectedDrill] = {
          ...stats,
          totalTime: stats.totalTime + finalTimer * 1000, // Convert seconds to ms
        };
        return updated;
      });
      
      // Save session data to progress with categorized format
      try {
        const { progressAPI } = require('../services/api.js');
        const { checkPoseBadges, awardBadge } = require('../utils/badgeSystem.js');
        
        // Phase 4.1: Calculate XP and prepare categorized progress data
        const { calculatePoseXP, calculateXPProgression } = require('../utils/xpSystem.js');
        
        const sessionXP = calculatePoseXP({
          drillId: selectedDrill,
          score: stats.bestScore,
          stabilityScore: averageScore > 0 ? averageScore / 100 : 0,
          duration: finalTimer,
          completed: stats.reps > 0,
        });
        
        // Get current progress to calculate level progression
        let userProgress = { pose: { level: 1, xp: 0, xpToNext: 100 }, poseEstimation: { level: 1, xp: 0, xpToNext: 100 } };
        try {
          const progressResponse = await progressAPI.loadProgress();
          userProgress = progressResponse.progress || userProgress;
        } catch (error) {
          console.warn('[Pose] Could not load current progress:', error);
        }
        
        const poseProgress = userProgress.pose || userProgress.poseEstimation || { level: 1, xp: 0, xpToNext: 100 };
        const xpProgression = calculateXPProgression(poseProgress.xp || 0, poseProgress.level || 1, sessionXP);
        
        // Prepare progress data with XP system
        const progressData = {
          category: 'pose',
          data: {
            xpEarned: sessionXP,
            drills: {
              [selectedDrill]: {
                completed: stats.reps > 0 ? 1 : 0,
                bestScore: stats.bestScore,
                totalTime: finalTimer * 1000, // Convert to milliseconds
              },
            },
            badges: [],
            // Legacy support
            completedDrills: stats.reps > 0 ? [selectedDrill] : [],
            scores: { [selectedDrill]: [stats.bestScore] },
            totalTime: finalTimer,
            sessions: 1,
          }
        };
        
        await progressAPI.saveProgress(
          progressData.category,
          progressData.data
        );
        
        // Show level up notification if applicable
        if (xpProgression.leveledUp) {
          Alert.alert(
            'Level Up!',
            `Congratulations! You've reached Level ${xpProgression.newLevel} in Pose Estimation!`,
            [{ text: 'Awesome!', onPress: () => {} }]
          );
        }
        
        // Phase 4.2: Check for new badges with performance-based triggers
        // Get full progress for badge checking (merge with existing)
        const fullProgress = userProgress.pose || userProgress.poseEstimation || {};
        const badgeCheckProgress = {
          completedDrills: [...(fullProgress.completedDrills || []), ...(stats.reps > 0 ? [selectedDrill] : [])],
          scores: {
            ...(fullProgress.scores || {}),
            [selectedDrill]: [...(fullProgress.scores?.[selectedDrill] || []), stats.bestScore],
          },
          totalTime: (fullProgress.totalTime || 0) + finalTimer,
          sessions: (fullProgress.sessions || 0) + 1,
          badges: fullProgress.badges || [],
        };
        
        // Calculate stability score for badge checking
        const avgStability = averageScore > 0 ? averageScore / 100 : 0;
        
        // Check for badges with current session data
        const sessionData = {
          stabilityScore: avgStability,
          duration: finalTimer,
          drillId: selectedDrill,
          // Note: popupVelocity, perfectAnglesDuration, consecutiveHighScores
          // would need to be tracked separately in state/refs
        };
        
        const newBadges = checkPoseBadges(badgeCheckProgress, badgeCheckProgress.badges);
        
        // Award new badges and show notification
        if (newBadges.length > 0) {
          for (const badgeId of newBadges) {
            await awardBadge('pose', badgeId);
          }
          
          // Show badge notification
          Alert.alert(
            'Badge Earned!',
            `Congratulations! You've earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`,
            [{ text: 'Awesome!', onPress: () => {} }]
          );
        }
      } catch (error) {
        console.error('[Pose] Error saving progress:', error);
      }
      
      // Format timer display
      const minutes = Math.floor(finalTimer / 60);
      const seconds = finalTimer % 60;
      const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Show summary alert
      Alert.alert(
        'Practice Complete',
        `Drill: ${drills.find((d) => d.id === selectedDrill)?.name}\n\n` +
        `Score: ${score}%\n` +
        `Best Score: ${stats.bestScore.toFixed(0)}%\n` +
        `Accuracy: ${accuracy.toFixed(1)}%\n` +
        `Practice Time: ${timerDisplay}`,
        [
          { text: 'Continue', onPress: () => {} },
          { text: 'Back to Menu', onPress: () => {
            setSelectedDrill(null);
            setScore(0);
            setDrillTimer(0);
            setFeedback([]);
            setPersonDetected(false);
            setCurrentLandmarks(null);
            setDetectionConfidence(0);
            setDetectionStage('none');
            clearSmoothingBuffers();
          }},
        ]
      );
    }
  };

  /**
   * Handle switching drills
   * @param {string} drillId - Drill ID to switch to
   */
  const handleDrillSwitch = (drillId) => {
    // Stop current practice if recording
    if (isRecording) {
      // Stop immediately
      isStoppingRef.current = true;
      setIsRecording(false);
      
      // Clear all intervals
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (poseDetectionIntervalRef.current) {
        clearInterval(poseDetectionIntervalRef.current);
        poseDetectionIntervalRef.current = null;
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
      
      // Reset states
      setPersonDetected(false);
      setFeedback([]);
      setScore(0);
      setCurrentLandmarks(null);
      setDetectionStage('none');
      clearSmoothingBuffers();
      
      // Wait a bit for cleanup before switching
      setTimeout(() => {
        handleStartPractice(drillId);
      }, 200);
    } else {
      // Switch immediately if not recording
      handleStartPractice(drillId);
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return '#34C759'; // Green
    if (score >= 60) return '#FFCC00'; // Yellow
    return '#FF3B30'; // Red
  };

  const getFeedbackColor = (type) => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FFCC00';
      case 'error':
        return '#FF3B30';
      default:
        return '#5AC8FA';
    }
  };

  /**
   * Render skeleton overlay
   * @param {PoseLandmarks} landmarks - Pose landmarks
   * @param {string} stage - Detection stage: 'none' | 'preview' | 'partial' | 'full'
   * @returns {React.ReactElement}
   */
  const renderSkeleton = (landmarks, stage) => {
    const lineColor = stage === 'full' ? '#00FF00' : stage === 'partial' ? '#FFCC00' : '#FF9500';
    const jointColor = stage === 'full' ? '#34C759' : stage === 'partial' ? '#FFCC00' : '#FF9500';
    const opacity = stage === 'full' ? 0.8 : stage === 'partial' ? 0.6 : 0.4;
    
    /** @type {Array<React.ReactElement|null>} */
    const skeletonLines = [];
    /** @type {Array<React.ReactElement|null>} */
    const skeletonJoints = [];

    /**
     * Helper to create a line
     * @param {PoseLandmark|undefined} p1 - First point
     * @param {PoseLandmark|undefined} p2 - Second point
     * @param {string} key - React key
     * @returns {React.ReactElement|null}
     */
    const createLine = (p1, p2, key) => {
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
            backgroundColor: lineColor,
            opacity,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      );
    };

    /**
     * Helper to create a joint
     * @param {PoseLandmark|undefined} p - Joint point
     * @param {string} key - React key
     * @returns {React.ReactElement|null}
     */
    const createJoint = (p, key) => {
      if (!p) return null;
      return (
        <View
          key={key}
          style={{
            position: 'absolute',
            left: p.x * width - 4,
            top: p.y * height - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: jointColor,
            opacity,
          }}
        />
      );
    };

    // Head connections
    if (landmarks.nose) {
      if (landmarks.leftEye) skeletonLines.push(createLine(landmarks.nose, landmarks.leftEye, 'nose-leftEye'));
      if (landmarks.rightEye) skeletonLines.push(createLine(landmarks.nose, landmarks.rightEye, 'nose-rightEye'));
      if (landmarks.leftEar && landmarks.leftEye) skeletonLines.push(createLine(landmarks.leftEye, landmarks.leftEar, 'leftEye-leftEar'));
      if (landmarks.rightEar && landmarks.rightEye) skeletonLines.push(createLine(landmarks.rightEye, landmarks.rightEar, 'rightEye-rightEar'));
    }

    // Torso
    if (landmarks.leftShoulder && landmarks.rightShoulder) {
      skeletonLines.push(createLine(landmarks.leftShoulder, landmarks.rightShoulder, 'shoulders'));
    }
    if (landmarks.leftShoulder && landmarks.leftHip) {
      skeletonLines.push(createLine(landmarks.leftShoulder, landmarks.leftHip, 'leftShoulder-leftHip'));
    }
    if (landmarks.rightShoulder && landmarks.rightHip) {
      skeletonLines.push(createLine(landmarks.rightShoulder, landmarks.rightHip, 'rightShoulder-rightHip'));
    }
    if (landmarks.leftHip && landmarks.rightHip) {
      skeletonLines.push(createLine(landmarks.leftHip, landmarks.rightHip, 'hips'));
    }

    // Left arm
    if (landmarks.leftShoulder && landmarks.leftElbow) {
      skeletonLines.push(createLine(landmarks.leftShoulder, landmarks.leftElbow, 'leftShoulder-leftElbow'));
    }
    if (landmarks.leftElbow && landmarks.leftWrist) {
      skeletonLines.push(createLine(landmarks.leftElbow, landmarks.leftWrist, 'leftElbow-leftWrist'));
    }

    // Right arm
    if (landmarks.rightShoulder && landmarks.rightElbow) {
      skeletonLines.push(createLine(landmarks.rightShoulder, landmarks.rightElbow, 'rightShoulder-rightElbow'));
    }
    if (landmarks.rightElbow && landmarks.rightWrist) {
      skeletonLines.push(createLine(landmarks.rightElbow, landmarks.rightWrist, 'rightElbow-rightWrist'));
    }

    // Left leg
    if (landmarks.leftHip && landmarks.leftKnee) {
      skeletonLines.push(createLine(landmarks.leftHip, landmarks.leftKnee, 'leftHip-leftKnee'));
    }
    if (landmarks.leftKnee && landmarks.leftAnkle) {
      skeletonLines.push(createLine(landmarks.leftKnee, landmarks.leftAnkle, 'leftKnee-leftAnkle'));
    }

    // Right leg
    if (landmarks.rightHip && landmarks.rightKnee) {
      skeletonLines.push(createLine(landmarks.rightHip, landmarks.rightKnee, 'rightHip-rightKnee'));
    }
    if (landmarks.rightKnee && landmarks.rightAnkle) {
      skeletonLines.push(createLine(landmarks.rightKnee, landmarks.rightAnkle, 'rightKnee-rightAnkle'));
    }

    // Joints
    if (landmarks.nose) skeletonJoints.push(createJoint(landmarks.nose, 'joint-nose'));
    if (landmarks.leftShoulder) skeletonJoints.push(createJoint(landmarks.leftShoulder, 'joint-leftShoulder'));
    if (landmarks.rightShoulder) skeletonJoints.push(createJoint(landmarks.rightShoulder, 'joint-rightShoulder'));
    if (landmarks.leftElbow) skeletonJoints.push(createJoint(landmarks.leftElbow, 'joint-leftElbow'));
    if (landmarks.rightElbow) skeletonJoints.push(createJoint(landmarks.rightElbow, 'joint-rightElbow'));
    if (landmarks.leftWrist) skeletonJoints.push(createJoint(landmarks.leftWrist, 'joint-leftWrist'));
    if (landmarks.rightWrist) skeletonJoints.push(createJoint(landmarks.rightWrist, 'joint-rightWrist'));
    if (landmarks.leftHip) skeletonJoints.push(createJoint(landmarks.leftHip, 'joint-leftHip'));
    if (landmarks.rightHip) skeletonJoints.push(createJoint(landmarks.rightHip, 'joint-rightHip'));
    if (landmarks.leftKnee) skeletonJoints.push(createJoint(landmarks.leftKnee, 'joint-leftKnee'));
    if (landmarks.rightKnee) skeletonJoints.push(createJoint(landmarks.rightKnee, 'joint-rightKnee'));
    if (landmarks.leftAnkle) skeletonJoints.push(createJoint(landmarks.leftAnkle, 'joint-leftAnkle'));
    if (landmarks.rightAnkle) skeletonJoints.push(createJoint(landmarks.rightAnkle, 'joint-rightAnkle'));

    return (
      <>
        {skeletonLines.filter(Boolean)}
        {skeletonJoints.filter(Boolean)}
      </>
    );
  };

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.placeholder}>
          <Icon name="camera-alt" size={64} color="#666" />
          <Text style={styles.placeholderText}>Camera not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDrill = drills.find((d) => d.id === selectedDrill);

  return (
    <SafeAreaView style={styles.container}>
      {!selectedDrill ? (
        // Drill Selection Menu
        <View style={styles.menuContainer}>
          <View style={styles.backButtonContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Surf Pose Coach</Text>
            <Text style={styles.menuSubtitle}>Select a drill to practice</Text>
          </View>

          <ScrollView 
            style={styles.drillsScrollView}
            contentContainerStyle={styles.drillsContainer}
            showsVerticalScrollIndicator={false}
          >
            {drills.map((drill, index) => {
              const stats = drillStats[drill.id] || { correctTime: 0, totalTime: 0, reps: 0, bestScore: 0 };
              const accuracy = stats.totalTime > 0 ? (stats.correctTime / stats.totalTime) * 100 : 0;
              
              return (
                <TouchableOpacity
                  key={drill.id}
                  style={[styles.drillCard, { borderLeftColor: drill.color, borderLeftWidth: 6 }]}
                  onPress={() => handleStartPractice(drill.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.drillCardHeader}>
                    <View style={[styles.drillIconContainer, { backgroundColor: drill.color + '20' }]}>
                      <Icon name={drill.icon} size={32} color={drill.color} />
                    </View>
                    <View style={styles.drillCardInfo}>
                      <View style={styles.drillCardTitleRow}>
                        <Text style={styles.drillCardNumber}>{drill.key}</Text>
                        <Text style={styles.drillCardName}>{drill.name}</Text>
                      </View>
                      <Text style={styles.drillCardDescription}>{drill.description}</Text>
                      <Text style={styles.drillCardInstruction}>{drill.instruction}</Text>
                    </View>
                  </View>
                  
                  {stats.bestScore > 0 && (
                    <View style={styles.drillStatsRow}>
                      <View style={styles.statItem}>
                        <Icon name="star" size={16} color="#FFCC00" />
                        <Text style={styles.statText}>Best: {stats.bestScore.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Icon name="check-circle" size={16} color="#34C759" />
                        <Text style={styles.statText}>Reps: {stats.reps}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Icon name="trending-up" size={16} color="#5AC8FA" />
                        <Text style={styles.statText}>{accuracy.toFixed(0)}%</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.menuFooter}>
            <Text style={styles.footerText}>
              Tip: Use the side panel buttons (1-8) to quickly switch between drills during practice
            </Text>
          </View>
        </View>
      ) : (
        // Practice View
        <View style={styles.cameraContainer}>
          {isExpoGo ? (
            <View style={[styles.cameraContainer, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
              <Icon name="camera-alt" size={80} color="#666" />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>
                Camera Not Available in Expo Go
              </Text>
              <Text style={{ color: '#aaa', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
                To use pose detection features, you need to build a development build:{'\n\n'}
                Run: expo run:android or expo run:ios
              </Text>
              <TouchableOpacity
                style={{ marginTop: 30, backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 }}
                onPress={() => setShowMenu(true)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          ) : hasPermission ? (
            <>
              {Camera && device ? (
                <Camera
                  ref={camera}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={isRecording && hasPermission}
                  photo={true}
                />
              ) : (
                <View style={[styles.cameraContainer, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff' }}>Camera not available</Text>
                </View>
              )}
              
              {/* Top Overlay - Drill Info & Score */}
              <View style={styles.overlayTop}>
                {/* Connection Status & Processing Indicator */}
                <View style={styles.statusBar}>
                  <View style={styles.statusIndicator}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: connectionStatus === 'connected' ? '#34C759' : connectionStatus === 'error' ? '#FF3B30' : '#FFCC00' }
                    ]} />
                    <Text style={styles.statusText}>
                      {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Disconnected'}
                    </Text>
                    {isProcessingPose && (
                      <View style={styles.processingIndicator}>
                        <Icon name="sync" size={12} color="#fff" />
                        <Text style={styles.processingText}>Processing...</Text>
                      </View>
                    )}
                  </View>
                  {!useRealPoseDetection && (
                    <View style={styles.mockModeBadge}>
                      <Icon name="info" size={12} color="#FFCC00" />
                      <Text style={styles.mockModeText}>Mock Mode</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.skeletonToggle}
                    onPress={() => setShowSkeleton(!showSkeleton)}
                  >
                    <Icon name={showSkeleton ? "visibility" : "visibility-off"} size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.skeletonToggle, { marginLeft: 8 }]}
                    onPress={() => setShowReferenceSkeleton(!showReferenceSkeleton)}
                  >
                    <Icon name={showReferenceSkeleton ? "account-circle" : "account-circle-outline"} size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.topBar}>
                  <TouchableOpacity
                    style={[styles.menuButton, { zIndex: 15, pointerEvents: 'auto' }]}
                    onPress={() => {
                      if (isRecording) handleStopPractice();
                      setSelectedDrill(null);
                    }}
                  >
                    <Icon name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <View style={styles.drillTitleContainer}>
                    <Text style={styles.drillTitleOverlay}>
                      {currentDrill?.key}. {currentDrill?.name}
                    </Text>
                  </View>
                  
                  {/* Camera Toggle Button */}
                  <TouchableOpacity
                    style={[styles.cameraToggleButton, { zIndex: 15, pointerEvents: 'auto' }]}
                    onPress={() => setIsFrontCamera(!isFrontCamera)}
                  >
                    <Icon name={isFrontCamera ? "camera-front" : "camera-rear"} size={18} color="#fff" />
                    <Text style={styles.cameraToggleText}>{isFrontCamera ? "Front" : "Back"}</Text>
                  </TouchableOpacity>
                  
                  {/* Timer Display */}
                  {isRecording && (
                    <View style={[styles.timerContainer, { zIndex: 15, pointerEvents: 'auto' }]}>
                      <Icon name="timer" size={16} color="#fff" />
                      <Text style={styles.timerText}>
                        {Math.floor(drillTimer / 60)}:{(drillTimer % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                  
                  {/* CRITICAL FIX: Top-Right Stop Button (Always Accessible) */}
                  {isRecording && (
                    <TouchableOpacity
                      style={styles.stopButtonTopRight}
                      onPress={handleStopPractice}
                      activeOpacity={0.8}
                    >
                      <Icon name="stop" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {personDetected ? (
                    <View style={styles.scoreGroupContainer}>
                      <View style={[styles.scoreContainer, { backgroundColor: getScoreColor() + 'CC' }]}>
                        <AnimatedText style={[styles.scoreText, { opacity: scoreAnimation.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0.5, 1],
                        }) }]}>
                          {score}%
                        </AnimatedText>
                        {scoreTrend !== 'stable' && (
                          <Icon 
                            name={scoreTrend === 'up' ? 'trending-up' : 'trending-down'} 
                            size={12} 
                            color="#fff" 
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                      {averageScore > 0 && (
                        <Text style={styles.averageScoreText}>Avg: {averageScore}%</Text>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.scoreContainer, { backgroundColor: 'rgba(128, 128, 128, 0.8)' }]}>
                      <Text style={styles.scoreText}>--</Text>
                    </View>
                  )}
                </View>

                {/* Detection Status Indicator */}
                {isRecording && (
                  <View style={styles.detectionStatusContainer}>
                    <View style={styles.detectionStatusBar}>
                      <View 
                        style={[
                          styles.detectionStatusFill, 
                          { 
                            width: `${detectionConfidence}%`,
                            backgroundColor: detectionStage === 'full' ? '#34C759' : 
                                            detectionStage === 'partial' ? '#FFCC00' : 
                                            detectionStage === 'preview' ? '#FF9500' : '#FF3B30'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.detectionStatusText}>
                      {detectionStage === 'full' ? '✓ Ready' : 
                       detectionStage === 'partial' ? `Positioning... ${Math.round(detectionConfidence)}%` :
                       detectionStage === 'preview' ? `Detecting ${Math.round(detectionConfidence)}%` :
                       'Waiting...'}
                    </Text>
                  </View>
                )}

                {/* Phase 3.1: AR Reference Skeleton Overlay - Show ideal pose */}
                {isRecording && showReferenceSkeleton && selectedDrill && detectionStage !== 'none' && (
                  <ReferenceSkeletonOverlay
                    drillId={selectedDrill}
                    screenWidth={width}
                    screenHeight={height}
                    opacity={0.4}
                  />
                )}
                
                {/* Skeleton Overlay - Show preview even with low confidence to help user position */}
                {showSkeleton && currentLandmarks && detectionStage !== 'none' && (
                  <View style={styles.skeletonOverlay} pointerEvents="none">
                    {renderSkeleton(currentLandmarks, detectionStage)}
                  </View>
                )}
                
                {/* Phase 2.3: Angle Arc Overlays - Visual angle guides at joints */}
                {isRecording && currentLandmarks && currentBodyMetrics && selectedDrill && detectionStage !== 'none' && (
                  <View style={styles.angleArcsOverlay} pointerEvents="none">
                    {/* Knee angle arcs */}
                    {currentLandmarks.leftHip && currentLandmarks.leftKnee && currentLandmarks.leftAnkle && currentBodyMetrics.kneeAngles.left > 0 && (
                      <AngleArcOverlay
                        joint={currentLandmarks.leftKnee}
                        point1={currentLandmarks.leftHip}
                        point2={currentLandmarks.leftAnkle}
                        currentAngle={currentBodyMetrics.kneeAngles.left}
                        targetAngle={selectedDrill === 'stance' ? 115 : selectedDrill === 'tube_stance' ? 90 : selectedDrill === 'bottom_turn' ? 100 : 115}
                        targetRange={selectedDrill === 'stance' ? [90, 140] : selectedDrill === 'tube_stance' ? [70, 90] : selectedDrill === 'bottom_turn' ? [80, 120] : [90, 140]}
                        screenWidth={width}
                        screenHeight={height}
                      />
                    )}
                    {currentLandmarks.rightHip && currentLandmarks.rightKnee && currentLandmarks.rightAnkle && currentBodyMetrics.kneeAngles.right > 0 && (
                      <AngleArcOverlay
                        joint={currentLandmarks.rightKnee}
                        point1={currentLandmarks.rightHip}
                        point2={currentLandmarks.rightAnkle}
                        currentAngle={currentBodyMetrics.kneeAngles.right}
                        targetAngle={selectedDrill === 'stance' ? 115 : selectedDrill === 'tube_stance' ? 90 : selectedDrill === 'bottom_turn' ? 100 : 115}
                        targetRange={selectedDrill === 'stance' ? [90, 140] : selectedDrill === 'tube_stance' ? [70, 90] : selectedDrill === 'bottom_turn' ? [80, 120] : [90, 140]}
                        screenWidth={width}
                        screenHeight={height}
                      />
                    )}
                    {/* Hip angle arcs (for stance drill) */}
                    {selectedDrill === 'stance' && currentLandmarks.leftShoulder && currentLandmarks.leftHip && currentLandmarks.leftKnee && currentBodyMetrics.hipAngles.left > 0 && (
                      <AngleArcOverlay
                        joint={currentLandmarks.leftHip}
                        point1={currentLandmarks.leftShoulder}
                        point2={currentLandmarks.leftKnee}
                        currentAngle={currentBodyMetrics.hipAngles.left}
                        targetAngle={155}
                        targetRange={[140, 170]}
                        screenWidth={width}
                        screenHeight={height}
                      />
                    )}
                    {selectedDrill === 'stance' && currentLandmarks.rightShoulder && currentLandmarks.rightHip && currentLandmarks.rightKnee && currentBodyMetrics.hipAngles.right > 0 && (
                      <AngleArcOverlay
                        joint={currentLandmarks.rightHip}
                        point1={currentLandmarks.rightShoulder}
                        point2={currentLandmarks.rightKnee}
                        currentAngle={currentBodyMetrics.hipAngles.right}
                        targetAngle={155}
                        targetRange={[140, 170]}
                        screenWidth={width}
                        screenHeight={height}
                      />
                    )}
                  </View>
                )}
                
                {/* Dynamic Visual Guide Rectangle - Phase 1.2 */}
                {isRecording && (
                  <DynamicGuideRectangle
                    personBoundingBox={personBoundingBox}
                    guideRectangle={guideRectangle}
                    calibrationStatus={calibrationStatus}
                    detectionQuality={detectionQuality}
                    screenWidth={width}
                    screenHeight={height}
                  />
                )}

                {/* Phase 3.2: Live Score Bar - Vertical bar showing correctness score */}
                {isRecording && personDetected && (
                  <View style={styles.liveScoreBarContainer} pointerEvents="none">
                    <LiveScoreBar score={score} height={height * 0.6} />
                  </View>
                )}

                {/* Real-time Feedback Display */}
                {personDetected && feedback.length > 0 && (
                  <AnimatedView 
                    style={[
                      styles.feedbackContainer,
                      {
                        opacity: feedbackAnimation,
                        transform: [{
                          translateY: feedbackAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                          }),
                        }],
                      },
                    ]}
                  >
                    {feedback
                      .sort((a, b) => b.priority - a.priority)
                      .slice(0, 3)
                      .map((item, index) => (
                        <View
                          key={index}
                          style={[
                            styles.feedbackItem,
                            { backgroundColor: getFeedbackColor(item.type) + 'E6' },
                          ]}
                        >
                          <Icon
                            name={
                              item.type === 'success'
                                ? 'check-circle'
                                : item.type === 'warning'
                                ? 'warning'
                                : 'error'
                            }
                            size={24}
                            color="#fff"
                            style={styles.feedbackIcon}
                          />
                          <Text style={styles.feedbackText}>{item.text}</Text>
                        </View>
                      ))}
                  </AnimatedView>
                )}
              </View>

              {/* Side Panel - Quick Drill Switch - Phase 3.4: Hide when recording */}
              {!isRecording && (
                <View style={styles.sidePanel}>
                  <ScrollView 
                    style={styles.drillButtonsContainer}
                    contentContainerStyle={styles.drillButtonsContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {drills.map((drill) => (
                      <TouchableOpacity
                        key={drill.id}
                        style={[
                          styles.drillButton,
                          selectedDrill === drill.id && styles.drillButtonActive,
                          { borderColor: drill.color },
                        ]}
                        onPress={() => handleDrillSwitch(drill.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.drillButtonText, selectedDrill === drill.id && styles.drillButtonTextActive]}>
                          {drill.key}
                        </Text>
                        <Icon
                          name={drill.icon}
                          size={20}
                          color={selectedDrill === drill.id ? '#fff' : drill.color}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Bottom Overlay - Instructions & Controls */}
              <View style={styles.overlayBottom}>
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionText}>{currentDrill?.instruction}</Text>
                </View>
                
                <View style={styles.controlsRow}>
                  {!isRecording ? (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.startButton]}
                      onPress={() => setIsRecording(true)}
                    >
                      <Icon name="play-arrow" size={24} color="#fff" />
                      <Text style={styles.controlButtonText}>Start Practice</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.stopButton]}
                      onPress={handleStopPractice}
                    >
                      <Icon name="stop" size={24} color="#fff" />
                      <Text style={styles.controlButtonText}>Stop</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Progress Indicator */}
                {isRecording && selectedDrill && personDetected && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <AnimatedView
                        style={[
                          styles.progressFill,
                          {
                            width: scoreAnimation.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: getScoreColor(),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>Form Accuracy</Text>
                  </View>
                )}
                
                {/* Person Detection Status - Bottom, non-intrusive (FIXED POSITION) */}
                {isRecording && detectionStage === 'none' && (
                  <View style={styles.noPersonContainer} pointerEvents="none">
                    <Icon name="person-off" size={20} color="#fff" />
                    <Text style={styles.noPersonText}>No person detected</Text>
                    <Text style={styles.noPersonSubtext}>
                      Step into view and face the camera
                    </Text>
                    {detectionConfidence > 0 && (
                      <Text style={styles.detectionHintText}>
                        Detection: {Math.round(detectionConfidence)}%
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.placeholder}>
              <Icon name="camera-alt" size={64} color="#666" />
              <Text style={styles.placeholderText}>Camera permission required</Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={checkCameraPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu Styles
  menuContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  menuHeader: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  drillsScrollView: {
    flex: 1,
  },
  drillsContainer: {
    padding: 16,
  },
  drillCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drillCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  drillIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drillCardInfo: {
    flex: 1,
  },
  drillCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  drillCardNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
    width: 24,
  },
  drillCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  drillCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  drillCardInstruction: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    lineHeight: 16,
  },
  drillStatsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  menuFooter: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
  },
  // Camera View Styles
  cameraContainer: {
    flex: 1,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    zIndex: 10,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  processingText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 4,
  },
  mockModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC00',
  },
  mockModeText: {
    fontSize: 10,
    color: '#FFCC00',
    fontWeight: '600',
    marginLeft: 4,
  },
  skeletonToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    pointerEvents: 'none',
  },
  angleArcsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    pointerEvents: 'none',
  },
  liveScoreBarContainer: {
    position: 'absolute',
    right: 20,
    top: '20%',
    bottom: '20%',
    zIndex: 7,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00FF00',
    opacity: 0.7,
  },
  detectionStatusContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    padding: 6,
    paddingHorizontal: 10,
    maxWidth: 150,  // Smaller, non-intrusive
    pointerEvents: 'none',  // Don't block touches
  },
  detectionStatusBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  detectionStatusFill: {
    height: '100%',
    borderRadius: 2,
  },
  detectionStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'left',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  scoreGroupContainer: {
    alignItems: 'flex-end',
  },
  averageScoreText: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
    opacity: 0.8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drillTitleContainer: {
    flex: 1,
  },
  drillTitleOverlay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scoreContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedbackContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  feedbackIcon: {
    marginRight: 12,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 80,
    bottom: 200,
    width: 60,
    zIndex: 10,
  },
  drillButtonsContainer: {
    flex: 1,
  },
  drillButtonsContent: {
    paddingVertical: 8,
  },
  drillButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 6,
  },
  drillButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderColor: '#fff',
  },
  drillButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  drillButtonTextActive: {
    color: '#fff',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  instructionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 150,
    gap: 8,
    zIndex: 10,  // Ensure buttons are always on top
    pointerEvents: 'auto',  // Ensure touches work
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  stopButtonTopRight: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25, // Always on top (highest priority)
    pointerEvents: 'auto', // Ensure touches work
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8, // Android shadow (higher)
    borderWidth: 2,
    borderColor: '#fff',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noPersonContainer: {
    position: 'absolute',
    bottom: 320,  // Moved higher to avoid blocking controls
    left: '50%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // More transparent
    padding: 10,
    borderRadius: 8,
    maxWidth: 220,  // Smaller width
    transform: [{ translateX: -110 }],  // Center horizontally
    pointerEvents: 'none',  // Don't block touches
    zIndex: 1,  // Below buttons (controls are zIndex: 10+)
  },
  noPersonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  noPersonSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  detectionHintText: {
    color: '#FFCC00',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  cameraToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
    zIndex: 10,  // Ensure button is always on top
    pointerEvents: 'auto',  // Ensure touches work
  },
  cameraToggleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  guideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  guideFrame: {
    width: '70%',
    height: '80%',
    borderWidth: 2,
    borderColor: '#FFCC00',
    borderStyle: 'dashed',
    borderRadius: 8,
    opacity: 0.5,
  },
  guideText: {
    position: 'absolute',
    top: '15%',
    color: '#FFCC00',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dynamicGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  dynamicGuideFrame: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dynamicGuideText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    transform: [{ translateX: -100 }], // Center horizontally
  },
  dynamicGuideQuality: {
    position: 'absolute',
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    transform: [{ translateX: -40 }], // Center horizontally
  },
});
