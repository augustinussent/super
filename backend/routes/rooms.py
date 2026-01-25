from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from models.room import RoomType, RoomInventory, BulkUpdateRequest
from services.auth import require_admin

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
async def create_room(room: RoomType, user: dict = Depends(require_admin)):
    room_doc = room.model_dump()
    await db.room_types.insert_one(room_doc)
    # Exclude _id from response (MongoDB adds it during insert)
    room_doc.pop("_id", None)
    return room_doc

@router.put("/admin/rooms/{room_type_id}")
async def update_room(room_type_id: str, room: dict, user: dict = Depends(require_admin)):
    room["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.room_types.update_one({"room_type_id": room_type_id}, {"$set": room})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room updated"}

@router.delete("/admin/rooms/{room_type_id}")
async def delete_room(room_type_id: str, user: dict = Depends(require_admin)):
    result = await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
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
async def bulk_update_inventory(request: BulkUpdateRequest, user: dict = Depends(require_admin)):
    start = datetime.strptime(request.start_date, "%Y-%m-%d")
    end = datetime.strptime(request.end_date, "%Y-%m-%d")
    
    room = await db.room_types.find_one({"room_type_id": request.room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    current = start
    updated_count = 0
    while current <= end:
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
    
    return {"message": f"Updated {updated_count} days"}

# Availability
@router.get("/availability")
async def check_availability(check_in: str, check_out: str):
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).sort("display_order", 1).to_list(100)
    available_rooms = []
    
    for room in rooms:
        inventory = await db.room_inventory.find({
            "room_type_id": room["room_type_id"],
            "date": {"$gte": check_in, "$lt": check_out}
        }, {"_id": 0}).to_list(100)
        
        min_rate = room.get("base_price", 500000)
        is_available = True
        
        if inventory:
            for inv in inventory:
                if inv.get("is_closed", False) or inv.get("allotment", 0) <= 0:
                    is_available = False
                    break
                min_rate = min(min_rate, inv.get("rate", min_rate))
        
        if is_available:
            room["available_rate"] = min_rate
            available_rooms.append(room)
    
    return available_rooms
