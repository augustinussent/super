import uuid
from datetime import datetime, timezone
from database import db

async def log_activity(
    user: dict,
    action: str,
    resource: str,
    resource_id: str = None,
    details: dict = None,
    ip_address: str = None
):
    """
    Log an activity to the audit_logs collection.
    
    Args:
        user: Current user dict (from auth)
        action: Action performed (create, update, delete, login)
        resource: Resource type (rooms, users, reservations, promo, content, reviews, inventory)
        resource_id: ID of the affected resource
        details: Dictionary with change details (e.g., {"field": {"old": x, "new": y}})
        ip_address: Client IP address
    """
    log_doc = {
        "log_id": str(uuid.uuid4()),
        "user_id": user.get("user_id"),
        "user_name": user.get("name", user.get("email", "Unknown")),
        "user_role": user.get("role", "unknown"),
        "action": action,
        "resource": resource,
        "resource_id": resource_id or "",
        "details": details or {},
        "ip_address": ip_address or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.audit_logs.insert_one(log_doc)
    return log_doc


def get_changes(old_data: dict, new_data: dict, fields_to_track: list = None):
    """
    Compare old and new data and return a dict of changes.
    
    Args:
        old_data: Original data
        new_data: Updated data
        fields_to_track: List of field names to compare. If None, compare all.
    
    Returns:
        Dict of changes: {"field_name": {"old": old_value, "new": new_value}}
    """
    changes = {}
    
    if fields_to_track is None:
        fields_to_track = set(old_data.keys()) | set(new_data.keys())
    
    for field in fields_to_track:
        old_val = old_data.get(field)
        new_val = new_data.get(field)
        
        if old_val != new_val:
            changes[field] = {"old": old_val, "new": new_val}
    
    return changes
