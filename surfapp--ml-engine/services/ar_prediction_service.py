"""
AR Surfboard Recommendation Prediction Service
CLI mode for on-demand predictions (spawned by Node.js)

Usage:
  python ar_prediction_service.py
  
Input (stdin JSON):
  {"height_cm": 175, "weight_kg": 75, "age": 28, "experience_level": "Intermediate", "gender": "Male"}

Output (stdout JSON):
  {"success": true, "data": {...}}
"""
import joblib
import numpy as np
import os
import sys
import json

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "ar_surfboard", "enhanced_ar_model.joblib")

# Global model variable
model_data = None


class ARSurfboardRecommender:
    """Wrapper class for AR surfboard recommendations"""
    
    def __init__(self, model_path):
        """Load the trained model"""
        try:
            print(f"Loading model from: {model_path}", file=sys.stderr)
            data = joblib.load(model_path)
            print(f"[DEBUG] Model data type: {type(data)}", file=sys.stderr)
            print(f"[DEBUG] Model keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}", file=sys.stderr)
            self.wave_model = data['wave_model']
            self.scaler = data['scaler']
            self.label_encoders = data['label_encoders']
            self.feature_names = data['feature_names']
            self.metrics = data['metrics']
            print("[OK] Model loaded successfully!", file=sys.stderr)
        except Exception as e:
            print(f"[ERROR] Failed to load model: {type(e).__name__}: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            raise
    
    def calculate_ideal_volume(self, weight_kg, height_cm, experience_level):
        """Physics-based volume calculation"""
        skill_multipliers = {
            'First-timer': 1.8,
            'Beginner': 1.5,
            'Intermediate': 1.1,
            'Advanced': 0.9,
            'Pro': 0.75
        }
        
        multiplier = skill_multipliers.get(experience_level, 1.2)
        base_volume = weight_kg * multiplier
        height_factor = (height_cm - 170) / 100
        volume = base_volume + (height_factor * 2)
        
        return max(20, min(100, volume))
    
    def calculate_board_length(self, height_cm, weight_kg, experience_level):
        """Rule-based board length calculation"""
        height_m = height_cm / 100
        
        if experience_level in ['First-timer', 'Beginner']:
            length_m = height_m + (height_m * 0.15)
        elif experience_level == 'Intermediate':
            length_m = height_m + (height_m * 0.08)
        elif experience_level in ['Advanced', 'Pro']:
            length_m = height_m + (height_m * 0.00)
        else:
            length_m = height_m + (height_m * 0.10)
        
        if weight_kg > 85:
            length_m += 0.1
        elif weight_kg < 60:
            length_m -= 0.1
        
        return max(1.5, min(2.7, length_m))
    
    def predict(self, height_cm, weight_kg, age, experience_level, gender='Male'):
        """Generate personalized recommendation"""
        try:
            # Validate inputs
            if not all([height_cm, weight_kg, age, experience_level]):
                raise ValueError("Missing required parameters")
            
            # Physics-based calculations
            board_volume = self.calculate_ideal_volume(weight_kg, height_cm, experience_level)
            board_length_m = self.calculate_board_length(height_cm, weight_kg, experience_level)
            
            # ML-based wave height prediction
            exp_encoded = self.label_encoders['surfer_experience'].transform([experience_level])[0]
            gender_encoded = self.label_encoders['surfer_gender'].transform([gender])[0]
            bmi = weight_kg / ((height_cm / 100) ** 2)
            height_weight_ratio = height_cm / weight_kg
            
            features = np.array([[height_cm, weight_kg, age, exp_encoded, gender_encoded, bmi, height_weight_ratio]])
            features_scaled = self.scaler.transform(features)
            wave_height = float(self.wave_model.predict(features_scaled)[0])
            
            # Ensure realistic wave height range
            wave_height = max(2.0, min(8.0, wave_height))
            
            # Convert units
            board_length_ft = board_length_m * 3.28084
            board_length_ft_int = int(board_length_ft)
            board_length_in = (board_length_ft - board_length_ft_int) * 12
            
            # Generate tips
            tips = self._generate_tips(experience_level, board_length_ft, wave_height, bmi)
            
            return {
                'success': True,
                'data': {
                    'board': {
                        'length_feet': round(board_length_ft, 2),
                        'length_display': f"{board_length_ft_int}'{int(board_length_in)}\"",
                        'length_meters': round(board_length_m, 2),
                        'volume_liters': round(board_volume, 1),
                        'volume_display': f"{round(board_volume, 1)}L"
                    },
                    'wave': {
                        'ideal_height_feet': round(wave_height, 1),
                        'height_display': f"{round(wave_height, 1)}ft"
                    },
                    'surfer': {
                        'bmi': round(bmi, 1),
                        'height_cm': height_cm,
                        'weight_kg': weight_kg,
                        'experience': experience_level,
                        'age': age
                    },
                    'coaching': {
                        'tips': tips,
                        'confidence': 'High',
                        'method': 'Hybrid AI (Physics + ML)'
                    }
                }
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_tips(self, experience, board_length_ft, wave_height, bmi):
        """Generate personalized tips"""
        tips = []
        
        # Board type
        if board_length_ft >= 7:
            tips.append({"type": "equipment", "text": "Longboard setup - Maximum stability for learning"})
        elif board_length_ft >= 6.5:
            tips.append({"type": "equipment", "text": "Fun board - Great balance of control and maneuverability"})
        else:
            tips.append({"type": "equipment", "text": "Shortboard - High performance and quick turning"})
        
        # Wave conditions
        tips.append({"type": "conditions", "text": f"Optimized for {wave_height:.1f}ft waves"})
        
        # Skill-based advice
        if experience in ['First-timer', 'Beginner']:
            tips.append({"type": "technique", "text": "Focus on: Paddling, pop-up timing, and balance"})
        elif experience == 'Intermediate':
            tips.append({"type": "technique", "text": "Practice: Bottom turns, cutbacks, and wave reading"})
        else:
            tips.append({"type": "technique", "text": "Master: Advanced maneuvers and barrel riding"})
        
        return tips


# Initialize model on startup
def load_model():
    """Load the model when the script starts"""
    global model_data
    if os.path.exists(MODEL_PATH):
        model_data = ARSurfboardRecommender(MODEL_PATH)
        return True
    else:
        print(json.dumps({
            'success': False,
            'error': f'Model not found at: {MODEL_PATH}'
        }), file=sys.stderr)
        return False


def main():
    """Main CLI function - reads JSON from stdin, prints JSON to stdout"""
    try:
        # Load model
        if not load_model():
            print(json.dumps({
                'success': False,
                'error': 'Failed to load model'
            }))
            sys.exit(1)
        
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Validate required fields
        required_fields = ['height_cm', 'weight_kg', 'age', 'experience_level']
        missing_fields = [f for f in required_fields if f not in input_data]
        
        if missing_fields:
            print(json.dumps({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }))
            sys.exit(1)
        
        # Get prediction
        result = model_data.predict(
            height_cm=float(input_data['height_cm']),
            weight_kg=float(input_data['weight_kg']),
            age=int(input_data['age']),
            experience_level=input_data['experience_level'],
            gender=input_data.get('gender', 'Male')
        )
        
        # Print result as JSON to stdout
        print(json.dumps(result))
        sys.exit(0)
    
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }))
        sys.exit(1)
    
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
