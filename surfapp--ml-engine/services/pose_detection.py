"""
Pose Detection Service
Extracts MediaPipe pose landmarks from images for React Native app
"""

import cv2
import mediapipe as mp
import numpy as np
import base64
import time
from typing import Dict, List, Optional, Tuple
from io import BytesIO
from PIL import Image

# Initialize MediaPipe Pose (reusable instance)
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Configuration - Optimized for maximum detection sensitivity
DETECTION_CONFIDENCE = 0.2  # Very low threshold for maximum sensitivity
TRACKING_CONFIDENCE = 0.2   # Very low threshold for better tracking

# Global pose detector instance (reused for performance)
_pose_detector = None

# Phase 5: Previous frame data for velocity tracking (stored per session)
_previous_frame_data = {}

def get_pose_detector():
    """Get or create MediaPipe pose detector instance (singleton pattern)"""
    global _pose_detector
    if _pose_detector is None:
        _pose_detector = mp_pose.Pose(
            min_detection_confidence=DETECTION_CONFIDENCE,
            min_tracking_confidence=TRACKING_CONFIDENCE,
            model_complexity=2,  # Maximum accuracy (handles occlusions better)
            static_image_mode=False,  # Video stream mode for better performance
            enable_segmentation=False,  # Disable for performance
            smooth_landmarks=True,  # Enable smoothing for stable tracking
        )
    return _pose_detector

def base64_to_image(base64_string: str) -> np.ndarray:
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_bgr
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

def extract_landmarks(landmarks) -> Dict:
    """
    Extract MediaPipe landmarks and convert to JSON-serializable format
    Returns landmarks in format compatible with React Native app
    """
    if not landmarks:
        return None
    
    # Map MediaPipe landmarks to our format
    landmark_map = {
        'nose': mp_pose.PoseLandmark.NOSE,
        'leftEye': mp_pose.PoseLandmark.LEFT_EYE_INNER,
        'rightEye': mp_pose.PoseLandmark.RIGHT_EYE_INNER,
        'leftEar': mp_pose.PoseLandmark.LEFT_EAR,
        'rightEar': mp_pose.PoseLandmark.RIGHT_EAR,
        'leftShoulder': mp_pose.PoseLandmark.LEFT_SHOULDER,
        'rightShoulder': mp_pose.PoseLandmark.RIGHT_SHOULDER,
        'leftElbow': mp_pose.PoseLandmark.LEFT_ELBOW,
        'rightElbow': mp_pose.PoseLandmark.RIGHT_ELBOW,
        'leftWrist': mp_pose.PoseLandmark.LEFT_WRIST,
        'rightWrist': mp_pose.PoseLandmark.RIGHT_WRIST,
        'leftHip': mp_pose.PoseLandmark.LEFT_HIP,
        'rightHip': mp_pose.PoseLandmark.RIGHT_HIP,
        'leftKnee': mp_pose.PoseLandmark.LEFT_KNEE,
        'rightKnee': mp_pose.PoseLandmark.RIGHT_KNEE,
        'leftAnkle': mp_pose.PoseLandmark.LEFT_ANKLE,
        'rightAnkle': mp_pose.PoseLandmark.RIGHT_ANKLE,
    }
    
    result = {}
    
    for key, landmark_enum in landmark_map.items():
        try:
            lm = landmarks.landmark[landmark_enum.value]
            # Always return coordinates, even if visibility is low
            # Don't filter by visibility here - let frontend decide
            result[key] = {
                'x': float(lm.x),
                'y': float(lm.y),
                'z': float(lm.z) if hasattr(lm, 'z') else 0.0,
                'visibility': float(lm.visibility) if hasattr(lm, 'visibility') else 0.5
            }
        except (IndexError, AttributeError):
            result[key] = None
    
    return result

