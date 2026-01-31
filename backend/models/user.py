from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserPermissions(BaseModel):
    dashboard: bool = True
    rooms: bool = False
    reservations: bool = False
    content: bool = False
    reviews: bool = False
    promo: bool = False
    users: bool = False
    gallery: bool = False
    email_config: bool = False

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "staff"
    permissions: Optional[UserPermissions] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    permissions: Optional[dict] = None
    created_at: str
