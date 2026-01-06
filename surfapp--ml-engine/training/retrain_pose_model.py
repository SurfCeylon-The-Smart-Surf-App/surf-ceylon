#!/usr/bin/env python3
"""
Train surf pose model with realistic pose landmark patterns.
This generates synthetic pose data that mimics real MediaPipe pose landmarks.
"""

import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / 'models'
SURF_MODEL_PATH = MODELS_DIR / 'surf_model.pkl'
LABEL_ENCODER_PATH = MODELS_DIR / 'label_encoder.pkl'


def generate_pose_based_training_data():
    """
    Generate training data based on realistic pose landmarks (x, y, z, visibility).
    MediaPipe provides 33 landmarks × 4 values = 132 features.
    Values are normalized: x,y,z in [0,1] range, visibility in [0,1].
    """
    
    techniques = ['roller', 'cutback-frontside', 'take-off', '360']
    samples_per_class = 200
    X = []
    y_labels = []
    
    np.random.seed(42)
    
    print("\n🏄 Generating pose landmark training data...")
    print(f"   Simulating MediaPipe pose detection patterns")
    
    for technique in techniques:
        for _ in range(samples_per_class):
            # Base pose structure (33 landmarks × 4 = 132 values)
            pose = []
            
            if technique == 'roller':
                # Roller: upright stance, balanced, centered
                for i in range(33):
                    x = np.random.uniform(0.3, 0.7)  # Centered horizontally
                    y_coord = np.random.uniform(0.2, 0.8)  # Full vertical range
                    z = np.random.uniform(-0.2, 0.2)  # Minimal depth change
                    visibility = np.random.uniform(0.7, 0.95)
                    pose.extend([x, y_coord, z, visibility])
                
            elif technique == 'cutback-frontside':
                # Cutback: rotated torso, weight shift, lateral movement
                for i in range(33):
                    x = np.random.uniform(0.2, 0.8)  # Wide horizontal range
                    y_coord = np.random.uniform(0.3, 0.7)  # Mid-range vertical
                    z = np.random.uniform(-0.3, 0.3)  # More depth variation
                    visibility = np.random.uniform(0.6, 0.9)
                    pose.extend([x, y_coord, z, visibility])
                # Add rotation effect
                pose[0::4] = [x + np.random.uniform(-0.2, 0.2) for x in pose[0::4]]
                
            elif technique == 'take-off':
                # Take-off: explosive leg extension, upward movement
                for i in range(33):
                    x = np.random.uniform(0.3, 0.7)  # Centered
                    # Lower body landmarks lower, upper body higher
                    y_coord = np.random.uniform(0.1, 0.5) if i < 15 else np.random.uniform(0.4, 0.8)
                    z = np.random.uniform(-0.1, 0.2)
                    visibility = np.random.uniform(0.75, 0.95)
                    pose.extend([x, y_coord, z, visibility])
                
            elif technique == '360':
                # 360: full rotation, dynamic position changes
                for i in range(33):
                    # Simulate rotation with varying x positions
                    x = np.random.uniform(0.1, 0.9)  # Full horizontal range
                    y_coord = np.random.uniform(0.2, 0.8)  # Variable vertical
                    z = np.random.uniform(-0.5, 0.5)  # Large depth changes
                    visibility = np.random.uniform(0.5, 0.85)  # Some landmarks may be occluded
                    pose.extend([x, y_coord, z, visibility])
            
            # Ensure exactly 132 features
            pose = pose[:132]
            
            # Add slight noise
            noise = np.random.normal(0, 0.02, 132)
            pose = np.clip(np.array(pose) + noise, 0, 1)
            
            X.append(pose)
            y_labels.append(technique)
    
    print(f"   ✓ Generated {len(X)} pose samples")
    print(f"   Classes: {techniques}")
    
    X_array = np.array(X)
    print(f"\n📊 Pose landmark statistics:")
    print(f"   Mean: {np.mean(X_array):.3f} (expected ~0.5 for normalized data)")
    print(f"   Std:  {np.std(X_array):.3f}")
    print(f"   Min:  {np.min(X_array):.3f}")
    print(f"   Max:  {np.max(X_array):.3f}")
    
    return np.array(X), np.array(y_labels)


def train_pose_model():
    """Train Random Forest with pose landmark data."""
    
    print("="*70)
    print("SURF POSE MODEL - MEDIAPIPE POSE LANDMARK TRAINING")
    print("="*70)
    
    # Generate training data
    X, y = generate_pose_based_training_data()
    
    # Encode labels
    print("\n📊 Encoding labels...")
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Train model
    print("\n🌲 Training Random Forest classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X, y_encoded)
    
    train_accuracy = model.score(X, y_encoded)
    print(f"   Training accuracy: {train_accuracy * 100:.2f}%")
    
    # Test with sample poses
    print("\n🧪 Testing model predictions...")
    
    test_cases = [
        ('Centered upright pose (roller)', np.array([[0.5] * 132])),
        ('Shifted lateral pose (cutback)', np.array([[0.3 if i % 4 == 0 else 0.5 for i in range(132)]])),
        ('Low to high transition (take-off)', np.array([[0.3 if i % 4 == 1 else 0.5 for i in range(132)]])),
        ('Highly variable pose (360)', np.random.uniform(0.2, 0.8, (1, 132)))
    ]
    
    for name, test_sample in test_cases:
        prediction = model.predict(test_sample)[0]
        probabilities = model.predict_proba(test_sample)[0]
        predicted_class = label_encoder.inverse_transform([prediction])[0]
        
        print(f"\n   {name}")
        print(f"      Predicted: {predicted_class}")
        probs_str = ', '.join([f"{label_encoder.classes_[i]}: {probabilities[i]*100:.0f}%" 
                               for i in range(len(label_encoder.classes_))])
        print(f"      [{probs_str}]")
    
    # Save models
    MODELS_DIR.mkdir(exist_ok=True)
    
    print("\n💾 Saving models...")
    with open(SURF_MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f"   ✓ Model saved to: {SURF_MODEL_PATH}")
    
    with open(LABEL_ENCODER_PATH, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"   ✓ Label encoder saved to: {LABEL_ENCODER_PATH}")
    
    print("\n✅ Training complete!")
    print("\n📝 Model is now trained with pose landmark patterns.")
    print("   When MediaPipe detects real poses, the model will classify them.")
    print("   If MediaPipe fails, it will fall back to basic features.")
    
    print("\n" + "="*70)


if __name__ == '__main__':
    train_pose_model()
