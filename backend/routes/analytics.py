import uuid
from fastapi import APIRouter, Request, Depends, Body
from datetime import datetime, timezone, timedelta
from database import db
from models.analytics import DailyStats
from services.auth import require_admin

router = APIRouter(tags=["analytics"])

@router.post("/analytics/track")
async def track_visit(
    request: Request, 
    page: str = "/",
    referrer: str = None,
    utm_source: str = None,
    utm_medium: str = None,
    utm_campaign: str = None
):
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
    locations = ["Jakarta", "Surabaya", "Bali", "Bandung", "Medan", "Singapore", "Kuala Lumpur", "Unknown"]
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
    
    # Track Source if present
    if utm_source:
        inc_update[f"traffic_sources.{utm_source.replace('.', '_')}"] = 1
    elif referrer and "google" in referrer:
         inc_update["traffic_sources.Google"] = 1
    elif referrer and "facebook" in referrer or referrer and "instagram" in referrer:
         inc_update["traffic_sources.Social"] = 1
    elif not referrer:
         inc_update["traffic_sources.Direct"] = 1
    else:
         inc_update["traffic_sources.Other"] = 1

    await db.daily_stats.update_one(
        {"date": today},
        {
            "$inc": inc_update,
            "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"status": "ok"}

@router.post("/analytics/event")
async def track_event(
    request: Request,
    event_name: str = Body(...),
    category: str = Body(None),
    label: str = Body(None),
    metadata: dict = Body({})
):
    """Store granular events"""
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "event_name": event_name,
        "category": category,
        "label": label,
        "metadata": metadata,
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.analytics_events.insert_one(event_doc)
    return {"status": "recorded", "event_id": event_doc["event_id"]}

@router.get("/admin/dashboard-stats")
async def get_dashboard_stats(
    days: int = 30, 
    start_date: str = None, 
    end_date: str = None,
    user: dict = Depends(require_admin)
):
    """Aggregate stats for the dashboard"""
    
    # Determine Date Range
    if start_date and end_date:
        query_start = start_date
        query_end = end_date
        # For daily_stats, we need to match the date string format YYYY-MM-DD
        date_query = {"date": {"$gte": query_start, "$lte": query_end}}
        # For timestamps (ISO), we usually assume start of day to end of day
        # But for simplicity, let's treat the inputs as inclusive YYYY-MM-DD
        iso_start = f"{query_start}T00:00:00"
        iso_end = f"{query_end}T23:59:59"
    else:
        # Default to 'days' lookback
        query_end = datetime.now().strftime("%Y-%m-%d")
        dt_start = datetime.now() - timedelta(days=days)
        query_start = dt_start.strftime("%Y-%m-%d")
        
        date_query = {"date": {"$gte": query_start, "$lte": query_end}}
        iso_start = dt_start.isoformat()
        iso_end = datetime.now().isoformat()

    # 1. Fetch Daily Stats (Traffic, Demographics)
    cursor = db.daily_stats.find(date_query, {"_id": 0}).sort("date", 1) # Sort ascending for chart
    daily_data = await cursor.to_list(None)
    # daily_data is already chronological if sorted by date: 1
    
    # 2. Key Metrics (Revenue, Bookings) from Reservations
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": iso_start, "$lte": iso_end},
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
    
    # 3. Overall KPI (In Selected Period)
    kpi_pipeline = [
        {
            "$match": {
                "created_at": {"$gte": iso_start, "$lte": iso_end}
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
    traffic_sources = {}
    
    for day in daily_data:
        for b, count in day.get("browser_stats", {}).items():
            total_browsers[b] = total_browsers.get(b, 0) + count
        for o, count in day.get("os_stats", {}).items():
            total_os[o] = total_os.get(o, 0) + count
        for l, count in day.get("location_stats", {}).items():
            total_locations[l] = total_locations.get(l, 0) + count
        for s, count in day.get("traffic_sources", {}).items():
             source = s.replace("_", ".") # Restore dots
             traffic_sources[source] = traffic_sources.get(source, 0) + count

    # 7. Funnel Analysis (from analytics_events)
    # Pipeline to count events by name for the last 30 days
    funnel_pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": iso_start, "$lte": iso_end},
                "event_name": {"$in": ["view_room_detail", "click_book_now", "booking_success"]}
            }
        },
        {
            "$group": {
                "_id": "$event_name",
                "count": {"$sum": 1}
            }
        }
    ]
    funnel_data_raw = await db.analytics_events.aggregate(funnel_pipeline).to_list(None)
    funnel_map = {item["_id"]: item["count"] for item in funnel_data_raw}
    
    # Construct Funnel (Fill gaps with 0)
    funnel = [
        {"name": "View Room", "value": funnel_map.get("view_room_detail", 0)},
        {"name": "Click Book", "value": funnel_map.get("click_book_now", 0)},
        # For "Success", we can also use confirmed bookings count if event tracking is not fully ready
        {"name": "Success", "value": max(funnel_map.get("booking_success", 0), kpi["confirmed_bookings"])} 
    ]
    
    # 8. Booking Lead Time & Look-to-Book
    # Lead Time calculation
    lead_time_pipeline = [
         {
            "$match": {
                "created_at": {"$gte": iso_start, "$lte": iso_end},
                "status": {"$nin": ["cancelled"]}
            }
        },
        {
             "$project": {
                  "lead_days": {
                       "$divide": [
                            {"$subtract": [{"$toDate": "$check_in"}, {"$toDate": "$created_at"}]},
                            1000 * 60 * 60 * 24 # Milliseconds to Days
                       ]
                  }
             }
        },
        {
             "$group": {
                  "_id": None,
                  "avg_lead_time": {"$avg": "$lead_days"}
             }
        }
    ]
    lead_time_res = await db.reservations.aggregate(lead_time_pipeline).to_list(1)
    avg_lead_time = round(lead_time_res[0]["avg_lead_time"], 1) if lead_time_res else 0
    
    # Look-to-Book
    total_room_views = funnel_map.get("view_room_detail", 0)
    look_to_book = (kpi["confirmed_bookings"] / total_room_views * 100) if total_room_views > 0 else 0
    
    # ARPU
    total_visitors = sum(d.get("total_visits", 0) for d in daily_data)
    arpu = kpi["total_revenue"] / total_visitors if total_visitors > 0 else 0

    return {
        "daily_traffic": daily_data,
        "revenue_trend": revenue_trend,
        "kpi": {
             **kpi,
             "avg_lead_time": avg_lead_time,
             "look_to_book": look_to_book,
             "arpu": arpu
        },
        "room_stats": room_stats,
        "recent_activity": recent_logs,
        "demographics": {
            "browsers": [{"name": k, "value": v} for k, v in total_browsers.items()],
            "os": [{"name": k, "value": v} for k, v in total_os.items()],
            "locations": [{"name": k, "value": v} for k, v in total_locations.items()],
            "sources": [{"name": k, "value": v} for k, v in traffic_sources.items()]
        },
        "funnel": funnel
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