def calculate_person_bounding_box(landmarks: Dict) -> Optional[Dict]:
    """
    Calculate bounding box of person from landmarks
    Returns normalized coordinates (0-1) with center point
    """
    if not landmarks:
        return None
    
    # Get all valid landmark positions
    valid_positions = []
    for key, landmark in landmarks.items():
        if landmark and landmark is not None:
            valid_positions.append({
                'x': landmark.get('x', 0),
                'y': landmark.get('y', 0)
            })
    
    if len(valid_positions) < 2:
        return None
    
    # Find min/max x and y
    x_coords = [p['x'] for p in valid_positions]
    y_coords = [p['y'] for p in valid_positions]
    
    min_x = min(x_coords)
    max_x = max(x_coords)
    min_y = min(y_coords)
    max_y = max(y_coords)
    
    width = max_x - min_x
    height = max_y - min_y
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    
    # Add padding (10% of dimensions)
    padding_x = width * 0.1
    padding_y = height * 0.1
    
    return {
        'x': max(0.0, min_x - padding_x),
        'y': max(0.0, min_y - padding_y),
        'width': min(1.0, width + 2 * padding_x),
        'height': min(1.0, height + 2 * padding_y),
        'centerX': center_x,
        'centerY': center_y
    }

def calculate_detection_quality(landmarks: Dict) -> float:
    """
    Calculate detection quality score (0-1) based on:
    - Number of visible keypoints
    - Visibility scores
    - Geometric validity
    - Body completeness
    """
    if not landmarks:
        return 0.0
    
    # Count valid landmarks
    valid_count = sum(1 for v in landmarks.values() if v is not None)
    total_expected = 16  # Total landmarks we track
    
    # Calculate average visibility
    visibilities = []
    for landmark in landmarks.values():
        if landmark and landmark is not None:
            vis = landmark.get('visibility', 0.5)
            visibilities.append(vis)
    
    avg_visibility = np.mean(visibilities) if visibilities else 0.0
    
    # Check body completeness
    head_landmarks = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar']
    torso_landmarks = ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip']
    leg_landmarks = ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle']
    
    head_count = sum(1 for k in head_landmarks if landmarks.get(k) is not None)
    torso_count = sum(1 for k in torso_landmarks if landmarks.get(k) is not None)
    leg_count = sum(1 for k in leg_landmarks if landmarks.get(k) is not None)
    
    completeness_score = (
        (head_count / len(head_landmarks)) * 0.2 +
        (torso_count / len(torso_landmarks)) * 0.4 +
        (leg_count / len(leg_landmarks)) * 0.4
    )
    
    # Geometric validity check (basic)
    l_shoulder = landmarks.get('leftShoulder')
    r_shoulder = landmarks.get('rightShoulder')
    l_hip = landmarks.get('leftHip')
    r_hip = landmarks.get('rightHip')
    
    geometric_valid = 1.0
    if l_shoulder and r_shoulder and l_hip and r_hip:
        # Check if shoulders are roughly horizontal
        shoulder_diff = abs(l_shoulder.get('y', 0) - r_shoulder.get('y', 0))
        if shoulder_diff > 0.2:  # Too tilted
            geometric_valid *= 0.8
        
        # Check if hips are below shoulders
        avg_shoulder_y = (l_shoulder.get('y', 0) + r_shoulder.get('y', 0)) / 2
        avg_hip_y = (l_hip.get('y', 0) + r_hip.get('y', 0)) / 2
        if avg_hip_y <= avg_shoulder_y:  # Hips above shoulders (impossible)
            geometric_valid *= 0.5
    
    # Combine scores
    count_score = valid_count / total_expected
    visibility_score = avg_visibility
    
    # Weighted combination
    quality = (
        count_score * 0.3 +
        visibility_score * 0.3 +
        completeness_score * 0.2 +
        geometric_valid * 0.2
    )
    
    return float(np.clip(quality, 0.0, 1.0))

