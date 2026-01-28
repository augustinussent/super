from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import logging

from config import CORS_ORIGINS
from database import close_db
from routes import (
    auth_router,
    rooms_router,
    reservations_router,
    reviews_router,
    promo_router,
    content_router,
    admin_router,
    init_router,
    init_router,
    media_router,
    analytics_router
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="Spencer Green Hotel HMS API")

# Create main API router
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(rooms_router)
api_router.include_router(reservations_router)
api_router.include_router(reviews_router)
api_router.include_router(promo_router)
api_router.include_router(content_router)
api_router.include_router(admin_router)
api_router.include_router(init_router)
api_router.include_router(media_router)
api_router.include_router(analytics_router)

# Add CORS middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_router.get("/")
async def root():
    return {"message": "Spencer Green Hotel HMS API", "version": "1.0.0"}

# Include API router in main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db()
