from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.project import ApprovedProject
from app.models.intelligence import IntelligenceEvent
from app.utils.deps import get_current_user

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

@router.get("/feed")
def get_intelligence_feed(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(IntelligenceEvent)
    
    # Filter by user role access
    if current_user.role not in ["VP", "PC"]:
        # PM can only see intelligence for their assigned projects
        projects = db.query(ApprovedProject.id).filter(ApprovedProject.assigned_manager_email == current_user.email).all()
        project_ids = [p[0] for p in projects]
        query = query.filter(IntelligenceEvent.project_id.in_(project_ids))
        
    if category:
        query = query.filter(IntelligenceEvent.category == category)
    if priority:
        query = query.filter(IntelligenceEvent.priority == priority)
        
    events = query.order_by(IntelligenceEvent.created_at.desc()).limit(100).all()
    
    result = []
    for e in events:
        result.append({
            "id": e.id,
            "project_id": e.project_id,
            "project_name": e.project_name,
            "sap_node_id": e.sap_node_id,
            "sap_node_name": e.sap_node_name,
            "category": e.category,
            "priority": e.priority,
            "metrics": e.metrics or {},
            "message": e.message,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
        
    return result
