from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Query, Body
from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY

from typing import Optional
from datetime import datetime, timezone

from database import db
from services.auth import require_admin
from cloudinary_helper import (
    upload_image, upload_video, delete_media, delete_folder,
    validate_image_file, validate_video_file, generate_upload_signature,
    list_gallery_images
)
from ai_helper import generate_image_caption

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload/gallery")
async def upload_gallery_image(
    file: UploadFile = File(...),
    category: str = "general",
    auto_caption: bool = Query(True, description="Generate AI caption for image"),
    user: dict = Depends(require_admin)
):
    """
    Upload gallery image for the hotel.
    Categories: general, rooms, facilities, restaurant, pool, spa, lobby
    If auto_caption is True, AI will generate caption and alt_text.
    """
    file_content = await file.read()
    file_size = len(file_content)
    
    is_valid, error = validate_image_file(file.content_type, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    result = await upload_image(
        file_content=file_content,
        folder=f"gallery/{category}"
    )
    
    # Generate AI caption if requested
    ai_result = {"caption": "", "alt_text": "", "success": False}
    if auto_caption:
        ai_result = await generate_image_caption(file_content, context="gallery")
    
    return {
        "success": True,
        "data": result,
        "ai_caption": ai_result
    }


@router.post("/upload/room-image")
async def upload_room_image(
    file: UploadFile = File(...),
    room_type_id: str = None,
    auto_caption: bool = Query(True, description="Generate AI caption for image"),
    user: dict = Depends(require_admin)
):
    """
    Upload image for a specific room type.
    If auto_caption is True, AI will generate caption and alt_text.
    """
    if not room_type_id:
        raise HTTPException(status_code=400, detail="room_type_id is required")
    
    room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    file_content = await file.read()
    file_size = len(file_content)
    
    is_valid, error = validate_image_file(file.content_type, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    result = await upload_image(
        file_content=file_content,
        folder=f"rooms/{room_type_id}"
    )
    
    # Update room with new image
    current_images = room.get("images", [])
    current_images.append(result["secure_url"])
    
    await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {"images": current_images, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Generate AI caption if requested
    ai_result = {"caption": "", "alt_text": "", "success": False}
    if auto_caption:
        ai_result = await generate_image_caption(file_content, context="room")
    
    return {
        "success": True,
        "data": result,
        "ai_caption": ai_result
    }


@router.post("/upload/room-video")
async def upload_room_video(
    file: UploadFile = File(...),
    room_type_id: str = None,
    user: dict = Depends(require_admin)
):
    """
    Upload tour video for a specific room type.
    """
    if not room_type_id:
        raise HTTPException(status_code=400, detail="room_type_id is required")
    
    room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    file_content = await file.read()
    file_size = len(file_content)
    
    is_valid, error = validate_video_file(file.content_type, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    result = await upload_video(
        file_content=file_content,
        folder=f"rooms/{room_type_id}/videos"
    )
    
    # Update room with video URL
    await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {
            "video_url": result["secure_url"],
            "video_thumbnail": result.get("thumbnail_url"),
            "video_public_id": result["public_id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "data": result
    }


@router.post("/upload/content-image")
async def upload_content_image(
    file: UploadFile = File(...),
    section: str = "general",
    auto_caption: bool = Query(True, description="Generate AI caption for image"),
    user: dict = Depends(require_admin)
):
    """
    Upload image for CMS content sections.
    Sections: hero, about, facilities, promo, banner
    If auto_caption is True, AI will generate caption and alt_text.
    """
    file_content = await file.read()
    file_size = len(file_content)
    
    is_valid, error = validate_image_file(file.content_type, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    result = await upload_image(
        file_content=file_content,
        folder=f"content/{section}"
    )
    
    # Generate AI caption if requested
    ai_result = {"caption": "", "alt_text": "", "success": False}
    if auto_caption:
        ai_result = await generate_image_caption(file_content, context="hotel")
    
    return {
        "success": True,
        "data": result,
        "ai_caption": ai_result
    }


@router.post("/convert")
async def convert_media(
    file: UploadFile = File(...),
    user: dict = Depends(require_admin)
):
    """
    Upload and optimize media.
    Images -> WebP
    Videos -> Optimized MP4/WebM
    """
    content = await file.read()
    content_type = file.content_type
    
    try:
        if content_type.startswith("image/"):
            # Image optimization (force WebP)
            result = await upload_image(
                file_content=content,
                folder="optimized",
                force_format="webp"
            )
            return {
                "message": "Image converted to WebP successfully",
                "original_name": file.filename,
                "url": result.get("secure_url"),
                "format": result.get("format"),
                "size": result.get("bytes"),
                "public_id": result.get("public_id")
            }
            
        elif content_type.startswith("video/"):
            # Video optimization
            result = await upload_video(
                file_content=content,
                folder="optimized-videos"
            )
            return {
                "message": "Video optimized successfully",
                "original_name": file.filename,
                "url": result.get("secure_url"),
                "thumbnail": result.get("thumbnail_url"),
                "format": result.get("format"),
                "size": result.get("bytes"),
                "public_id": result.get("public_id")
            }
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported media type")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete")
async def delete_media_file(
    public_id: str,
    resource_type: str = "image",
    user: dict = Depends(require_admin)
):
    """
    Delete a media file from Cloudinary.
    """
    result = await delete_media(public_id, resource_type)
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    return result


@router.delete("/delete-room-image")
async def delete_room_image(
    room_type_id: str,
    image_url: str,
    user: dict = Depends(require_admin)
):
    """
    Delete a specific image from a room and remove from Cloudinary.
    """
    room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    current_images = room.get("images", [])
    if image_url not in current_images:
        raise HTTPException(status_code=404, detail="Image not found in room")
    
    # Extract public_id from URL
    # URL format: https://res.cloudinary.com/{cloud}/image/upload/{version}/{public_id}.{format}
    try:
        url_parts = image_url.split("/upload/")
        if len(url_parts) > 1:
            path_with_extension = url_parts[1]
            # Remove version if present (v1234567890/)
            if path_with_extension.startswith("v"):
                path_with_extension = "/".join(path_with_extension.split("/")[1:])
            # Remove extension
            public_id = ".".join(path_with_extension.split(".")[:-1])
            
            # Try to delete from Cloudinary
            await delete_media(public_id, "image")
    except Exception as e:
        pass  # Continue even if Cloudinary delete fails
    
    # Remove from room images
    current_images.remove(image_url)
    await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {"images": current_images, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Image deleted"}


@router.delete("/delete-room-video")
async def delete_room_video(
    room_type_id: str,
    user: dict = Depends(require_admin)
):
    """
    Delete room tour video from Cloudinary and database.
    """
    room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    video_public_id = room.get("video_public_id")
    if video_public_id:
        try:
            await delete_media(video_public_id, "video")
        except Exception:
            pass  # Continue even if Cloudinary delete fails
    
    # Clear video from room
    await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {
            "video_url": "",
            "video_thumbnail": "",
            "video_public_id": "",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Video deleted"}


@router.post("/signature")
async def get_signature(
    params_to_sign: dict = Body(...),
    user: dict = Depends(require_admin)
):
    """
    Get signature for signed Cloudinary widget.
    Accepts params_to_sign from the widget.
    """
    return generate_upload_signature(params_to_sign)


@router.get("/gallery")
async def get_gallery(
    prefix: Optional[str] = None,
    resource_type: str = "image",
    next_cursor: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """
    Get list of images from Cloudinary.
    """
    return list_gallery_images(folder_prefix=prefix, resource_type=resource_type, next_cursor=next_cursor)


@router.get("/config")
async def get_cloudinary_config(user: dict = Depends(require_admin)):
    """
    Get Cloudinary configuration for widget initialization.
    """
    return {
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key": CLOUDINARY_API_KEY
    }
