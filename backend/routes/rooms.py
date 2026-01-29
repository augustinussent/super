from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from models.room import RoomType, RoomInventory, BulkUpdateRequest
from services.auth import require_admin
from services.audit import log_activity, get_changes

router = APIRouter(tags=["rooms"])

# Public routes
@router.get("/rooms")
async def get_rooms():
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return rooms

@router.get("/rooms/{room_type_id}")
async def get_room(room_type_id: str):
    room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

# Admin routes
@router.post("/admin/rooms")
async def create_room(room: RoomType, request: Request, user: dict = Depends(require_admin)):
    room_doc = room.model_dump()
    await db.room_types.insert_one(room_doc)
    # Exclude _id from response (MongoDB adds it during insert)
    room_doc.pop("_id", None)
    
    # Log the activity
    await log_activity(
        user=user,
        action="create",
        resource="rooms",
        resource_id=room_doc.get("room_type_id"),
        details={"room_name": room_doc.get("name"), "base_price": room_doc.get("base_price")},
        ip_address=request.client.host if request.client else None
    )
    
    return room_doc

@router.put("/admin/rooms/{room_type_id}")
async def update_room(room_type_id: str, room: dict, request: Request, user: dict = Depends(require_admin)):
    # Get old room data for comparison
    old_room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not old_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.room_types.update_one({"room_type_id": room_type_id}, {"$set": room})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Log the activity
    changes = get_changes(old_room, room, ["name", "description", "base_price", "max_guests", "amenities"])
    await log_activity(
        user=user,
        action="update",
        resource="rooms",
        resource_id=room_type_id,
        details={"room_name": old_room.get("name"), "changes": changes},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Room updated"}

@router.delete("/admin/rooms/{room_type_id}")
async def delete_room(room_type_id: str, request: Request, user: dict = Depends(require_admin)):
    # Get room info before delete
    room_to_delete = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room_to_delete:
        raise HTTPException(status_code=404, detail="Room not found")
    
    result = await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Log the activity
    await log_activity(
        user=user,
        action="delete",
        resource="rooms",
        resource_id=room_type_id,
        details={"room_name": room_to_delete.get("name")},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Room deleted"}

@router.post("/admin/rooms/reorder")
async def reorder_rooms(order_data: dict, user: dict = Depends(require_admin)):
    # order_data expectation: {"room_ids": ["id1", "id2", ...]}
    room_ids = order_data.get("room_ids", [])
    if not room_ids:
        raise HTTPException(status_code=400, detail="room_ids list is required")
        
    for index, room_id in enumerate(room_ids):
        await db.room_types.update_one(
            {"room_type_id": room_id},
            {"$set": {"display_order": index}}
        )
            
    return {"message": "Rooms reordered successfully"}

# Inventory routes
@router.get("/inventory")
async def get_inventory(room_type_id: str = None, start_date: str = None, end_date: str = None):
    query = {}
    if room_type_id:
        query["room_type_id"] = room_type_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    inventory = await db.room_inventory.find(query, {"_id": 0}).to_list(1000)
    return inventory

@router.post("/admin/inventory")
async def create_inventory(inventory: RoomInventory, user: dict = Depends(require_admin)):
    existing = await db.room_inventory.find_one({
        "room_type_id": inventory.room_type_id,
        "date": inventory.date
    }, {"_id": 0})
    
    if existing:
        await db.room_inventory.update_one(
            {"inventory_id": existing["inventory_id"]},
            {"$set": inventory.model_dump()}
        )
    else:
        await db.room_inventory.insert_one(inventory.model_dump())
    
    return inventory.model_dump()

@router.post("/admin/inventory/bulk-update")
async def bulk_update_inventory(request: BulkUpdateRequest, req: Request, user: dict = Depends(require_admin)):
    start = datetime.strptime(request.start_date, "%Y-%m-%d")
    end = datetime.strptime(request.end_date, "%Y-%m-%d")
    
    room = await db.room_types.find_one({"room_type_id": request.room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    current = start
    updated_count = 0
    while current <= end:
        # Check day validation if specific days are requested
        # Python weekday: 0=Mon, 6=Sun
        if request.days_of_week is not None and len(request.days_of_week) > 0:
            if current.weekday() not in request.days_of_week:
                current += timedelta(days=1)
                continue
                
        date_str = current.strftime("%Y-%m-%d")
        update_fields = {}
        
        if request.allotment is not None:
            update_fields["allotment"] = request.allotment
        if request.rate is not None:
            update_fields["rate"] = request.rate
        if request.is_closed is not None:
            update_fields["is_closed"] = request.is_closed
        
        if update_fields:
            existing = await db.room_inventory.find_one({
                "room_type_id": request.room_type_id,
                "date": date_str
            }, {"_id": 0})
            
            if existing:
                await db.room_inventory.update_one(
                    {"inventory_id": existing["inventory_id"]},
                    {"$set": update_fields}
                )
            else:
                new_inventory = {
                    "inventory_id": str(uuid.uuid4()),
                    "room_type_id": request.room_type_id,
                    "date": date_str,
                    "allotment": request.allotment if request.allotment is not None else 5,
                    "rate": request.rate if request.rate is not None else room.get("base_price", 500000),
                    "is_closed": request.is_closed if request.is_closed is not None else False
                }
                await db.room_inventory.insert_one(new_inventory)
            
            updated_count += 1
        
        current += timedelta(days=1)
    
    # Log the activity
    await log_activity(
        user=user,
        action="update",
        resource="inventory",
        resource_id=request.room_type_id,
        details={
            "room_name": room.get("name"),
            "range": f"{request.start_date} to {request.end_date}",
            "days_updated": updated_count,
            "updates": {
                k: v for k, v in request.model_dump().items() 
                if k in ["allotment", "rate", "is_closed"] and v is not None
            }
        },
        ip_address=req.client.host if req.client else None
    )
    
    return {"message": f"Updated {updated_count} days"}

# Availability
@router.get("/availability")
async def check_availability(check_in: str, check_out: str):
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).sort("display_order", 1).to_list(100)
    available_rooms = []
    
    # Get active rate plans
    rate_plans = await db.rate_plans.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    # Organize rate plans by room_type_id (None = global)
    global_plans = [p for p in rate_plans if not p.get("room_type_id")]
    specific_plans = {p["room_type_id"]: [] for p in rate_plans if p.get("room_type_id")}
    for p in rate_plans:
        if p.get("room_type_id"):
            specific_plans[p["room_type_id"]].append(p)

    for room in rooms:
        # Check inventory availability first
        inventory = await db.room_inventory.find({
            "room_type_id": room["room_type_id"],
            "date": {"$gte": check_in, "$lt": check_out}
        }, {"_id": 0}).to_list(100)
        
        # Calculate base rate per night logic
        # We need to know the total base price for the stay to apply rate plans correctly
        is_available = True
        total_base_price = 0
        night_rates = []
        
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (check_out_date - check_in_date).days
        
        if nights <= 0:
            is_available = False
        else:
            for i in range(nights):
                date_str = (check_in_date + timedelta(days=i)).strftime("%Y-%m-%d")
                inv = next((x for x in inventory if x["date"] == date_str), None)
                
                if inv:
                    if inv.get("is_closed", False) or inv.get("allotment", 0) <= 0:
                        is_available = False
                        break
                    rate = inv.get("rate", room.get("base_price", 500000))
                    total_base_price += rate
                    night_rates.append(rate)
                else:
                    # Default if no specific inventory
                    rate = room.get("base_price", 500000)
                    total_base_price += rate
                    night_rates.append(rate)
        
        if is_available:
            # Calculate available rate plans for this room
            room_plans = global_plans + specific_plans.get(room["room_type_id"], [])
            
            calculated_plans = []
            
            # Always add "Standard Rate" if no plans, or as a base? 
            # Let's assume there's always a "Standard Rate" implicitly or we can create a dummy one
            # Ideally, the user creates rate plans. If there are none, we just show base price.
            # But specific logic: "Standard Rate" is just base price.
            
            standard_plan = {
                "rate_plan_id": "standard",
                "name": "Standard Rate",
                "description": "Room only, standard cancellation policy",
                "total_price": total_base_price,
                "nightly_price": total_base_price / nights if nights > 0 else 0,
                "conditions": ["free-cancellation"]
            }
            calculated_plans.append(standard_plan)
            
            for plan in room_plans:
                plan_price = total_base_price
                
                if plan["price_modifier_type"] == "percent":
                    # e.g. -10 means 10% discount, +10 means 10% surcharge
                    modifier = plan["price_modifier_val"] / 100
                    plan_price = total_base_price * (1 + modifier)
                elif plan["price_modifier_type"] == "absolute_add":
                    # Add X per night
                    plan_price = total_base_price + (plan["price_modifier_val"] * nights)
                elif plan["price_modifier_type"] == "absolute_total":
                    # Fixed total add (rare, but maybe "cleaning fee" style?) 
                    # Or maybe replace price? "absolute_total" usually means "add X to total"
                    plan_price = total_base_price + plan["price_modifier_val"]
                
                calculated_plans.append({
                    "rate_plan_id": plan["rate_plan_id"],
                    "name": plan["name"],
                    "description": plan["description"],
                    "total_price": plan_price,
                    "nightly_price": plan_price / nights if nights > 0 else 0,
                    "conditions": plan.get("conditions", [])
                })
            
            room["rate_plans"] = calculated_plans
            # Keep backward compatibility for frontend that expects 'available_rate'
            room["available_rate"] = min(p["nightly_price"] for p in calculated_plans)
            
            available_rooms.append(room)
    
    return available_rooms
