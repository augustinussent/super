import cloudinary
import cloudinary.uploader
from cloudinary.api import delete_resources_by_prefix
import os
import logging
from typing import Optional, List

from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

# File type validations
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/mpeg"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB


async def upload_image(
    file_content: bytes,
    folder: str,
    eager_transforms: Optional[List[dict]] = None,
    force_format: str = None,
    public_id: str = None
) -> dict:
    """
    Upload an image to Cloudinary with automatic optimization.
    
    Args:
        file_content: The file bytes to upload
        folder: Cloudinary folder path (e.g., "spencer-green/rooms")
        eager_transforms: List of eager transformations to apply
        force_format: Force specific format (e.g., "webp")
        public_id: Optional custom public ID (for SEO naming)
    
    Returns:
        Dictionary containing upload response with public_id, secure_url, and metadata
    """
    try:
        upload_params = {
            "folder": f"spencer-green/{folder}",
            "resource_type": "image",
            "use_filename": True,
            "unique_filename": True,
            "quality": "auto",
            "fetch_format": "auto"
        }
        
        if public_id:
            upload_params["public_id"] = public_id
            upload_params["unique_filename"] = False # Don't append random chars if specific ID requested
        
        if force_format:
            upload_params["format"] = force_format
            # If forcing format, we might want to disable fetch_format auto to ensure the URL ends in .webp
            # But normally Cloudinary handles this. Let's explicitly set it.
            
        if eager_transforms:
            upload_params["eager"] = eager_transforms
        else:
            # Default transformations for hotel images
            upload_params["eager"] = [
                {"width": 400, "height": 300, "crop": "fill", "gravity": "auto", "quality": "auto"},
                {"width": 800, "height": 600, "crop": "fill", "gravity": "auto", "quality": "auto"}
            ]
        
        result = cloudinary.uploader.upload(file_content, **upload_params)
        
        return {
            "public_id": result.get("public_id"),
            "secure_url": result.get("secure_url"),
            "resource_type": result.get("resource_type"),
            "format": result.get("format"),
            "width": result.get("width"),
            "height": result.get("height"),
            "bytes": result.get("bytes"),
            "created_at": result.get("created_at"),
            "eager": result.get("eager", [])
        }
    except Exception as e:
        logger.error(f"Cloudinary image upload error: {str(e)}")
        raise Exception(f"Cloudinary upload error: {str(e)}")


async def upload_video(
    file_content: bytes,
    folder: str
) -> dict:
    """
    Upload a video to Cloudinary with automatic transcoding and thumbnail generation.
    """
    try:
        upload_params = {
            "folder": f"spencer-green/{folder}",
            "resource_type": "video",
            "use_filename": True,
            "unique_filename": True,
            "eager": [
                {"width": 1280, "height": 720, "crop": "fill", "quality": "auto"},
                {"fetch_format": "auto", "quality": "auto"}
            ],
            "eager_async": True
        }
        
        result = cloudinary.uploader.upload(file_content, **upload_params)
        
        # Generate thumbnail URL
        thumbnail_url = cloudinary.CloudinaryImage(result.get("public_id")).build_url(
            resource_type="video",
            format="jpg",
            transformation=[
                {"width": 400, "height": 300, "crop": "fill", "gravity": "auto"},
                {"start_offset": "auto"}
            ]
        )
        
        return {
            "public_id": result.get("public_id"),
            "secure_url": result.get("secure_url"),
            "resource_type": result.get("resource_type"),
            "format": result.get("format"),
            "width": result.get("width"),
            "height": result.get("height"),
            "duration": result.get("duration"),
            "bytes": result.get("bytes"),
            "created_at": result.get("created_at"),
            "thumbnail_url": thumbnail_url,
            "eager": result.get("eager", [])
        }
    except Exception as e:
        logger.error(f"Cloudinary video upload error: {str(e)}")
        raise Exception(f"Cloudinary upload error: {str(e)}")


async def delete_media(public_id: str, resource_type: str = "image") -> dict:
    """
    Delete a single media asset from Cloudinary.
    
    Args:
        public_id: The public ID of the asset to delete
        resource_type: Type of resource (image, video, raw)
    
    Returns:
        Dictionary containing deletion result
    """
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True
        )
        
        if result.get("result") == "ok":
            return {
                "success": True,
                "message": f"Media {public_id} deleted successfully",
                "public_id": public_id
            }
        else:
            return {
                "success": False,
                "message": f"Media {public_id} not found",
                "public_id": public_id
            }
    except Exception as e:
        logger.error(f"Cloudinary delete error: {str(e)}")
        raise Exception(f"Cloudinary delete error: {str(e)}")


