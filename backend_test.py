#!/usr/bin/env python3
"""
NeonFrame Studio Backend API Testing Suite
Tests all Bria API integrations, authentication, and job management endpoints
"""

import requests
import json
import time
import os
from typing import Dict, Any, Optional

class NeonFrameAPITester:
    def __init__(self):
        # Get base URL from environment or use default
        self.base_url = "https://pixelflow-6.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.test_user_id = None
        self.test_results = {}
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        self.test_results[test_name] = {
            'success': success,
            'details': details,
            'response_data': response_data
        }
        print()

    def test_user_registration(self) -> bool:
        """Test user registration endpoint"""
        print("🔐 Testing User Registration...")
        
        test_data = {
            "email": "sarah.designer@neonframe.com",
            "password": "SecurePass123!",
            "name": "Sarah Designer"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/register", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'id' in data['user']:
                    self.test_user_id = data['user']['id']
                    self.log_test("User Registration", True, f"User created with ID: {self.test_user_id}")
                    return True
                else:
                    self.log_test("User Registration", False, "Missing user data in response", data)
                    return False
            elif response.status_code == 409:
                # User already exists, try to login instead
                return self.test_user_login_existing()
            else:
                self.log_test("User Registration", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False

    def test_user_login_existing(self) -> bool:
        """Test login with existing user"""
        print("🔐 Testing User Login (existing user)...")
        
        test_data = {
            "email": "sarah.designer@neonframe.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'id' in data['user']:
                    self.test_user_id = data['user']['id']
                    self.log_test("User Login", True, f"Login successful with ID: {self.test_user_id}")
                    return True
                else:
                    self.log_test("User Login", False, "Missing user data in response", data)
                    return False
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_user_login_invalid(self) -> bool:
        """Test login with invalid credentials"""
        print("🔐 Testing User Login (invalid credentials)...")
        
        test_data = {
            "email": "sarah.designer@neonframe.com",
            "password": "WrongPassword123!"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
            
            if response.status_code == 401:
                self.log_test("User Login Invalid", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.log_test("User Login Invalid", False, f"Expected 401, got {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("User Login Invalid", False, f"Exception: {str(e)}")
            return False

    def test_hd_image_generation(self) -> bool:
        """Test HD image generation with Bria API"""
        print("🎨 Testing HD Image Generation...")
        
        test_data = {
            "prompt": "A majestic golden retriever sitting in a sunlit meadow with wildflowers, professional photography style, high detail, warm lighting",
            "modelVersion": "2.2",
            "numResults": 1,
            "aspectRatio": "1:1",
            "sync": True,
            "promptEnhancement": True,
            "userId": self.test_user_id or "test_user"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/bria/hd-generation", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'result_urls' in data and len(data['result_urls']) > 0:
                    self.log_test("HD Image Generation", True, f"Generated {len(data['result_urls'])} images")
                    return True
                else:
                    self.log_test("HD Image Generation", False, "No result URLs in response", data)
                    return False
            else:
                self.log_test("HD Image Generation", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("HD Image Generation", False, f"Exception: {str(e)}")
            return False

    def test_prompt_enhancement(self) -> bool:
        """Test prompt enhancement with Bria API"""
        print("✨ Testing Prompt Enhancement...")
        
        test_data = {
            "prompt": "beautiful landscape",
            "userId": self.test_user_id or "test_user"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/bria/prompt-enhance", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'enhanced_prompt' in data:
                    enhanced = data['enhanced_prompt']
                    if len(enhanced) > len(test_data['prompt']):
                        self.log_test("Prompt Enhancement", True, f"Enhanced: '{enhanced[:100]}...'")
                        return True
                    else:
                        self.log_test("Prompt Enhancement", False, "Enhanced prompt not longer than original", data)
                        return False
                else:
                    self.log_test("Prompt Enhancement", False, "No enhanced_prompt in response", data)
                    return False
            else:
                self.log_test("Prompt Enhancement", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Prompt Enhancement", False, f"Exception: {str(e)}")
            return False

    def test_lifestyle_shots(self) -> bool:
        """Test lifestyle shot generation with Bria API"""
        print("📸 Testing Lifestyle Shots...")
        
        # Using a sample product image URL
        test_data = {
            "prompt": "modern minimalist living room with natural lighting",
            "productImageUrl": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
            "numResults": 1,
            "sync": True,
            "userId": self.test_user_id or "test_user"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/bria/lifestyle-text", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'result_urls' in data and len(data['result_urls']) > 0:
                    self.log_test("Lifestyle Shots", True, f"Generated {len(data['result_urls'])} lifestyle images")
                    return True
                else:
                    self.log_test("Lifestyle Shots", False, "No result URLs in response", data)
                    return False
            else:
                self.log_test("Lifestyle Shots", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Lifestyle Shots", False, f"Exception: {str(e)}")
            return False

    def test_erase_foreground(self) -> bool:
        """Test foreground erasing with Bria API"""
        print("🧹 Testing Erase Foreground...")
        
        # Using a sample image URL
        test_data = {
            "imageUrl": "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=500",
            "userId": self.test_user_id or "test_user"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/bria/erase-foreground", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'result_urls' in data and len(data['result_urls']) > 0:
                    self.log_test("Erase Foreground", True, f"Processed image successfully")
                    return True
                else:
                    self.log_test("Erase Foreground", False, "No result URLs in response", data)
                    return False
            else:
                self.log_test("Erase Foreground", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Erase Foreground", False, f"Exception: {str(e)}")
            return False

    def test_job_history(self) -> bool:
        """Test job history retrieval"""
        print("📋 Testing Job History...")
        
        if not self.test_user_id:
            self.log_test("Job History", False, "No user ID available for testing")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/jobs/user?userId={self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if 'jobs' in data:
                    job_count = len(data['jobs'])
                    self.log_test("Job History", True, f"Retrieved {job_count} jobs")
                    return True
                else:
                    self.log_test("Job History", False, "No jobs field in response", data)
                    return False
            else:
                self.log_test("Job History", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Job History", False, f"Exception: {str(e)}")
            return False

    def test_invalid_endpoints(self) -> bool:
        """Test invalid endpoint handling"""
        print("🚫 Testing Invalid Endpoints...")
        
        try:
            response = self.session.get(f"{self.base_url}/nonexistent/endpoint")
            
            if response.status_code == 404:
                self.log_test("Invalid Endpoint Handling", True, "Correctly returned 404 for invalid endpoint")
                return True
            else:
                self.log_test("Invalid Endpoint Handling", False, f"Expected 404, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Endpoint Handling", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting NeonFrame Studio Backend API Tests")
        print("=" * 60)
        
        # Test authentication first
        auth_success = self.test_user_registration()
        if not auth_success:
            auth_success = self.test_user_login_existing()
        
        self.test_user_login_invalid()
        
        # Test Bria API integrations
        self.test_hd_image_generation()
        self.test_prompt_enhancement()
        self.test_lifestyle_shots()
        self.test_erase_foreground()
        
        # Test job management
        self.test_job_history()
        
        # Test error handling
        self.test_invalid_endpoints()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result['success']:
                    print(f"  - {test_name}: {result['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = NeonFrameAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)