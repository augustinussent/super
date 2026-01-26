from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import EmailStr
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from models.user import UserCreate, UserLogin, UserResponse
from services.auth import hash_password, verify_password, create_token, get_current_user, require_admin
from services.email import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
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

@router.post("/login")
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
            "role": user["role"],
            "permissions": user.get("permissions", {})
        }
    }

@router.post("/forgot-password")
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

@router.post("/reset-password")
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

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc
