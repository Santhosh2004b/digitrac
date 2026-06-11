from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.services.dashboard_service import DashboardService
from app.utils.deps import get_current_manager, get_current_vp, get_current_executive

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/")
def get_dashboard(db: Session = Depends(get_db), current_manager: User = Depends(get_current_manager)):
    return DashboardService.get_manager_dashboard(db, current_manager.id)

@router.get("/vp")
def get_vp_dashboard(db: Session = Depends(get_db), current_vp: User = Depends(get_current_vp)):
    return DashboardService.get_vp_dashboard(db)

@router.post("/clear-cache")
def clear_dashboard_cache(current_user: User = Depends(get_current_executive)):
    DashboardService.clear_dashboard_cache(current_user.id)
    return {"message": "Cache cleared"}

@router.get("/employees")
def get_employees(db: Session = Depends(get_db), current_user: User = Depends(get_current_executive)):
    employees = db.query(User).filter(User.role == "EMP").all()
    return [{"id": e.id, "name": e.name} for e in employees]
