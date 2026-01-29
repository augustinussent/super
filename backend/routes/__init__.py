from routes.auth import router as auth_router
from routes.rooms import router as rooms_router
from routes.reservations import router as reservations_router
from routes.reviews import router as reviews_router
from routes.promo import router as promo_router
from routes.content import router as content_router
from routes.admin import router as admin_router
from routes.init import router as init_router
from routes.media import router as media_router
from routes.analytics import router as analytics_router
from routes.rate_plans import router as rate_plans_router

__all__ = [
    "auth_router",
    "rooms_router",
    "reservations_router",
    "reviews_router",
    "promo_router",
    "content_router",
    "admin_router",
    "init_router",
    "init_router",
    "media_router",
    "analytics_router",
    "rate_plans_router"
]