def check_body_completeness(landmarks: Dict) -> Dict:
    """
    Check which body parts are visible
    Returns dict with head, torso, legs, feet visibility
    """
    if not landmarks:
        return {
            'head': False,
            'torso': False,
            'legs': False,
            'feet': False
        }
    
    # Head: nose or eyes visible
    head = landmarks.get('nose') is not None or \
            landmarks.get('leftEye') is not None or \
            landmarks.get('rightEye') is not None
    
    # Torso: shoulders and hips visible
    torso = landmarks.get('leftShoulder') is not None and \
            landmarks.get('rightShoulder') is not None and \
            landmarks.get('leftHip') is not None and \
            landmarks.get('rightHip') is not None
    
    # Legs: knees visible
    legs = landmarks.get('leftKnee') is not None and \
           landmarks.get('rightKnee') is not None
    
    # Feet: ankles visible
    feet = landmarks.get('leftAnkle') is not None and \
           landmarks.get('rightAnkle') is not None
    
    return {
        'head': head,
        'torso': torso,
        'legs': legs,
        'feet': feet
    }

def determine_calibration_status(landmarks: Dict, bounding_box: Optional[Dict]) -> str:
    """
    Determine calibration status based on detection quality and body completeness
    Returns: 'ready' | 'too_close' | 'too_far' | 'off_center' | 'not_detected'
    """
    if not landmarks or not bounding_box:
        return 'not_detected'
    
    completeness = check_body_completeness(landmarks)
    quality = calculate_detection_quality(landmarks)
    
    # Check if too close (feet not visible but head/torso are)
    if completeness['head'] and completeness['torso'] and not completeness['feet']:
        return 'too_close'
    
    # Check if too far (only head visible, no torso/legs)
    if completeness['head'] and not completeness['torso']:
        return 'too_far'
    
    # Check if off center (bounding box center not in middle 60% of screen)
    center_x = bounding_box.get('centerX', 0.5)
    if center_x < 0.2 or center_x > 0.8:
        return 'off_center'
    
    # Check if ready (good quality, complete body, centered)
    if quality > 0.7 and completeness['torso'] and completeness['legs']:
        return 'ready'
    
    # Default to positioning if detected but not ready
    if quality > 0.3:
        return 'positioning'
    
    return 'not_detected'

def calculate_stability_score(landmarks: Dict) -> float:
    """
    Calculate stability score based on variance of hip and shoulder landmarks
    Returns a score from 0.0 to 1.0, where 1.0 is most stable
    """
    if not landmarks:
        return 0.0
    
    # Key landmarks for stability calculation
    key_points = ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip']
    positions = []
    
    for key in key_points:
        if landmarks.get(key) and landmarks[key] is not None:
            pos = landmarks[key]
            positions.append([pos.get('x', 0), pos.get('y', 0), pos.get('z', 0)])
    
    if len(positions) < 4:
        return 0.0
    
    positions = np.array(positions)
    
    # Calculate variance for each axis
    x_variance = np.var(positions[:, 0])
    y_variance = np.var(positions[:, 1])
    z_variance = np.var(positions[:, 2])
    
    # Lower variance = more stable
    # Normalize: variance of 0.01 = score of 0.5, variance of 0.001 = score of 0.95
    # Use exponential decay for scoring
    x_score = np.exp(-x_variance * 50)
    y_score = np.exp(-y_variance * 50)
    z_score = np.exp(-z_variance * 50)
    
    # Average the scores
    stability_score = (x_score + y_score + z_score) / 3.0
    
    # Clamp to [0, 1]
    return float(np.clip(stability_score, 0.0, 1.0))

