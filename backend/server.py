from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'spencer-green-hotel-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Spencer Green Hotel HMS API")

# Create routers
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "staff"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    created_at: str

class RoomType(BaseModel):
    room_type_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    base_price: float
    max_guests: int
    amenities: List[str] = []
    images: List[str] = []
    video_url: str = ""
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RoomInventory(BaseModel):
    inventory_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_type_id: str
    date: str
    allotment: int
    rate: float
    is_closed: bool = False

class ReservationCreate(BaseModel):
    guest_name: str
    guest_email: EmailStr
    guest_phone: str
    room_type_id: str
    check_in: str
    check_out: str
    guests: int
    special_requests: str = ""
    promo_code: str = ""

class Reservation(BaseModel):
    reservation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_code: str = Field(default_factory=lambda: f"SGH-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    guest_name: str
    guest_email: str
    guest_phone: str
    room_type_id: str
    room_type_name: str = ""
    check_in: str
    check_out: str
    guests: int
    nights: int = 0
    rate_per_night: float = 0
    total_amount: float = 0
    discount_amount: float = 0
    promo_code: str = ""
    special_requests: str = ""
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewCreate(BaseModel):
    guest_name: str
    guest_email: EmailStr
    rating: int
    comment: str
    reservation_id: str = ""

class Review(BaseModel):
    review_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guest_name: str
    guest_email: str
    rating: int
    comment: str
    reservation_id: str = ""
    is_visible: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PromoCode(BaseModel):
    promo_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str
    discount_value: float
    max_usage: int
    current_usage: int = 0
    room_type_ids: List[str] = []
    valid_from: str
    valid_until: str
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SiteContent(BaseModel):
    content_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section: str
    page: str
    content_type: str
    content: Dict[str, Any]
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BulkUpdateRequest(BaseModel):
    room_type_id: str
    start_date: str
    end_date: str
    allotment: Optional[int] = None
    rate: Optional[float] = None
    is_closed: Optional[bool] = None

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== EMAIL HELPERS ==============

async def send_reservation_email(reservation: dict, room_type: dict):
    whatsapp_number = await db.site_content.find_one({"section": "contact", "content_type": "whatsapp"}, {"_id": 0})
    wa_number = whatsapp_number.get("content", {}).get("number", "6281334480210") if whatsapp_number else "6281334480210"
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: #059669; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Spencer Green Hotel</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0;">Batu, East Java</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #059669;">Reservation Confirmation</h2>
            <p>Dear {reservation['guest_name']},</p>
            <p>Thank you for your reservation. Here are your booking details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f0fdf4;">
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Booking Code</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['booking_code']}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Room Type</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{room_type.get('name', 'N/A')}</td>
                </tr>
                <tr style="background: #f0fdf4;">
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Check-in</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['check_in']}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Check-out</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['check_out']}</td>
                </tr>
                <tr style="background: #f0fdf4;">
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Guests</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['guests']}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Total Amount</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold;">Rp {reservation['total_amount']:,.0f}</td>
                </tr>
            </table>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px 0;">Payment Instructions</h3>
                <p style="color: #78350f; margin: 0;">Please complete your payment via WhatsApp to confirm your reservation:</p>
                <a href="https://wa.me/{wa_number}?text=Hi,%20I%20want%20to%20complete%20payment%20for%20booking%20{reservation['booking_code']}" 
                   style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">
                    Contact via WhatsApp
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                If you have any questions, please don't hesitate to contact us.
            </p>
        </div>
        <div style="background: #064e3b; padding: 20px; text-align: center;">
            <p style="color: #d1fae5; margin: 0; font-size: 14px;">Spencer Green Hotel Batu</p>
            <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 12px;">Jl. Raya Selecta No. 1, Batu, East Java</p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [reservation['guest_email']],
            "subject": f"Reservation Confirmation - {reservation['booking_code']}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Reservation email sent to {reservation['guest_email']}")
    except Exception as e:
        logger.error(f"Failed to send reservation email: {str(e)}")

async def send_password_reset_email(email: str, token: str):
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Spencer Green Hotel</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #059669;">Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="{reset_link}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Reset Password
            </a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Password Reset - Spencer Green Hotel",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, current_user: dict = Depends(require_admin)):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "user_id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": user.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    del user_doc["password"]
    return user_doc

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["user_id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(email: EmailStr, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If email exists, reset link will be sent"}
    
    reset_token = str(uuid.uuid4())
    await db.password_resets.insert_one({
        "token": reset_token,
        "email": email,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    })
    
    background_tasks.add_task(send_password_reset_email, email, reset_token)
    return {"message": "If email exists, reset link will be sent"}

