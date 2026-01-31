import asyncio
import logging
import smtplib
import ssl
import resend
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SENDER_EMAIL, FRONTEND_URL, RESEND_API_KEY
from database import db

logger = logging.getLogger(__name__)

# Default Indonesian Template
DEFAULT_EMAIL_TEMPLATE = {
    "subject_template": "Konfirmasi Reservasi - {booking_code}",
    "header_text_top": "SPENCER GREEN HOTEL",
    "header_text_bottom": "Batu, Jawa Timur",
    "greeting_template": "Hai {guest_name}!",
    "intro_text": "Terima kasih telah memilih Spencer Green Hotel. Kami berkomitmen untuk memberikan pengalaman menginap yang nyaman bagi Anda.",
    "labels": {
        "reservation_number": "NOMOR RESERVASI",
        "status": "STATUS",
        "check_in": "CHECK-IN",
        "check_out": "CHECK-OUT",
        "guests": "TAMU",
        "stay": "DURASI",
        "reservation_under": "PEMESAN",
        "contact": "KONTAK",
        "room_details": "Detail Kamar",
        "room_type": "Tipe Kamar:",
        "rate_plan": "Paket:",
        "special_req": "Permintaan Khusus:",
        "description": "Deskripsi",
        "total": "Total",
        "room_charge": "Biaya Kamar ({nights} malam)",
        "total_amount": "Total Tagihan",
        "payment_info": "Silakan transfer pembayaran ke:",
        "bank": "Bank:",
        "account": "No. Rekening:",
        "holder": "Atas Nama:",
        "amount": "Nominal:",
        "important_notes": "Catatan Penting:",
        "cancellation_policy": "Kebijakan Pembatalan",
        "website": "Website"
    },
    "payment_details": {
        "bank_name": "BCA (Bank Central Asia)",
        "account_number": "788-095-1909",
        "account_holder": "PT. SPENCER GREEN",
        "show": True
    },
    "important_notes_list": [
        "Pembayaran harus diselesaikan dalam waktu 24 jam.",
        "Mohon kirimkan bukti transfer melalui WhatsApp atau Email.",
        "Non-refundable kecuali dinyatakan lain."
    ],
    "cancellation_policy_list": [
        "Harga total dibayarkan saat pemesanan.",
        "Ketidakhadiran (No-Show) tidak dapat dikembalikan."
    ],
    "footer_address": "Jl. Raya Punten No.86, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia",
    "show_payment": True,
    "show_policy": True
}

async def send_email_resend(to_email: str, subject: str, html_content: str):
    """
    Send email via Resend API (recommended for Render)
    """
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not set")
        raise Exception("RESEND_API_KEY not set")
    
    # Allow exceptions to bubble up so we can see the real error (e.g. domain validation)
    resend.api_key = RESEND_API_KEY
    
    params = {
        "from": f"Spencer Green Hotel <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }
    
    # Run in thread since resend.Emails.send is blocking
    def send():
        return resend.Emails.send(params)
    
    result = await asyncio.to_thread(send)
    logger.info(f"Email sent successfully via Resend to {to_email}, id: {result.get('id')}")
    return True

async def send_email_smtp(to_email: str, subject: str, html_content: str):
    """
    Helper function to send email via SMTP (SSL/TLS) - Fallback
    """
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SENDER_EMAIL
    message["To"] = to_email

    # Turn these into plain/html MIMEText objects
    part1 = MIMEText("Please enable HTML to view this email.", "plain")
    part2 = MIMEText(html_content, "html")

    # Add HTML/plain-text parts to MIMEMultipart message
    # The email client will try to render the last part first
    message.attach(part1)
    message.attach(part2)

    try:
        # Create a secure SSL context but disable strict verification
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        # Run SMTP operations in a thread since they are blocking
        def send():
            if SMTP_PORT == 465:
                # SSL Connection
                with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SENDER_EMAIL, to_email, message.as_string())
            else:
                # TLS Connection (usually port 587)
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls(context=context)
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SENDER_EMAIL, to_email, message.as_string())

        await asyncio.to_thread(send)
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email via SMTP: {str(e)}")
        return False

async def send_email(to_email: str, subject: str, html_content: str):
    """
    Main email sending function - tries Resend first.
    If RESEND_API_KEY is present, we rely on it and DO NOT fallback to SMTP
    because SMTP on Render hangs (firewall) causing timeouts.
    """
    if RESEND_API_KEY:
        return await send_email_resend(to_email, subject, html_content)
    
    # Only use SMTP if Resend is not configured
    return await send_email_smtp(to_email, subject, html_content)

