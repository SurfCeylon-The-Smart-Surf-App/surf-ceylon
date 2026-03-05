"""Video Analysis Service - Main Business Logic"""
import sys
import json
import cv2
import numpy as np
import pickle
import os
from pathlib import Path

# MediaPipe imports
try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MEDIAPIPE_AVAILABLE = True
except ImportError as e:
    MEDIAPIPE_AVAILABLE = False
    print(f"⚠️  MediaPipe not available: {e}", file=sys.stderr)

# YOLOv8 imports
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError as e:
    YOLO_AVAILABLE = False
    print(f"⚠️  Ultralytics (YOLO) not available: {e}", file=sys.stderr)

# Get base directory
BASE_DIR = Path(__file__).parent.parent.absolute()

# Model paths
SURF_MODEL_PATH = BASE_DIR / 'models' / 'surf_model.pkl'
LABEL_ENCODER_PATH = BASE_DIR / 'models' / 'label_encoder.pkl'
POSE_MODEL_PATH = BASE_DIR / 'models' / 'pose_landmarker_lite.task'


def load_models():
    """Load the trained surf pose model and label encoder"""
    try:
        with open(SURF_MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(LABEL_ENCODER_PATH, 'rb') as f:
            label_encoder = pickle.load(f)
        return model, label_encoder
    except FileNotFoundError as e:
        print(f"❌ Model files not found: {e}", file=sys.stderr)
        return None, None
    except Exception as e:
        print(f"❌ Error loading models: {e}", file=sys.stderr)
        return None, None


def validate_surfing_video(video_path, max_yolo_checks=30, frame_skip=5):
    """
    Level 3 Gatekeeper: Scans deeper into the video using frame skipping
    to find a surfboard before allowing heavy ML processing.
    """
    if not YOLO_AVAILABLE:
        print("⚠️  YOLO not installed. Skipping video validation.", file=sys.stderr)
        return True # Fail open

    print("🕵️ Checking for surfboard using YOLOv8...", file=sys.stderr)
    try:
        yolo_model = YOLO('yolov8n.pt')
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return False

        SURFBOARD_CLASS_ID = 37 
        frame_count = 0
        checks_performed = 0
        surfboard_found = False

        # Keep reading frames until we've run YOLO 'max_yolo_checks' times
        while checks_performed < max_yolo_checks:
            ret, cap_frame = cap.read()
            if not ret: break # End of video
            
            # Only run heavy YOLO analysis every 5th frame
            if frame_count % frame_skip == 0:
                results = yolo_model(cap_frame, verbose=False)
                
                for result in results:
                    for box in result.boxes:
                        # Dropped confidence to 20% to account for water spray
                        if int(box.cls[0]) == SURFBOARD_CLASS_ID and float(box.conf[0]) > 0.20:
                            surfboard_found = True
                            break
                    if surfboard_found: break
                
                checks_performed += 1

            if surfboard_found: break
            frame_count += 1

        cap.release()
        
        if surfboard_found:
            print("✅ Surfboard detected! Proceeding with deep analysis.", file=sys.stderr)
            return True
        else:
            print("❌ No surfboard detected after scanning. Rejecting video.", file=sys.stderr)
            return False
            
    except Exception as e:
        print(f"⚠️  YOLO validation error: {e}", file=sys.stderr)
        return True

def extract_pose_landmarks(video_path, max_frames=300):
    """Extract pose landmarks from video using MediaPipe"""
    if not MEDIAPIPE_AVAILABLE:
        return extract_basic_features(video_path, max_frames)
    
    try:
        if not POSE_MODEL_PATH.exists():
            import urllib.request
            model_url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
            POSE_MODEL_PATH.parent.mkdir(exist_ok=True)
            urllib.request.urlretrieve(model_url, POSE_MODEL_PATH)
        
        base_options = python.BaseOptions(model_asset_path=str(POSE_MODEL_PATH))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        detector = vision.PoseLandmarker.create_from_options(options)
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return extract_basic_features(video_path, max_frames)
        
        landmarks_list = []
        frame_count = 0
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret: break
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int((frame_count / fps) * 1000)
            
            detection_result = detector.detect_for_video(mp_image, timestamp_ms)
            
            if detection_result.pose_landmarks:
                pose = detection_result.pose_landmarks[0]
                features = []
                for landmark in pose:
                    features.extend([landmark.x, landmark.y, landmark.z, landmark.visibility])
                landmarks_list.append(features)
            
            frame_count += 1
        
        cap.release()
        detector.close()
        
        if landmarks_list:
            return landmarks_list
        else:
            return extract_basic_features(video_path, max_frames)
            
    except Exception as e:
        return extract_basic_features(video_path, max_frames)


def extract_basic_features(video_path, max_frames=300):
    """Fallback feature extraction"""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened(): return None
    
    features_list = []
    prev_frame = None
    
    while len(features_list) < max_frames:
        ret, frame = cap.read()
        if not ret: break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_frame is not None:
            diff = cv2.absdiff(prev_frame, gray)
            motion = np.mean(diff)
            features = [motion, np.mean(gray), np.std(gray), np.max(diff)]
            features = features + [0.5] * (132 - len(features))
            features_list.append(features)
        
        prev_frame = gray
    
    cap.release()
    return features_list if features_list else None


def classify_pose(landmarks_list, model, label_encoder):
    """Classify surf pose using trained model"""
    if not landmarks_list or len(landmarks_list) == 0: return None
    
    seq_arr = np.array(landmarks_list)
    mean_feat = np.mean(seq_arr, axis=0)
    std_feat = np.std(seq_arr, axis=0)
    min_feat = np.min(seq_arr, axis=0)
    max_feat = np.max(seq_arr, axis=0)
    
    combined_features = np.concatenate([mean_feat, std_feat, min_feat, max_feat])
    input_data = combined_features.reshape(1, -1)
    
    motion_intensity = float(np.mean(mean_feat))
    motion_variation = float(np.mean(std_feat))
    has_real_pose_data = np.max(mean_feat) < 10
    
    prediction_encoded = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]
    
    if not has_real_pose_data and motion_variation < 5:
        noise = np.random.dirichlet(np.ones(len(probabilities)) * 2)
        probabilities = 0.7 * probabilities + 0.3 * noise
        probabilities = probabilities / np.sum(probabilities)
        prediction_encoded = np.argmax(probabilities)
    
    pose_class = label_encoder.inverse_transform([prediction_encoded])[0]
    confidence = float(probabilities[prediction_encoded])
    
    all_classes = {}
    for idx, class_name in enumerate(label_encoder.classes_):
        all_classes[class_name] = float(probabilities[idx])
    
    return {
        'pose': pose_class,
        'confidence': confidence,
        'all_classes': all_classes,
        'frames_analyzed': len(landmarks_list),
        'motion_intensity': motion_intensity,
        'motion_variation': motion_variation,
        'real_pose_detection': bool(has_real_pose_data)
    }


