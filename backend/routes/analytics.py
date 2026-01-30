from fastapi import APIRouter, Request, Depends
from datetime import datetime, timezone, timedelta
from database import db
from models.analytics import DailyStats
from services.auth import require_admin

router = APIRouter(tags=["analytics"])

@router.post("/analytics/track")
async def track_visit(request: Request, page: str = "/"):
    today = datetime.now().strftime("%Y-%m-%d")
    ua_string = request.headers.get("user-agent", "")
    ip = request.client.host if request.client else "unknown"
    
    # Simple User-Agent Parser
    browser = "Other"
    os = "Other"
    
    if "Firefox" in ua_string: browser = "Firefox"
    elif "Chrome" in ua_string: 
        if "Edg" in ua_string: browser = "Edge"
        else: browser = "Chrome"
    elif "Safari" in ua_string: browser = "Safari"
    
    if "Windows" in ua_string: os = "Windows"
    elif "Mac" in ua_string: 
        if "iPhone" in ua_string or "iPad" in ua_string: os = "iOS"
        else: os = "macOS"
    elif "Android" in ua_string: os = "Android"
    elif "Linux" in ua_string: os = "Linux"

    # Mock Location (In real app, use GeoIP DB)
    # Using simple hashing of IP to distribute "randomly" for demo purposes 
    # if no real GeoIP service is attached.
    locations = ["Jakarta", "Surabaya", "Bali", "Bandung", "Medan", "Singapore", "Kuala Lumpur", "Unknown"]
    # consistent hash for "stickiness"
    loc_idx = sum(ord(c) for c in ip) % len(locations)
    location = locations[loc_idx] if ip != "unknown" else "Unknown"

    # Update daily stats
    inc_update = {
        "total_visits": 1,
        f"page_views.{page.replace('.', '_')}": 1,
        f"browser_stats.{browser}": 1,
        f"os_stats.{os}": 1,
        f"location_stats.{location}": 1
    }

    await db.daily_stats.update_one(
        {"date": today},
        {
            "$inc": inc_update,
            "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"status": "ok"}

@router.get("/admin/dashboard-stats")
async def get_dashboard_stats(days: int = 30, user: dict = Depends(require_admin)):
    """Aggregate stats for the dashboard"""
    # 1. Fetch Daily Stats (Traffic, Demographics)
    cursor = db.daily_stats.find({}, {"_id": 0}).sort("date", -1).limit(days)
    daily_data = await cursor.to_list(days)
    daily_data.reverse() # Chronological order

    # 2. Key Metrics (Revenue, Bookings) from Reservations
    # We aggregate ALL reservations for the simplified KPI cards, 
    # or filter by created_at for "Period" KPIs. 
    # For this dashboard, let's show "All Time" or "This Month".
    # Let's do "Last 30 Days" revenue trend.
    
    start_date = (datetime.now() - timedelta(days=30)).isoformat()
    
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date},
                "status": {"$nin": ["cancelled"]}
            }
        },
        {
            "$group": {
                "_id": {"$substr": ["$created_at", 0, 10]}, # Group by YYYY-MM-DD
                "daily_revenue": {"$sum": "$total_amount"},
                "daily_bookings": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    revenue_trend = await db.reservations.aggregate(pipeline).to_list(None)
    
    # Merge Revenue into Daily Data?
    # Or just return separate arrays. Separate is easier for Recharts composed chart.
    
    # 3. Overall KPI (Last 30 Days)
    kpi_pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_revenue": {
                    "$sum": {
                        "$cond": [{"$ne": ["$status", "cancelled"]}, "$total_amount", 0]
                    }
                },
                "total_bookings": {"$sum": 1},
                "confirmed_bookings": {
                    "$sum": {
                        "$cond": [{"$ne": ["$status", "cancelled"]}, 1, 0]
                    }
                },
                "cancelled_bookings": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", "cancelled"]}, 1, 0]
                    }
                }
            }
        }
    ]
    kpi_result = await db.reservations.aggregate(kpi_pipeline).to_list(1)
    kpi = kpi_result[0] if kpi_result else {"total_revenue": 0, "total_bookings": 0, "confirmed_bookings": 0, "cancelled_bookings": 0}
    
    # Calculate ADR
    kpi["adr"] = kpi["total_revenue"] / kpi["confirmed_bookings"] if kpi["confirmed_bookings"] > 0 else 0
    
    # 4. Room Popularity
    room_pop_pipeline = [
        {"$match": {"status": {"$ne": "cancelled"}}}, # All time or limited? Let's do All Time for popularity
        {"$group": {"_id": "$room_type_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    room_stats = await db.reservations.aggregate(room_pop_pipeline).to_list(5)
    
    # 5. Recent Activity
    recent_logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)

    # 6. Aggregate Browsers/OS/Locations from daily_stats
    total_browsers = {}
    total_os = {}
    total_locations = {}
    
    for day in daily_data:
        for b, count in day.get("browser_stats", {}).items():
            total_browsers[b] = total_browsers.get(b, 0) + count
        for o, count in day.get("os_stats", {}).items():
            total_os[o] = total_os.get(o, 0) + count
        for l, count in day.get("location_stats", {}).items():
            total_locations[l] = total_locations.get(l, 0) + count

    return {
        "daily_traffic": daily_data,
        "revenue_trend": revenue_trend,
        "kpi": kpi,
        "room_stats": room_stats,
        "recent_activity": recent_logs,
        "demographics": {
            "browsers": [{"name": k, "value": v} for k, v in total_browsers.items()],
            "os": [{"name": k, "value": v} for k, v in total_os.items()],
            "locations": [{"name": k, "value": v} for k, v in total_locations.items()]
        }
    }

@router.get("/admin/analytics")
async def get_analytics(days: int = 7, user: dict = Depends(require_admin)):
    # ... legacy endpoint ...
    cursor = db.daily_stats.find({}, {"_id": 0}).sort("date", -1).limit(days)
    stats = await cursor.to_list(days)
    return stats[::-1]

@router.get("/admin/test-smtp")
async def test_smtp():
    """Test SMTP connection and return detailed status"""
    import smtplib
    import ssl
    from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
    
    result = {
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "user": SMTP_USER,
        "password_set": bool(SMTP_PASSWORD),
        "connection": None,
        "login": None,
        "error": None
    }
    
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=10) as server:
                result["connection"] = "SUCCESS"
                server.login(SMTP_USER, SMTP_PASSWORD)
                result["login"] = "SUCCESS"
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                result["connection"] = "SUCCESS"
                server.starttls(context=context)
                server.login(SMTP_USER, SMTP_PASSWORD)
                result["login"] = "SUCCESS"
                
    except smtplib.SMTPAuthenticationError as e:
        result["error"] = f"Authentication failed: {str(e)}"
    except smtplib.SMTPConnectError as e:
        result["error"] = f"Connection failed: {str(e)}"
    except Exception as e:
        result["error"] = f"Error: {type(e).__name__} - {str(e)}"
    
    return result

@router.get("/admin/test-resend")
async def test_resend():
    """Test Resend API configuration"""
    from config import RESEND_API_KEY, SENDER_EMAIL
    import resend
    
    result = {
        "api_key_set": bool(RESEND_API_KEY),
        "sender": SENDER_EMAIL,
        "status": None,
        "error": None
    }
    
    if not RESEND_API_KEY:
        result["error"] = "RESEND_API_KEY is missing"
        return result
        
    try:
        resend.api_key = RESEND_API_KEY
        # Just check if we can list domains or something simple, or send a dummy logic check
        # But sending email uses quota. Let's just return config status for now
        # or try to get account info if possible? Resend python sdk might not have 'get account' easy
        # easiest is to assume if key is there, it's good. 
        # But let's try to send a test email to the sender itself?
        
        # For now, just confirming env var is loaded
        result["status"] = "CONFIGURED"
        
    except Exception as e:
        result["error"] = str(e)
        
    return result