async def send_reservation_email(reservation: dict, room_type: dict, is_resend: bool = False) -> bool:
    """
    Send reservation confirmation email and log the result to database.
    Returns True if email was sent successfully, False otherwise.
    """
    from datetime import datetime, timezone
    
    # --- FETCH CONFIGURATION ---
    # Try to get dynamic config from DB, fallback to DEFAULT
    db_config = await db.site_content.find_one({"page": "email", "section": "reservation_conf"}, {"_id": 0})
    
    if db_config and "content" in db_config:
        config = db_config["content"]
        # Merge with default to ensure all keys exist (deep merge simplified)
        final_config = DEFAULT_EMAIL_TEMPLATE.copy()
        
        # Merge top-level keys
        for key, value in config.items():
            if key in ["labels", "payment_details"]:
                if key in final_config and isinstance(final_config[key], dict):
                    final_config[key] = {**final_config[key], **value}
                else:
                    final_config[key] = value
            else:
                final_config[key] = value
        
        config = final_config
    else:
        config = DEFAULT_EMAIL_TEMPLATE

    labels = config["labels"]
    
    # --- HELPER FUNCTIONS ---
    def format_idr(amount):
        return f"{int(amount):,}".replace(",", ".") + " IDR"

    total_formatted = format_idr(reservation.get('total_amount', 0))
    nights = reservation.get('nights', 1)
    rate_per_night = reservation.get('rate_per_night', 0)
    room_total_formatted = format_idr(rate_per_night * nights)
    
    # Date formatting
    try:
        check_in_dt = datetime.strptime(reservation['check_in'], "%Y-%m-%d")
        check_out_dt = datetime.strptime(reservation['check_out'], "%Y-%m-%d")
        # Indonesian format: 31 Jan 2026
        # Start simple map for months if locale not efficient
        months = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agust", "Sep", "Okt", "Nov", "Des"]
        
        check_in_str = f"{check_in_dt.day} {months[check_in_dt.month]} {check_in_dt.year}"
        check_out_str = f"{check_out_dt.day} {months[check_out_dt.month]} {check_out_dt.year}"
    except:
        check_in_str = reservation['check_in']
        check_out_str = reservation['check_out']

    # Logo
    logo_html = '<img src="https://placehold.co/200x80/059669/ffffff?text=Spencer+Green+Hotel" alt="Spencer Green Hotel" style="max-width: 200px; height: auto;">'

    subject_prefix = "[RESENT] " if is_resend else ""
    
    resend_banner = ""
    if is_resend:
        resend_banner = """
        <div style="background-color: #fff7ed; color: #9a3412; padding: 12px; border: 1px solid #ffedd5; text-align: center; margin-bottom: 24px; font-weight: 600;">
            <strong>Pemberitahuan:</strong> Ini adalah salinan ulang konfirmasi reservasi Anda.
        </div>
        """

    # --- LIST BUILDERS ---
    # Payment Info
    payment_section = ""
    if config.get("show_payment", True):
        pay = config["payment_details"]
        if pay.get("show", True):
            payment_section = f"""
            <div class="payment-info">{labels['payment_info']}</div>
            <div class="payment-details">
                <p style="margin:0; line-height:1.6;">
                    <strong>{labels['bank']}</strong> {pay['bank_name']}<br>
                    <strong>{labels['account']}</strong> {pay['account_number']}<br>
                    <strong>{labels['holder']}</strong> {pay['account_holder']}<br>
                    <strong>{labels['amount']}</strong> <span style="font-size:18px; font-weight:bold; color:#059669;">{total_formatted}</span>
                </p>
            </div>
            """

    # Notes List
    notes_list_items = "".join([f"<li>{item}</li>" for item in config["important_notes_list"]])
    important_notes_section = f"""
    <div class="important-notes">
        <strong>{labels['important_notes']}</strong>
        <ul style="margin:0; padding-left:20px; color:#92400e; font-size:14px;">
            {notes_list_items}
        </ul>
    </div>
    """

    # Policy List
    policy_list_items = "".join([f"<li>{item}</li>" for item in config["cancellation_policy_list"]])
    policy_section = ""
    if config.get("show_policy", True):
        policy_section = f"""
        <div style="margin-top: 32px;">
            <h3 style="font-size:18px; margin-bottom:12px;">{labels['cancellation_policy']}</h3>
            <div class="box" style="font-size:14px; color:#4b5563;">
                <ul style="padding-left:20px; margin:0;">
                    {policy_list_items}
                </ul>
            </div>
        </div>
        """

    # --- HTML ASSEMBLY ---
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservation Confirmation</title>
        <style>
            body {{ font-family: 'Nunito', 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }}
            .container {{ max-width: 640px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ background-color: #059669; padding: 16px 24px; color: white; display: flex; align-items: center; justify-content: space-between; }}
            .hero-image {{ width: 100%; height: auto; display: block; }}
            .content {{ padding: 24px; }}
            .greeting {{ margin-top: 24px; margin-bottom: 24px; color: #374151; line-height: 1.6; }}
            .grid-table {{ width: 100%; border-spacing: 0; margin-top: 24px; }}
            .grid-td {{ padding: 16px; border-top: 1px solid #e5e7eb; vertical-align: top; width: 50%; }}
            .grid-label {{ color: #9ca3af; text-transform: uppercase; font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px; }}
            .grid-value {{ color: #111827; font-size: 18px; font-weight: 700; }}
            .grid-value-lg {{ font-size: 24px; }}
            .section-title {{ font-size: 20px; font-weight: 700; color: #111827; margin-top: 40px; margin-bottom: 16px; }}
            .box, .payment-details {{ border: 1px solid #e5e7eb; padding: 16px; border-radius: 4px; }}
            .room-details {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            .room-details td {{ padding: 6px 0; font-size: 14px; color: #374151; vertical-align: top; }}
            .room-label {{ font-weight: 700; width: 120px; }}
            .price-table {{ width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #e5e7eb; }}
            .price-table th {{ background-color: #f9fafb; padding: 8px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #374151; }}
            .price-table th:first-child {{ text-align: left; }}
            .price-table td {{ padding: 8px 12px; text-align: right; font-size: 14px; color: #374151; border-top: 1px solid #e5e7eb; }}
            .price-table td:first-child {{ text-align: left; }}
            .payment-info {{ background-color: #059669; color: white; padding: 16px; margin-top: 32px; font-size: 18px; font-weight: 600; }}
            .payment-details {{ border-color: #059669; background-color: #ecfdf5; }}
            .important-notes {{ background-color: #fffbeb; border: 1px solid #fcd34d; padding: 16px; margin-top: 24px; border-radius: 4px; }}
            .footer {{ background-color: #059669; color: white; padding: 32px 24px; margin-top: 40px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                {logo_html}
                <div style="text-align: right;">
                    <span style="display: block; font-size: 12px;">{config['header_text_top']}</span>
                    <span style="display: block; font-size: 10px; opacity: 0.8;">{config['header_text_bottom']}</span>
                </div>
            </div>
            
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?fit=crop&w=1200&q=80" alt="Hotel" class="hero-image" style="background-color: #e5e7eb; min-height: 200px;">
            
            <div class="content">
                {resend_banner}
                
                <div class="greeting">
                    <strong>{config['greeting_template'].format(guest_name=reservation['guest_name'])}</strong>
                    <p>{config['intro_text']}</p>
                </div>

                <table class="grid-table">
                    <tr>
                        <td class="grid-td" style="border-top: none;">
                            <span class="grid-label">{labels['reservation_number']}</span>
                            <span class="grid-value grid-value-lg" style="color: #059669;">{reservation['booking_code']}</span>
                        </td>
                        <td class="grid-td" style="border-top: none; text-align: right;">
                            <span class="grid-label">{labels['status']}</span>
                            <span class="grid-value" style="text-transform: capitalize;">{reservation['status'].replace('_', ' ')}</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="grid-td">
                            <span class="grid-label">{labels['check_in']}</span>
                            <span class="grid-value grid-value-lg">{check_in_str}</span>
                            <br><small style="color: #6b7280;">14:00</small>
                        </td>
                        <td class="grid-td" style="border-left: 1px solid #e5e7eb;">
                            <span class="grid-label">{labels['check_out']}</span>
                            <span class="grid-value grid-value-lg">{check_out_str}</span>
                            <br><small style="color: #6b7280;">12:00</small>
                        </td>
                    </tr>
                    <tr>
                        <td class="grid-td">
                            <span class="grid-label">{labels['guests']}</span>
                            <span class="grid-value grid-value-lg">{reservation['guests']} Orang</span>
                        </td>
                        <td class="grid-td" style="border-left: 1px solid #e5e7eb;">
                            <span class="grid-label">{labels['stay']}</span>
                            <span class="grid-value grid-value-lg">{reservation['nights']} Malam</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="grid-td">
                            <span class="grid-label">{labels['reservation_under']}</span>
                            <span class="grid-value" style="font-size: 16px;">{reservation['guest_name']}</span>
                        </td>
                        <td class="grid-td" style="border-left: 1px solid #e5e7eb;">
                            <span class="grid-label">{labels['contact']}</span>
                            <div style="font-size: 14px;">
                                {reservation.get('guest_phone', '-')}<br>
                                <a href="mailto:{reservation['guest_email']}" style="color: #059669;">{reservation['guest_email']}</a>
                            </div>
                        </td>
                    </tr>
                </table>

                <div class="section-title">{labels['room_details']}</div>
                <div class="box">
                    <div style="background-color: #f3f4f6; padding: 8px; margin-bottom: 12px; font-weight: 700;">Room 1</div>
                    <table class="room-details">
                        <tr><td class="room-label">{labels['room_type']}</td><td>{reservation['room_type_name']}</td></tr>
                        <tr><td class="room-label">{labels['rate_plan']}</td><td>{reservation.get('rate_plan_name', 'Standard')}</td></tr>
                        <tr><td class="room-label">{labels['special_req']}</td><td>{reservation.get('special_requests') or '-'}</td></tr>
                    </table>

                    <table class="price-table">
                        <thead><tr><th>{labels['description']}</th><th>{labels['total']}</th></tr></thead>
                        <tbody>
                            <tr><td>{labels['room_charge'].format(nights=reservation['nights'])}</td><td>{room_total_formatted}</td></tr>
                            <tr><td><strong>{labels['total_amount']}</strong></td><td style="color: #059669; font-weight: 700;">{total_formatted}</td></tr>
                        </tbody>
                    </table>
                </div>

                {payment_section}
                {important_notes_section}
                {policy_section}
                
            </div>

            <div class="footer">
                <p style="margin:0; font-size:14px;">&copy; {datetime.now().year()} Spencer Green Hotel</p>
                <div style="margin-top:16px;">
                    <a href="{FRONTEND_URL}" style="color:white; text-decoration:none; margin:0 8px;">{labels['website']}</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    hotel_email = "reservasi@spencergreenhotel.com"
    
    # Send to Guest
    # Parse subject template
    try:
        guest_subject = subject_prefix + config["subject_template"].format(
            booking_code=reservation['booking_code'],
            guest_name=reservation['guest_name']
        )
    except:
        guest_subject = f"{subject_prefix}Konfirmasi Reservasi - {reservation['booking_code']}"

    guest_success = await send_email(
        to_email=reservation['guest_email'],
        subject=guest_subject,
        html_content=html_content
    )

    # Send copy to Hotel
    hotel_subject = f"{subject_prefix}[NEW BOOKING] {reservation['booking_code']} - {reservation['guest_name']}"
    hotel_success = await send_email(
        to_email=hotel_email,
        subject=hotel_subject,
        html_content=html_content
    )
    
    success = guest_success and hotel_success

    # Log email send attempt
    email_log = {
        "reservation_id": reservation.get('reservation_id'),
        "booking_code": reservation.get('booking_code'),
        "to_email": reservation['guest_email'],
        "cc_email": hotel_email,
        "subject": guest_subject,
        "is_resend": is_resend,
        "status": "sent" if success else "partial_failure" if (guest_success or hotel_success) else "failed",
        "details": {
            "guest_sent": guest_success,
            "hotel_sent": hotel_success
        },
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.email_logs.insert_one(email_log)
    
    if success:
        logger.info(f"Reservation email ({'resent' if is_resend else 'initial'}) sent to {reservation['guest_email']}")
    else:
        logger.error(f"Failed to send email. Guest: {guest_success}, Hotel: {hotel_success}")
    
    return success

async def send_password_reset_email(email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Spencer Green Hotel</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #059669;">Permintaan Reset Password</h2>
            <p>Anda telah meminta untuk mereset password Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
            <a href="{reset_link}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Reset Password
            </a>
            <p style="color: #6b7280; font-size: 14px;">Tautan ini akan kedaluwarsa dalam 1 jam. Jika Anda tidak memintanya, silakan abaikan email ini.</p>
        </div>
    </div>
    """
    
    await send_email(
        to_email=email,
        subject="Reset Password - Spencer Green Hotel",
        html_content=html_content
    )
