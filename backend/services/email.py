import asyncio
import logging
import resend
from config import RESEND_API_KEY, SENDER_EMAIL, FRONTEND_URL
from database import db

resend.api_key = RESEND_API_KEY
logger = logging.getLogger(__name__)

async def send_reservation_email(reservation: dict, room_type: dict):
    whatsapp_doc = await db.site_content.find_one({"section": "contact", "content_type": "whatsapp"}, {"_id": 0})
    wa_number = whatsapp_doc.get("content", {}).get("number", "6281130700206") if whatsapp_doc else "6281130700206"
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: #059669; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Spencer Green Hotel</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0;">Batu, East Java</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #059669;">Reservation Confirmation</h2>
            <p>Dear {reservation['guest_name']},</p>
            <p>Thank you for your reservation. Here are your booking details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f0fdf4;">
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Booking Code</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['booking_code']}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Room Type</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{room_type.get('name', 'N/A')}</td>
                </tr>
                <tr style="background: #f0fdf4;">
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Check-in</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['check_in']}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Check-out</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['check_out']}</td>
                </tr>
                <tr style="background: #f0fdf4;">
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Guests</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">{reservation['guests']}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Total Amount</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold;">Rp {reservation['total_amount']:,.0f}</td>
                </tr>
            </table>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px 0;">Payment Instructions</h3>
                <p style="color: #78350f; margin: 0;">Please complete your payment via WhatsApp to confirm your reservation:</p>
                <a href="https://wa.me/{wa_number}?text=Hi,%20I%20want%20to%20complete%20payment%20for%20booking%20{reservation['booking_code']}" 
                   style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">
                    Contact via WhatsApp
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                If you have any questions, please don't hesitate to contact us.
            </p>
        </div>
        <div style="background: #064e3b; padding: 20px; text-align: center;">
            <p style="color: #d1fae5; margin: 0; font-size: 14px;">Spencer Green Hotel Batu</p>
            <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 12px;">Jl. Raya Punten No.86, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia</p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [reservation['guest_email']],
            "subject": f"Reservation Confirmation - {reservation['booking_code']}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Reservation email sent to {reservation['guest_email']}")
    except Exception as e:
        logger.error(f"Failed to send reservation email: {str(e)}")

async def send_password_reset_email(email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Spencer Green Hotel</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #059669;">Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="{reset_link}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Reset Password
            </a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Password Reset - Spencer Green Hotel",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
