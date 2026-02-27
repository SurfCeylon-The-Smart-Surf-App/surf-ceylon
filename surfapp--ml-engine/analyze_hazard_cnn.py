"""
Hazard Image Analyzer with CNN Classification
==============================================
Surf Ceylon ML Engine

This module analyzes uploaded hazard images using:
1. Trained CNN model to classify the hazard type
2. Scene validation (ocean/beach detection)
3. Confidence scoring

The CNN model must be trained first using:
    python training/train_hazard_classifier.py
"""

import os
import sys
import json
import cv2
import numpy as np
from pathlib import Path

# TensorFlow import with error handling
try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️ TensorFlow not available. Using fallback analysis.")

# Paths
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "artifacts" / "hazard_classifier"
MODEL_PATH = MODEL_DIR / "hazard_classifier_best.keras"
METADATA_PATH = MODEL_DIR / "model_metadata.json"

# Hazard classes (must match training)
HAZARD_CLASSES = [
    'shark',
    'jellyfish',
    'rip_current',
    'sea_urchin',
    'large_waves',
    'reef_coral',
    'no_hazard'
]

# Confidence threshold for accepting a hazard detection
# Lower threshold because model is still training with limited data
# Increase this to 0.60+ once you have more training images
CONFIDENCE_THRESHOLD = 0.25  # 25% minimum confidence (temporary)

# Map hazard classes to user-friendly names and safety tips
HAZARD_INFO = {
    'shark': {
        'name': 'Shark',
        'suggestions': 'Exit water immediately. Alert other surfers and beach authorities. Do not panic or splash.',
        'severity': 'high'
    },
    'jellyfish': {
        'name': 'Jellyfish',
        'suggestions': 'Avoid contact. Treat stings with vinegar (not freshwater). Seek medical help for severe stings.',
        'severity': 'medium'
    },
    'rip_current': {
        'name': 'Rip Current',
        'suggestions': 'Do not swim against the current. Swim parallel to shore to escape. Float if tired and signal for help.',
        'severity': 'high'
    },
    'sea_urchin': {
        'name': 'Sea Urchin',
        'suggestions': 'Wear reef booties. If punctured, soak in hot water. Remove visible spines carefully. Watch for infection.',
        'severity': 'medium'
    },
    'large_waves': {
        'name': 'Dangerous Waves / High Surf',
        'suggestions': 'Do not enter water. Only experienced surfers should attempt. Check conditions with lifeguards.',
        'severity': 'high'
    },
    'reef_coral': {
        'name': 'Reef / Coral Hazard',
        'suggestions': 'Wear booties and check tide levels. Avoid surfing at low tide over shallow reef.',
        'severity': 'medium'
    },
    'no_hazard': {
        'name': 'No Hazard Detected',
        'suggestions': 'Image does not appear to contain a recognizable surf hazard.',
        'severity': 'none'
    }
}

# Loaded model (cached)
_model = None
_model_metadata = None


def load_model():
    """Load the trained CNN model."""
    global _model, _model_metadata
    
    if _model is not None:
        return _model, _model_metadata
    
    if not TF_AVAILABLE:
        return None, None
    
    if not MODEL_PATH.exists():
        print(f"⚠️ Model not found at {MODEL_PATH}")
        print("   Train the model first: python training/train_hazard_classifier.py")
        return None, None
    
    try:
        print(f"🔄 Loading hazard classifier model...")
        _model = keras.models.load_model(MODEL_PATH)
        
        if METADATA_PATH.exists():
            with open(METADATA_PATH, 'r') as f:
                _model_metadata = json.load(f)
        
        print(f"✅ Model loaded successfully")
        return _model, _model_metadata
    
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None, None


def preprocess_image(image_path, target_size=(224, 224)):
    """Load and preprocess image for CNN prediction."""
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return None, None
        
        # Keep original for scene analysis
        original = img.copy()
        
        # Resize and normalize for CNN
        img_resized = cv2.resize(img, target_size)
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_normalized = img_rgb.astype('float32') / 255.0
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        return img_batch, original
    
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None, None


