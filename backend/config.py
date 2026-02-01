import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
# MongoDB (Legacy - Optional during migration)
MONGO_URL = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
DB_NAME = os.environ.get('DB_NAME', "spencer_green_hms")

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'spencer-green-hotel-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# SMTP Email (Rackrock / cPanel)
SMTP_HOST = os.environ.get('SMTP_HOST', 'mail.spencergreenhotel.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465')) # 465 for SSL, 587 for TLS
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', SMTP_USER)

# Cloudinary
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

# Emergent LLM
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Resend Email API
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')

# Frontend URL
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# CORS
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
if CORS_ORIGINS == ['*']:
    CORS_ORIGINS = [
        "http://localhost:3000",
        "https://spencergreenhotel.com",
        "https://www.spencergreenhotel.com",
        "https://spensmer-backend.onrender.com"
    ]
else:
    # Always append production domains just in case
    CORS_ORIGINS.extend([
        "https://spencergreenhotel.com",
        "https://www.spencergreenhotel.com"
    ])
    CORS_ORIGINS = list(set(CORS_ORIGINS)) # Remove duplicates
