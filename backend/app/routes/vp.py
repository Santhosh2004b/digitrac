# vp.py - Legacy metrics endpoint only.
# All /vp/intelligence-feed, /vp/projects, /vp/summary are in intelligence.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.project import Project, ProjectItem
from app.utils.deps import get_current_vp
from typing import List

router = APIRouter(prefix="/vp", tags=["vp"])

@router.get("/metrics")
async def get_vp_metrics(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Legacy metrics endpoint using Project table."""
    projects = db.query(Project).all()
    total_rev = sum(p.sale_value for p in projects)
    total_cost = sum(p.total_cost_baseline for p in projects)
    
    return {
        "total_active_missions": len(projects),
        "total_revenue_deployed": total_rev,
        "average_strategic_margin": (total_rev - total_cost) / total_rev * 100 if total_rev > 0 else 0,
        "resource_efficiency": 92.4
    }

@router.get("/mission-history")
async def get_mission_history(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    from app.models.project import MissionAssignment
    assignments = db.query(MissionAssignment).filter(MissionAssignment.assigned_by == current_user.email).order_by(MissionAssignment.assigned_at.desc()).all()
    return [{
        "id": a.id,
        "mission_name": a.mission_name,
        "manager_email": a.manager_email,
        "mail_status": a.mail_status,
        "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None
    } for a in assignments]

@router.get("/resource-intelligence")
async def get_resource_intelligence(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Returns aggregated resource intelligence for the VP dashboard."""
    from app.models.project import ApprovedProject
    from sqlalchemy import func

    if current_user.role == "VP":
        projects = db.query(ApprovedProject).all()
    else:
        projects = db.query(ApprovedProject).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()

    resource_map = {}
    for p in projects:
        items = p.safe_excel_data
        for item in items:
            person = item.get("assigned_person")
            if not person or person == "Unassigned":
                continue
            if person not in resource_map:
                resource_map[person] = {
                    "name": person,
                    "role": item.get("practice") or "Consultant",
                    "projects": [],
                    "tasks": [],
                    "total_hours": 0,
                    "total_value": 0,
                    "practices": set(),
                    "components": set()
                }
            rm = resource_map[person]
            if p.project_name not in rm["projects"]:
                rm["projects"].append(p.project_name)
            rm["tasks"].append(item.get("description", "Task"))
            rm["total_hours"] += float(item.get("est_hours") or 0)
            rm["total_value"] += float(item.get("net_value") or 0)
            if item.get("practice"): rm["practices"].add(item["practice"])
            if item.get("component"): rm["components"].add(item["component"])

    result = []
    for name, data in resource_map.items():
        util = (data["total_hours"] / 160) * 100
        data["utilization"] = round(min(util, 120), 1)
        data["status"] = "Overloaded" if util > 100 else "Busy" if util > 70 else "Available"
        data["practices"] = list(data["practices"])
        data["components"] = list(data["components"])
        result.append(data)

    return result
