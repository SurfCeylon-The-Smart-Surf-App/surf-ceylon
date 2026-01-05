# Surf Model Files Directory

Place your trained model files here:

1. **surf_model.pkl** - The trained Random Forest classifier for surf pose detection
2. **label_encoder.pkl** - The label encoder for pose class names

## Training the Models

If you haven't trained the models yet, use the Google Colab notebook provided in the training documentation.

The models should be trained on surf pose videos with labeled categories like:

- perfect_popup
- good_popup
- needs_work_popup
- riding_wave
- duck_dive
- paddling
- wipeout

## Model Requirements

- **surf_model.pkl**: Scikit-learn RandomForestClassifier trained on MediaPipe pose landmarks
- **label_encoder.pkl**: Scikit-learn LabelEncoder for class names

Both files are required for the AI Video Analyzer feature to work.
