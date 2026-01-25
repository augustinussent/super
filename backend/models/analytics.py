from pydantic import BaseModel, Field
from typing import Dict, Any

class DailyStats(BaseModel):
    date: str
    total_visits: int = 0
    unique_visitors: int = 0
    page_views: Dict[str, int] = {}
    last_updated: str = ""