def is_surf_scene(img):
    """
    Validate whether the image looks like a surf/ocean scene.
    Returns a dict with 'valid' bool and 'reason' string.
    """
    try:
        h, w = img.shape[:2]
        total_pixels = h * w
        
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Check for water/ocean (blue-green tones)
        water_mask = cv2.inRange(hsv, np.array([85, 40, 40]), np.array([135, 255, 255]))
        water_pct = (cv2.countNonZero(water_mask) / total_pixels) * 100
        
        # Check for sandy/beach tones
        sand_mask = cv2.inRange(hsv, np.array([15, 20, 100]), np.array([35, 120, 255]))
        sand_pct = (cv2.countNonZero(sand_mask) / total_pixels) * 100
        
        # Check for sky blue
        sky_mask = cv2.inRange(hsv, np.array([90, 30, 150]), np.array([130, 150, 255]))
        sky_pct = (cv2.countNonZero(sky_mask) / total_pixels) * 100
        
        # Combined beach context
        beach_context = water_pct + sand_pct + sky_pct
        
        # NEW: Check for unnatural/artificial image characteristics
        # Screenshots and text images have very low texture variance in uniform areas
        # and high contrast edges from text
        
        # Calculate image variance (natural scenes have moderate variance)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Check for very dark images (like code editors with dark themes)
        dark_pixel_pct = (np.sum(gray < 50) / total_pixels) * 100
        
        # Check for very uniform colors (artificial/screenshot indicator)
        # Natural beach scenes have color variety
        saturation = hsv[:, :, 1]
        low_saturation_pct = (np.sum(saturation < 30) / total_pixels) * 100
        
        # Edge detection - screenshots have lots of sharp edges from text
        edges = cv2.Canny(gray, 50, 150)
        edge_pct = (cv2.countNonZero(edges) / total_pixels) * 100
        
        # Detect if image looks like a screenshot/document/non-natural image
        # Also detect images with high contrast text patterns or artificial graphics
        
        # Check for very uniform blue areas (poster/advertisement indicator)
        # Natural ocean has varied blues, posters have solid blue gradients
        blue_channel = img[:, :, 0]  # BGR format
        blue_variance = np.var(blue_channel)
        
        # Check for white/bright text areas (common in posters)
        white_mask = cv2.inRange(img, np.array([200, 200, 200]), np.array([255, 255, 255]))
        white_pct = (cv2.countNonZero(white_mask) / total_pixels) * 100
        
        is_likely_screenshot = (
            (dark_pixel_pct > 25 and low_saturation_pct > 25) or  # Dark theme screenshot
            (edge_pct > 10 and low_saturation_pct > 35) or  # Text-heavy document
            (variance < 100 and low_saturation_pct > 50) or  # Very uniform artificial image
            (dark_pixel_pct > 20 and variance > 800 and low_saturation_pct > 20) or  # Dark with sharp edges
            (white_pct > 5 and edge_pct > 3 and blue_variance < 2000) or  # Poster with text on solid background
            (low_saturation_pct > 15 and white_pct > 8)  # Document/poster with white text areas
        )
        
        if is_likely_screenshot:
            return {
                'valid': False,
                'reason': (
                    'Image appears to be a screenshot or document, not a beach/ocean photo. '
                    'Please upload an actual photo of the hazard taken at the surf spot.'
                ),
                'water_pct': water_pct,
                'beach_context': beach_context,
                'is_screenshot': True,
                'dark_pct': dark_pixel_pct,
                'edge_pct': edge_pct
            }
        
        # Decision: needs meaningful water OR beach presence
        has_water = water_pct > 10
        has_beach_context = beach_context > 20
        
        if not has_water and not has_beach_context:
            return {
                'valid': False,
                'reason': (
                    f'Image does not appear to be a surf/ocean scene. '
                    f'Please upload a photo taken at the beach showing the hazard.'
                ),
                'water_pct': water_pct,
                'beach_context': beach_context
            }
        
        return {
            'valid': True,
            'reason': 'Image appears to show an ocean/beach environment.',
            'water_pct': water_pct,
            'beach_context': beach_context,
            'variance': variance
        }
    
    except Exception as e:
        return {'valid': True, 'reason': f'Scene validation error: {e}'}


