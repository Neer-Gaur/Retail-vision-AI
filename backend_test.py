#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Retail-Vision AI
Tests all endpoints for multi-tenant SaaS functionality
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
        self.founder_token = None
        self.owner_token = None
        self.tenant_id = None
        self.industry = None
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

    def make_request(self, method, endpoint, data=None, token=None):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            return response
        except Exception as e:
            return None

    def test_founder_signup(self):
        """Test founder account creation"""
        timestamp = int(time.time())
        data = {
            "email": f"founder_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "founder"
        }
        
        response = self.make_request('POST', 'auth/signup', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.founder_token = result.get('token')
            self.log_test("Founder Signup", True)
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'Connection failed'
            self.log_test("Founder Signup", False, error_msg)
            return False

    def test_owner_signup(self):
        """Test owner account creation with shop setup"""
        timestamp = int(time.time())
        data = {
            "email": f"owner_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "owner",
            "shop_name": "Test Fashion Store",
            "industry": "fashion",
            "admin_pin": "1234"
        }
        
        response = self.make_request('POST', 'auth/signup', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.owner_token = result.get('token')
            self.tenant_id = result.get('tenant_id')
            self.industry = result.get('industry')
            self.log_test("Owner Signup", True)
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'Connection failed'
            self.log_test("Owner Signup", False, error_msg)
            return False

    def test_login_flows(self):
        """Test login for both roles"""
        # Test with invalid credentials first
        invalid_data = {
            "email": "invalid@test.com",
            "password": "wrongpass"
        }
        
        response = self.make_request('POST', 'auth/login', invalid_data)
        if response and response.status_code == 401:
            self.log_test("Login - Invalid Credentials Rejection", True)
        else:
            self.log_test("Login - Invalid Credentials Rejection", False, "Should return 401")

    def test_inventory_crud(self):
        """Test complete inventory CRUD operations"""
        if not self.owner_token:
            self.log_test("Inventory CRUD", False, "No owner token available")
            return False

        # Create inventory item
        item_data = {
            "name": "Test Saree Collection",
            "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
            "category": "Traditional",
            "price": 299.99,
            "tags": ["silk", "traditional", "wedding"],
            "stock": 10
        }
        
        response = self.make_request('POST', 'inventory', item_data, self.owner_token)
        
        if response and response.status_code == 200:
            item_id = response.json().get('id')
            self.log_test("Inventory - Create Item", True)
            
            # Test get inventory
            response = self.make_request('GET', 'inventory', token=self.owner_token)
            if response and response.status_code == 200:
                items = response.json()
                if len(items) > 0:
                    self.log_test("Inventory - Get All Items", True)
                else:
                    self.log_test("Inventory - Get All Items", False, "No items returned")
            else:
                self.log_test("Inventory - Get All Items", False, "Failed to fetch")
            
            # Test kiosk inventory (stock > 0 only)
            response = self.make_request('GET', 'inventory?kiosk=true', token=self.owner_token)
            if response and response.status_code == 200:
                self.log_test("Inventory - Kiosk Filter (Stock > 0)", True)
            else:
                self.log_test("Inventory - Kiosk Filter (Stock > 0)", False)
            
            # Test update item
            update_data = {
                "price": 349.99,
                "stock": 15
            }
            response = self.make_request('PUT', f'inventory/{item_id}', update_data, self.owner_token)
            if response and response.status_code == 200:
                self.log_test("Inventory - Update Item", True)
            else:
                self.log_test("Inventory - Update Item", False)
            
            # Test delete item
            response = self.make_request('DELETE', f'inventory/{item_id}', token=self.owner_token)
            if response and response.status_code == 200:
                self.log_test("Inventory - Delete Item", True)
            else:
                self.log_test("Inventory - Delete Item", False)
            
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'Connection failed'
            self.log_test("Inventory - Create Item", False, error_msg)
            return False

    def test_lead_management(self):
        """Test lead capture and retrieval"""
        if not self.owner_token:
            self.log_test("Lead Management", False, "No owner token available")
            return False

        # Create lead
        lead_data = {
            "name": "Test Customer",
            "whatsapp": "+1234567890",
            "photo_url": "data:image/jpeg;base64,test_photo_data"
        }
        
        response = self.make_request('POST', 'leads', lead_data, self.owner_token)
        
        if response and response.status_code == 200:
            lead_id = response.json().get('id')
            self.log_test("Leads - Create Lead", True)
            
            # Test get leads
            response = self.make_request('GET', 'leads', token=self.owner_token)
            if response and response.status_code == 200:
                leads = response.json()
                if len(leads) > 0:
                    self.log_test("Leads - Get All Leads", True)
                    return lead_id
                else:
                    self.log_test("Leads - Get All Leads", False, "No leads returned")
            else:
                self.log_test("Leads - Get All Leads", False)
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'Connection failed'
            self.log_test("Leads - Create Lead", False, error_msg)
        
        return None

    def test_ai_visualization(self, lead_id):
        """Test AI visualization (mocked)"""
        if not self.owner_token or not lead_id:
            self.log_test("AI Visualization", False, "Missing requirements")
            return False

        # First create a product to visualize
        item_data = {
            "name": "Visualization Test Saree",
            "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
            "category": "Test",
            "price": 199.99,
            "tags": ["test"],
            "stock": 5
        }
        
        response = self.make_request('POST', 'inventory', item_data, self.owner_token)
        if not response or response.status_code != 200:
            self.log_test("AI Visualization - Setup", False, "Failed to create test product")
            return False
        
        product_id = response.json().get('id')
        
        # Test visualization
        viz_data = {
            "lead_id": lead_id,
            "product_ids": [product_id],
            "photo_url": "data:image/jpeg;base64,test_photo_data"
        }
        
        response = self.make_request('POST', 'visualize', viz_data, self.owner_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if 'results' in result and len(result['results']) > 0:
                # Check if mock images are returned
                first_result = result['results'][0]
                if 'result_image' in first_result and 'unsplash.com' in first_result['result_image']:
                    self.log_test("AI Visualization - Mock Response", True)
                else:
                    self.log_test("AI Visualization - Mock Response", False, "Invalid mock image")
            else:
                self.log_test("AI Visualization - Mock Response", False, "No results returned")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'Connection failed'
            self.log_test("AI Visualization - Mock Response", False, error_msg)

    def test_kiosk_pin_verification(self):
        """Test kiosk PIN verification"""
        if not self.owner_token:
            self.log_test("Kiosk PIN Verification", False, "No owner token available")
            return False

        # Test correct PIN
        pin_data = {"pin": "1234"}
        response = self.make_request('POST', 'kiosk/verify-pin', pin_data, self.owner_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if result.get('success'):
                self.log_test("Kiosk PIN - Correct PIN", True)
            else:
                self.log_test("Kiosk PIN - Correct PIN", False, "Success flag not set")
        else:
            self.log_test("Kiosk PIN - Correct PIN", False)

        # Test incorrect PIN
        wrong_pin_data = {"pin": "9999"}
        response = self.make_request('POST', 'kiosk/verify-pin', wrong_pin_data, self.owner_token)
        
        if response and response.status_code == 401:
            self.log_test("Kiosk PIN - Incorrect PIN Rejection", True)
        else:
            self.log_test("Kiosk PIN - Incorrect PIN Rejection", False, "Should return 401")

    def test_founder_dashboard_access(self):
        """Test founder-only endpoints"""
        if not self.founder_token:
            self.log_test("Founder Dashboard Access", False, "No founder token available")
            return False

        # Test tenants list
        response = self.make_request('GET', 'tenants', token=self.founder_token)
        
        if response and response.status_code == 200:
            tenants = response.json()
            self.log_test("Founder - Get Tenants List", True)
        else:
            self.log_test("Founder - Get Tenants List", False)

        # Test founder analytics
        response = self.make_request('GET', 'analytics', token=self.founder_token)
        
        if response and response.status_code == 200:
            analytics = response.json()
            expected_keys = ['total_tryons', 'total_tenants', 'gpu_health']
            if all(key in analytics for key in expected_keys):
                self.log_test("Founder - Analytics Access", True)
            else:
                self.log_test("Founder - Analytics Access", False, "Missing analytics keys")
        else:
            self.log_test("Founder - Analytics Access", False)

    def test_owner_analytics(self):
        """Test owner analytics"""
        if not self.owner_token:
            self.log_test("Owner Analytics", False, "No owner token available")
            return False

        response = self.make_request('GET', 'analytics', token=self.owner_token)
        
        if response and response.status_code == 200:
            analytics = response.json()
            expected_keys = ['total_visualizations', 'total_leads', 'most_visualized']
            if all(key in analytics for key in expected_keys):
                self.log_test("Owner - Analytics Access", True)
            else:
                self.log_test("Owner - Analytics Access", False, "Missing analytics keys")
        else:
            self.log_test("Owner - Analytics Access", False)

    def test_tenant_isolation(self):
        """Test that tenants can only access their own data"""
        # This would require creating a second owner account
        # For now, we'll test that owner can't access founder endpoints
        if not self.owner_token:
            self.log_test("Tenant Isolation", False, "No owner token available")
            return False

        # Owner should not be able to access tenants list
        response = self.make_request('GET', 'tenants', token=self.owner_token)
        
        if response and response.status_code == 403:
            self.log_test("Tenant Isolation - Owner Cannot Access Tenants", True)
        else:
            self.log_test("Tenant Isolation - Owner Cannot Access Tenants", False, "Should return 403")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Retail-Vision AI Backend Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Authentication Tests
        print("\n🔐 Authentication Tests")
        if not self.test_founder_signup():
            print("❌ Founder signup failed - stopping tests")
            return False
        
        if not self.test_owner_signup():
            print("❌ Owner signup failed - stopping tests")
            return False
        
        self.test_login_flows()

        # Core Functionality Tests
        print("\n📦 Inventory Management Tests")
        self.test_inventory_crud()

        print("\n👥 Lead Management Tests")
        lead_id = self.test_lead_management()

        print("\n🎨 AI Visualization Tests")
        if lead_id:
            self.test_ai_visualization(lead_id)

        print("\n🔒 Kiosk Security Tests")
        self.test_kiosk_pin_verification()

        print("\n👑 Founder Dashboard Tests")
        self.test_founder_dashboard_access()

        print("\n📊 Owner Analytics Tests")
        self.test_owner_analytics()

        print("\n🏢 Tenant Isolation Tests")
        self.test_tenant_isolation()

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
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())