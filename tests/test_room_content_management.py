"""
Spencer Green Hotel - Room Management & Content Management Tests
Tests for new features: Room CRUD and Content CMS endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta
import uuid

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@spencergreen.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed - cannot run admin tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestRoomManagementCRUD:
    """Test Room Management CRUD operations - /api/admin/rooms/*"""
    
    created_room_id = None
    
    def test_create_room(self, auth_headers):
        """Test POST /api/admin/rooms - Create new room"""
        room_data = {
            "name": f"TEST_Room_{uuid.uuid4().hex[:8]}",
            "description": "Test room created by automated tests",
            "base_price": 1500000,
            "max_guests": 4,
            "amenities": ["AC", "WiFi", "TV", "Mini Bar", "Safe Box"],
            "images": ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"],
            "video_url": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/rooms",
            json=room_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Create room failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "room_type_id" in data, "room_type_id missing from response"
        assert data["name"] == room_data["name"]
        assert data["base_price"] == room_data["base_price"]
        assert data["max_guests"] == room_data["max_guests"]
        assert data["is_active"] == True
        assert "_id" not in data, "MongoDB _id should be excluded"
        
        # Store for later tests
        TestRoomManagementCRUD.created_room_id = data["room_type_id"]
        print(f"✓ Room created: {data['name']} (ID: {data['room_type_id']})")
    
    def test_verify_room_in_list(self, auth_headers):
        """Test GET /api/rooms - Verify new room appears in list"""
        if not TestRoomManagementCRUD.created_room_id:
            pytest.skip("No room created to verify")
        
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        
        rooms = response.json()
        room_ids = [r["room_type_id"] for r in rooms]
        
        assert TestRoomManagementCRUD.created_room_id in room_ids, "Created room not found in rooms list"
        print(f"✓ Room {TestRoomManagementCRUD.created_room_id} found in rooms list")
    
    def test_verify_room_in_availability(self, auth_headers):
        """Test GET /api/availability - Verify new room appears in availability"""
        if not TestRoomManagementCRUD.created_room_id:
            pytest.skip("No room created to verify")
        
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/availability",
            params={"check_in": check_in, "check_out": check_out}
        )
        assert response.status_code == 200
        
        available_rooms = response.json()
        room_ids = [r["room_type_id"] for r in available_rooms]
        
        assert TestRoomManagementCRUD.created_room_id in room_ids, "Created room not found in availability"
        print(f"✓ Room {TestRoomManagementCRUD.created_room_id} found in availability check")
    
    def test_update_room(self, auth_headers):
        """Test PUT /api/admin/rooms/{room_type_id} - Update room details"""
        if not TestRoomManagementCRUD.created_room_id:
            pytest.skip("No room created to update")
        
        update_data = {
            "name": f"TEST_Room_Updated_{uuid.uuid4().hex[:8]}",
            "description": "Updated description",
            "base_price": 1800000,
            "max_guests": 5
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/rooms/{TestRoomManagementCRUD.created_room_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Update room failed: {response.text}"
        data = response.json()
        assert data["message"] == "Room updated"
        print(f"✓ Room updated successfully")
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/rooms/{TestRoomManagementCRUD.created_room_id}")
        assert verify_response.status_code == 200
        
        updated_room = verify_response.json()
        assert updated_room["name"] == update_data["name"]
        assert updated_room["base_price"] == update_data["base_price"]
        assert updated_room["max_guests"] == update_data["max_guests"]
        assert "updated_at" in updated_room
        print(f"✓ Room update verified: {updated_room['name']}")
    
    def test_delete_room(self, auth_headers):
        """Test DELETE /api/admin/rooms/{room_type_id} - Delete/deactivate room"""
        if not TestRoomManagementCRUD.created_room_id:
            pytest.skip("No room created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/rooms/{TestRoomManagementCRUD.created_room_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Delete room failed: {response.text}"
        data = response.json()
        assert data["message"] == "Room deleted"
        print(f"✓ Room deleted successfully")
        
        # Verify room no longer in active rooms list
        verify_response = requests.get(f"{BASE_URL}/api/rooms")
        assert verify_response.status_code == 200
        
        rooms = verify_response.json()
        room_ids = [r["room_type_id"] for r in rooms]
        
        assert TestRoomManagementCRUD.created_room_id not in room_ids, "Deleted room still in active list"
        print(f"✓ Room {TestRoomManagementCRUD.created_room_id} no longer in active rooms")
    
    def test_create_room_without_auth(self):
        """Test POST /api/admin/rooms without authentication returns 401/403"""
        room_data = {
            "name": "Unauthorized Room",
            "description": "Should fail",
            "base_price": 1000000,
            "max_guests": 2
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/rooms",
            json=room_data
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Create room without auth correctly rejected")
    
    def test_update_nonexistent_room(self, auth_headers):
        """Test PUT /api/admin/rooms/{invalid_id} returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin/rooms/nonexistent-room-id",
            json={"name": "Test"},
            headers=auth_headers
        )
        
        assert response.status_code == 404
        print("✓ Update nonexistent room correctly returns 404")
    
    def test_delete_nonexistent_room(self, auth_headers):
        """Test DELETE /api/admin/rooms/{invalid_id} returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/rooms/nonexistent-room-id",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        print("✓ Delete nonexistent room correctly returns 404")


class TestContentManagementCRUD:
    """Test Content Management CRUD operations - /api/admin/content/*"""
    
    test_section = f"test_section_{uuid.uuid4().hex[:8]}"
    
    def test_get_all_content(self):
        """Test GET /api/content - Get all site content"""
        response = requests.get(f"{BASE_URL}/api/content")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Validate content structure if content exists
        if len(data) > 0:
            content = data[0]
            assert "_id" not in content
            assert "content_id" in content
            assert "section" in content
            assert "page" in content
            assert "content" in content
        
        print(f"✓ GET /api/content returned {len(data)} content items")
    
    def test_get_page_content(self):
        """Test GET /api/content/{page} - Get page-specific content"""
        pages = ["home", "rooms", "meeting", "wedding", "facilities", "gallery", "global"]
        
        for page in pages:
            response = requests.get(f"{BASE_URL}/api/content/{page}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            
            # Verify all returned content is for the requested page
            for item in data:
                assert item["page"] == page, f"Content page mismatch: expected {page}, got {item['page']}"
                assert "_id" not in item
            
            print(f"✓ GET /api/content/{page} returned {len(data)} items")
    
    def test_create_content(self, auth_headers):
        """Test POST /api/admin/content - Create new content"""
        content_data = {
            "page": "home",
            "section": TestContentManagementCRUD.test_section,
            "content_type": "text",
            "content": {
                "title": "TEST Content Title",
                "description": "TEST Content Description",
                "image": "https://example.com/test.jpg"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/content",
            json=content_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Create content failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "content_id" in data
        assert data["page"] == content_data["page"]
        assert data["section"] == content_data["section"]
        assert data["content"]["title"] == content_data["content"]["title"]
        assert "_id" not in data
        
        print(f"✓ Content created: {data['section']} (ID: {data['content_id']})")
    
    def test_verify_content_created(self, auth_headers):
        """Test GET /api/content/home - Verify new content appears"""
        response = requests.get(f"{BASE_URL}/api/content/home")
        assert response.status_code == 200
        
        data = response.json()
        sections = [c["section"] for c in data]
        
        assert TestContentManagementCRUD.test_section in sections, "Created content not found"
        print(f"✓ Content {TestContentManagementCRUD.test_section} found in home page content")
    
    def test_update_content_upsert(self, auth_headers):
        """Test POST /api/admin/content - Update existing content (upsert)"""
        content_data = {
            "page": "home",
            "section": TestContentManagementCRUD.test_section,
            "content_type": "text",
            "content": {
                "title": "TEST Content Title UPDATED",
                "description": "TEST Content Description UPDATED",
                "image": "https://example.com/test-updated.jpg"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/content",
            json=content_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Update content failed: {response.text}"
        data = response.json()
        
        # Verify content was updated (same section, updated content)
        assert data["section"] == TestContentManagementCRUD.test_section
        print(f"✓ Content updated via upsert")
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/content/home")
        assert verify_response.status_code == 200
        
        home_content = verify_response.json()
        test_content = next((c for c in home_content if c["section"] == TestContentManagementCRUD.test_section), None)
        
        assert test_content is not None
        assert test_content["content"]["title"] == "TEST Content Title UPDATED"
        print(f"✓ Content update verified")
    
    def test_create_content_without_auth(self):
        """Test POST /api/admin/content without authentication returns 401/403"""
        content_data = {
            "page": "home",
            "section": "unauthorized_section",
            "content_type": "text",
            "content": {"title": "Should fail"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/content",
            json=content_data
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Create content without auth correctly rejected")
    
    def test_create_content_for_all_pages(self, auth_headers):
        """Test creating content for all supported pages"""
        pages = ["home", "rooms", "meeting", "wedding", "facilities", "gallery", "global"]
        
        for page in pages:
            content_data = {
                "page": page,
                "section": f"test_section_{page}_{uuid.uuid4().hex[:6]}",
                "content_type": "text",
                "content": {
                    "title": f"TEST {page.capitalize()} Content",
                    "description": f"Test content for {page} page"
                }
            }
            
            response = requests.post(
                f"{BASE_URL}/api/admin/content",
                json=content_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200, f"Create content for {page} failed: {response.text}"
            data = response.json()
            assert data["page"] == page
            assert "_id" not in data
            print(f"✓ Content created for {page} page")


class TestRoomInventoryIntegration:
    """Test Room Inventory integration with Room Management"""
    
    def test_inventory_for_existing_rooms(self, auth_headers):
        """Test GET /api/inventory returns inventory for existing rooms"""
        # Get rooms first
        rooms_response = requests.get(f"{BASE_URL}/api/rooms")
        assert rooms_response.status_code == 200
        rooms = rooms_response.json()
        
        if len(rooms) == 0:
            pytest.skip("No rooms available")
        
        # Get inventory
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/inventory",
            params={"start_date": start_date, "end_date": end_date}
        )
        
        assert response.status_code == 200
        inventory = response.json()
        
        # Verify inventory structure
        if len(inventory) > 0:
            inv = inventory[0]
            assert "_id" not in inv
            assert "room_type_id" in inv
            assert "date" in inv
            assert "allotment" in inv
            assert "rate" in inv
        
        print(f"✓ Inventory returned {len(inventory)} records for {len(rooms)} rooms")
    
    def test_bulk_update_inventory(self, auth_headers):
        """Test POST /api/admin/inventory/bulk-update"""
        # Get first room
        rooms_response = requests.get(f"{BASE_URL}/api/rooms")
        rooms = rooms_response.json()
        
        if len(rooms) == 0:
            pytest.skip("No rooms available")
        
        room_id = rooms[0]["room_type_id"]
        start_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d")
        
        bulk_data = {
            "room_type_id": room_id,
            "start_date": start_date,
            "end_date": end_date,
            "allotment": 10,
            "rate": 900000,
            "is_closed": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/inventory/bulk-update",
            json=bulk_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Bulk update failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "Updated" in data["message"]
        print(f"✓ Bulk inventory update: {data['message']}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