async def delete_folder(folder_path: str) -> dict:
    """
    Delete all media assets in a folder.
    
    Args:
        folder_path: The folder path to delete (e.g., "spencer-green/rooms/room-123")
    
    Returns:
        Dictionary containing deletion result
    """
    try:
        result = delete_resources_by_prefix(folder_path, invalidate=True)
        
        return {
            "success": True,
            "deleted_count": result.get("deleted", {}),
            "folder": folder_path
        }
    except Exception as e:
        logger.error(f"Cloudinary folder delete error: {str(e)}")
        raise Exception(f"Cloudinary folder delete error: {str(e)}")


def validate_image_file(content_type: str, file_size: int) -> tuple:
    """
    Validate image file type and size.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if content_type not in ALLOWED_IMAGE_TYPES:
        return False, "Only JPEG, PNG, and WebP images are allowed"
    
    if file_size > MAX_IMAGE_SIZE:
        return False, f"Image size exceeds {MAX_IMAGE_SIZE // (1024*1024)}MB limit"
    
    return True, None


def validate_video_file(content_type: str, file_size: int) -> tuple:
    """
    Validate video file type and size.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if content_type not in ALLOWED_VIDEO_TYPES:
        return False, "Only MP4, MOV, and MPEG video formats are allowed"
    
    if file_size > MAX_VIDEO_SIZE:
        return False, f"Video size exceeds {MAX_VIDEO_SIZE // (1024*1024)}MB limit"
    
    return True, None


def generate_upload_signature(params: dict = None) -> dict:
    """
    Generate signature for signed uploads/access.
    
    Args:
        params: Dictionary of parameters to sign (from widget)
    
    Returns:
        Dictionary containing signature, timestamp, and api_key
    """
    import time
    from cloudinary.utils import api_sign_request
    
    if params is None:
        params = {}
        
    # Ensure timestamp is present
    if "timestamp" not in params:
        params["timestamp"] = int(time.time())
    
    # Filter out parameters that should not be part of the signature
    # api_sign_request in Python SDK signs EVERYTHING in the dict passed to it.
    # The widget might send api_key or cloud_name in params_to_sign (though unlikely, it's safer to remove).
    params_to_sign = params.copy()
    for key in ["api_key", "cloud_name", "file", "resource_type"]:
        params_to_sign.pop(key, None)
        
    # Sign the cleaned parameters
    signature = api_sign_request(params_to_sign, CLOUDINARY_API_SECRET)
    
    return {
        "signature": signature,
        "timestamp": params["timestamp"],
        "api_key": CLOUDINARY_API_KEY,
        "cloud_name": CLOUDINARY_CLOUD_NAME
    }


def list_gallery_images(folder_prefix: str = None, resource_type: str = "image", max_results: int = 50, next_cursor: str = None) -> dict:
    """
    List images from Cloudinary folder.
    
    Args:
        folder_prefix: The folder prefix to search in (optional)
        resource_type: Type of resource (image, video, raw)
        max_results: Max results to return
        next_cursor: Cursor for pagination
    
    Returns:
        Dictionary containing resources and next_cursor
    """
    try:
        # Use Admin API resources for folder browsing
        params = {
            "resource_type": resource_type,
            "type": "upload",
            "max_results": max_results,
            "context": True,
            "tags": True,
            "direction": "desc" 
        }
        
        # Only add prefix if it's provided and not empty
        if folder_prefix and folder_prefix.strip():
            params["prefix"] = folder_prefix
        
        if next_cursor:
            params["next_cursor"] = next_cursor
            
        print(f"DEBUG: Listing Cloudinary resources with params: {params}")
        result = cloudinary.api.resources(**params)
        print(f"DEBUG: Cloudinary list result count: {len(result.get('resources', []))}")
        
        return {
            "resources": result.get("resources", []),
            "next_cursor": result.get("next_cursor")
        }
    except Exception as e:
        error_msg = f"Cloudinary list resources error: {str(e)}"
        print(f"DEBUG ERROR: {error_msg}")
        logger.error(error_msg)
        return {"resources": [], "error": str(e)}
