from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone
import uuid

class ReservationCreate(BaseModel):
    guest_name: str
    guest_email: EmailStr
    guest_phone: str
    room_type_id: str
    check_in: str
    check_out: str
    guests: int
    rate_plan_id: str = ""
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
    rate_plan_id: str = ""
    rate_plan_name: str = "Standard Rate"
    special_requests: str = ""
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
