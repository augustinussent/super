from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from services.auth import hash_password

router = APIRouter(tags=["init"])

@router.post("/init")
async def init_default_data():
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if admin:
        return {"message": "Data already initialized"}
    
    admin_user = {
        "user_id": str(uuid.uuid4()),
        "email": "admin@spencergreenhotel.com",
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
                "number": "6281130700206"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "content_id": str(uuid.uuid4()),
            "section": "footer",
            "page": "global",
            "content_type": "info",
            "content": {
                "address": "Jl. Raya Punten No.86, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia",
                "phone": "(0341) 597828",
                "email": "reservasi@spencergreenhotel.com",
                "tiktok": "https://tiktok.com/@spencergreenhotel",
                "instagram": "https://instagram.com/spencergreenhotel",
                "facebook": "https://facebook.com/spencergreenhotel86",
                "whatsapp": "6281130700206"
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
    
    return {"message": "Default data initialized", "admin_email": "admin@spencergreenhotel.com", "admin_password": "admin123"}
