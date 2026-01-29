from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
import uuid

from database import db
from models.rate_plan import RatePlan, RatePlanCreate
from services.auth import require_admin
from services.audit import log_activity

router = APIRouter(tags=["rate_plans"])

@router.get("/rate-plans")
async def get_rate_plans(room_type_id: str = None):
    query = {}
    if room_type_id:
        # Fetch global plans (None) OR specific room plans
        query["$or"] = [
            {"room_type_id": None},
            {"room_type_id": room_type_id}
        ]
    
    plans = await db.rate_plans.find(query, {"_id": 0}).to_list(100)
    return plans

@router.get("/admin/rate-plans")
async def get_all_rate_plans(user: dict = Depends(require_admin)):
    plans = await db.rate_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return plans

@router.post("/admin/rate-plans")
async def create_rate_plan(plan: RatePlanCreate, request: Request, user: dict = Depends(require_admin)):
    plan_doc = RatePlan(**plan.model_dump()).model_dump()
    
    await db.rate_plans.insert_one(plan_doc)
    
    # Exclude _id
    plan_doc.pop("_id", None)
    
    await log_activity(
        user=user,
        action="create",
        resource="rate_plans",
        resource_id=plan_doc["rate_plan_id"],
        details={"name": plan_doc["name"]},
        ip_address=request.client.host if request.client else None
    )
    
    return plan_doc

@router.put("/admin/rate-plans/{rate_plan_id}")
async def update_rate_plan(rate_plan_id: str, plan_update: dict, request: Request, user: dict = Depends(require_admin)):
    existing = await db.rate_plans.find_one({"rate_plan_id": rate_plan_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rate plan not found")
        
    # Prevent updating ID or Created At
    plan_update.pop("rate_plan_id", None)
    plan_update.pop("created_at", None)
    
    await db.rate_plans.update_one(
        {"rate_plan_id": rate_plan_id},
        {"$set": plan_update}
    )
    
    await log_activity(
        user=user,
        action="update",
        resource="rate_plans",
        resource_id=rate_plan_id,
        details={"updates": plan_update},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Rate plan updated"}

@router.delete("/admin/rate-plans/{rate_plan_id}")
async def delete_rate_plan(rate_plan_id: str, request: Request, user: dict = Depends(require_admin)):
    result = await db.rate_plans.delete_one({"rate_plan_id": rate_plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rate plan not found")
        
    await log_activity(
        user=user,
        action="delete",
        resource="rate_plans",
        resource_id=rate_plan_id,
        details={},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Rate plan deleted"}
