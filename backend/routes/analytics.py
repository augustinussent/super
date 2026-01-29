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
    cursor = db.daily_stats.find({}, {"_id": 0}).sort("date", -1).limit(days)
    stats = await cursor.to_list(days)
    # Reverse to show chronological
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