@api_router.post("/auth/reset-password")
async def reset_password(token: str, new_password: str):
    reset_doc = await db.password_resets.find_one({"token": token}, {"_id": 0})
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if datetime.fromisoformat(reset_doc["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"email": reset_doc["email"]},
        {"$set": {"password": hash_password(new_password)}}
    )
    await db.password_resets.delete_one({"token": token})
    return {"message": "Password reset successful"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

# ============== ROOM TYPES ROUTES ==============

@api_router.get("/rooms")
async def get_rooms():
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).to_list(100)
    return rooms

@api_router.get("/rooms/{room_type_id}")
async def get_room(room_type_id: str):
    room = await db.room_types.find_one({"room_type_id": room_type_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@api_router.post("/admin/rooms")
async def create_room(room: RoomType, user: dict = Depends(require_admin)):
    room_doc = room.model_dump()
    await db.room_types.insert_one(room_doc)
    return room_doc

@api_router.put("/admin/rooms/{room_type_id}")
async def update_room(room_type_id: str, room: dict, user: dict = Depends(require_admin)):
    room["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.room_types.update_one({"room_type_id": room_type_id}, {"$set": room})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room updated"}

@api_router.delete("/admin/rooms/{room_type_id}")
async def delete_room(room_type_id: str, user: dict = Depends(require_admin)):
    result = await db.room_types.update_one(
        {"room_type_id": room_type_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted"}

# ============== ROOM INVENTORY ROUTES ==============

@api_router.get("/inventory")
async def get_inventory(room_type_id: str = None, start_date: str = None, end_date: str = None):
    query = {}
    if room_type_id:
        query["room_type_id"] = room_type_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    inventory = await db.room_inventory.find(query, {"_id": 0}).to_list(1000)
    return inventory

@api_router.post("/admin/inventory")
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

@api_router.post("/admin/inventory/bulk-update")
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

# ============== AVAILABILITY & BOOKING ==============

@api_router.get("/availability")
async def check_availability(check_in: str, check_out: str):
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).to_list(100)
    available_rooms = []
    
    for room in rooms:
        inventory = await db.room_inventory.find({
            "room_type_id": room["room_type_id"],
            "date": {"$gte": check_in, "$lt": check_out}
        }, {"_id": 0}).to_list(100)
        
        min_allotment = room.get("base_price", 500000)
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

@api_router.post("/reservations")
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
    
    # Insert reservation and get the result without _id
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

@api_router.get("/reservations/check")
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

# ============== ADMIN RESERVATIONS ==============

@api_router.get("/admin/reservations")
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

@api_router.put("/admin/reservations/{reservation_id}/status")
async def update_reservation_status(reservation_id: str, status: str, user: dict = Depends(require_admin)):
    valid_statuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return {"message": "Status updated"}

# ============== REVIEWS ==============

@api_router.get("/reviews")
async def get_visible_reviews():
    reviews = await db.reviews.find({"is_visible": True}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return reviews

@api_router.post("/reviews")
async def create_review(review: ReviewCreate):
    review_doc = Review(
        guest_name=review.guest_name,
        guest_email=review.guest_email,
        rating=min(max(review.rating, 1), 5),
        comment=review.comment,
        reservation_id=review.reservation_id,
        is_visible=False
    ).model_dump()
    
    await db.reviews.insert_one(review_doc)
    return {"message": "Review submitted for approval"}

@api_router.get("/admin/reviews")
async def get_all_reviews(user: dict = Depends(require_admin)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.put("/admin/reviews/{review_id}/visibility")
async def toggle_review_visibility(review_id: str, is_visible: bool, user: dict = Depends(require_admin)):
    result = await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {"is_visible": is_visible}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review visibility updated"}

# ============== PROMO CODES ==============

@api_router.get("/admin/promo-codes")
async def get_promo_codes(user: dict = Depends(require_admin)):
    promos = await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return promos

@api_router.post("/admin/promo-codes")
async def create_promo_code(promo: PromoCode, user: dict = Depends(require_admin)):
    promo_doc = promo.model_dump()
    promo_doc["code"] = promo_doc["code"].upper()
    
    existing = await db.promo_codes.find_one({"code": promo_doc["code"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    await db.promo_codes.insert_one(promo_doc)
    return promo_doc

@api_router.put("/admin/promo-codes/{promo_id}")
async def update_promo_code(promo_id: str, promo: dict, user: dict = Depends(require_admin)):
    if "code" in promo:
        promo["code"] = promo["code"].upper()
    promo["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.promo_codes.update_one({"promo_id": promo_id}, {"$set": promo})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    return {"message": "Promo code updated"}

@api_router.delete("/admin/promo-codes/{promo_id}")
async def delete_promo_code(promo_id: str, user: dict = Depends(require_admin)):
    result = await db.promo_codes.delete_one({"promo_id": promo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    return {"message": "Promo code deleted"}

# ============== USERS MANAGEMENT ==============

@api_router.get("/admin/users")
async def get_users(user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return users

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: dict = Depends(require_admin)):
    if "password" in user_data:
        user_data["password"] = hash_password(user_data["password"])
    user_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": user_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ============== CMS / SITE CONTENT ==============

@api_router.get("/content")
async def get_all_content():
    content = await db.site_content.find({}, {"_id": 0}).to_list(500)
    return content

@api_router.get("/content/{page}")
async def get_page_content(page: str):
    content = await db.site_content.find({"page": page}, {"_id": 0}).to_list(100)
    return content

@api_router.post("/admin/content")
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
    
    return content_doc

@api_router.put("/admin/content/{content_id}")
async def update_content(content_id: str, content: dict, user: dict = Depends(require_admin)):
    content["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.site_content.update_one({"content_id": content_id}, {"$set": content})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"message": "Content updated"}

# ============== DASHBOARD ==============

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(user: dict = Depends(require_admin)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month_start = datetime.now(timezone.utc).replace(day=1).strftime("%Y-%m-%d")
    
    rooms = await db.room_types.find({"is_active": True}, {"_id": 0}).to_list(100)
    total_rooms = sum(r.get("base_price", 0) for r in rooms)
    
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
    
    return {
        "occupied_rooms": today_occupied,
        "available_rooms": available_today,
        "monthly_revenue": month_revenue,
        "total_room_types": len(rooms),
        "pending_reviews": pending_reviews,
        "recent_reservations": recent_reservations
    }

# ============== INIT DEFAULT DATA ==============

@api_router.post("/init")
async def init_default_data():
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if admin:
        return {"message": "Data already initialized"}
    
    admin_user = {
        "user_id": str(uuid.uuid4()),
        "email": "admin@spencergreen.com",
        "password": hash_password("admin123"),
        "name": "Admin",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    room_types = [
        {
            "room_type_id": str(uuid.uuid4()),
            "name": "Superior Room",
            "description": "Kamar nyaman dengan pemandangan taman yang menenangkan. Dilengkapi dengan fasilitas modern dan desain interior yang elegan.",
            "base_price": 850000,
            "max_guests": 2,
            "amenities": ["AC", "WiFi", "TV", "Mini Bar", "Safe Box"],
            "images": ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"],
            "video_url": "",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "room_type_id": str(uuid.uuid4()),
            "name": "Deluxe Room",
            "description": "Kamar luas dengan balkon pribadi menghadap pegunungan. Nikmati kenyamanan premium dengan fasilitas lengkap.",
            "base_price": 1200000,
            "max_guests": 2,
            "amenities": ["AC", "WiFi", "TV", "Mini Bar", "Safe Box", "Balcony", "Bathtub"],
            "images": ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800"],
            "video_url": "",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "room_type_id": str(uuid.uuid4()),
            "name": "Executive Room",
            "description": "Kamar eksklusif dengan ruang tamu terpisah dan pemandangan spektakuler. Sempurna untuk tamu bisnis atau liburan mewah.",
            "base_price": 1800000,
            "max_guests": 3,
            "amenities": ["AC", "WiFi", "TV", "Mini Bar", "Safe Box", "Balcony", "Bathtub", "Living Room", "Work Desk"],
            "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"],
            "video_url": "",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.room_types.insert_many(room_types)
    
    today = datetime.now(timezone.utc)
    inventory_docs = []
    for room in room_types:
        for i in range(60):
            date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            inventory_docs.append({
                "inventory_id": str(uuid.uuid4()),
                "room_type_id": room["room_type_id"],
                "date": date,
                "allotment": 5,
                "rate": room["base_price"],
                "is_closed": False
            })
    await db.room_inventory.insert_many(inventory_docs)
    
    content_docs = [
        {
            "content_id": str(uuid.uuid4()),
            "section": "hero",
            "page": "home",
            "content_type": "hero",
            "content": {
                "title": "Spencer Green Hotel",
                "subtitle": "Experience Luxury in the Heart of Batu",
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920",
                "cta_text": "Book Now"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "content_id": str(uuid.uuid4()),
            "section": "contact",
            "page": "global",
            "content_type": "whatsapp",
            "content": {
                "number": "6281334480210"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "content_id": str(uuid.uuid4()),
            "section": "footer",
            "page": "global",
            "content_type": "info",
            "content": {
                "address": "Jl. Raya Selecta No. 1, Batu, East Java, Indonesia",
                "phone": "+62 813 3448 0210",
                "email": "info@spencergreen.com",
                "tiktok": "https://tiktok.com/@spencergreenhotel",
                "instagram": "https://instagram.com/spencergreenhotel",
                "facebook": "https://facebook.com/spencergreenhotel",
                "whatsapp": "6281334480210"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "content_id": str(uuid.uuid4()),
            "section": "promo_banner",
            "page": "home",
            "content_type": "banner",
            "content": {
                "title": "Special Weekend Offer",
                "description": "Get 20% off for weekend stays. Use code: WEEKEND20",
                "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
                "is_active": True
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.site_content.insert_many(content_docs)
    
    gallery_images = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1080",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1080",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1080",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1080",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1080"
    ]
    gallery_docs = []
    for i, img in enumerate(gallery_images):
        gallery_docs.append({
            "content_id": str(uuid.uuid4()),
            "section": f"gallery_item_{i}",
            "page": "gallery",
            "content_type": "image",
            "content": {
                "url": img,
                "caption": f"Gallery Image {i+1}",
                "order": i
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    await db.site_content.insert_many(gallery_docs)
    
    return {"message": "Default data initialized", "admin_email": "admin@spencergreen.com", "admin_password": "admin123"}

# ============== SETUP ==============

@api_router.get("/")
async def root():
    return {"message": "Spencer Green Hotel HMS API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
