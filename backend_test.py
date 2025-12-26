#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class SpencerGreenAPITester:
    def __init__(self, base_url="https://spencer-green-hotel.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text)}"
                except:
                    details += f" - {response.text[:200]}"

            self.log_test(name, success, details if not success else "")
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, str(e))
            return None

    def test_init_data(self):
        """Initialize default data"""
        print("\n🔧 Testing Data Initialization...")
        result = self.run_test("Initialize Default Data", "POST", "", 200)
        return result is not None

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with admin credentials
        login_data = {
            "email": "admin@spencergreen.com",
            "password": "admin123"
        }
        
        result = self.run_test("Admin Login", "POST", "auth/login", 200, login_data)
        if result and 'token' in result:
            self.token = result['token']
            print(f"🔑 Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_room_endpoints(self):
        """Test room-related endpoints"""
        print("\n🏨 Testing Room Endpoints...")
        
        # Get all rooms
        self.run_test("Get All Rooms", "GET", "rooms", 200)
        
        # Get room types (should have 3 default rooms)
        rooms = self.run_test("Get Room Types", "GET", "rooms", 200)
        if rooms and len(rooms) >= 3:
            self.log_test("Default Room Types Created", True)
            return rooms[0]['room_type_id']  # Return first room ID for further tests
        else:
            self.log_test("Default Room Types Created", False, "Expected at least 3 room types")
            return None

    def test_availability_endpoints(self):
        """Test availability checking"""
        print("\n📅 Testing Availability...")
        
        today = datetime.now().strftime('%Y-%m-%d')
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Check availability
        availability_url = f"availability?check_in={today}&check_out={tomorrow}"
        self.run_test("Check Room Availability", "GET", availability_url, 200)

    def test_reservation_endpoints(self, room_type_id):
        """Test reservation creation and management"""
        print("\n📋 Testing Reservations...")
        
        if not room_type_id:
            self.log_test("Reservation Tests", False, "No room type ID available")
            return None
            
        # Create a test reservation
        reservation_data = {
            "guest_name": "Test Guest",
            "guest_email": "test@example.com",
            "guest_phone": "+6281234567890",
            "room_type_id": room_type_id,
            "check_in": datetime.now().strftime('%Y-%m-%d'),
            "check_out": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            "guests": 2,
            "special_requests": "Test reservation",
            "promo_code": ""
        }
        
        reservation = self.run_test("Create Reservation", "POST", "reservations", 200, reservation_data)
        if reservation:
            reservation_id = reservation.get('reservation_id')
            booking_code = reservation.get('booking_code')
            
            # Test check reservation by booking code
            if booking_code:
                check_url = f"reservations/check?booking_code={booking_code}"
                self.run_test("Check Reservation by Code", "GET", check_url, 200)
            
            return reservation_id
        return None

    def test_admin_endpoints(self, reservation_id):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Dashboard stats
        self.run_test("Get Dashboard Stats", "GET", "admin/dashboard", 200)
        
        # Get all reservations
        self.run_test("Get All Reservations", "GET", "admin/reservations", 200)
        
        # Update reservation status if we have one
        if reservation_id:
            status_url = f"admin/reservations/{reservation_id}/status?status=confirmed"
            self.run_test("Update Reservation Status", "PUT", status_url, 200)
        
        # Get users
        self.run_test("Get Users", "GET", "admin/users", 200)
        
        # Get promo codes
        self.run_test("Get Promo Codes", "GET", "admin/promo-codes", 200)
        
        # Get reviews
        self.run_test("Get All Reviews", "GET", "admin/reviews", 200)

    def test_content_endpoints(self):
        """Test content management endpoints"""
        print("\n📄 Testing Content Endpoints...")
        
        # Get all content
        self.run_test("Get All Content", "GET", "content", 200)
        
        # Get home page content
        self.run_test("Get Home Content", "GET", "content/home", 200)

    def test_review_endpoints(self):
        """Test review endpoints"""
        print("\n⭐ Testing Reviews...")
        
        # Get visible reviews
        self.run_test("Get Visible Reviews", "GET", "reviews", 200)
        
        # Create a test review
        review_data = {
            "guest_name": "Test Reviewer",
            "guest_email": "reviewer@example.com",
            "rating": 5,
            "comment": "Great hotel experience!",
            "reservation_id": ""
        }
        
        self.run_test("Create Review", "POST", "reviews", 200, review_data)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Spencer Green Hotel API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Initialize data first
        if not self.test_init_data():
            print("❌ Failed to initialize data, continuing with existing data...")
        
        # Test authentication
        if not self.test_auth_endpoints():
            print("❌ Authentication failed, cannot continue with admin tests")
            return False
        
        # Test public endpoints
        room_type_id = self.test_room_endpoints()
        self.test_availability_endpoints()
        reservation_id = self.test_reservation_endpoints(room_type_id)
        self.test_content_endpoints()
        self.test_review_endpoints()
        
        # Test admin endpoints
        self.test_admin_endpoints(reservation_id)
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['error']}")
        
        print("="*60)
        return len(self.failed_tests) == 0

def main():
    tester = SpencerGreenAPITester()
    
    try:
        success = tester.run_all_tests()
        all_passed = tester.print_summary()
        
        return 0 if all_passed else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())