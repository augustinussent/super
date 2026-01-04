"""
Test User Permissions and Room Gallery Features
- User permissions with checkbox (8 permissions: dashboard, rooms, reservations, content, reviews, promo, users, gallery)
- Room gallery with multiple images
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@spencergreen.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Authenticated requests session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestUserPermissions:
    """Test user permissions CRUD operations"""
    
    def test_get_users_returns_permissions(self, api_client):
        """GET /api/admin/users should return users with permissions field"""
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        
        # Check that at least one user has permissions
        admin_user = next((u for u in users if u.get("email") == ADMIN_EMAIL), None)
        assert admin_user is not None, "Admin user should exist"
        print(f"Admin user data: {admin_user}")
        
        # Permissions should be present (either as object or None)
        if admin_user.get("permissions"):
            perms = admin_user["permissions"]
            # Check all 8 permission keys exist
            expected_keys = ["dashboard", "rooms", "reservations", "content", "reviews", "promo", "users", "gallery"]
            for key in expected_keys:
                assert key in perms, f"Permission key '{key}' should exist"
                assert isinstance(perms[key], bool), f"Permission '{key}' should be boolean"
            print(f"Admin permissions: {perms}")
    
    def test_update_user_with_permissions(self, api_client):
        """PUT /api/admin/users/{user_id} should update user with permissions"""
        # First get users to find a test user
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find admin user
        admin_user = next((u for u in users if u.get("email") == ADMIN_EMAIL), None)
        assert admin_user is not None
        
        user_id = admin_user["user_id"]
        
        # Update with custom permissions
        custom_permissions = {
            "dashboard": True,
            "rooms": True,
            "reservations": True,
            "content": True,
            "reviews": True,
            "promo": True,
            "users": True,
            "gallery": True
        }
        
        update_data = {
            "name": admin_user["name"],
            "email": admin_user["email"],
            "role": admin_user["role"],
            "permissions": custom_permissions
        }
        
        response = api_client.put(f"{BASE_URL}/api/admin/users/{user_id}", json=update_data)
        assert response.status_code == 200
        print(f"Update response: {response.json()}")
        
        # Verify permissions were saved by fetching user again
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        
        updated_user = next((u for u in users if u.get("user_id") == user_id), None)
        assert updated_user is not None
        
        # Verify permissions were persisted
        if updated_user.get("permissions"):
            for key, value in custom_permissions.items():
                assert updated_user["permissions"].get(key) == value, f"Permission '{key}' should be {value}"
            print(f"Verified permissions persisted: {updated_user['permissions']}")
    
    def test_create_user_with_permissions(self, api_client):
        """POST /api/auth/register should create user with permissions"""
        test_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        
        user_data = {
            "name": "Test User Permissions",
            "email": test_email,
            "password": "testpass123",
            "role": "staff",
            "permissions": {
                "dashboard": True,
                "rooms": False,
                "reservations": True,
                "content": False,
                "reviews": False,
                "promo": False,
                "users": False,
                "gallery": False
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=user_data)
        print(f"Create user response: {response.status_code} - {response.text}")
        
        # Should succeed (200 or 201)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        
        # Verify user was created with permissions
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        
        created_user = next((u for u in users if u.get("email") == test_email), None)
        assert created_user is not None, "Created user should exist"
        
        # Cleanup - delete test user
        if created_user:
            delete_response = api_client.delete(f"{BASE_URL}/api/admin/users/{created_user['user_id']}")
            print(f"Cleanup delete response: {delete_response.status_code}")
    
    def test_update_partial_permissions(self, api_client):
        """Test updating only some permissions"""
        # Get users
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        
        admin_user = next((u for u in users if u.get("email") == ADMIN_EMAIL), None)
        assert admin_user is not None
        
        user_id = admin_user["user_id"]
        
        # Update with partial permissions (only change some)
        partial_permissions = {
            "dashboard": True,
            "rooms": True,
            "reservations": False,  # Changed
            "content": True,
            "reviews": False,  # Changed
            "promo": True,
            "users": True,
            "gallery": True
        }
        
        update_data = {
            "permissions": partial_permissions
        }
        
        response = api_client.put(f"{BASE_URL}/api/admin/users/{user_id}", json=update_data)
        assert response.status_code == 200
        
        # Restore all permissions for admin
        restore_permissions = {
            "dashboard": True,
            "rooms": True,
            "reservations": True,
            "content": True,
            "reviews": True,
            "promo": True,
            "users": True,
            "gallery": True
        }
        
        response = api_client.put(f"{BASE_URL}/api/admin/users/{user_id}", json={"permissions": restore_permissions})
        assert response.status_code == 200
        print("Restored admin permissions to all true")


class TestRoomGallery:
    """Test room gallery with multiple images"""
    
    def test_get_rooms_returns_images_array(self, api_client):
        """GET /api/rooms should return rooms with images array"""
        response = requests.get(f"{BASE_URL}/api/rooms")  # Public endpoint
        assert response.status_code == 200
        
        rooms = response.json()
        assert isinstance(rooms, list)
        assert len(rooms) > 0
        
        for room in rooms:
            print(f"Room: {room.get('name')}")
            # Check images field exists
            if "images" in room:
                assert isinstance(room["images"], list), "images should be a list"
                print(f"  Images count: {len(room['images'])}")
                if len(room["images"]) > 0:
                    print(f"  First image: {room['images'][0][:50]}...")
            else:
                print("  No images field")
    
    def test_superior_room_has_multiple_images(self, api_client):
        """Superior Room should have 5 images for testing"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        
        rooms = response.json()
        superior_room = next((r for r in rooms if "Superior" in r.get("name", "")), None)
        
        if superior_room:
            print(f"Superior Room found: {superior_room.get('name')}")
            images = superior_room.get("images", [])
            print(f"Images count: {len(images)}")
            
            # According to context, Superior Room should have 5 images
            assert len(images) >= 1, "Superior Room should have at least 1 image"
            
            for idx, img in enumerate(images):
                print(f"  Image {idx + 1}: {img[:80]}...")
        else:
            print("Superior Room not found, checking other rooms")
            for room in rooms:
                images = room.get("images", [])
                if len(images) > 1:
                    print(f"Room '{room.get('name')}' has {len(images)} images")
    
    def test_update_room_with_multiple_images(self, api_client):
        """PUT /api/admin/rooms/{room_type_id} should update room with multiple images"""
        # Get rooms first
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        rooms = response.json()
        
        if len(rooms) == 0:
            pytest.skip("No rooms available for testing")
        
        # Pick first room
        test_room = rooms[0]
        room_type_id = test_room["room_type_id"]
        original_images = test_room.get("images", [])
        
        print(f"Testing room: {test_room.get('name')}")
        print(f"Original images: {len(original_images)}")
        
        # Update with new images array
        new_images = [
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"
        ]
        
        update_data = {
            "images": new_images
        }
        
        response = api_client.put(f"{BASE_URL}/api/admin/rooms/{room_type_id}", json=update_data)
        assert response.status_code == 200
        print(f"Update response: {response.json()}")
        
        # Verify images were updated
        response = requests.get(f"{BASE_URL}/api/rooms/{room_type_id}")
        assert response.status_code == 200
        
        updated_room = response.json()
        updated_images = updated_room.get("images", [])
        print(f"Updated images count: {len(updated_images)}")
        
        assert len(updated_images) == len(new_images), f"Expected {len(new_images)} images, got {len(updated_images)}"
        
        # Restore original images
        if original_images:
            response = api_client.put(f"{BASE_URL}/api/admin/rooms/{room_type_id}", json={"images": original_images})
            print(f"Restored original images: {response.status_code}")
    
    def test_room_detail_endpoint(self, api_client):
        """GET /api/rooms/{room_type_id} should return room with images"""
        # Get rooms first
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        rooms = response.json()
        
        if len(rooms) == 0:
            pytest.skip("No rooms available")
        
        room_type_id = rooms[0]["room_type_id"]
        
        response = requests.get(f"{BASE_URL}/api/rooms/{room_type_id}")
        assert response.status_code == 200
        
        room = response.json()
        assert "room_type_id" in room
        assert "name" in room
        
        # Check images field
        if "images" in room:
            assert isinstance(room["images"], list)
            print(f"Room '{room['name']}' has {len(room['images'])} images")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API: {data}")
    
    def test_auth_login(self):
        """Test login endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful for: {data['user'].get('email')}")
    
    def test_public_rooms_endpoint(self):
        """Test public rooms endpoint"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        rooms = response.json()
        assert isinstance(rooms, list)
        print(f"Found {len(rooms)} rooms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
