from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class RoomType(BaseModel):
    room_type_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    base_price: float
    max_guests: int
    amenities: List[str] = []
    images: List[str] = []
    image_alts: List[str] = []
    video_url: str = ""
    is_active: bool = True
    display_order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RoomInventory(BaseModel):
    inventory_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_type_id: str
    date: str
    allotment: int
    rate: float
    is_closed: bool = False

class BulkUpdateRequest(BaseModel):
    room_type_id: str
    start_date: str
    end_date: str
    allotment: Optional[int] = None
    rate: Optional[float] = None
    is_closed: Optional[bool] = None
    days_of_week: Optional[List[int]] = None # 0=Mon, 6=Sun
