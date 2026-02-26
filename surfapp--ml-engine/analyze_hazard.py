import cv2
import numpy as np
from PIL import Image
import os

def analyze_hazard_image(image_path, hazard_type):
    """
    Analyze hazard image using computer vision
    This is a simplified version - can be enhanced with deep learning
    """
    try:
        # Load image
        img = cv2.imread(image_path)
        
        if img is None:
            return {
                'detectedHazards': [],
                'confidenceScore': 0,
                'aiSuggestions': 'Could not load image'
            }
        
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        detected_hazards = []
        suggestions = []
        
        # Detect water conditions (simplified)
        # Blue/Green tones indicate water
        water_mask = cv2.inRange(hsv, np.array([90, 50, 50]), np.array([130, 255, 255]))
        water_percentage = (cv2.countNonZero(water_mask) / (img.shape[0] * img.shape[1])) * 100
        
        if water_percentage > 30:
            detected_hazards.append('Visible water conditions')
        
        # Detect rough seas (check image variance)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if variance > 500:
            detected_hazards.append('Rough water surface detected')
            suggestions.append('High wave activity visible')
        
        # Check for dark areas (could indicate deep water or shadows)
        dark_percentage = (np.sum(gray < 50) / gray.size) * 100
        
        if dark_percentage > 20:
            detected_hazards.append('Dark water areas visible')
        
        # Hazard-specific detection
        if 'rip' in hazard_type.lower() or 'current' in hazard_type.lower():
            suggestions.append('Rip current reported - avoid swimming perpendicular to shore')
        elif 'reef' in hazard_type.lower():
            suggestions.append('Reef hazard - wear booties and check tide levels')
        elif 'jellyfish' in hazard_type.lower():
            suggestions.append('Jellyfish present - avoid swimming and use vinegar for stings')
        
        confidence = min(100, len(detected_hazards) * 30 + variance / 20)
        
        return {
            'detectedHazards': detected_hazards if detected_hazards else ['General hazard'],
            'confidenceScore': round(confidence, 2),
            'aiSuggestions': '; '.join(suggestions) if suggestions else 'Exercise caution'
        }
        
    except Exception as e:
        return {
            'detectedHazards': ['Analysis failed'],
            'confidenceScore': 0,
            'aiSuggestions': f'Error analyzing image: {str(e)}'
        }
