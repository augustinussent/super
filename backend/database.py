from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME

# Legacy MongoDB Client (Deprecated - causing issues if Mongo not present)
# We initialized it with a default URL in config, so this won't crash immediately,
# but functionality will be broken until refactored to Prisma.
try:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
except Exception as e:
    print(f"Warning: MongoDB client failed to initialize: {e}")
    client = None
    db = None

async def close_db():
    client.close()
