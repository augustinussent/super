from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import db
from models.promo import PromoCode
from services.auth import require_admin

router = APIRouter(prefix="/admin/promo-codes", tags=["promo"])

@router.get("")
async def get_promo_codes(user: dict = Depends(require_admin)):
    promos = await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return promos

@router.post("")
async def create_promo_code(promo: PromoCode, user: dict = Depends(require_admin)):
    import logging
    import traceback
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Received promo create request: {promo.model_dump()}")
        
        promo_doc = promo.model_dump()
        promo_doc["code"] = promo_doc["code"].upper()
        
        # Check database connection/collection
        if db.promo_codes is None:
             raise Exception("Database collection promo_codes is None")

        existing = await db.promo_codes.find_one({"code": promo_doc["code"]}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Promo code already exists")
        
        await db.promo_codes.insert_one(promo_doc)
        
        # Fix: Ensure _id is removed before returning if it was added
        promo_doc.pop("_id", None)
        
        return promo_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating promo code: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.put("/{promo_id}")
async def update_promo_code(promo_id: str, promo: dict, user: dict = Depends(require_admin)):
    if "code" in promo:
        promo["code"] = promo["code"].upper()
    promo["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.promo_codes.update_one({"promo_id": promo_id}, {"$set": promo})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    return {"message": "Promo code updated"}

@router.delete("/{promo_id}")
async def delete_promo_code(promo_id: str, user: dict = Depends(require_admin)):
    result = await db.promo_codes.delete_one({"promo_id": promo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    return {"message": "Promo code deleted"}
