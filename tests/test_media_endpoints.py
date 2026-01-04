"""
Spencer Green Hotel - Media Upload Endpoints Tests
Tests for Cloudinary integration and media management
Endpoints: /api/media/upload/gallery, /api/media/upload/room-image, /api/media/delete
"""
import pytest
import requests
import os
import io

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@spencergreen.com"
ADMIN_PASSWORD = "admin123"


class TestMediaEndpointsAuth:
    """Test media endpoints require authentication"""
    
    def test_gallery_upload_requires_auth(self):
        """Test POST /api/media/upload/gallery requires authentication"""
        # Create a fake file
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/media/upload/gallery", files=files)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Gallery upload correctly requires authentication")
    
    def test_room_image_upload_requires_auth(self):
        """Test POST /api/media/upload/room-image requires authentication"""
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/room-image",
            files=files,
            params={"room_type_id": "test-room"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Room image upload correctly requires authentication")
    
    def test_media_delete_requires_auth(self):
        """Test DELETE /api/media/delete requires authentication"""
        response = requests.delete(
            f"{BASE_URL}/api/media/delete",
            params={"public_id": "test-public-id"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Media delete correctly requires authentication")


class TestMediaUploadValidation:
    """Test media upload validation (file type, size)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_gallery_upload_invalid_file_type(self, auth_token):
        """Test gallery upload rejects invalid file types"""
        # Create a fake PDF file
        files = {'file': ('test.pdf', b'fake pdf content', 'application/pdf')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/gallery",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid file type rejected: {data['detail']}")
    
    def test_gallery_upload_invalid_file_type_text(self, auth_token):
        """Test gallery upload rejects text files"""
        files = {'file': ('test.txt', b'fake text content', 'text/plain')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/gallery",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Text file correctly rejected")
    
    def test_room_image_upload_missing_room_type_id(self, auth_token):
        """Test room image upload requires room_type_id"""
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/room-image",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "room_type_id" in data.get("detail", "").lower()
        print(f"✓ Missing room_type_id rejected: {data['detail']}")
    
    def test_room_image_upload_invalid_room_type_id(self, auth_token):
        """Test room image upload with non-existent room_type_id"""
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/room-image",
            files=files,
            params={"room_type_id": "nonexistent-room-id"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "not found" in data.get("detail", "").lower()
        print(f"✓ Non-existent room_type_id rejected: {data['detail']}")
    
    def test_room_video_upload_missing_room_type_id(self, auth_token):
        """Test room video upload requires room_type_id"""
        files = {'file': ('test.mp4', b'fake video content', 'video/mp4')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/room-video",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Room video upload requires room_type_id")
    
    def test_room_video_upload_invalid_file_type(self, auth_token):
        """Test room video upload rejects invalid video types"""
        # Get a valid room first
        rooms_response = requests.get(f"{BASE_URL}/api/rooms")
        rooms = rooms_response.json()
        if len(rooms) == 0:
            pytest.skip("No rooms available")
        
        room_id = rooms[0]["room_type_id"]
        
        # Try uploading an image as video
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/room-video",
            files=files,
            params={"room_type_id": room_id},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid video file type rejected")


class TestMediaDeleteEndpoint:
    """Test media delete endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_delete_nonexistent_media(self, auth_token):
        """Test deleting non-existent media returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/media/delete",
            params={"public_id": "nonexistent-public-id-12345"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Cloudinary returns "not found" for non-existent resources
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent media returns 404")
    
    def test_delete_room_image_invalid_room(self, auth_token):
        """Test deleting room image from non-existent room"""
        response = requests.delete(
            f"{BASE_URL}/api/media/delete-room-image",
            params={
                "room_type_id": "nonexistent-room",
                "image_url": "https://example.com/image.jpg"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete room image from non-existent room returns 404")
    
    def test_delete_room_video_invalid_room(self, auth_token):
        """Test deleting room video from non-existent room"""
        response = requests.delete(
            f"{BASE_URL}/api/media/delete-room-video",
            params={"room_type_id": "nonexistent-room"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete room video from non-existent room returns 404")


class TestContentImageUpload:
    """Test content image upload endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_content_image_upload_invalid_type(self, auth_token):
        """Test content image upload rejects invalid file types"""
        files = {'file': ('test.gif', b'fake gif content', 'image/gif')}
        response = requests.post(
            f"{BASE_URL}/api/media/upload/content-image",
            files=files,
            params={"section": "hero"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Content image upload rejects GIF files")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
