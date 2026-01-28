import sys
import smtplib
import ssl
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SENDER_EMAIL

print("Checking Email Configuration...")
print(f"SMTP_HOST: {SMTP_HOST}")
print(f"SMTP_PORT: {SMTP_PORT}")
print(f"SMTP_USER: {SMTP_USER}")
print(f"SENDER_EMAIL: {SENDER_EMAIL}")
print(f"SMTP_PASSWORD is set: {'Yes' if SMTP_PASSWORD else 'No'}")

if not SMTP_HOST or not SMTP_PORT or not SMTP_USER or not SMTP_PASSWORD:
    print("ERROR: Missing one or more required environment variables.")
    sys.exit(1)

print("\nAttempting to connect to SMTP server...")
try:
    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        print("Using SMTP_SSL...")
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            print("Connected. Logging in...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("Login successful!")
    else:
        print("Using SMTP (starttls)...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            print("Connected. Starting TLS...")
            server.starttls(context=context)
            print("Logging in...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("Login successful!")
    print("\nSUCCESS: Email configuration appears to be correct and credentials are valid.")
except Exception as e:
    print(f"\nFAILURE: Could not connect or login. Error: {e}")
    sys.exit(1)
