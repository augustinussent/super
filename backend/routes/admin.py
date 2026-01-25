from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import db
from services.auth import hash_password, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])

# Dashboard
@router.get("/dashboard")
async def get_dashboard_stats(user: dict = Depends(require_admin)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month_start = datetime.now(timezone.utc).replace(day=1).strftime("%Y-%m-%d")
    
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    today_occupied = await db.reservations.count_documents({
        "check_in": {"$lte": today},
        "check_out": {"$gt": today},
        "status": {"$in": ["confirmed", "checked_in"]}
    })
    
    today_inventory = await db.room_inventory.find({"date": today}, {"_id": 0}).to_list(100)
    available_today = sum(inv.get("allotment", 0) for inv in today_inventory)
    
    month_reservations = await db.reservations.find({
        "created_at": {"$gte": month_start},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0}).to_list(1000)
    month_revenue = sum(r.get("total_amount", 0) for r in month_reservations)
    
    pending_reviews = await db.reviews.count_documents({"is_visible": False})
    
    recent_reservations = await db.reservations.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    
    # Calculate Revenue Chart (Last 6 Months)
    pipeline = [
        {
            "$match": {
                "status": {"$in": ["confirmed", "checked_in", "checked_out"]}
            }
        },
        {
            "$group": {
                "_id": {"$substr": ["$check_in", 0, 7]}, # YYYY-MM
                "revenue": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 6}
    ]
    
    revenue_data = await db.reservations.aggregate(pipeline).to_list(10)
    
    # Format for chart
    revenue_chart = []
    for item in revenue_data:
        # Convert YYYY-MM to Month Name
        date_obj = datetime.strptime(item["_id"], "%Y-%m")
        month_name = date_obj.strftime("%b")
        revenue_chart.append({
            "name": month_name,
            "revenue": item["revenue"],
            "fullDate": item["_id"]
        })
        
    # If empty, provide at least minimal structure or empty list
    if not revenue_chart:
        revenue_chart = []

    return {
        "occupied_rooms": today_occupied,
        "available_rooms": available_today,
        "monthly_revenue": month_revenue,
        "total_room_types": len(rooms),
        "pending_reviews": pending_reviews,
        "recent_reservations": recent_reservations,
        "revenue_chart": revenue_chart
    }

# User Management
@router.get("/users")
async def get_users(user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return users

@router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: dict = Depends(require_admin)):
    if "password" in user_data:
        user_data["password"] = hash_password(user_data["password"])
    user_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": user_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
