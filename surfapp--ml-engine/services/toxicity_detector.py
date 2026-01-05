"""Toxicity Checker Service - Main Business Logic"""
import sys
import json
import joblib
import re
from pathlib import Path

# Get base directory
BASE_DIR = Path(__file__).parent.parent.absolute()

# Model paths
MODEL_PATH = BASE_DIR / 'models' / 'toxic_model.pkl'
VECTORIZER_PATH = BASE_DIR / 'models' / 'tfidf_vectorizer.pkl'


def load_toxicity_models():
    """Load trained toxicity detection model and vectorizer"""
    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        return model, vectorizer
    except FileNotFoundError as e:
        print(f"❌ Model files not found: {e}", file=sys.stderr)
        return None, None
    except Exception as e:
        print(f"❌ Error loading models: {e}", file=sys.stderr)
        return None, None


def preprocess_text(text):
    """Clean and preprocess text for toxicity detection"""
    if not text or not isinstance(text, str):
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def check_toxicity(text):
    """
    Check if text contains toxic content
    
    Args:
        text: Input text to analyze
    
    Returns:
        dict: Analysis results with toxicity score and classification
    """
    # Load models
    model, vectorizer = load_toxicity_models()
    if model is None or vectorizer is None:
        return {
            'success': False,
            'error': 'Could not load toxicity detection models'
        }
    
    # Preprocess
    cleaned_text = preprocess_text(text)
    if not cleaned_text:
        return {
            'success': False,
            'error': 'No valid text to analyze'
        }
    
    try:
        # Vectorize text
        text_vectorized = vectorizer.transform([cleaned_text])
        
        # Predict
        prediction = model.predict(text_vectorized)[0]
        
        # Get probability scores if available
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(text_vectorized)[0]
            toxic_probability = float(probabilities[1]) if len(probabilities) > 1 else float(prediction)
        else:
            toxic_probability = float(prediction)
        
        # Classify
        is_toxic = bool(prediction == 1)
        
        # Generate severity level
        if toxic_probability > 0.8:
            severity = 'high'
        elif toxic_probability > 0.5:
            severity = 'medium'
        else:
            severity = 'low'
        
        return {
            'success': True,
            'text': text,
            'is_toxic': is_toxic,
            'toxic_probability': round(toxic_probability, 3),
            'severity': severity if is_toxic else 'none',
            'message': 'Content contains toxic language' if is_toxic else 'Content is clean'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Analysis failed: {str(e)}'
        }


def main():
    """CLI entry point - maintains backward compatibility"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'Usage: python check_toxicity_cli.py "<text_to_check>"'
        }))
        sys.exit(1)
    
    text = sys.argv[1]
    
    # Run toxicity check
    result = check_toxicity(text)
    
    # Output compact JSON to stdout (no indentation for parsing)
    print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)