def assess_lighting(image: np.ndarray) -> str:
    """
    Phase 5: Assess lighting conditions from image
    Returns: 'good' | 'poor' | 'too_bright' | 'too_dark'
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Calculate mean brightness
    mean_brightness = np.mean(gray)
    
    # Calculate standard deviation (contrast indicator)
    std_brightness = np.std(gray)
    
    if mean_brightness < 50:
        return 'too_dark'
    elif mean_brightness > 200:
        return 'too_bright'
    elif std_brightness < 20:
        return 'poor'  # Low contrast
    else:
        return 'good'

def estimate_distance(landmarks: Dict, image_shape: Tuple[int, int]) -> str:
    """
    Phase 5: Estimate distance based on body size in frame
    Returns: 'optimal' | 'too_close' | 'too_far'
    """
    if not landmarks:
        return 'too_far'
    
    # Get bounding box
    bbox = calculate_person_bounding_box(landmarks)
    if not bbox:
        return 'too_far'
    
    # Calculate body height as percentage of image
    body_height = bbox['height']
    
    # Optimal range: body should be 60-80% of image height
    if body_height > 0.85:
        return 'too_close'
    elif body_height < 0.4:
        return 'too_far'
    else:
        return 'optimal'

def calculate_velocity(landmarks: Dict, previous_landmarks: Optional[Dict], time_delta: float) -> Optional[Dict]:
    """
    Phase 5.2: Calculate velocity vectors for key points
    Returns velocity data for shoulders, hips, and other key points
    
    Args:
        landmarks: Current frame landmarks
        previous_landmarks: Previous frame landmarks (from _previous_frame_data)
        time_delta: Time difference in seconds
    
    Returns:
        Dictionary with velocity vectors for key points, or None if insufficient data
    """
    if not landmarks or not previous_landmarks or time_delta <= 0:
        return None
    
    velocity_data = {}
    
    # Key points for velocity tracking
    key_points = [
        'leftShoulder', 'rightShoulder',
        'leftHip', 'rightHip',
        'leftKnee', 'rightKnee',
        'nose'
    ]
    
    for key in key_points:
        current_lm = landmarks.get(key)
        previous_lm = previous_landmarks.get(key)
        
        if current_lm and previous_lm and current_lm is not None and previous_lm is not None:
            # Calculate velocity (change in position / time)
            vx = (current_lm.get('x', 0) - previous_lm.get('x', 0)) / time_delta
            vy = (current_lm.get('y', 0) - previous_lm.get('y', 0)) / time_delta
            vz = (current_lm.get('z', 0) - previous_lm.get('z', 0)) / time_delta if current_lm.get('z') is not None and previous_lm.get('z') is not None else 0.0
            
            # Calculate magnitude
            magnitude = np.sqrt(vx**2 + vy**2 + vz**2)
            
            velocity_data[key] = {
                'x': float(vx),
                'y': float(vy),
                'z': float(vz),
                'magnitude': float(magnitude)
            }
    
    # Calculate average shoulder vertical velocity (for pop-up detection)
    if 'leftShoulder' in velocity_data and 'rightShoulder' in velocity_data:
        avg_shoulder_vy = (velocity_data['leftShoulder']['y'] + velocity_data['rightShoulder']['y']) / 2.0
        velocity_data['averageShoulderVerticalVelocity'] = float(avg_shoulder_vy)
    
    # Calculate hip center velocity (for stability analysis)
    if 'leftHip' in velocity_data and 'rightHip' in velocity_data:
        avg_hip_vx = (velocity_data['leftHip']['x'] + velocity_data['rightHip']['x']) / 2.0
        avg_hip_vy = (velocity_data['leftHip']['y'] + velocity_data['rightHip']['y']) / 2.0
        velocity_data['hipCenterVelocity'] = {
            'x': float(avg_hip_vx),
            'y': float(avg_hip_vy),
            'magnitude': float(np.sqrt(avg_hip_vx**2 + avg_hip_vy**2))
        }
    
    return velocity_data if velocity_data else None

def detect_pose_from_base64(base64_image: str, session_id: str = None) -> Dict:
    """
    Main function: Detect pose from base64 encoded image
    Returns landmarks in format compatible with React Native app
    """
    try:
        # Convert base64 to image
        image = base64_to_image(base64_image)
        image_shape = image.shape[:2]  # (height, width) - Phase 5
        
        # Phase 5: Assess lighting
        lighting = assess_lighting(image)
        
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Get pose detector
        pose = get_pose_detector()
        
        # Process image
        results = pose.process(image_rgb)
        
        # Extract landmarks if MediaPipe detected anything
        if results.pose_landmarks:
            landmarks = extract_landmarks(results.pose_landmarks)
            
            # Count valid landmarks (not None)
            valid_landmarks = sum(1 for v in landmarks.values() if v is not None)
            
            # Calculate bounding box
            bounding_box = calculate_person_bounding_box(landmarks)
            
            # Calculate detection quality
            detection_quality = calculate_detection_quality(landmarks)
            
            # Check body completeness
            body_completeness = check_body_completeness(landmarks)
            
            # Determine calibration status
            calibration_status = determine_calibration_status(landmarks, bounding_box)
            
            # Phase 5: Estimate distance
            estimated_distance = estimate_distance(landmarks, image_shape)
            
            # If we have ANY landmarks (even with low visibility), consider it a detection
            # Frontend will handle visibility filtering
            person_detected = valid_landmarks >= 2  # Very lenient threshold
            
            # Calculate average visibility
            visibilities = [lm.get('visibility', 0.5) for lm in landmarks.values() 
                          if lm is not None and lm.get('visibility') is not None]
            avg_visibility = np.mean(visibilities) if visibilities else 0.0
            
            # Phase 5.2: Calculate velocity if previous frame data exists
            velocity_data = None
            if session_id and session_id in _previous_frame_data:
                prev_data = _previous_frame_data[session_id]
                prev_landmarks = prev_data.get('landmarks')
                prev_timestamp = prev_data.get('timestamp')
                current_timestamp = time.time()
                time_delta = current_timestamp - prev_timestamp if prev_timestamp else 0.1  # Default to 0.1s if no timestamp
                
                if prev_landmarks and time_delta > 0:
                    velocity_data = calculate_velocity(landmarks, prev_landmarks, time_delta)
            
            # Phase 5: Store current frame data for next velocity calculation
            if session_id:
                _previous_frame_data[session_id] = {
                    'landmarks': landmarks,
                    'timestamp': time.time(),
                }
            
            if person_detected:
                stability_score = calculate_stability_score(landmarks)
                return {
                    'success': True,
                    'personDetected': True,
                    'landmarks': landmarks,  # Always return landmarks if they exist
                    'confidence': 0.9,
                    'stability_score': stability_score,
                    'landmark_count': valid_landmarks,
                    'boundingBox': bounding_box,
                    'detectionQuality': detection_quality,
                    'bodyCompleteness': body_completeness,
                    'calibrationStatus': calibration_status,
                    'averageVisibility': float(avg_visibility),
                    'lighting': lighting,  # Phase 5
                    'estimatedDistance': estimated_distance,  # Phase 5
                    'velocity': velocity_data,  # Phase 5.2
                }
            else:
                # Return landmarks even if not fully detected (for preview)
                return {
                    'success': True,
                    'personDetected': False,
                    'landmarks': landmarks,  # Return landmarks for preview
                    'confidence': 0.3,
                    'stability_score': 0.0,
                    'landmark_count': valid_landmarks,
                    'boundingBox': bounding_box,
                    'detectionQuality': detection_quality,
                    'bodyCompleteness': body_completeness,
                    'calibrationStatus': calibration_status,
                    'averageVisibility': float(avg_visibility),
                    'velocity': velocity_data,  # Phase 5.2
                }
        else:
            return {
                'success': True,
                'personDetected': False,
                'landmarks': None,
                'confidence': 0.0,
                'stability_score': 0.0,
                'landmark_count': 0,
                'boundingBox': None,
                'detectionQuality': 0.0,
                'bodyCompleteness': {
                    'head': False,
                    'torso': False,
                    'legs': False,
                    'feet': False
                },
                'calibrationStatus': 'not_detected',
                'averageVisibility': 0.0
            }
            
    except Exception as e:
        return {
            'success': False,
            'personDetected': False,
            'landmarks': None,
            'error': str(e),
            'confidence': 0.0,
            'stability_score': 0.0,
            'landmark_count': 0,
            'boundingBox': None,
            'detectionQuality': 0.0,
            'bodyCompleteness': {
                'head': False,
                'torso': False,
                'legs': False,
                'feet': False
            },
            'calibrationStatus': 'not_detected',
            'averageVisibility': 0.0,
            'lighting': 'poor',  # Phase 5
            'estimatedDistance': 'too_far',  # Phase 5
            'velocity': None,
        }

def detect_pose_from_image(image: np.ndarray) -> Dict:
    """
    Detect pose from OpenCV image (numpy array)
    """
    try:
        # Convert BGR to RGB for MediaPipe
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
        
        # Get pose detector
        pose = get_pose_detector()
        
        # Process image
        results = pose.process(image_rgb)
        
        # Extract landmarks if MediaPipe detected anything
        if results.pose_landmarks:
            landmarks = extract_landmarks(results.pose_landmarks)
            
            # Count valid landmarks (not None)
            valid_landmarks = sum(1 for v in landmarks.values() if v is not None)
            
            # Calculate bounding box
            bounding_box = calculate_person_bounding_box(landmarks)
            
            # Calculate detection quality
            detection_quality = calculate_detection_quality(landmarks)
            
            # Check body completeness
            body_completeness = check_body_completeness(landmarks)
            
            # Determine calibration status
            calibration_status = determine_calibration_status(landmarks, bounding_box)
            
            # If we have ANY landmarks (even with low visibility), consider it a detection
            person_detected = valid_landmarks >= 2  # Very lenient threshold
            
            # Calculate average visibility
            visibilities = [lm.get('visibility', 0.5) for lm in landmarks.values() 
                          if lm is not None and lm.get('visibility') is not None]
            avg_visibility = np.mean(visibilities) if visibilities else 0.0
            
            if person_detected:
                stability_score = calculate_stability_score(landmarks)
                return {
                    'success': True,
                    'personDetected': True,
                    'landmarks': landmarks,
                    'confidence': 0.9,
                    'stability_score': stability_score,
                    'landmark_count': valid_landmarks,
                    'boundingBox': bounding_box,
                    'detectionQuality': detection_quality,
                    'bodyCompleteness': body_completeness,
                    'calibrationStatus': calibration_status,
                    'averageVisibility': float(avg_visibility)
                }
            else:
                # Return landmarks even if not fully detected (for preview)
                return {
                    'success': True,
                    'personDetected': False,
                    'landmarks': landmarks,  # Return landmarks for preview
                    'confidence': 0.3,
                    'stability_score': 0.0,
                    'landmark_count': valid_landmarks,
                    'boundingBox': bounding_box,
                    'detectionQuality': detection_quality,
                    'bodyCompleteness': body_completeness,
                    'calibrationStatus': calibration_status,
                    'averageVisibility': float(avg_visibility)
                }
        else:
            return {
                'success': True,
                'personDetected': False,
                'landmarks': None,
                'confidence': 0.0,
                'stability_score': 0.0,
                'landmark_count': 0,
                'boundingBox': None,
                'detectionQuality': 0.0,
                'bodyCompleteness': {
                    'head': False,
                    'torso': False,
                    'legs': False,
                    'feet': False
                },
                'calibrationStatus': 'not_detected',
                'averageVisibility': 0.0
            }
            
    except Exception as e:
        return {
            'success': False,
            'personDetected': False,
            'landmarks': None,
            'error': str(e),
            'confidence': 0.0,
            'stability_score': 0.0,
            'landmark_count': 0,
            'boundingBox': None,
            'detectionQuality': 0.0,
            'bodyCompleteness': {
                'head': False,
                'torso': False,
                'legs': False,
                'feet': False
            },
            'calibrationStatus': 'not_detected',
            'averageVisibility': 0.0,
            'lighting': 'poor',  # Phase 5
            'estimatedDistance': 'too_far',  # Phase 5
            'velocity': None,
        }

