import cv2
import numpy as np
from PIL import Image
import os

# Define which hazard types are surf-relevant
SURF_HAZARD_TYPES = [
    'rip current', 'high surf', 'reef cuts', 'jellyfish',
    'sea urchins', 'strong winds', 'poor visibility',
    'marine life', 'shark', 'tsunami', 'reef', 'coral',
    'urchin', 'current', 'wave', 'swell'
]

def is_surf_hazard(hazard_type: str) -> bool:
    """Check if the reported hazard type is surf-related."""
    hazard_lower = hazard_type.lower()
    return any(keyword in hazard_lower for keyword in SURF_HAZARD_TYPES)

def is_surf_scene(img, hsv) -> dict:
    """
    Validate whether the image looks like a surf/ocean scene.
    Returns a dict with 'valid' bool and 'reason' string.
    """
    h, w = img.shape[:2]
    total_pixels = h * w

    # Check for water/ocean (blue-green tones)
    water_mask = cv2.inRange(hsv, np.array([85, 40, 40]), np.array([135, 255, 255]))
    water_pct = (cv2.countNonZero(water_mask) / total_pixels) * 100

    # Check for sandy/beach tones (yellow-tan)
    sand_mask = cv2.inRange(hsv, np.array([15, 20, 100]), np.array([35, 120, 255]))
    sand_pct = (cv2.countNonZero(sand_mask) / total_pixels) * 100

    # Check for sky blue (lighter blues)
    sky_mask = cv2.inRange(hsv, np.array([90, 30, 150]), np.array([130, 150, 255]))
    sky_pct = (cv2.countNonZero(sky_mask) / total_pixels) * 100

    # Image texture — surf scenes tend to have moderate variance
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()

    # Decide: needs meaningful water OR beach presence
    has_water = water_pct > 15
    has_beach_context = (water_pct + sand_pct + sky_pct) > 25

    if not has_water and not has_beach_context:
        return {
            'valid': False,
            'reason': (
                f'Image does not appear to be a surf/ocean scene '
                f'(water: {water_pct:.1f}%, beach context: {(water_pct + sand_pct):.1f}%). '
                'Please upload a photo taken at the surf spot showing the hazard.'
            ),
            'water_pct': water_pct,
            'sand_pct': sand_pct,
        }

    return {
        'valid': True,
        'reason': 'Image appears to show an ocean/surf environment.',
        'water_pct': water_pct,
        'sand_pct': sand_pct,
        'variance': variance,
    }

def analyze_hazard_image(image_path, hazard_type):
    """
    Analyze hazard image using computer vision.
    Only validates images that:
      1. Report a surf-related hazard type
      2. Appear to show an ocean/beach scene
    """
    try:
        # --- Step 1: Check hazard type is surf-relevant ---
        if not is_surf_hazard(hazard_type):
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': (
                    f'Hazard type "{hazard_type}" is not a recognised surf hazard. '
                    'This report will not be validated. '
                    'Please report surf-specific hazards such as shark threats, '
                    'sea urchins, rip currents, jellyfish, reef cuts, or tsunami warnings.'
                ),
                'validated': False,
                'rejectionReason': 'non_surf_hazard_type'
            }

        # --- Step 2: Load image ---
        img = cv2.imread(image_path)
        if img is None:
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': 'Could not load image.',
                'validated': False,
                'rejectionReason': 'image_load_failed'
            }

        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # --- Step 3: Validate it's a surf/ocean scene ---
        scene_check = is_surf_scene(img, hsv)
        if not scene_check['valid']:
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': scene_check['reason'],
                'validated': False,
                'rejectionReason': 'not_a_surf_scene'
            }

        # --- Step 4: Analyse the surf hazard ---
        detected_hazards = []
        suggestions = []
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        water_pct = scene_check.get('water_pct', 0)

        if water_pct > 30:
            detected_hazards.append('Visible water conditions')

        if variance > 500:
            detected_hazards.append('Rough water surface detected')
            suggestions.append('High wave activity visible')

        dark_pct = (np.sum(gray < 50) / gray.size) * 100
        if dark_pct > 20:
            detected_hazards.append('Dark water areas visible')

        # Hazard-specific detection
        hazard_lower = hazard_type.lower()

        if 'shark' in hazard_lower or 'marine life' in hazard_lower:
            detected_hazards.append('Marine life threat area')
            suggestions.append('Exit water immediately if shark sighted. Alert other surfers.')

        elif 'tsunami' in hazard_lower or 'high surf' in hazard_lower:
            detected_hazards.append('Extreme wave conditions')
            suggestions.append('Do not enter the water. Move to higher ground if tsunami warning.')

        elif 'sea urchin' in hazard_lower or 'urchin' in hazard_lower:
            detected_hazards.append('Sea urchin hazard area')
            suggestions.append('Wear reef booties. Use hot water treatment if punctured.')

        elif 'rip' in hazard_lower or 'current' in hazard_lower:
            detected_hazards.append('Rip current reported')
            suggestions.append('Swim parallel to shore to escape rip. Do not swim against the current.')

        elif 'jellyfish' in hazard_lower:
            detected_hazards.append('Jellyfish presence reported')
            suggestions.append('Treat stings with vinegar. Avoid freshwater rinse.')

        elif 'reef' in hazard_lower or 'coral' in hazard_lower:
            detected_hazards.append('Reef hazard visible')
            suggestions.append('Wear booties. Check tide levels before paddling out.')

        elif 'wind' in hazard_lower:
            detected_hazards.append('Strong wind conditions')
            suggestions.append('Check offshore wind direction. Avoid paddling out in strong offshore winds.')

        elif 'visibility' in hazard_lower:
            detected_hazards.append('Poor visibility conditions')
            suggestions.append('Avoid surfing alone. Use brightly coloured board leash.')

        confidence = min(100, len(detected_hazards) * 30 + variance / 20)

        return {
            'detectedHazards': detected_hazards if detected_hazards else ['General surf hazard'],
            'confidenceScore': round(confidence, 2),
            'aiSuggestions': '; '.join(suggestions) if suggestions else 'Exercise caution in the water.',
            'validated': True,
            'rejectionReason': None
        }

    except Exception as e:
        return {
            'detectedHazards': [],
            'confidenceScore': 0,
            'aiSuggestions': f'Error analysing image: {str(e)}',
            'validated': False,
            'rejectionReason': 'analysis_error'
        }