def classify_hazard_cnn(image_path):
    """
    Classify hazard using the trained CNN model.
    Returns predicted class, confidence, and all class probabilities.
    """
    model, metadata = load_model()
    
    if model is None:
        return {
            'success': False,
            'error': 'Model not loaded. Please train the model first.',
            'use_fallback': True
        }
    
    # Preprocess
    img_batch, original = preprocess_image(image_path)
    if img_batch is None:
        return {
            'success': False,
            'error': 'Could not load or preprocess image.',
            'use_fallback': False
        }
    
    # Scene validation
    scene_check = is_surf_scene(original)
    if not scene_check['valid']:
        return {
            'success': False,
            'error': scene_check['reason'],
            'use_fallback': False,
            'rejection_reason': 'not_a_surf_scene'
        }
    
    # Predict
    try:
        predictions = model.predict(img_batch, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        predicted_class = HAZARD_CLASSES[predicted_idx]
        
        # Get all class probabilities
        class_probabilities = {
            HAZARD_CLASSES[i]: float(predictions[0][i]) 
            for i in range(len(HAZARD_CLASSES))
        }
        
        return {
            'success': True,
            'predicted_class': predicted_class,
            'confidence': confidence,
            'class_probabilities': class_probabilities,
            'scene_check': scene_check
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': f'Prediction error: {e}',
            'use_fallback': True
        }


def analyze_hazard_image(image_path, reported_hazard_type):
    """
    Main analysis function called by the backend.
    
    Args:
        image_path: Path to the uploaded image
        reported_hazard_type: Hazard type reported by user (e.g., "shark", "jellyfish")
    
    Returns:
        dict with analysis results including validation status
    """
    try:
        # Step 1: Try CNN classification
        cnn_result = classify_hazard_cnn(image_path)
        
        # If CNN failed but suggests fallback, use basic analysis
        if not cnn_result['success']:
            if cnn_result.get('use_fallback'):
                return fallback_analysis(image_path, reported_hazard_type)
            else:
                # CNN found a specific issue (not surf scene, etc.)
                return {
                    'detectedHazards': [],
                    'confidenceScore': 0,
                    'aiSuggestions': cnn_result.get('error', 'Image analysis failed.'),
                    'validated': False,
                    'rejectionReason': cnn_result.get('rejection_reason', 'analysis_failed')
                }
        
        # Step 2: Get CNN predictions
        predicted_class = cnn_result['predicted_class']
        confidence = cnn_result['confidence']
        probabilities = cnn_result['class_probabilities']
        
        # Step 3: Validate against reported hazard type
        reported_lower = reported_hazard_type.lower()
        
        # Map reported type to our classes
        reported_class = None
        for hazard_class in HAZARD_CLASSES:
            if hazard_class in reported_lower or hazard_class.replace('_', ' ') in reported_lower:
                reported_class = hazard_class
                break
        
        # Special mappings
        if reported_class is None:
            if 'tsunami' in reported_lower or 'wave' in reported_lower or 'high surf' in reported_lower:
                reported_class = 'large_waves'
            elif 'urchin' in reported_lower:
                reported_class = 'sea_urchin'
            elif 'reef' in reported_lower or 'coral' in reported_lower:
                reported_class = 'reef_coral'
            elif 'current' in reported_lower or 'rip' in reported_lower:
                reported_class = 'rip_current'
            elif 'marine' in reported_lower:
                reported_class = 'shark'  # Default marine life to shark
        
        # Step 4: Decision logic
        
        # Get the highest hazard probability (excluding no_hazard)
        hazard_probs = {k: v for k, v in probabilities.items() if k != 'no_hazard'}
        max_hazard_prob = max(hazard_probs.values()) if hazard_probs else 0
        no_hazard_prob = probabilities.get('no_hazard', 0)
        
        # Case A: No hazard detected - either predicted as no_hazard OR no_hazard is dominant
        if predicted_class == 'no_hazard' or no_hazard_prob > max_hazard_prob:
            return {
                'detectedHazards': [],
                'confidenceScore': round(no_hazard_prob * 100, 2),
                'aiSuggestions': (
                    'The AI could not detect a valid surf hazard in this image. '
                    'Please upload a clear photo showing the hazard (shark, jellyfish, '
                    'rip current, sea urchin, large waves, or reef danger).'
                ),
                'validated': False,
                'rejectionReason': 'no_hazard_detected',
                'cnn_prediction': predicted_class,
                'cnn_confidence': confidence,
                'class_probabilities': probabilities
            }
        
        # Case B: CNN detected a hazard
        hazard_info = HAZARD_INFO.get(predicted_class, HAZARD_INFO['no_hazard'])
        
        # Check if confidence is high enough
        if confidence < CONFIDENCE_THRESHOLD:
            # Low confidence - might be a hazard but unclear
            # Accept if it somewhat matches reported type
            if reported_class and (predicted_class == reported_class or 
                                   probabilities.get(reported_class, 0) > 0.15):
                # Accept with warning
                return {
                    'detectedHazards': [f'{hazard_info["name"]} (uncertain)'],
                    'confidenceScore': round(confidence * 100, 2),
                    'aiSuggestions': (
                        f'{hazard_info["suggestions"]} '
                        f'Note: Detection confidence is low ({confidence*100:.0f}%). '
                        'Consider uploading a clearer image.'
                    ),
                    'validated': True,
                    'rejectionReason': None,
                    'cnn_prediction': predicted_class,
                    'cnn_confidence': confidence,
                    'severity': hazard_info['severity'],
                    'class_probabilities': probabilities
                }
            else:
                # Low confidence and doesn't match reported type
                return {
                    'detectedHazards': [],
                    'confidenceScore': round(confidence * 100, 2),
                    'aiSuggestions': (
                        f'The image quality is too low to confirm the hazard. '
                        f'Detected: {hazard_info["name"]} ({confidence*100:.0f}% confidence). '
                        f'Reported: {reported_hazard_type}. '
                        'Please upload a clearer photo.'
                    ),
                    'validated': False,
                    'rejectionReason': 'low_confidence',
                    'cnn_prediction': predicted_class,
                    'cnn_confidence': confidence,
                    'class_probabilities': probabilities
                }
        
        # Case C: High confidence hazard detection
        # Check if detected matches reported (or is close)
        detection_matches = (
            reported_class is None or  # User didn't specify a mapped type
            predicted_class == reported_class or  # Exact match
            (predicted_class in ['shark'] and 'marine' in reported_lower) or
            (predicted_class in ['large_waves'] and ('wave' in reported_lower or 'tsunami' in reported_lower))
        )
        
        if detection_matches:
            return {
                'detectedHazards': [hazard_info['name']],
                'confidenceScore': round(confidence * 100, 2),
                'aiSuggestions': hazard_info['suggestions'],
                'validated': True,
                'rejectionReason': None,
                'cnn_prediction': predicted_class,
                'cnn_confidence': confidence,
                'severity': hazard_info['severity'],
                'class_probabilities': probabilities
            }
        else:
            # High confidence but mismatch between reported and detected
            # Accept the image but note the discrepancy
            return {
                'detectedHazards': [hazard_info['name']],
                'confidenceScore': round(confidence * 100, 2),
                'aiSuggestions': (
                    f'AI detected: {hazard_info["name"]} (reported: {reported_hazard_type}). '
                    f'{hazard_info["suggestions"]}'
                ),
                'validated': True,
                'rejectionReason': None,
                'cnn_prediction': predicted_class,
                'cnn_confidence': confidence,
                'severity': hazard_info['severity'],
                'reported_vs_detected_mismatch': True,
                'class_probabilities': probabilities
            }
    
    except Exception as e:
        return {
            'detectedHazards': [],
            'confidenceScore': 0,
            'aiSuggestions': f'Error analyzing image: {str(e)}',
            'validated': False,
            'rejectionReason': 'analysis_error'
        }


def fallback_analysis(image_path, hazard_type):
    """
    Fallback analysis when CNN model is not available.
    Uses basic scene validation only.
    """
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': 'Could not load image.',
                'validated': False,
                'rejectionReason': 'image_load_failed'
            }
        
        # Scene validation
        scene_check = is_surf_scene(img)
        if not scene_check['valid']:
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': scene_check['reason'],
                'validated': False,
                'rejectionReason': 'not_a_surf_scene'
            }
        
        # Without CNN, we can only validate scene - not hazard content
        return {
            'detectedHazards': [f'Reported: {hazard_type}'],
            'confidenceScore': 50,  # Lower confidence without CNN
            'aiSuggestions': (
                'Image appears to be from a beach/ocean environment. '
                'Note: Full hazard classification is unavailable. '
                'Please ensure the image clearly shows the reported hazard.'
            ),
            'validated': True,  # Accept but with warning
            'rejectionReason': None,
            'fallback_mode': True
        }
    
    except Exception as e:
        return {
            'detectedHazards': [],
            'confidenceScore': 0,
            'aiSuggestions': f'Error: {str(e)}',
            'validated': False,
            'rejectionReason': 'analysis_error'
        }


# CLI entry point
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze hazard image')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('hazard_type', help='Reported hazard type')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    result = analyze_hazard_image(args.image_path, args.hazard_type)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("\n🔍 Hazard Analysis Result")
        print("="*40)
        print(f"Validated: {'✅ Yes' if result['validated'] else '❌ No'}")
        print(f"Detected: {result['detectedHazards']}")
        print(f"Confidence: {result['confidenceScore']}%")
        print(f"Suggestions: {result['aiSuggestions']}")
        if result.get('rejectionReason'):
            print(f"Rejection: {result['rejectionReason']}")
