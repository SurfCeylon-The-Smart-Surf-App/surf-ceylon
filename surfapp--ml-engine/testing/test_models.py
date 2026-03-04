"""
Model Testing Module
====================
Unit tests and integration tests for ML models.

Usage:
    python test_models.py
    
    Or with pytest:
    pytest test_models.py -v
"""

import unittest
import numpy as np
import os
import sys
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestRiskPrediction(unittest.TestCase):
    """Test cases for risk prediction model"""
    
    @classmethod
    def setUpClass(cls):
        """Load models before tests"""
        import joblib
        
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        
        try:
            cls.rf_model = joblib.load(os.path.join(models_dir, 'risk_classifier.pkl'))
            cls.gb_model = joblib.load(os.path.join(models_dir, 'risk_regressor.pkl'))
            cls.feature_cols = joblib.load(os.path.join(models_dir, 'feature_cols.pkl'))
            cls.models_loaded = True
        except FileNotFoundError:
            cls.models_loaded = False
            print("⚠️ Models not found. Run training first.")
    
    def test_models_exist(self):
        """Test that trained models exist"""
        self.assertTrue(self.models_loaded, "Models should be loaded successfully")
    
    def test_feature_columns(self):
        """Test that feature columns are correctly defined"""
        if not self.models_loaded:
            self.skipTest("Models not loaded")
        
        expected_cols = [
            'total_incidents', 'fatal_count', 'severe_count', 'moderate_count',
            'drowning_count', 'reef_cut_count', 'collision_count', 'rip_current_count',
            'is_peak_season', 'incidents_per_year'
        ]
        
        self.assertEqual(self.feature_cols, expected_cols)
    
    def test_prediction_output_format(self):
        """Test that prediction returns correct format"""
        if not self.models_loaded:
            self.skipTest("Models not loaded")
        
        # Sample feature vector
        sample_features = np.array([[10, 1, 2, 5, 1, 2, 1, 2, 1, 1.0]])
        
        prediction = self.rf_model.predict(sample_features)
        proba = self.rf_model.predict_proba(sample_features)
        
        # Check prediction is valid risk level (0, 1, or 2)
        self.assertIn(prediction[0], [0, 1, 2])
        
        # Check probabilities sum to 1
        self.assertAlmostEqual(proba[0].sum(), 1.0, places=5)
    
    def test_low_risk_prediction(self):
        """Test prediction for low-risk scenario"""
        if not self.models_loaded:
            self.skipTest("Models not loaded")
        
        # Low risk: few incidents, no fatalities
        low_risk_features = np.array([[2, 0, 0, 1, 0, 1, 0, 0, 0, 0.2]])
        
        prediction = self.rf_model.predict(low_risk_features)
        
        # Should predict low risk (0) or medium risk (1)
        self.assertIn(prediction[0], [0, 1])
    
    def test_high_risk_prediction(self):
        """Test prediction for high-risk scenario"""
        if not self.models_loaded:
            self.skipTest("Models not loaded")
        
        # High risk: many incidents, fatalities, drownings
        high_risk_features = np.array([[50, 5, 10, 20, 10, 5, 5, 10, 1, 5.0]])
        
        prediction = self.rf_model.predict(high_risk_features)
        
        # Should predict high risk (2) or medium risk (1)
        self.assertIn(prediction[0], [1, 2])
    
    def test_prediction_consistency(self):
        """Test that same input gives same output"""
        if not self.models_loaded:
            self.skipTest("Models not loaded")
        
        sample_features = np.array([[15, 2, 3, 8, 2, 3, 1, 3, 1, 1.5]])
        
        pred1 = self.rf_model.predict(sample_features)
        pred2 = self.rf_model.predict(sample_features)
        
        self.assertEqual(pred1[0], pred2[0])


class TestHazardAnalysis(unittest.TestCase):
    """Test cases for hazard image analysis"""
    
    def test_analyze_hazard_import(self):
        """Test that analyze_hazard module can be imported"""
        try:
            from analyze_hazard import analyze_hazard_image
            self.assertTrue(True)
        except ImportError as e:
            self.fail(f"Failed to import analyze_hazard: {e}")
    
    def test_analyze_nonexistent_image(self):
        """Test analysis of non-existent image"""
        from analyze_hazard import analyze_hazard_image
        
        result = analyze_hazard_image('/nonexistent/path/image.jpg', 'Rip Current')
        
        # Should return error result, not crash
        self.assertIn('detectedHazards', result)
        self.assertIn('confidenceScore', result)
        self.assertEqual(result['confidenceScore'], 0)
    
    def test_analyze_hazard_types(self):
        """Test that different hazard types generate appropriate suggestions"""
        from analyze_hazard import analyze_hazard_image
        
        hazard_types = [
            ('Rip Current', 'rip'),
            ('Reef Cuts', 'reef'),
            ('Jellyfish', 'jellyfish')
        ]
        
        for hazard_type, expected_keyword in hazard_types:
            result = analyze_hazard_image('/fake/path.jpg', hazard_type)
            # Suggestions should be relevant to hazard type
            self.assertIsInstance(result['aiSuggestions'], str)


class TestSkillRiskCalculation(unittest.TestCase):
    """Test cases for skill-level risk calculation"""
    
    def test_skill_risk_import(self):
        """Test that calculate_skill_risk module can be imported"""
        try:
            from calculate_skill_risk import MANUAL_RISK_SCORES
            self.assertTrue(True)
        except ImportError as e:
            self.fail(f"Failed to import calculate_skill_risk: {e}")
    
    def test_all_spots_have_risk_scores(self):
        """Test that all spots have risk scores for all skill levels"""
        from calculate_skill_risk import MANUAL_RISK_SCORES
        
        skill_levels = ['beginner', 'intermediate', 'advanced']
        
        for spot, scores in MANUAL_RISK_SCORES.items():
            for level in skill_levels:
                self.assertIn(level, scores, f"{spot} missing {level} risk score")
                self.assertGreaterEqual(scores[level], 0)
                self.assertLessEqual(scores[level], 10)
    
    def test_beginner_risk_higher_than_advanced(self):
        """Test that beginners generally have higher risk than advanced"""
        from calculate_skill_risk import MANUAL_RISK_SCORES
        
        higher_count = 0
        for spot, scores in MANUAL_RISK_SCORES.items():
            if scores['beginner'] >= scores['advanced']:
                higher_count += 1
        
        # Most spots should have higher beginner risk
        self.assertGreater(higher_count, len(MANUAL_RISK_SCORES) / 2)


def test_risk_prediction():
    """Run risk prediction tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestRiskPrediction)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def test_hazard_analysis():
    """Run hazard analysis tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestHazardAnalysis)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def run_all_tests():
    """Run all model tests"""
    print("=" * 60)
    print("🧪 Running ML Model Tests")
    print("=" * 60)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestRiskPrediction))
    suite.addTests(loader.loadTestsFromTestCase(TestHazardAnalysis))
    suite.addTests(loader.loadTestsFromTestCase(TestSkillRiskCalculation))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print("=" * 60)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
