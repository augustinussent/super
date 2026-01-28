from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone

from database import db
from models.content import SiteContent
from services.auth import require_admin
from services.audit import log_activity

router = APIRouter(tags=["content"])

@router.get("/content")
async def get_all_content():
    content = await db.site_content.find({}, {"_id": 0}).to_list(500)
    return content

@router.get("/content/{page}")
async def get_page_content(page: str):
    content = await db.site_content.find({"page": page}, {"_id": 0}).to_list(100)
    return content

@router.post("/admin/content")
async def create_content(content: SiteContent, request: Request, user: dict = Depends(require_admin)):
    content_doc = content.model_dump()
    
    existing = await db.site_content.find_one({
        "section": content_doc["section"],
        "page": content_doc["page"]
    }, {"_id": 0})
    
    action = "create"
    if existing:
        action = "update"
        await db.site_content.update_one(
            {"content_id": existing["content_id"]},
            {"$set": {"content": content_doc["content"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        content_doc["content_id"] = existing["content_id"]
    else:
        await db.site_content.insert_one(content_doc)
    
    # Log activity
    await log_activity(
        user=user,
        action=action,
        resource="content",
        resource_id=content_doc["content_id"],
        details={"page": content_doc["page"], "section": content_doc["section"]},
        ip_address=request.client.host if request.client else None
    )
    
    # Exclude _id from response (MongoDB adds it during insert)
    content_doc.pop("_id", None)
    return content_doc

@router.put("/admin/content/{content_id}")
async def update_content(content_id: str, content: dict, request: Request, user: dict = Depends(require_admin)):
    content["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.site_content.update_one({"content_id": content_id}, {"$set": content})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
        
    await log_activity(
        user=user,
        action="update",
        resource="content",
        resource_id=content_id,
        details={"content": "updated via put"},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Content updated"}

@router.delete("/admin/content/{page}/{section}")
async def delete_content(page: str, section: str, request: Request, user: dict = Depends(require_admin)):
    result = await db.site_content.delete_one({"page": page, "section": section})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
        
    await log_activity(
        user=user,
        action="delete",
        resource="content",
        resource_id=f"{page}_{section}",
        details={"page": page, "section": section},
        ip_address=request.client.host if request.client else None
    )
        
    return {"message": "Content deleted"}

# ==================== SPECIAL OFFERS ====================

import uuid

@router.get("/special-offers")
async def get_special_offers():
    """Public endpoint to get all active special offers"""
    offers = await db.site_content.find(
        {"section": "special_offer"},
        {"_id": 0}
    ).sort("order", 1).to_list(50)
    
    # Transform to simpler format
    result = []
    for offer in offers:
        content = offer.get("content", {})
        result.append({
            "id": offer.get("content_id"),
            "title": content.get("title", ""),
            "description": content.get("description", ""),
            "code": content.get("code", ""),
            "image": content.get("image", ""),
            "validUntil": content.get("validUntil", ""),
            "order": offer.get("order", 0)
        })
    return result

@router.post("/admin/special-offers")
async def create_special_offer(offer: dict, request: Request, user: dict = Depends(require_admin)):
    """Create a new special offer"""
    offer_id = str(uuid.uuid4())
    
    # Get max order
    last = await db.site_content.find_one(
        {"section": "special_offer"},
        sort=[("order", -1)]
    )
    new_order = (last.get("order", 0) + 1) if last else 0
    
    doc = {
        "content_id": offer_id,
        "section": "special_offer",
        "page": "home",
        "content_type": "offer",
        "order": new_order,
        "content": {
            "title": offer.get("title", ""),
            "description": offer.get("description", ""),
            "code": offer.get("code", ""),
            "image": offer.get("image", ""),
            "validUntil": offer.get("validUntil", "")
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.site_content.insert_one(doc)
    
    await log_activity(
        user=user,
        action="create",
        resource="special_offer",
        resource_id=offer_id,
        details={"title": offer.get("title")},
        ip_address=request.client.host if request.client else None
    )
    
    doc.pop("_id", None)
    return {"id": offer_id, **doc["content"], "order": doc["order"]}

@router.put("/admin/special-offers/{offer_id}")
async def update_special_offer(offer_id: str, offer: dict, request: Request, user: dict = Depends(require_admin)):
    """Update an existing special offer"""
    update_data = {
        "content.title": offer.get("title"),
        "content.description": offer.get("description"),
        "content.code": offer.get("code"),
        "content.image": offer.get("image"),
        "content.validUntil": offer.get("validUntil"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    if "order" in offer:
        update_data["order"] = offer["order"]
    
    result = await db.site_content.update_one(
        {"content_id": offer_id, "section": "special_offer"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    await log_activity(
        user=user,
        action="update",
        resource="special_offer",
        resource_id=offer_id,
        details={"title": offer.get("title")},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Offer updated"}

@router.delete("/admin/special-offers/{offer_id}")
async def delete_special_offer(offer_id: str, request: Request, user: dict = Depends(require_admin)):
    """Delete a special offer"""
    result = await db.site_content.delete_one({"content_id": offer_id, "section": "special_offer"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    await log_activity(
        user=user,
        action="delete",
        resource="special_offer",
        resource_id=offer_id,
        details={},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Offer deleted"}

