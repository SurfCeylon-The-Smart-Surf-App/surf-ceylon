#!/usr/bin/env python3
"""
Toxicity Checker Service (Refactored)
Uses modular architecture with clean separation of concerns.

This file maintains backward compatibility with Node.js backend.
All business logic has been extracted to organized modules:
- models/ - Toxicity detection model and TF-IDF vectorizer
- services/ - Text analysis and classification

Usage:
    python check_toxicity_cli.py "<text_to_check>"
    
Output:
    JSON with toxicity classification and probability scores
"""

# Suppress all warnings before any imports
import warnings
warnings.filterwarnings('ignore')
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN warnings

# Import directly from module file, bypassing package __init__
import sys
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "toxicity_detector",
    Path(__file__).parent / "services" / "toxicity_detector.py"
)
toxicity_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(toxicity_module)

main = toxicity_module.main

if __name__ == '__main__':
    main()
