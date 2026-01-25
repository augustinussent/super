from fastapi import APIRouter, Request, Depends
from datetime import datetime, timezone
from database import db
from models.analytics import DailyStats
from services.auth import require_admin

router = APIRouter(tags=["analytics"])

@router.post("/analytics/track")
async def track_visit(request: Request, page: str = "/"):
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Simple unique visitor check (this is very basic, normally use cookies/IP)
    # Here we just increment total visits
    
    # Update daily stats
    # Upsert
    result = await db.daily_stats.update_one(
        {"date": today},
        {
            "$inc": {
                "total_visits": 1,
                f"page_views.{page.replace('.', '_')}": 1  # MongoDB keys can't contain dots
            },
            "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"status": "ok"}

@router.get("/admin/analytics")
async def get_analytics(days: int = 7, user: dict = Depends(require_admin)):
    # Get last N days
    cursor = db.daily_stats.find().sort("date", -1).limit(days)
    stats = await cursor.to_list(days)
    # Reverse to show chronological
    return stats[::-1]
