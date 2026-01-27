from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import db
from models.content import SiteContent
from services.auth import require_admin

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
async def create_content(content: SiteContent, user: dict = Depends(require_admin)):
    content_doc = content.model_dump()
    
    existing = await db.site_content.find_one({
        "section": content_doc["section"],
        "page": content_doc["page"]
    }, {"_id": 0})
    
    if existing:
        await db.site_content.update_one(
            {"content_id": existing["content_id"]},
            {"$set": {"content": content_doc["content"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        content_doc["content_id"] = existing["content_id"]
    else:
        await db.site_content.insert_one(content_doc)
    
    # Exclude _id from response (MongoDB adds it during insert)
    content_doc.pop("_id", None)
    return content_doc

@router.put("/admin/content/{content_id}")
async def update_content(content_id: str, content: dict, user: dict = Depends(require_admin)):
    content["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.site_content.update_one({"content_id": content_id}, {"$set": content})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"message": "Content updated"}

@router.delete("/admin/content/{page}/{section}")
async def delete_content(page: str, section: str, user: dict = Depends(require_admin)):
    result = await db.site_content.delete_one({"page": page, "section": section})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"message": "Content deleted"}
