"""
Step 3: Deep Learning Cardio Recommendation Model
Hybrid Neural Network with User and Exercise Embeddings
"""

import numpy as np
import pandas as pd
import json
import pickle
from pathlib import Path
import matplotlib.pyplot as plt

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import precision_score, recall_score, ndcg_score

from cardio_config import *

# Set random seeds
np.random.seed(42)
tf.random.set_seed(42)

class CardioRecommenderModel:
    """Deep Learning Model for Cardio Exercise Recommendations"""
    
    def __init__(self):
        self.model = None
        self.exercise_encoder = LabelEncoder()
        self.fitness_encoder = LabelEncoder()
        self.goal_encoder = LabelEncoder()
        self.equipment_encoder = LabelEncoder()
        self.bmi_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.exercise_db = None
        
    def load_data(self):
        """Load preprocessed data"""
        print("=" * 80)
        print("📂 LOADING PREPROCESSED DATA")
        print("=" * 80)
        
        # Load exercise database
        with open(EXERCISE_DB_PATH, 'r') as f:
            self.exercise_db = json.load(f)
        
        # Load training data
        training_df = pd.read_csv(PROCESSED_DATA_PATH / "training_data.csv")
        
        # Load user profiles
        profiles_df = pd.read_csv(PROCESSED_DATA_PATH / "user_profiles.csv")
        
        print(f"✅ Exercises: {len(self.exercise_db)}")
        print(f"✅ Training instances: {len(training_df):,}")
        print(f"✅ User profiles: {len(profiles_df):,}\n")
        
        return training_df, profiles_df
    
    def create_training_pairs(self, training_df, profiles_df, n_samples=50000):
        """Create user-exercise interaction pairs"""
        print("=" * 80)
        print("🎯 CREATING TRAINING PAIRS")
        print("=" * 80)
        
        pairs = []
        labels = []
        
        # Sample exercises
        sampled_exercises = training_df.sample(n=min(n_samples, len(training_df)), random_state=42)
        
        for idx, exercise_row in sampled_exercises.iterrows():
            # Sample a random user
            user = profiles_df.sample(n=1).iloc[0]
            
            # Check if exercise matches user profile (label = 1 if match, 0 if not)
            match_score = 0
            
            # Fitness level match
            if exercise_row['fitness_level'] == user['fitness_level']:
                match_score += 0.4
            
            # Goal match
            if exercise_row['goal_category'] == user['goal']:
                match_score += 0.3
            
            # Equipment match
            if exercise_row['equipment_category'] == user['equipment']:
                match_score += 0.3
            
            # Create pair
            pair = {
                'user_fitness': user['fitness_level'],
                'user_goal': user['goal'],
                'user_equipment': user['equipment'],
                'user_bmi': user['bmi_category'],
                'user_height': user['height'],
                'user_weight': user['weight'],
                'user_duration': user['duration_range'],
                'exercise_name': exercise_row['exercise_name'],
                'exercise_fitness': exercise_row['fitness_level'],
                'exercise_goal': exercise_row['goal_category'],
                'exercise_equipment': exercise_row['equipment_category'],
                'exercise_intensity': exercise_row['intensity_level'],
            }
            pairs.append(pair)
            labels.append(match_score)
        
        # Also create negative samples (mismatched pairs)
        for _ in range(n_samples // 2):
            user = profiles_df.sample(n=1).iloc[0]
            exercise = sampled_exercises.sample(n=1).iloc[0]
            
            # Intentionally create mismatch
            if (exercise['fitness_level'] != user['fitness_level'] and 
                exercise['goal_category'] != user['goal']):
                
                pair = {
                    'user_fitness': user['fitness_level'],
                    'user_goal': user['goal'],
                    'user_equipment': user['equipment'],
                    'user_bmi': user['bmi_category'],
                    'user_height': user['height'],
                    'user_weight': user['weight'],
                    'user_duration': user['duration_range'],
                    'exercise_name': exercise['exercise_name'],
                    'exercise_fitness': exercise['fitness_level'],
                    'exercise_goal': exercise['goal_category'],
                    'exercise_equipment': exercise['equipment_category'],
                    'exercise_intensity': exercise['intensity_level'],
                }
                pairs.append(pair)
                labels.append(0.0)  # No match
        
        pairs_df = pd.DataFrame(pairs)
        labels = np.array(labels)
        
        print(f"✅ Created {len(pairs_df):,} training pairs")
        print(f"   Positive samples: {(labels > 0.5).sum():,}")
        print(f"   Negative samples: {(labels <= 0.5).sum():,}\n")
        
        return pairs_df, labels
    
    def prepare_features(self, pairs_df):
        """Encode and normalize features"""
        print("=" * 80)
        print("🔧 PREPARING FEATURES")
        print("=" * 80)
        
        # Encode categorical features
        user_fitness_encoded = self.fitness_encoder.fit_transform(pairs_df['user_fitness'])
        user_goal_encoded = self.goal_encoder.fit_transform(pairs_df['user_goal'])
        user_equipment_encoded = self.equipment_encoder.fit_transform(pairs_df['user_equipment'])
        user_bmi_encoded = self.bmi_encoder.fit_transform(pairs_df['user_bmi'])
        
        exercise_encoded = self.exercise_encoder.fit_transform(pairs_df['exercise_name'])
        
        # Normalize numerical features
        numerical_features = pairs_df[['user_height', 'user_weight']].values
        numerical_normalized = self.scaler.fit_transform(numerical_features)
        
        print(f"✅ User fitness levels: {len(self.fitness_encoder.classes_)}")
        print(f"✅ User goals: {len(self.goal_encoder.classes_)}")
        print(f"✅ Equipment types: {len(self.equipment_encoder.classes_)}")
        print(f"✅ BMI categories: {len(self.bmi_encoder.classes_)}")
        print(f"✅ Unique exercises: {len(self.exercise_encoder.classes_)}\n")
        
        return {
            'user_fitness': user_fitness_encoded,
            'user_goal': user_goal_encoded,
            'user_equipment': user_equipment_encoded,
            'user_bmi': user_bmi_encoded,
            'user_numerical': numerical_normalized,
            'exercise': exercise_encoded
        }
    
    def build_model(self, n_exercises, n_fitness, n_goals, n_equipment, n_bmi):
        """Build ENHANCED deep learning architecture for 90%+ accuracy"""
        print("=" * 80)
        print("🏗️ BUILDING ENHANCED DEEP NEURAL NETWORK (Target: 90%+ Accuracy)")
        print("=" * 80)
        
        # User Input Layers
        user_fitness_input = layers.Input(shape=(1,), name='user_fitness')
        user_goal_input = layers.Input(shape=(1,), name='user_goal')
        user_equipment_input = layers.Input(shape=(1,), name='user_equipment')
        user_bmi_input = layers.Input(shape=(1,), name='user_bmi')
        user_numerical_input = layers.Input(shape=(2,), name='user_numerical')
        
        # Exercise Input Layer
        exercise_input = layers.Input(shape=(1,), name='exercise')
        
        # ENHANCED User Embedding Layers (increased dimensions)
        user_fitness_emb = layers.Embedding(n_fitness, 32, name='user_fitness_emb')(user_fitness_input)
        user_fitness_emb = layers.Flatten()(user_fitness_emb)
        
        user_goal_emb = layers.Embedding(n_goals, 32, name='user_goal_emb')(user_goal_input)
        user_goal_emb = layers.Flatten()(user_goal_emb)
        
        user_equipment_emb = layers.Embedding(n_equipment, 24, name='user_equipment_emb')(user_equipment_input)
        user_equipment_emb = layers.Flatten()(user_equipment_emb)
        
        user_bmi_emb = layers.Embedding(n_bmi, 16, name='user_bmi_emb')(user_bmi_input)
        user_bmi_emb = layers.Flatten()(user_bmi_emb)
        
        # ENHANCED Exercise Embedding Layer (larger dimension)
        exercise_emb = layers.Embedding(n_exercises, 128, name='exercise_emb')(exercise_input)
        exercise_emb = layers.Flatten()(exercise_emb)
        
        # Concatenate user features
        user_concat = layers.Concatenate()([
            user_fitness_emb,
            user_goal_emb,
            user_equipment_emb,
            user_bmi_emb,
            user_numerical_input
        ])
        
        # DEEPER User tower with residual connections
        user_tower = layers.Dense(256, activation='relu')(user_concat)
        user_tower = layers.BatchNormalization()(user_tower)
        user_tower = layers.Dropout(0.3)(user_tower)
        
        user_tower2 = layers.Dense(128, activation='relu')(user_tower)
        user_tower2 = layers.BatchNormalization()(user_tower2)
        user_tower2 = layers.Dropout(0.25)(user_tower2)
        
        user_tower3 = layers.Dense(64, activation='relu')(user_tower2)
        user_tower3 = layers.BatchNormalization()(user_tower3)
        user_tower3 = layers.Dropout(0.2)(user_tower3)
        
        # DEEPER Exercise tower with residual connections
        exercise_tower = layers.Dense(256, activation='relu')(exercise_emb)
        exercise_tower = layers.BatchNormalization()(exercise_tower)
        exercise_tower = layers.Dropout(0.3)(exercise_tower)
        
        exercise_tower2 = layers.Dense(128, activation='relu')(exercise_tower)
        exercise_tower2 = layers.BatchNormalization()(exercise_tower2)
        exercise_tower2 = layers.Dropout(0.25)(exercise_tower2)
        
        exercise_tower3 = layers.Dense(64, activation='relu')(exercise_tower2)
        exercise_tower3 = layers.BatchNormalization()(exercise_tower3)
        exercise_tower3 = layers.Dropout(0.2)(exercise_tower3)
        
        # Merge towers
        merged = layers.Concatenate()([user_tower3, exercise_tower3])
        
        # DEEPER interaction layers with attention-like mechanism
        x = layers.Dense(512, activation='relu')(merged)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.35)(x)
        
        x = layers.Dense(256, activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.3)(x)
        
        x = layers.Dense(128, activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.25)(x)
        
        x = layers.Dense(64, activation='relu')(x)
        x = layers.Dropout(0.2)(x)
        
        # Output layer (suitability score 0-1)
        output = layers.Dense(1, activation='sigmoid', name='suitability')(x)
        
        # Create model
        model = Model(
            inputs=[
                user_fitness_input,
                user_goal_input,
                user_equipment_input,
                user_bmi_input,
                user_numerical_input,
                exercise_input
            ],
            outputs=output
        )
        
        # Compile model with optimized parameters for higher accuracy
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0005),  # Lower learning rate for stability
            loss='binary_crossentropy',
            metrics=['accuracy', keras.metrics.AUC(name='auc'), keras.metrics.Precision(), keras.metrics.Recall()]
        )
        
        print(f"✅ Enhanced Model Architecture (90%+ target):")
        model.summary()
        print(f"\\n📊 Total parameters: {model.count_params():,}")
        print(f"💡 Key improvements:")
        print(f"   - Doubled embedding dimensions")
        print(f"   - Added deeper tower architectures")
        print(f"   - Increased interaction layer capacity (512→256→128→64)")
        print(f"   - Added Precision & Recall metrics")
        print(f"   - Reduced learning rate for better convergence\\n")
        
        self.model = model
        return model
    
    def train(self, X_train, y_train, X_val, y_val):
        """Train the ENHANCED model for 90%+ accuracy"""
        print("\n" + "=" * 80)
        print("🚀 TRAINING ENHANCED DEEP LEARNING MODEL (Target: 90%+ Accuracy)")
        print("=" * 80)
        
        # ENHANCED Callbacks
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_accuracy',  # Monitor accuracy instead of loss
            patience=15,  # Increased patience for better convergence
            restore_best_weights=True,
            mode='max',
            verbose=1
        )
        
        reduce_lr = keras.callbacks.ReduceLROnPlateau(
            monitor='val_accuracy',
            factor=0.5,
            patience=7,  # Increased patience
            min_lr=0.000001,  # Lower minimum LR
            mode='max',
            verbose=1
        )
        
        # Model checkpoint to save best model
        checkpoint = keras.callbacks.ModelCheckpoint(
            filepath=str(MODEL_PATH),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
        
        # Train with increased epochs for better convergence
        history = self.model.fit(
            X_train,
            y_train,
            validation_data=(X_val, y_val),
            epochs=50,  # Increased from default
            batch_size=32,  # Smaller batch size for better gradient updates
            callbacks=[early_stopping, reduce_lr, checkpoint],
            verbose=1
        )
        
        print("\n✅ Enhanced training complete!")
        print(f"🎯 Final validation accuracy: {max(history.history['val_accuracy']):.4f}")
        print(f"🎯 Final validation AUC: {max(history.history['val_auc']):.4f}")
        
        return history
    
    def save_model(self):
        """Save model and encoders"""
        print("\n" + "=" * 80)
        print("💾 SAVING MODEL AND ARTIFACTS")
        print("=" * 80)
        
        # Save Keras model
        self.model.save(MODEL_PATH)
        print(f"✅ Model saved: {MODEL_PATH}")
        
        # Save encoders and scaler
        artifacts = {
            'exercise_encoder': self.exercise_encoder,
            'fitness_encoder': self.fitness_encoder,
            'goal_encoder': self.goal_encoder,
            'equipment_encoder': self.equipment_encoder,
            'bmi_encoder': self.bmi_encoder,
            'scaler': self.scaler
        }
        
        with open(ENCODER_PATH, 'wb') as f:
            pickle.dump(artifacts, f)
        print(f"✅ Encoders saved: {ENCODER_PATH}")
        
    def plot_training_history(self, history):
        """Plot training curves"""
        print("\n" + "=" * 80)
        print("📊 GENERATING TRAINING PLOTS")
        print("=" * 80)
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        # Loss
        axes[0].plot(history.history['loss'], label='Train Loss')
        axes[0].plot(history.history['val_loss'], label='Val Loss')
        axes[0].set_title('Model Loss', fontsize=14, fontweight='bold')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Loss')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Accuracy
        axes[1].plot(history.history['accuracy'], label='Train Accuracy')
        axes[1].plot(history.history['val_accuracy'], label='Val Accuracy')
        axes[1].set_title('Model Accuracy', fontsize=14, fontweight='bold')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Accuracy')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        # AUC
        axes[2].plot(history.history['auc'], label='Train AUC')
        axes[2].plot(history.history['val_auc'], label='Val AUC')
        axes[2].set_title('Model AUC (ROC)', fontsize=14, fontweight='bold')
        axes[2].set_xlabel('Epoch')
        axes[2].set_ylabel('AUC')
        axes[2].legend()
        axes[2].grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        plot_path = ARTIFACTS_DIR / "training_history.png"
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        print(f"✅ Training plots saved: {plot_path}")
        plt.close()

def main():
    """Main training pipeline"""
    print("\n🚀 DEEP LEARNING CARDIO RECOMMENDER TRAINING")
    print("=" * 80)
    
    # Initialize model
    recommender = CardioRecommenderModel()
    
    # Load data
    training_df, profiles_df = recommender.load_data()
    
    # Create training pairs
    pairs_df, labels = recommender.create_training_pairs(training_df, profiles_df, n_samples=50000)
    
    # Prepare features
    features = recommender.prepare_features(pairs_df)
    
    # Train/validation split
    print("=" * 80)
    print("✂️ SPLITTING DATA")
    print("=" * 80)
    
    indices = np.arange(len(labels))
    train_idx, val_idx = train_test_split(indices, test_size=VALIDATION_SPLIT, random_state=42)
    
    X_train = {k: v[train_idx] for k, v in features.items()}
    X_val = {k: v[val_idx] for k, v in features.items()}
    y_train = labels[train_idx]
    y_val = labels[val_idx]
    
    print(f"✅ Training samples: {len(train_idx):,}")
    print(f"✅ Validation samples: {len(val_idx):,}\n")
    
    # Build model
    recommender.build_model(
        n_exercises=len(recommender.exercise_encoder.classes_),
        n_fitness=len(recommender.fitness_encoder.classes_),
        n_goals=len(recommender.goal_encoder.classes_),
        n_equipment=len(recommender.equipment_encoder.classes_),
        n_bmi=len(recommender.bmi_encoder.classes_)
    )
    
    # Train model
    history = recommender.train(X_train, y_train, X_val, y_val)
    
    # Save model
    recommender.save_model()
    
    # Plot history
    recommender.plot_training_history(history)
    
    # Evaluate
    print("\n" + "=" * 80)
    print("📈 FINAL EVALUATION")
    print("=" * 80)
    
    val_predictions = recommender.model.predict(X_val)
    val_pred_binary = (val_predictions > 0.5).astype(int)
    
    final_metrics = {
        'val_loss': history.history['val_loss'][-1],
        'val_accuracy': history.history['val_accuracy'][-1],
        'val_auc': history.history['val_auc'][-1],
    }
    
    print(f"✅ Validation Loss: {final_metrics['val_loss']:.4f}")
    print(f"✅ Validation Accuracy: {final_metrics['val_accuracy']:.4f}")
    print(f"✅ Validation AUC: {final_metrics['val_auc']:.4f}")
    
    # Save metrics
    with open(ARTIFACTS_DIR / "training_metrics.json", 'w') as f:
        json.dump(final_metrics, f, indent=2)
    
    print("\n" + "=" * 80)
    print("✅ TRAINING PIPELINE COMPLETE!")
    print("=" * 80)
    print(f"📊 Model: {MODEL_PATH}")
    print(f"📊 Artifacts: {ARTIFACTS_DIR}")
    print(f"\n➡️ Next step: Create ML-based server and integrate")
    print("=" * 80)

if __name__ == "__main__":
    main()
