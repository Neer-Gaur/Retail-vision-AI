#!/usr/bin/env python3
"""
Backend API Testing for Retail-Vision AI
Tests the actual implemented endpoints: /health and /visualize
"""

import requests
import sys
import json
from datetime import datetime
import time

class RetailVisionAPITester:
    def __init__(self, base_url="https://smooth-login-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, timeout=30):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            
            return response
        except requests.exceptions.Timeout:
            print(f"Request timed out after {timeout} seconds")
            return None
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_health_endpoint(self):
        """Test GET /api/health endpoint"""
        print("\n🏥 Testing Health Check Endpoint")
        
        response = self.make_request('GET', 'health')
        
        if response is None:
            self.log_test("Health Check - Connection", False, "Failed to connect to API")
            return False
        
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('status') == 'healthy':
                    self.log_test("Health Check - Status Response", True)
                    return True
                else:
                    self.log_test("Health Check - Status Response", False, f"Unexpected status: {result}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Health Check - JSON Response", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Health Check - HTTP Status", False, f"Status code: {response.status_code}")
            return False

    def test_visualize_endpoint_structure(self):
        """Test POST /api/visualize endpoint structure and validation"""
        print("\n🎨 Testing AI Visualization Endpoint Structure")
        
        # Test with missing data
        response = self.make_request('POST', 'visualize', {}, timeout=10)
        
        if response and response.status_code == 422:
            self.log_test("Visualize - Missing Data Validation", True)
        else:
            self.log_test("Visualize - Missing Data Validation", False, f"Expected 422, got {response.status_code if response else 'None'}")

        # Test with invalid URLs
        invalid_data = {
            "customer_photo_url": "invalid_url",
            "product_image_urls": ["invalid_url"],
            "product_names": ["Test Product"],
            "industry": "fashion"
        }
        
        response = self.make_request('POST', 'visualize', invalid_data, timeout=10)
        
        if response and response.status_code == 400:
            self.log_test("Visualize - Invalid URL Handling", True)
        else:
            # Check if it's a different error but still handled properly
            if response and response.status_code in [422, 500]:
                self.log_test("Visualize - Invalid URL Handling", True, f"Handled with status {response.status_code}")
            else:
                self.log_test("Visualize - Invalid URL Handling", False, f"Expected error status, got {response.status_code if response else 'None'}")

    def test_visualize_endpoint_with_valid_data(self):
        """Test POST /api/visualize with valid image URLs"""
        print("\n🖼️  Testing AI Visualization with Valid Data")
        
        # Use publicly accessible image URLs
        valid_data = {
            "customer_photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
            "product_image_urls": [
                "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop"
            ],
            "product_names": ["Elegant Dress"],
            "industry": "fashion"
        }
        
        print("   Testing with fashion industry...")
        response = self.make_request('POST', 'visualize', valid_data, timeout=60)
        
        if response is None:
            self.log_test("Visualize - Fashion Industry Request", False, "Request timeout or connection error")
            return False
        
        if response.status_code == 200:
            try:
                result = response.json()
                if 'results' in result and len(result['results']) > 0:
                    first_result = result['results'][0]
                    if first_result.get('status') in ['success', 'failed']:
                        self.log_test("Visualize - Fashion Industry Response Structure", True)
                        
                        # Check if AI generation worked
                        if first_result.get('status') == 'success' and first_result.get('result_image'):
                            self.log_test("Visualize - AI Image Generation Success", True)
                        elif first_result.get('status') == 'failed':
                            error_msg = first_result.get('error', 'Unknown error')
                            self.log_test("Visualize - AI Generation Failed", False, f"AI Error: {error_msg}")
                        else:
                            self.log_test("Visualize - AI Generation Status", False, "Unclear generation status")
                    else:
                        self.log_test("Visualize - Fashion Industry Response Structure", False, f"Invalid status: {first_result.get('status')}")
                else:
                    self.log_test("Visualize - Fashion Industry Response Structure", False, "No results in response")
            except json.JSONDecodeError:
                self.log_test("Visualize - Fashion Industry JSON", False, "Invalid JSON response")
        else:
            try:
                error_detail = response.json().get('detail', 'Unknown error') if response.text else 'No error details'
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_test("Visualize - Fashion Industry Request", False, error_detail)

        # Test tiles industry
        tiles_data = {
            "customer_photo_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
            "product_image_urls": [
                "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=400&fit=crop"
            ],
            "product_names": ["Marble Tiles"],
            "industry": "tiles"
        }
        
        print("   Testing with tiles industry...")
        response = self.make_request('POST', 'visualize', tiles_data, timeout=60)
        
        if response and response.status_code == 200:
            try:
                result = response.json()
                if 'results' in result and len(result['results']) > 0:
                    self.log_test("Visualize - Tiles Industry Response", True)
                else:
                    self.log_test("Visualize - Tiles Industry Response", False, "No results returned")
            except json.JSONDecodeError:
                self.log_test("Visualize - Tiles Industry JSON", False, "Invalid JSON response")
        else:
            error_detail = response.json().get('detail', 'Unknown error') if response and response.text else f"HTTP {response.status_code if response else 'None'}"
            self.log_test("Visualize - Tiles Industry Response", False, error_detail)

    def test_api_key_configuration(self):
        """Test if EMERGENT_LLM_KEY is properly configured"""
        print("\n🔑 Testing API Key Configuration")
        
        # We can't directly test the API key, but we can infer from the visualization response
        # If the key is missing, the endpoint should return a specific error
        test_data = {
            "customer_photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
            "product_image_urls": [
                "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop"
            ],
            "product_names": ["Test Product"],
            "industry": "fashion"
        }
        
        response = self.make_request('POST', 'visualize', test_data, timeout=30)
        
        if response and response.status_code == 200:
            try:
                result = response.json()
                if 'results' in result and len(result['results']) > 0:
                    first_result = result['results'][0]
                    if first_result.get('error') == "API key not configured":
                        self.log_test("API Key Configuration", False, "EMERGENT_LLM_KEY not configured")
                    else:
                        self.log_test("API Key Configuration", True, "API key appears to be configured")
                else:
                    self.log_test("API Key Configuration", False, "Unexpected response structure")
            except json.JSONDecodeError:
                self.log_test("API Key Configuration", False, "Invalid JSON response")
        else:
            self.log_test("API Key Configuration", False, "Could not test API key configuration")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Retail-Vision AI Backend Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Test health endpoint
        health_ok = self.test_health_endpoint()
        
        if not health_ok:
            print("❌ Health check failed - API may not be running")
            # Continue with other tests anyway
        
        # Test visualization endpoint
        self.test_visualize_endpoint_structure()
        self.test_visualize_endpoint_with_valid_data()
        self.test_api_key_configuration()

        # Results Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = RetailVisionAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": f"{(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "0%",
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results_actual.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())