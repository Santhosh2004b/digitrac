from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.workflow import InAppNotification
from app.utils.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
def get_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role not in ["PM", "MNG", "VP", "PC"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    notifications = (
        db.query(InAppNotification)
        .filter(func.lower(InAppNotification.recipient_email) == current_user.email.lower())
        .order_by(InAppNotification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "project_name": n.title or "New Notification",
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "type": n.type,
            "priority": n.priority,
        }
        for n in notifications
    ]

@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role not in ["PM", "MNG", "VP", "PC"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    notification = db.query(InAppNotification).filter(
        InAppNotification.id == notification_id,
        func.lower(InAppNotification.recipient_email) == current_user.email.lower()
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}
