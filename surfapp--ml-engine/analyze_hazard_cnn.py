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

# STRICT Confidence thresholds for accepting a hazard detection
# Balanced thresholds - reject random images but accept real hazards
CONFIDENCE_THRESHOLD = 0.40  # 40% minimum confidence for the detected hazard
MIN_HAZARD_CONFIDENCE = 0.30  # At least 30% for ANY hazard class  
MAX_NO_HAZARD_FOR_ACCEPT = 0.40  # no_hazard must be < 40% to accept

# WATER CONTENT REQUIREMENT - Image must have significant SATURATED water/ocean pixels
# Increased to 12% to filter out gallery images with slight blue tints
MIN_WATER_PERCENTAGE = 12  # At least 12% of image must be saturated water/ocean colors

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
    
    STRICT VALIDATION: Image must show POSITIVE EVIDENCE of being a surf/ocean scene.
    We require presence of water/ocean OR beach/sand OR marine colors.
    
    Rejection reasons:
    - Screenshots, documents, text-heavy images
    - Indoor photos with no natural elements
    - Commercial/storefront images
    - Images with no ocean/beach characteristics
    
    Returns a dict with 'valid' bool and 'reason' string.
    """
    try:
        h, w = img.shape[:2]
        total_pixels = h * w
        
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # ============ DETECTION METRICS ============
        
        # 1. Water/Ocean detection (blue-green tones) - STRICT detection
        # Real ocean has SATURATED blue colors, not just any blue tint
        # Require higher saturation (>60) to avoid false positives from gallery images
        bottom_half = img[h//2:, :, :]
        bottom_hsv = cv2.cvtColor(bottom_half, cv2.COLOR_BGR2HSV)
        bottom_pixels = (h//2) * w
        
        # Ocean in bottom half - strict saturation requirement
        ocean_mask_bottom = cv2.inRange(bottom_hsv, np.array([90, 60, 50]), np.array([130, 255, 255]))
        ocean_pct_bottom = (cv2.countNonZero(ocean_mask_bottom) / bottom_pixels) * 100
        
        # Full image ocean - STRICTER: require saturation > 50 (not just > 30)
        # This prevents random blue-tinted gallery images from passing
        ocean_mask = cv2.inRange(hsv, np.array([90, 50, 50]), np.array([130, 255, 255]))
        ocean_pct_full = (cv2.countNonZero(ocean_mask) / total_pixels) * 100
        
        # 2. Teal/aqua water (tropical waters, underwater shots) - also stricter
        teal_mask = cv2.inRange(hsv, np.array([75, 50, 50]), np.array([95, 255, 255]))
        teal_pct = (cv2.countNonZero(teal_mask) / total_pixels) * 100
        
        # 3. Sandy/beach tones
        sand_mask = cv2.inRange(hsv, np.array([15, 20, 100]), np.array([35, 120, 255]))
        sand_pct = (cv2.countNonZero(sand_mask) / total_pixels) * 100
        
        # 4. Sky blue (often present in beach photos)
        sky_mask = cv2.inRange(hsv, np.array([100, 30, 150]), np.array([130, 150, 255]))
        sky_pct = (cv2.countNonZero(sky_mask) / total_pixels) * 100
        
        # 5. Red/Orange detection (storefronts, signs, buildings) - HIGH saturation reds
        red_mask1 = cv2.inRange(hsv, np.array([0, 120, 100]), np.array([10, 255, 255]))
        red_mask2 = cv2.inRange(hsv, np.array([160, 120, 100]), np.array([180, 255, 255]))
        red_pct = (cv2.countNonZero(red_mask1) + cv2.countNonZero(red_mask2)) / total_pixels * 100
        
        # 6. Gray/concrete detection (buildings, roads, parking lots)
        gray_mask = cv2.inRange(hsv, np.array([0, 0, 80]), np.array([180, 40, 200]))
        gray_pct = (cv2.countNonZero(gray_mask) / total_pixels) * 100
        
        # 7. White areas (text, signs, buildings)
        white_mask = cv2.inRange(img, np.array([220, 220, 220]), np.array([255, 255, 255]))
        white_pct = (cv2.countNonZero(white_mask) / total_pixels) * 100
        
        # 8. Edge detection for text/artificial patterns
        edges = cv2.Canny(gray, 50, 150)
        edge_pct = (cv2.countNonZero(edges) / total_pixels) * 100
        
        # 9. Variance check
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 10. Dark pixels (for dark screenshots)
        dark_pct = (np.sum(gray < 50) / total_pixels) * 100
        
        # 11. Saturation analysis
        saturation = hsv[:, :, 1]
        low_sat_pct = (np.sum(saturation < 30) / total_pixels) * 100
        
        # 12. Green vegetation (might be present near beaches, also sharks in ocean)
        green_mask = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
        green_pct = (cv2.countNonZero(green_mask) / total_pixels) * 100
        
        # 13. Check for large rectangular shapes (signs, storefronts)
        edges_h = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        edges_v = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        h_edge_strength = np.mean(np.abs(edges_h))
        v_edge_strength = np.mean(np.abs(edges_v))
        structural_edges = (h_edge_strength + v_edge_strength) / 2
        
        # ============ POSITIVE INDICATORS (surf/ocean scene) ============
        
        # Total water-related colors (ocean, teal, any blue-green)
        total_water_pct = ocean_pct_full + teal_pct
        
        # Log water detection for debugging
        print(f"🌊 Scene Analysis:")
        print(f"   Water content: {total_water_pct:.1f}% (ocean={ocean_pct_full:.1f}%, teal={teal_pct:.1f}%)")
        print(f"   Ocean in bottom half: {ocean_pct_bottom:.1f}%")
        print(f"   Sand: {sand_pct:.1f}%, Gray: {gray_pct:.1f}%, Red: {red_pct:.1f}%")
        
        # Natural ocean/beach scene indicators - STRICTER thresholds
        # Increased from 8% to 12% for water to filter gallery images with blue tints
        has_significant_water = total_water_pct > MIN_WATER_PERCENTAGE  # At least 12% SATURATED water colors
        has_beach_sand = sand_pct > 15  # Increased from 12% - need more sand
        has_ocean_bottom = ocean_pct_bottom > 10  # Increased from 6% - need more ocean in bottom
        
        # Combined surf scene score - must have at least ONE strong indicator
        is_likely_surf_scene = (
            has_significant_water or  # Has saturated water (>12%)
            has_beach_sand or  # Has significant sand (>15%)
            has_ocean_bottom  # Clear ocean in lower half (>10%)
        )
        
        # ============ REJECTION RULES ============
        
        # Rule 1: Commercial/storefront images 
        is_commercial = (
            red_pct > 8 and  # Significant saturated red (signs)
            (gray_pct > 15 or white_pct > 5) and  # Concrete or text
            ocean_pct_bottom < 10 and  # No ocean in bottom
            total_water_pct < 15  # Very little water overall
        )
        
        # Rule 2: Building/urban scene
        is_urban = (
            gray_pct > 35 and  # Lots of concrete/buildings
            ocean_pct_bottom < 5 and  # No ocean in bottom
            sand_pct < 5 and  # No beach
            total_water_pct < 10  # Very little water
        )
        
        # Rule 3: Screenshots/documents
        is_screenshot = (
            (dark_pct > 50 and low_sat_pct > 50) or  # Dark theme
            (edge_pct > 12 and low_sat_pct > 60) or  # Text document
            (variance < 30 and low_sat_pct > 70)  # Uniform artificial
        )
        
        # Rule 4: Signage/poster
        is_signage = (
            white_pct > 8 and  # Lots of white text
            red_pct > 10 and  # Colored background
            ocean_pct_bottom < 5 and  # No ocean
            structural_edges > 20  # Strong edges
        )
        
        # Rule 5: NO surf/ocean characteristics - THIS IS THE KEY RULE
        # Random images (selfies, food, buildings, cars, etc.) will fail here
        # because they won't have water/ocean colors
        lacks_surf_characteristics = not is_likely_surf_scene
        
        # ============ DECISION ============
        
        # MOST IMPORTANT: Check if image lacks water/ocean characteristics
        # This is the PRIMARY filter for random images
        if lacks_surf_characteristics:
            print(f"   ❌ REJECTED: No water/ocean detected (water={total_water_pct:.1f}%, sand={sand_pct:.1f}%)")
            return {
                'valid': False,
                'reason': (
                    'Image does not appear to be from a beach or ocean environment. '
                    'Please upload a photo showing ocean, water, or beach with the hazard.'
                ),
                'total_water_pct': total_water_pct,
                'sand_pct': sand_pct,
                'ocean_pct_bottom': ocean_pct_bottom,
                'rejection_type': 'not_surf_scene'
            }
        
        # Check for specific rejection patterns
        
        if is_commercial:
            print(f"   ❌ REJECTED: Commercial scene")
            return {
                'valid': False,
                'reason': (
                    'Image appears to be a commercial/storefront scene, not a beach photo. '
                    'Please upload a photo of an actual surf hazard at the beach.'
                ),
                'ocean_pct_bottom': ocean_pct_bottom,
                'red_pct': red_pct,
                'gray_pct': gray_pct,
                'rejection_type': 'commercial'
            }
        
        if is_urban:
            print(f"   ❌ REJECTED: Urban scene")
            return {
                'valid': False,
                'reason': (
                    'Image appears to be an urban/building scene with no ocean visible. '
                    'Please upload a photo taken at the beach showing the hazard.'
                ),
                'ocean_pct_bottom': ocean_pct_bottom,
                'gray_pct': gray_pct,
                'rejection_type': 'urban'
            }
        
        if is_screenshot:
            return {
                'valid': False,
                'reason': (
                    'Image appears to be a screenshot or document. '
                    'Please upload an actual photo of the hazard.'
                ),
                'dark_pct': dark_pct,
                'edge_pct': edge_pct,
                'rejection_type': 'screenshot'
            }
        
        if is_signage:
            print(f"   ❌ REJECTED: Signage/poster")
            return {
                'valid': False,
                'reason': (
                    'Image appears to be a sign or advertisement. '
                    'Please upload a photo of an actual surf hazard at the beach.'
                ),
                'white_pct': white_pct,
                'red_pct': red_pct,
                'rejection_type': 'signage'
            }
        
        # ============ ACCEPTANCE ============
        # Image passed all rejection rules and has surf scene characteristics
        print(f"   ✅ Scene validation PASSED (water={total_water_pct:.1f}%, sand={sand_pct:.1f}%)")
        
        return {
            'valid': True,
            'reason': 'Image passed scene validation - appears to be ocean/beach related.',
            'ocean_pct_bottom': ocean_pct_bottom,
            'ocean_pct_full': ocean_pct_full,
            'total_water_pct': total_water_pct,
            'sand_pct': sand_pct,
            'is_likely_surf_scene': is_likely_surf_scene,
            'variance': variance
        }
    
    except Exception as e:
        # On error, REJECT (fail-closed for safety)
        return {
            'valid': False, 
            'reason': f'Scene validation error: {e}. Please try with a different image.',
            'rejection_type': 'error'
        }


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
        
        # ===============================================================
        # Step 4: BALANCED Decision logic
        # Scene validation is the PRIMARY gatekeeper (rejects non-ocean images)
        # CNN provides hazard type classification for images that pass scene check
        # ===============================================================
        
        # Get hazard probabilities (excluding no_hazard)
        hazard_probs = {k: v for k, v in probabilities.items() if k != 'no_hazard'}
        max_hazard_prob = max(hazard_probs.values()) if hazard_probs else 0
        max_hazard_class = max(hazard_probs, key=hazard_probs.get) if hazard_probs else None
        total_hazard_prob = sum(hazard_probs.values())
        no_hazard_prob = probabilities.get('no_hazard', 0)
        
        # Log for debugging
        print(f"🔍 CNN Analysis:")
        print(f"   Predicted: {predicted_class} ({confidence*100:.1f}%)")
        print(f"   Max hazard: {max_hazard_class} ({max_hazard_prob*100:.1f}%)")
        print(f"   No hazard: {no_hazard_prob*100:.1f}%")
        print(f"   Total hazard prob: {total_hazard_prob*100:.1f}%")
        
        # ===============================================================
        # REJECTION RULE: Only reject if no_hazard is VERY high
        # This indicates the CNN is confident this is NOT a hazard
        # ===============================================================
        
        # If no_hazard is dominant (> 40%) AND max hazard is low (< 30%), REJECT
        if no_hazard_prob > MAX_NO_HAZARD_FOR_ACCEPT and max_hazard_prob < MIN_HAZARD_CONFIDENCE:
            print(f"   ❌ REJECTED: no_hazard={no_hazard_prob*100:.1f}%, max_hazard={max_hazard_prob*100:.1f}%")
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
                'no_hazard_prob': no_hazard_prob,
                'class_probabilities': probabilities
            }
        
        # ===============================================================
        # ACCEPTANCE - Scene passed + CNN detected some hazard
        # ===============================================================
        
        # If we get here, scene validation passed (has water/ocean)
        # AND CNN detected SOME hazard probability
        # Accept the image with the detected hazard type
        
        best_hazard = max_hazard_class
        hazard_info = HAZARD_INFO.get(best_hazard, HAZARD_INFO['no_hazard'])
        
        print(f"   ✅ ACCEPTED: {best_hazard} with {max_hazard_prob*100:.1f}% confidence")
        
        return {
            'detectedHazards': [hazard_info['name']],
            'confidenceScore': round(max_hazard_prob * 100, 2),
            'aiSuggestions': hazard_info['suggestions'],
            'validated': True,
            'rejectionReason': None,
            'cnn_prediction': best_hazard,
            'cnn_confidence': max_hazard_prob,
            'severity': hazard_info['severity'],
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
    STRICT MODE: Without CNN, we cannot properly validate hazards, so REJECT.
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
        
        # Scene validation first
        scene_check = is_surf_scene(img)
        if not scene_check['valid']:
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': scene_check['reason'],
                'validated': False,
                'rejectionReason': 'not_a_surf_scene'
            }
        
        # Without CNN, we cannot verify hazard content - REJECT
        # This prevents random images from being accepted
        return {
            'detectedHazards': [],
            'confidenceScore': 0,
            'aiSuggestions': (
                'Hazard verification system is currently unavailable. '
                'Please try again later or contact support.'
            ),
            'validated': False,
            'rejectionReason': 'cnn_unavailable',
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
