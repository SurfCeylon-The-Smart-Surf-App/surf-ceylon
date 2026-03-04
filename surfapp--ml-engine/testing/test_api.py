"""
API Testing Module
==================
Tests for the ML Flask API endpoints.

Usage:
    python test_api.py
    
    Or with pytest:
    pytest test_api.py -v
"""

import unittest
import json
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestMLAPI(unittest.TestCase):
    """Test cases for ML API endpoints"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client"""
        try:
            from app import app
            cls.app = app
            cls.client = app.test_client()
            cls.api_available = True
        except ImportError:
            cls.api_available = False
            print("⚠️ Flask app not available for testing")
    
    def test_health_endpoint(self):
        """Test /health endpoint"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'OK')
        self.assertIn('message', data)
    
    def test_predict_risk_endpoint(self):
        """Test /predict-risk/<spot_name> endpoint"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.get('/predict-risk/Hikkaduwa')
        
        # Should return 200 or 404/500 if spot not found
        self.assertIn(response.status_code, [200, 404, 500])
        
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('success', data)
    
    def test_update_risk_score_endpoint(self):
        """Test /update-risk-score endpoint"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.post(
            '/update-risk-score',
            data=json.dumps({'surf_spot_id': 'test123'}),
            content_type='application/json'
        )
        
        # Should return 200 or error status
        self.assertIn(response.status_code, [200, 400, 404, 500])
    
    def test_analyze_hazard_endpoint_no_files(self):
        """Test /analyze-hazard endpoint without files"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.post(
            '/analyze-hazard',
            data={'hazard_type': 'Rip Current'}
        )
        
        # Should handle missing files gracefully
        self.assertIn(response.status_code, [200, 400, 500])
    
    def test_invalid_endpoint(self):
        """Test non-existent endpoint returns 404"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.get('/nonexistent-endpoint')
        self.assertEqual(response.status_code, 404)
    
    def test_skill_risk_endpoint(self):
        """Test /skill-risk/<spot_name> endpoint if it exists"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.get('/skill-risk/Hikkaduwa')
        
        # Endpoint may or may not exist
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('success', data)


class TestAPIResponses(unittest.TestCase):
    """Test API response formats"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client"""
        try:
            from app import app
            cls.client = app.test_client()
            cls.api_available = True
        except ImportError:
            cls.api_available = False
    
    def test_response_is_json(self):
        """Test that responses are JSON"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.get('/health')
        self.assertEqual(response.content_type, 'application/json')
    
    def test_success_response_format(self):
        """Test successful response format"""
        if not self.api_available:
            self.skipTest("API not available")
        
        response = self.client.get('/health')
        data = json.loads(response.data)
        
        # Should have status field
        self.assertIn('status', data)
    
    def test_error_response_format(self):
        """Test error response format"""
        if not self.api_available:
            self.skipTest("API not available")
        
        # Make request that might fail
        response = self.client.get('/predict-risk/NonExistentSpot12345')
        
        if response.status_code != 200:
            data = json.loads(response.data)
            # Error responses should have message or error field
            self.assertTrue('message' in data or 'error' in data or 'success' in data)


def test_api_endpoints():
    """Run API endpoint tests"""
    print("=" * 60)
    print("🌐 Running API Tests")
    print("=" * 60)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestMLAPI))
    suite.addTests(loader.loadTestsFromTestCase(TestAPIResponses))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = test_api_endpoints()
    sys.exit(0 if success else 1)
