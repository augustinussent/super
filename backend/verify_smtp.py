import smtplib
import ssl
import sys

# Credentials provided by user
SMTP_HOST = "mail.spencergreenhotel.com"
SMTP_PORT = 465
SMTP_USER = "reservasi@spencergreenhotel.com"
SMTP_PASSWORD = "Sp3nc3r@B4tu"
SENDER_EMAIL = SMTP_USER

print(f"Testing SMTP Connection to {SMTP_HOST}:{SMTP_PORT}...")
print(f"User: {SMTP_USER}")

try:
    context = ssl.create_default_context()
    
    if SMTP_PORT == 465:
        print("Attempting SMTP_SSL connection...")
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            print("Connected to server.")
            print(f"Logging in as {SMTP_USER}...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("✅ Login SUCCESSFUL!")
            
            # Optional: Verify we can send a test email to self
            # uncomment to test actual sending
            # msg = f"Subject: SMTP Test\n\nThis is a test email from the verification script."
            # server.sendmail(SENDER_EMAIL, SENDER_EMAIL, msg)
            # print("Test email sent to self.")
            
    else:
        print("Attempting SMTP (STARTTLS) connection...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            print("Connected to server.")
            server.ehlo()
            if server.has_extn('STARTTLS'):
                print("Starting TLS...")
                server.starttls(context=context)
                server.ehlo()
            print(f"Logging in as {SMTP_USER}...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("✅ Login SUCCESSFUL!")

except smtplib.SMTPAuthenticationError as e:
    print(f"❌ Authentication FAILED: {e}")
    print("Check your username and password.")
except smtplib.SMTPConnectError as e:
    print(f"❌ Connection FAILED: {e}")
    print("Server might be unreachable or blocking the connection.")
except Exception as e:
    print(f"❌ An error occurred: {e}")
    import traceback
    traceback.print_exc()