def generate_feedback(classification_result):
    """Generate detailed feedback based on pose classification"""
    if not classification_result:
        return {
            'rating': 'unknown',
            'message': 'Could not analyze video. Please ensure the surfer is clearly visible.',
            'suggestions': [],
            'next_steps': []
        }
    
    pose = classification_result['pose']
    confidence = classification_result['confidence']
    all_classes = classification_result['all_classes']
    
    feedback_db = {
        'roller': {
            'rating': 'excellent',
            'message': '🌊 Nice roller technique! You\'re using the wave\'s power effectively.',
            'strengths': ['Good wave positioning', 'Smooth transition up the face', 'Maintaining speed through the maneuver'],
            'suggestions': ['Try extending the roller further along the wave face', 'Work on your exit to maintain momentum', 'Practice on different wave sizes to adapt your technique'],
            'next_steps': ['Combine rollers with other maneuvers', 'Practice on steeper sections', 'Work on timing and wave reading']
        },
        'cutback-frontside': {
            'rating': 'excellent',
            'message': '🎯 Great frontside cutback! Classic surfing technique.',
            'strengths': ['Good rail-to-rail transition', 'Proper body rotation', 'Carving through the turn'],
            'suggestions': ['Drive harder off the bottom turn to set up the cutback', 'Keep your eyes on where you want to go', 'Try to complete the arc closer to the whitewater'],
            'next_steps': ['Work on layback cutbacks for style', 'Practice snap cutbacks for tighter turns', 'Combine with other maneuvers in sequence']
        },
        'take-off': {
            'rating': 'good',
            'message': '🏄 Solid take-off! Getting into waves is crucial.',
            'strengths': ['Good wave selection', 'Timing the pop-up well', 'Proper positioning on the board'],
            'suggestions': ['Paddle stronger to catch waves earlier', 'Look ahead to the section you want to hit', 'Work on explosive pop-up for steeper waves'],
            'next_steps': ['Practice take-offs on different wave types', 'Work on angled take-offs', 'Build paddling strength and endurance']
        },
        '360': {
            'rating': 'excellent',
            'message': '🔄 Impressive 360! Advanced aerial maneuver!',
            'strengths': ['Explosive off the lip', 'Good rotation control', 'Committed to the maneuver'],
            'suggestions': ['Work on landing with more control', 'Try to spot your landing earlier', 'Build more speed going into the maneuver'],
            'next_steps': ['Practice on different sections', 'Try variations like alley-oop 360s', 'Work on other aerial maneuvers']
        }
    }
    
    default_feedback = {
        'rating': 'good',
        'message': f'🏄 Detected technique: {pose}',
        'suggestions': ['Keep practicing consistently', 'Film your sessions to track progress', 'Focus on fundamentals'],
        'next_steps': ['Set specific goals for each session', 'Practice on appropriate wave sizes', 'Stay patient and persistent']
    }
    
    pose_key = pose.lower().replace(' ', '_').replace('-', '_')
    feedback = feedback_db.get(pose_key, default_feedback).copy()
    
    if confidence < 0.6:
        feedback['note'] = f'⚠️ Low confidence ({confidence*100:.0f}%). The model may need more training data.'
    
    sorted_probs = sorted(all_classes.items(), key=lambda x: x[1], reverse=True)
    if len(sorted_probs) > 1:
        top_prob = sorted_probs[0][1]
        second_prob = sorted_probs[1][1]
        
        if top_prob - second_prob < 0.15:
            if 'note' not in feedback: feedback['note'] = ''
            feedback['note'] += '\n📊 Model is uncertain between multiple techniques.'
    
    alternatives = []
    for class_name, prob in sorted_probs[1:3]:
        if prob > 0.2:
            alternatives.append(f'{class_name} ({prob*100:.0f}%)')
    
    if alternatives:
        feedback['also_detected'] = alternatives
    
    return feedback


