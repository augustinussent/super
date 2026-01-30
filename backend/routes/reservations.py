from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from datetime import datetime, timezone, timedelta

from database import db
from models.reservation import ReservationCreate, Reservation
from services.auth import require_admin, require_super_admin
from services.email import send_reservation_email
from services.audit import log_activity

router = APIRouter(tags=["reservations"])

@router.delete("/reservations/{reservation_id}")
async def delete_reservation(reservation_id: str, request: Request, user: dict = Depends(require_super_admin)):
    result = await db.reservations.delete_one({"reservation_id": reservation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    await log_activity(
        user=user,
        action="delete",
        resource="reservations",
        resource_id=reservation_id,
        details={"reservation_id": reservation_id},
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Reservation deleted permanently"}

@router.post("/reservations")
async def create_reservation(reservation: ReservationCreate, background_tasks: BackgroundTasks):
    room = await db.room_types.find_one({"room_type_id": reservation.room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    check_in = datetime.strptime(reservation.check_in, "%Y-%m-%d")
    check_out = datetime.strptime(reservation.check_out, "%Y-%m-%d")
    nights = (check_out - check_in).days
    
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Invalid dates")
    
    inventory = await db.room_inventory.find({
        "room_type_id": reservation.room_type_id,
        "date": {"$gte": reservation.check_in, "$lt": reservation.check_out}
    }, {"_id": 0}).to_list(nights)
    
    total_rate = 0
    for i in range(nights):
        date_str = (check_in + timedelta(days=i)).strftime("%Y-%m-%d")
        inv = next((x for x in inventory if x["date"] == date_str), None)
        
        if inv:
            if inv.get("is_closed", False) or inv.get("allotment", 0) <= 0:
                raise HTTPException(status_code=400, detail=f"Room not available on {date_str}")
            total_rate += inv.get("rate", room.get("base_price", 500000))
        else:
            total_rate += room.get("base_price", 500000)
    
    # Apply Rate Plan
    rate_plan_name = "Room Only"
    if reservation.rate_plan_id and reservation.rate_plan_id != "standard":
        rate_plan = await db.rate_plans.find_one({
            "rate_plan_id": reservation.rate_plan_id,
            "is_active": True
        }, {"_id": 0})
        
        if rate_plan:
            rate_plan_name = rate_plan["name"]
            if rate_plan["price_modifier_type"] == "percent":
                modifier = rate_plan["price_modifier_val"] / 100
                total_rate = total_rate * (1 + modifier)
            elif rate_plan["price_modifier_type"] == "absolute_add":
                total_rate = total_rate + (rate_plan["price_modifier_val"] * nights)
            elif rate_plan["price_modifier_type"] == "absolute_total":
                total_rate = total_rate + rate_plan["price_modifier_val"]
        else:
            # Fallback or error? Let's treat invalid ID as Standard for robustness, or error?
            # Ideally strict validation
            raise HTTPException(status_code=400, detail="Invalid rate plan")
    
    discount = 0
    if reservation.promo_code:
        promo = await db.promo_codes.find_one({
            "code": reservation.promo_code.upper(),
            "is_active": True
        }, {"_id": 0})
        
        if promo:
            now = datetime.now(timezone.utc).isoformat()
            if promo["valid_from"] <= now <= promo["valid_until"]:
                if promo["current_usage"] < promo["max_usage"]:
                    if not promo["room_type_ids"] or reservation.room_type_id in promo["room_type_ids"]:
                        # Check valid_days (0=Sunday, 6=Saturday in JS convention)
                        # Python weekday: 0=Monday, so we convert
                        valid_days = promo.get("valid_days", [])
                        if valid_days:
                            # Convert Python weekday (0=Mon) to JS (0=Sun)
                            py_weekday = check_in.weekday()  # 0=Mon, 6=Sun
                            js_weekday = (py_weekday + 1) % 7  # 0=Sun, 6=Sat
                            if js_weekday not in valid_days:
                                # Promo not valid for this day
                                pass
                            else:
                                # Day is valid, apply discount
                                if promo["discount_type"] == "percent":
                                    discount = total_rate * (promo["discount_value"] / 100)
                                else:
                                    discount = promo["discount_value"]
                                
                                await db.promo_codes.update_one(
                                    {"promo_id": promo["promo_id"]},
                                    {"$inc": {"current_usage": 1}}
                                )
                        else:
                            # No day restriction, apply discount
                            if promo["discount_type"] == "percent":
                                discount = total_rate * (promo["discount_value"] / 100)
                            else:
                                discount = promo["discount_value"]
                            
                            await db.promo_codes.update_one(
                                {"promo_id": promo["promo_id"]},
                                {"$inc": {"current_usage": 1}}
                            )
    
    res_doc = Reservation(
        guest_name=reservation.guest_name,
        guest_email=reservation.guest_email,
        guest_phone=reservation.guest_phone,
        room_type_id=reservation.room_type_id,
        room_type_name=room["name"],
        rate_plan_id=reservation.rate_plan_id,
        rate_plan_name=rate_plan_name,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        guests=reservation.guests,
        nights=nights,
        rate_per_night=total_rate / nights,
        total_amount=total_rate - discount,
        discount_amount=discount,
        promo_code=reservation.promo_code,
        special_requests=reservation.special_requests,
        status="pending"
    ).model_dump()
    
    await db.reservations.insert_one(res_doc)
    
    # Update inventory
    for i in range(nights):
        date_str = (check_in + timedelta(days=i)).strftime("%Y-%m-%d")
        await db.room_inventory.update_one(
            {"room_type_id": reservation.room_type_id, "date": date_str},
            {"$inc": {"allotment": -1}}
        )
    
    # Send email in background
    background_tasks.add_task(send_reservation_email, res_doc, room)
    
    # Return clean response without MongoDB _id
    clean_response = {k: v for k, v in res_doc.items() if k != '_id'}
    return clean_response

@router.get("/reservations/check")
async def check_reservation(booking_code: str = None, email: str = None):
    if not booking_code and not email:
        raise HTTPException(status_code=400, detail="Please provide booking code or email")
    
    query = {}
    if booking_code:
        query["booking_code"] = booking_code.upper()
    if email:
        query["guest_email"] = email.lower()
    
    reservations = await db.reservations.find(query, {"_id": 0}).to_list(10)
    return reservations

@router.post("/promo/verify")
async def verify_promo(request: dict):
    code = request.get("code", "").upper()
    check_in_str = request.get("check_in")
    
    if not code:
        raise HTTPException(status_code=400, detail="Promo code is required")
    
    promo = await db.promo_codes.find_one({
        "code": code,
        "is_active": True
    }, {"_id": 0})
    
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid promo code")
        
    # Check general validity period
    now = datetime.now(timezone.utc).isoformat()
    if not (promo["valid_from"] <= now <= promo["valid_until"]):
        raise HTTPException(status_code=400, detail="Promo code is expired or not yet valid")
        
    # Check max usage
    if promo["current_usage"] >= promo["max_usage"]:
        raise HTTPException(status_code=400, detail="Promo code usage limit reached")
        
    # Check day validity if check_in is provided
    if check_in_str:
        try:
            check_in = datetime.strptime(check_in_str, "%Y-%m-%d")
            valid_days = promo.get("valid_days", [])
            if valid_days:
                # 0=Mon, 6=Sun in Python; 0=Sun, 6=Sat in JS/Promo convention
                py_weekday = check_in.weekday()
                js_weekday = (py_weekday + 1) % 7
                
                if js_weekday not in valid_days:
                    raise HTTPException(status_code=400, detail="Promo code not valid for this check-in day")
        except ValueError:
            pass # Ignore invalid date format, just check code existence
            
    return {
        "valid": True,
        "code": promo["code"],
        "discount_type": promo["discount_type"],
        "discount_value": promo["discount_value"],
        "room_type_ids": promo.get("room_type_ids", []),
        "message": "Promo code applied!"
    }

# Admin routes
@router.get("/admin/reservations")
async def get_all_reservations(
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    user: dict = Depends(require_admin)
):
    query = {}
    if status:
        query["status"] = status
    if start_date:
        query["check_in"] = {"$gte": start_date}
    if end_date:
        query["check_out"] = {"$lte": end_date}
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reservations

@router.put("/admin/reservations/{reservation_id}/status")
async def update_reservation_status(reservation_id: str, status: str, request: Request, user: dict = Depends(require_admin)):
    valid_statuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    await log_activity(
        user=user,
        action="update",
        resource="reservations",
        resource_id=reservation_id,
        details={"status": status},
        ip_address=request.client.host if request.client else None
    )
        
    return {"message": "Status updated"}

@router.post("/admin/reservations/{reservation_id}/resend-email")
async def resend_reservation_email(reservation_id: str, request: Request, user: dict = Depends(require_admin)):
    """Resend reservation confirmation email to guest"""
    reservation = await db.reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    room = await db.room_types.find_one({"room_type_id": reservation["room_type_id"]}, {"_id": 0})
    if not room:
        room = {"name": reservation.get("room_type_name", "N/A")}
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Attempting to resend email for reservation {reservation_id} to {reservation['guest_email']}")
    
    try:
        success = await send_reservation_email(reservation, room)
        logger.info(f"Resend email result for {reservation_id}: {success}")
    except Exception as e:
        logger.error(f"Error resending email for {reservation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    await log_activity(
        user=user,
        action="resend_email",
        resource="reservations",
        resource_id=reservation_id,
        details={"success": success, "to_email": reservation["guest_email"]},
        ip_address=request.client.host if request.client else None
    )
    
    if success:
        return {"message": "Email sent successfully", "success": True}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

