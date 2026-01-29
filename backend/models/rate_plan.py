from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid

class RatePlan(BaseModel):
    rate_plan_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_type_id: Optional[str] = None # If None, applies to all rooms (unless logic dictates otherwise)
    name: str
    description: str = ""
    price_modifier_type: Literal["percent", "absolute_add", "absolute_total"]
    price_modifier_val: float
    is_active: bool = True
    conditions: List[str] = [] # e.g. ["non-refundable", "breakfast-included"]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RatePlanCreate(BaseModel):
    room_type_id: Optional[str] = None
    name: str
    description: str = ""
    price_modifier_type: Literal["percent", "absolute_add", "absolute_total"]
    price_modifier_val: float
    is_active: bool = True
    conditions: List[str] = []
