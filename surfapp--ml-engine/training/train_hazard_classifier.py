"""
Hazard Image Classifier - Custom CNN Training Script
=====================================================
Surf Ceylon ML Engine

This script trains a Convolutional Neural Network (CNN) to classify
surf hazard images into 7 categories:
- shark
- jellyfish  
- rip_current
- sea_urchin
- large_waves
- reef_coral
- no_hazard

Requirements:
- TensorFlow 2.16.2+
- At least 100 images per category (700+ total recommended)

Usage:
    python train_hazard_classifier.py
    python train_hazard_classifier.py --epochs 50 --batch-size 32
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping, 
    ModelCheckpoint, 
    ReduceLROnPlateau,
    TensorBoard
)
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "hazard_images"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_DIR = ARTIFACTS_DIR / "hazard_classifier"

# Hazard categories (must match folder names)
HAZARD_CLASSES = [
    'shark',
    'jellyfish',
    'rip_current', 
    'sea_urchin',
    'large_waves',
    'reef_coral',
    'no_hazard'
]

# Default hyperparameters
DEFAULT_CONFIG = {
    'img_height': 224,
    'img_width': 224,
    'batch_size': 32,
    'epochs': 50,
    'learning_rate': 0.0005,
    'validation_split': 0.2,
    'dropout_rate': 0.6,
    'min_images_per_class': 50
}


def check_dataset():
    """Validate dataset before training."""
    print("\n📊 Checking Dataset...")
    print("="*50)
    
    issues = []
    class_counts = {}
    
    for class_name in HAZARD_CLASSES:
        class_dir = DATA_DIR / class_name
        if not class_dir.exists():
            issues.append(f"❌ Missing folder: {class_name}")
            class_counts[class_name] = 0
            continue
        
        # Count actual images (not placeholder files)
        images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png")) + list(class_dir.glob("*.jpeg"))
        count = len(images)
        class_counts[class_name] = count
        
        if count < DEFAULT_CONFIG['min_images_per_class']:
            issues.append(f"⚠️  {class_name}: only {count} images (need {DEFAULT_CONFIG['min_images_per_class']}+)")
        else:
            print(f"  ✅ {class_name}: {count} images")
    
    total = sum(class_counts.values())
    print(f"\n  📦 Total: {total} images")
    
    if issues:
        print("\n⚠️  Issues found:")
        for issue in issues:
            print(f"  {issue}")
        
        if total < 200:
            print("\n❌ CRITICAL: Not enough images to train!")
            print("   Run: python training/download_hazard_images.py --all --count 100")
            return False, class_counts
    
    return True, class_counts


def create_data_generators(config):
    """Create training and validation data generators with augmentation."""
    
    # Training data augmentation (enhanced for better generalization)
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=config['validation_split'],
        rotation_range=30,
        width_shift_range=0.25,
        height_shift_range=0.25,
        shear_range=0.2,
        zoom_range=0.3,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=[0.7, 1.3],
        channel_shift_range=30,
        fill_mode='nearest'
    )
    
    # Validation data (no augmentation, just rescale)
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=config['validation_split']
    )
    
    print(f"\n📂 Loading images from: {DATA_DIR}")
    
    train_generator = train_datagen.flow_from_directory(
        DATA_DIR,
        target_size=(config['img_height'], config['img_width']),
        batch_size=config['batch_size'],
        class_mode='categorical',
        classes=HAZARD_CLASSES,
        subset='training',
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        DATA_DIR,
        target_size=(config['img_height'], config['img_width']),
        batch_size=config['batch_size'],
        class_mode='categorical',
        classes=HAZARD_CLASSES,
        subset='validation',
        shuffle=False
    )
    
    return train_generator, val_generator


def build_cnn_model(num_classes, config):
    """
    Build a Custom CNN model for hazard classification.
    Architecture designed for image classification with 7 classes.
    Simplified to 3 Conv blocks to reduce overfitting.
    """
    
    # L2 regularization to reduce overfitting
    l2_reg = keras.regularizers.l2(0.001)
    
    model = keras.Sequential([
        # Input layer
        layers.Input(shape=(config['img_height'], config['img_width'], 3)),
        
        # Block 1: Initial feature extraction
        layers.Conv2D(32, (3, 3), activation='relu', padding='same', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 2: Deeper features
        layers.Conv2D(64, (3, 3), activation='relu', padding='same', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 3: Complex patterns
        layers.Conv2D(128, (3, 3), activation='relu', padding='same', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Global pooling and classification (simplified)
        layers.GlobalAveragePooling2D(),
        layers.Dense(256, activation='relu', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.Dropout(config['dropout_rate']),
        layers.Dense(128, activation='relu', kernel_regularizer=l2_reg),
        layers.BatchNormalization(),
        layers.Dropout(config['dropout_rate']),
        
        # Output layer
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model


def train_model(model, train_gen, val_gen, config):
    """Train the model with callbacks for best performance."""
    
    # Create model directory
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config['learning_rate']),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    # Callbacks
    callbacks = [
        # Save best model
        ModelCheckpoint(
            MODEL_DIR / 'hazard_classifier_best.keras',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        # Early stopping
        EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        # Reduce learning rate on plateau
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        # TensorBoard logging
        TensorBoard(
            log_dir=MODEL_DIR / 'logs' / datetime.now().strftime("%Y%m%d-%H%M%S"),
            histogram_freq=1
        )
    ]
    
    print("\n🚀 Starting Training...")
    print("="*50)
    
    # Calculate steps
    steps_per_epoch = train_gen.samples // config['batch_size']
    validation_steps = val_gen.samples // config['batch_size']
    
    # Handle class imbalance using sklearn's balanced class weights
    from sklearn.utils.class_weight import compute_class_weight
    class_weights = None
    if train_gen.samples > 0:
        # Get class indices from generator
        classes = train_gen.classes
        unique_classes = np.unique(classes)
        # Compute balanced class weights
        weights = compute_class_weight(
            class_weight='balanced',
            classes=unique_classes,
            y=classes
        )
        class_weights = dict(zip(unique_classes, weights))
        print(f"\n⚖️  Class weights: {class_weights}")
    
    history = model.fit(
        train_gen,
        steps_per_epoch=max(1, steps_per_epoch),
        epochs=config['epochs'],
        validation_data=val_gen,
        validation_steps=max(1, validation_steps),
        callbacks=callbacks,
        class_weight=class_weights,
        verbose=1
    )
    
    return history


def evaluate_model(model, val_gen, config):
    """Evaluate model and generate reports."""
    
    print("\n📈 Evaluating Model...")
    print("="*50)
    
    # Get predictions
    val_gen.reset()
    predictions = model.predict(val_gen, verbose=1)
    predicted_classes = np.argmax(predictions, axis=1)
    true_classes = val_gen.classes
    
    # Classification report
    print("\n📊 Classification Report:")
    print("-"*50)
    report = classification_report(
        true_classes, 
        predicted_classes, 
        target_names=HAZARD_CLASSES,
        output_dict=True
    )
    print(classification_report(true_classes, predicted_classes, target_names=HAZARD_CLASSES))
    
    # Confusion matrix
    cm = confusion_matrix(true_classes, predicted_classes)
    
    # Save evaluation results
    eval_results = {
        'classification_report': report,
        'confusion_matrix': cm.tolist(),
        'classes': HAZARD_CLASSES,
        'accuracy': float(report['accuracy']),
        'timestamp': datetime.now().isoformat()
    }
    
    with open(MODEL_DIR / 'evaluation_results.json', 'w') as f:
        json.dump(eval_results, f, indent=2)
    
    return eval_results


def plot_training_history(history, save_path):
    """Plot and save training history."""
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Accuracy plot
    axes[0].plot(history.history['accuracy'], label='Train Accuracy')
    axes[0].plot(history.history['val_accuracy'], label='Val Accuracy')
    axes[0].set_title('Model Accuracy')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Accuracy')
    axes[0].legend()
    axes[0].grid(True)
    
    # Loss plot
    axes[1].plot(history.history['loss'], label='Train Loss')
    axes[1].plot(history.history['val_loss'], label='Val Loss')
    axes[1].set_title('Model Loss')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Loss')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"\n📊 Training history saved to: {save_path}")


def save_model_metadata(config, class_counts, eval_results):
    """Save model metadata for inference."""
    
    metadata = {
        'model_name': 'hazard_classifier',
        'version': '1.0.0',
        'created': datetime.now().isoformat(),
        'classes': HAZARD_CLASSES,
        'num_classes': len(HAZARD_CLASSES),
        'input_shape': [config['img_height'], config['img_width'], 3],
        'training_config': config,
        'class_distribution': class_counts,
        'accuracy': eval_results.get('accuracy', 0),
        'model_file': 'hazard_classifier_best.keras'
    }
    
    with open(MODEL_DIR / 'model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n💾 Model metadata saved to: {MODEL_DIR / 'model_metadata.json'}")


def main():
    parser = argparse.ArgumentParser(description='Train Hazard Image Classifier')
    parser.add_argument('--epochs', type=int, default=DEFAULT_CONFIG['epochs'])
    parser.add_argument('--batch-size', type=int, default=DEFAULT_CONFIG['batch_size'])
    parser.add_argument('--learning-rate', type=float, default=DEFAULT_CONFIG['learning_rate'])
    parser.add_argument('--skip-check', action='store_true', help='Skip dataset validation')
    
    args = parser.parse_args()
    
    # Update config
    config = DEFAULT_CONFIG.copy()
    config['epochs'] = args.epochs
    config['batch_size'] = args.batch_size
    config['learning_rate'] = args.learning_rate
    
    print("🏄 Surf Ceylon - Hazard Classifier Training")
    print("="*50)
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")
    
    # Check dataset
    if not args.skip_check:
        is_valid, class_counts = check_dataset()
        if not is_valid:
            print("\n❌ Please fix dataset issues before training.")
            sys.exit(1)
    else:
        _, class_counts = check_dataset()
    
    # Create data generators
    train_gen, val_gen = create_data_generators(config)
    
    if train_gen.samples == 0:
        print("\n❌ No training images found!")
        sys.exit(1)
    
    # Build model
    print("\n🏗️  Building CNN Model...")
    model = build_cnn_model(len(HAZARD_CLASSES), config)
    model.summary()
    
    # Train model
    history = train_model(model, train_gen, val_gen, config)
    
    # Evaluate
    eval_results = evaluate_model(model, val_gen, config)
    
    # Save plots
    plot_training_history(history, MODEL_DIR / 'training_history.png')
    
    # Save metadata
    save_model_metadata(config, class_counts, eval_results)
    
    # Final model save (in addition to checkpoint)
    model.save(MODEL_DIR / 'hazard_classifier_final.keras')
    
    print("\n" + "="*50)
    print("✅ TRAINING COMPLETE!")
    print("="*50)
    print(f"   Model saved to: {MODEL_DIR}")
    print(f"   Best accuracy: {max(history.history['val_accuracy']):.2%}")
    print(f"   Final accuracy: {eval_results['accuracy']:.2%}")
    print("\n📝 Next steps:")
    print("   1. Review training_history.png for overfitting")
    print("   2. Check evaluation_results.json for per-class performance")
    print("   3. The model will be automatically used by analyze_hazard.py")


if __name__ == "__main__":
    main()