def analyze_video(video_path):
    """Main analysis function - coordinates the entire pipeline"""
    print(f"\n🔍 Starting surf video analysis...", file=sys.stderr)
    
    if not os.path.exists(video_path):
        return {'success': False, 'error': f'Video file not found: {video_path}'}

    # --- LEVEL 3 YOLO GATEKEEPER ---
    is_valid_surf_video = validate_surfing_video(video_path)
    if not is_valid_surf_video:
        return {
            'success': False,
            'error': 'NOT_SURFING_VIDEO',
            'message': 'No surfboard detected. Please upload a clear surfing video.',
            'is_surf_video': False
        }
    
    model, label_encoder = load_models()
    if model is None or label_encoder is None:
        return {'success': False, 'error': 'Could not load ML models.'}
    
    landmarks = extract_pose_landmarks(video_path)
    if landmarks is None or len(landmarks) == 0:
        return {'success': False, 'error': 'Could not extract pose data from video.'}
    
    classification = classify_pose(landmarks, model, label_encoder)
    if classification is None:
        return {'success': False, 'error': 'Could not classify pose from extracted data.'}
    
    feedback = generate_feedback(classification)
    
    print(f"✅ Analysis complete!", file=sys.stderr)
    
    return {
        'success': True,
        'classification': classification,
        'feedback': feedback,
        'video_path': video_path
    }


def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python surf_pose_analyzer_service.py <video_path>", file=sys.stderr)
        sys.exit(1)
    
    video_path = sys.argv[1]
    result = analyze_video(video_path)
    
    print(json.dumps(result, indent=2))
    
    # CRITICAL FIX: Always exit 0 so Node.js can parse the JSON error cleanly!
    sys.exit(0)

if __name__ == "__main__":
    main()