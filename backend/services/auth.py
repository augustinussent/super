import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

security = HTTPBearer(auto_error=False)

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

async def get_current_user_with_permissions(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user and fetch full user data including permissions from database"""
    from database import db
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        # Fetch full user from database to get permissions
        user_doc = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        return user_doc
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user_with_permissions)):
    """Allow access if user is admin/superadmin OR staff with any permission"""
    role = user.get("role")
    
    # Admin and superadmin always have access
    if role in ["admin", "superadmin"]:
        return user
    
    # Staff can access if they have at least one permission
    permissions = user.get("permissions", {})
    if any(permissions.values()):
        return user
    
    raise HTTPException(status_code=403, detail="Admin access required")

def require_permission(perm_key: str):
    """Factory function to create permission-specific dependency"""
    async def permission_checker(user: dict = Depends(get_current_user_with_permissions)):
        role = user.get("role")
        
        # Admin and superadmin have all permissions
        if role in ["admin", "superadmin"]:
            return user
        
        # Check specific permission for staff
        permissions = user.get("permissions", {})
        if permissions.get(perm_key, False):
            return user
        
        raise HTTPException(status_code=403, detail=f"Permission '{perm_key}' required")
    
    return permission_checker

async def require_super_admin(user: dict = Depends(get_current_user_with_permissions)):
    """Allow access ONLY if user is superadmin"""
    role = user.get("role")
    
    if role == "superadmin":
        return user
    
    raise HTTPException(status_code=403, detail="Super Admin access required")
