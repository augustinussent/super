from fastapi import APIRouter, HTTPException, Depends, Request
from database import db
from models.review import ReviewCreate, Review
from services.auth import require_admin, require_super_admin
from services.audit import log_activity, get_changes

router = APIRouter(tags=["reviews"])

@router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, request: Request, user: dict = Depends(require_super_admin)):
    # Get existing for logs
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    result = await db.reviews.delete_one({"review_id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Log activity
    await log_activity(
        user=user,
        action="delete",
        resource="reviews",
        resource_id=review_id,
        details={"guest_name": review.get("guest_name"), "rating": review.get("rating")},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Review deleted permanently"}

@router.get("/reviews")
async def get_visible_reviews():
    reviews = await db.reviews.find({"is_visible": True}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return reviews

@router.post("/reviews")
async def create_review(review: ReviewCreate, request: Request):
    review_doc = Review(
        guest_name=review.guest_name,
        guest_email=review.guest_email,
        rating=min(max(review.rating, 1), 5),
        comment=review.comment,
        reservation_id=review.reservation_id,
        is_visible=False
    ).model_dump()
    
    await db.reviews.insert_one(review_doc)
    
    # Optional: Log new review submission? (Maybe not needed for system logs, or as "system" user)
    # Skipping for now to focus on admin actions
    
    return {"message": "Review submitted for approval"}

@router.get("/admin/reviews")
async def get_all_reviews(user: dict = Depends(require_admin)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@router.put("/admin/reviews/{review_id}/visibility")
async def toggle_review_visibility(review_id: str, is_visible: bool, request: Request, user: dict = Depends(require_admin)):
    # Get existing for logs
    old_review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not old_review:
        raise HTTPException(status_code=404, detail="Review not found")

    result = await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {"is_visible": is_visible}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
        
    # Log activity
    await log_activity(
        user=user,
        action="update",
        resource="reviews",
        resource_id=review_id,
        details={
            "guest_name": old_review.get("guest_name"),
            "changes": {"is_visible": {"old": old_review.get("is_visible"), "new": is_visible}}
        },
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Review visibility updated"}
