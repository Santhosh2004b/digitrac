from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import os
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.models.project import Project, ProjectResource
from app.models.task import Task
from app.schemas.project import ProjectCreate, ProjectResponse
from app.schemas.task import TaskCreate, TaskResponse
from app.schemas.user import UserResponse
from app.utils.deps import get_current_manager

from app.services.project_service import ProjectService

router = APIRouter(prefix="/manager", tags=["manager"])

@router.get("/artifact")
def get_mission_artifact(path: str, current_user: User = Depends(get_current_manager)):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Artifact file not found on disk")
    return FileResponse(path)

class ResourceAssignInput(BaseModel):
    name: str
    email: str
    mobile: str

class ActualMonthsInput(BaseModel):
    actual_months: float

class TrackingUpdateInput(BaseModel):
    actual_months: Optional[float] = None
    work_start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None

from app.models.project import Project, ProjectResource, ApprovedProject, MissionAssignment

@router.get("/projects")
def get_my_projects(db: Session = Depends(get_db), current_manager: User = Depends(get_current_manager), region: str = "GLOBAL"):
    # FETCH ONLY projects where assigned_manager_email = logged_in_user, unless it's a VP
    if current_manager.role == "VP":
        query = db.query(ApprovedProject)
    else:
        query = db.query(ApprovedProject).filter(ApprovedProject.assigned_manager_email == current_manager.email)
    
    projects = query.all()
    result = []
    
    for p in projects:
        items = p.full_excel_data or []
        if region != "GLOBAL":
            items = [i for i in items if i.get("sales_region") == region]
        
        if not items and region != "GLOBAL":
            continue

        ma = db.query(MissionAssignment).filter(
            MissionAssignment.mission_name == p.project_name,
            MissionAssignment.manager_email == current_manager.email
        ).first()
        artifact_path = ma.artifact_path if ma else None

        # Calculate resources for this project
        project_resources = []
        for idx, i in enumerate(items):
            # Fallback for ID consistency
            node_id = i.get("id") if i.get("id") is not None else (idx + 1)
            
            project_resources.append({
                "id": node_id,
                "sap_id": i.get("sap_id"),
                "task_name": i.get("description") or "N/A",
                "role": i.get("practice") or i.get("sbu") or "Mission Resource",
                "component": i.get("component"),
                "item_type": i.get("item_type"),
                "sales_region": i.get("sales_region"),
                "oem": i.get("oem"),
                "qty": i.get("qty", 0),
                "purchase_total": i.get("purchase_total", 0),
                "selling_total": i.get("selling_total", 0),
                "net_value": i.get("net_value", 0),
                "margin_pct": i.get("margin_pct", 0),
                "gm_pct": i.get("margin_pct", 0),
                "margin": f"{i.get('margin_pct', 0)}%",
                "est_hours": i.get("est_hours", 0),
                "status": i.get("status", "Pending"),
                "name": i.get("assigned_person") or "Unassigned",
                
                # Centralized Pool Fields
                "employee_id": i.get("employee_id") or "N/A",
                "grade": i.get("grade") or "N/A",
                "role_practice": i.get("role_practice") or "N/A",
                "hourly_billing_rate": i.get("hourly_billing_rate") or i.get("hourly_rate") or 0.0,
                "cost_rate": i.get("cost_rate") or 0.0,
                "resource_cost": i.get("resource_cost") or 0.0,
                "billing_value": i.get("billing_value") or 0.0,
                "resource_margin": i.get("resource_margin") or 0.0,
                "assigned_email": i.get("assigned_email") or "unknown@arche.global",

                "progress_pct": i.get("progress_pct", 0),
                "remaining_hours": float(i.get("qty", 0)) * 4,
                "deadline": i.get("end_date"),
                "priority": i.get("priority", "MEDIUM"),
                "start_date": i.get("start_date"),
                "duration": i.get("duration", 0),
                "work_mode": i.get("work_mode", "Days")
            })

        # Find the Project model to get the new fields
        proj_model = db.query(Project).filter(Project.name == p.project_name).first()
        duration = proj_model.duration_months if proj_model else 0
        target = proj_model.margin_target_pct if proj_model else 0
        
        revenue = proj_model.sale_value if proj_model else 0
        baseline_cost = proj_model.total_cost_baseline if proj_model else 0
        
        # Calculate actual project resource cost from assignments
        actual_res_cost = sum(float(r.get("resource_cost") or 0.0) for r in project_resources)
        actual_total_cost = baseline_cost + actual_res_cost
        
        actual_margin_amt = revenue - actual_total_cost
        actual_margin_pct = (actual_margin_amt / revenue * 100) if revenue > 0 else 0
        deviation = actual_margin_pct - target

        result.append({
            "id": p.id,
            "name": p.project_name,
            "status": "ASSIGNED",
            "efficiency_pct": 100.0,
            "performance_score": 100.0,
            "total_items": len(items),
            "region": region,
            "resources": project_resources,
            "approved_by": p.approved_by,
            "artifact_path": artifact_path,
            "duration_months": duration,
            "margin_target_pct": target,
            "margin_deviation_pct": round(deviation, 2),
            "total_revenue": revenue,
            "margin_amount": round(actual_margin_amt, 2),
            "margin_pct": round(actual_margin_pct, 2),
            "actual_resource_cost": round(actual_res_cost, 2),
            "actual_total_cost": round(actual_total_cost, 2),
            "assigned_at": p.created_at.isoformat() if p.created_at else None
        })
    return result

class TaskAssignmentInput(BaseModel):
    assigned_person: str
    start_date: str
    end_date: str
    duration: float
    priority: str = "MEDIUM"
    work_mode: str = "Days"
    booking_hours: Optional[float] = None

@router.post("/projects/{project_id}/items/{item_id}/assign")
def assign_item_task(
    project_id: int,
    item_id: int,
    assignment: TaskAssignmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    # Fetch ApprovedProject (Case-insensitive email matching)
    if current_user.role == "VP":
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    else:
        project = db.query(ApprovedProject).filter(
            ApprovedProject.id == project_id,
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project command not found or unauthorized.")

    items = project.full_excel_data or []
    updated = False
    
    # Validation: Prevent duplicate resource allocation entries for the SAME node/item
    # (Checking if this specific resource is already allocated to another node in the same project can be done if desired)
    
    for idx, i in enumerate(items):
        # Robust ID matching with index fallback
        node_id = i.get("id") if i.get("id") is not None else (idx + 1)
        
        if str(node_id) == str(item_id):
            # central resource cost lookups
            hourly_billing_rate = 0.0
            cost_rate = 0.0
            grade = "N/A"
            role_practice = "N/A"
            cost = 0.0
            billing_value = 0.0
            margin = 0.0
            
            from app.models.resource import CentralizedResource
            res_obj = db.query(CentralizedResource).filter(
                (CentralizedResource.name == assignment.assigned_person) | 
                (CentralizedResource.email == assignment.assigned_person)
            ).first()
            
            # Determine booking hours: PM's explicit entry, otherwise fallback to node baseline
            if assignment.booking_hours is not None:
                booked_hours = float(assignment.booking_hours)
            else:
                booked_hours = float(i.get("est_hours") or (float(i.get("qty", 0)) * 4))
            
            if res_obj:
                hourly_billing_rate = res_obj.hourly_billing_rate
                cost_rate = res_obj.cost_rate
                grade = res_obj.grade
                role_practice = res_obj.role_practice
                
                # Business Logic Formulas:
                cost = booked_hours * cost_rate
                billing_value = booked_hours * hourly_billing_rate
                margin = billing_value - cost
                
                assignment_name = res_obj.name
                assignment_email = res_obj.email
                employee_id = res_obj.employee_id
            else:
                assignment_name = assignment.assigned_person
                assignment_email = "unknown@arche.global"
                employee_id = "N/A"
                # fallback values
                hourly_billing_rate = float(i.get("hourly_rate") or 0.0)
                cost = booked_hours * hourly_billing_rate
                billing_value = booked_hours * hourly_billing_rate
                margin = 0.0
            
            i.update({
                "assigned_person": assignment_name,
                "assigned_email": assignment_email,
                "employee_id": employee_id,
                "grade": grade,
                "role_practice": role_practice,
                "hourly_billing_rate": hourly_billing_rate,
                "cost_rate": cost_rate,
                "est_hours": booked_hours,
                "resource_cost": cost,
                "billing_value": billing_value,
                "resource_margin": margin,
                "start_date": assignment.start_date,
                "end_date": assignment.end_date,
                "duration": assignment.duration,
                "priority": assignment.priority,
                "work_mode": assignment.work_mode,
                "status": "In Progress",
                "id": node_id
            })
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Mission node not found in project.")

    from sqlalchemy.orm.attributes import flag_modified
    project.full_excel_data = items
    flag_modified(project, "full_excel_data")
    db.commit()
    return {"status": "success", "message": "Resource allocated successfully"}


@router.get("/all-resources")
def get_all_manager_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """Aggregates resource intelligence across all manager projects"""
    if current_user.role == "VP":
        projects = db.query(ApprovedProject).all()
    else:
        projects = db.query(ApprovedProject).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()
    
    resource_map = {} # email -> resource info
    
    for p in projects:
        items = p.full_excel_data or []
        for i in items:
            person = i.get("assigned_person")
            if not person or person == "Unassigned": continue
            
            if person not in resource_map:
                resource_map[person] = {
                    "name": person,
                    "role": i.get("practice") or i.get("sbu") or "Consultant",
                    "projects": [],
                    "tasks": [],
                    "total_hours": 0,
                    "utilization": 0,
                    "status": "Available"
                }
            
            if p.project_name not in resource_map[person]["projects"]:
                resource_map[person]["projects"].append(p.project_name)
            
            resource_map[person]["tasks"].append(i.get("description", "Task"))
            hours = float(i.get("qty", 0)) * 4
            resource_map[person]["total_hours"] += hours

    # Calculate status and utilization
    # Assuming 160h/month as 100%
    result = []
    for name, data in resource_map.items():
        util = (data["total_hours"] / 160) * 100
        data["utilization"] = round(min(util, 120), 1)
        if util > 100: data["status"] = "Overloaded"
        elif util > 70: data["status"] = "Busy"
        else: data["status"] = "Available"
        result.append(data)
        
    return result

@router.get("/all-logs")
def get_all_manager_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """Fetches all time logs for projects assigned to this manager"""
    from app.models.timelog import TimeLog
    from app.models.user import User as DBUser
    from app.models.project import Project as DBProj
    
    # Get projects IDs this manager owns in the 'projects' table
    # Wait, ApprovedProject is the source of truth, but TimeLog links to projects.id
    # We need to map ApprovedProject.project_name to Project.id
    
    if current_user.role == "VP":
        approved_names = db.query(ApprovedProject.project_name).all()
    else:
        approved_names = db.query(ApprovedProject.project_name).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()
    names = [n[0] for n in approved_names]
    
    proj_ids = db.query(DBProj.id).filter(DBProj.name.in_(names)).all()
    ids = [i[0] for i in proj_ids]
    
    logs = db.query(TimeLog).join(Task).filter(Task.project_id.in_(ids)).all()
    
    result = []
    for l in logs:
        u = db.query(DBUser).filter(DBUser.id == l.user_id).first()
        p = db.query(DBProj).filter(DBProj.id == l.task.project_id).first()
        
        # Smart Status logic
        expected = 8.0 # Default daily expected
        variance = l.hours - expected
        status = "Optimal"
        if l.hours > expected: status = "Overworked"
        elif l.hours < expected: status = "Underutilized"
        
        result.append({
            "id": l.id,
            "date": l.date.isoformat(),
            "employee_name": u.name if u else "Unknown",
            "project": p.name if p else "Unknown",
            "task": l.task.title if l.task else "N/A",
            "hours": l.hours,
            "expected": expected,
            "variance": round(variance, 1),
            "status": status
        })
        
    return result

@router.get("/projects/{project_id}")
def get_project_detail(
    project_id: int,
    region: str = "GLOBAL",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    if current_user.role == "VP":
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    else:
        project = db.query(ApprovedProject).filter(
            ApprovedProject.id == project_id,
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not assigned to you.")

    items = project.full_excel_data or []
    if region != "GLOBAL":
        items = [i for i in items if str(i.get("region", "GLOBAL")).upper() == region.upper()]

    ma = db.query(MissionAssignment).filter(
        MissionAssignment.mission_name == project.project_name,
        MissionAssignment.manager_email == current_user.email
    ).first()
    artifact_path = ma.artifact_path if ma else None

    resource_data = []
    for idx, i in enumerate(items):
        # Fallback to index+1 if ID is missing
        node_id = i.get("id") if i.get("id") is not None else (idx + 1)
        
        resource_data.append({
            "id": node_id,
            "sap_id": i.get("sap_id"),
            "task_name": i.get("description") or "N/A",
            "role": i.get("practice") or i.get("sbu") or "Mission Resource",
            "component": i.get("component"),
            "item_type": i.get("item_type"),
            "sales_region": i.get("sales_region"),
            "oem": i.get("oem"),
            "qty": i.get("qty", 0),
            "purchase_total": i.get("purchase_total", 0),
            "selling_total": i.get("selling_total", 0),
            "net_value": i.get("net_value", 0),
            "margin_pct": i.get("margin_pct", 0),
            "gm_pct": i.get("margin_pct", 0),
            "margin": f"{i.get('margin_pct', 0)}%",
            "est_hours": i.get("est_hours", 0),
            "status": i.get("status", "Pending"),
            "name": i.get("assigned_person") or "Unassigned",
            
            # Centralized Pool Fields
            "employee_id": i.get("employee_id") or "N/A",
            "grade": i.get("grade") or "N/A",
            "role_practice": i.get("role_practice") or "N/A",
            "hourly_billing_rate": i.get("hourly_billing_rate") or i.get("hourly_rate") or 0.0,
            "cost_rate": i.get("cost_rate") or 0.0,
            "resource_cost": i.get("resource_cost") or 0.0,
            "billing_value": i.get("billing_value") or 0.0,
            "resource_margin": i.get("resource_margin") or 0.0,
            "assigned_email": i.get("assigned_email") or "unknown@arche.global",

            "progress_pct": i.get("progress_pct", 0),
            "remaining_hours": i.get("remaining_hours", float(i.get("qty", 0)) * 4),
            "deadline": i.get("end_date"),
            "priority": i.get("priority", "MEDIUM"),
            "start_date": i.get("start_date"),
            "duration": i.get("duration", 0),
            "work_mode": i.get("work_mode", "Days")
        })

    # Find the Project model to get the new fields
    proj_model = db.query(Project).filter(Project.name == project.project_name).first()
    duration = proj_model.duration_months if proj_model else 0
    target = proj_model.margin_target_pct if proj_model else 0
    
    revenue = proj_model.sale_value if proj_model else 0
    baseline_cost = proj_model.total_cost_baseline if proj_model else 0
    
    actual_res_cost = sum(float(r.get("resource_cost") or 0.0) for r in resource_data)
    actual_total_cost = baseline_cost + actual_res_cost
    
    actual_margin_amt = revenue - actual_total_cost
    actual_margin_pct = (actual_margin_amt / revenue * 100) if revenue > 0 else 0
    deviation = actual_margin_pct - target

    return {
        "id": project.id,
        "name": project.project_name,
        "resources": resource_data,
        "efficiency_pct": 100.0,
        "task_progress": 0,
        "status": "Good",
        "approved_by": project.approved_by,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "artifact_path": artifact_path,
        "duration_months": duration,
        "margin_target_pct": target,
        "margin_deviation_pct": round(deviation, 2),
        "total_revenue": revenue,
        "margin_amount": round(actual_margin_amt, 2),
        "margin_pct": round(actual_margin_pct, 2),
        "actual_resource_cost": round(actual_res_cost, 2),
        "actual_total_cost": round(actual_total_cost, 2),
        "assigned_at": project.created_at.isoformat() if project.created_at else None
    }

@router.get("/projects/{project_id}/resources")
def get_manager_project_resources(project_id: int, db: Session = Depends(get_db), current_manager: User = Depends(get_current_manager)):
    """Dedicated endpoint for resource matrix"""
    project = db.query(Project).filter(Project.id == project_id, Project.manager_id == current_manager.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    resources = db.query(ProjectResource).filter(ProjectResource.project_id == project_id).all()
    result = []
    from sqlalchemy import func
    from app.models.timelog import TimeLog

    for r in resources:
        user_id = db.query(User.id).filter(User.email == r.email).scalar()
        task = None
        if user_id:
            task = db.query(Task).filter(Task.project_id == project_id, Task.assigned_to == user_id).first()
        
        logged = 0
        if task:
            logged = db.query(func.sum(TimeLog.hours)).filter(TimeLog.task_id == task.id).scalar() or 0
            
        expected = task.expected_hours if task else (r.planned_months * 160 if r.planned_months else 1)
        progress = round((logged / expected * 100), 2) if expected > 0 else 0
        
        result.append({
            "id": r.id,
            "role": r.role,
            "name": r.name or "TBD",
            "employee_name": r.name or "UNASSIGNED",
            "task_name": task.title if task else "N/A",
            "progress_pct": progress,
            "remaining_hours": max(0, expected - logged),
            "remaining_days": (r.deadline - datetime.utcnow()).days if r.deadline else 30,
            "deadline": r.deadline.isoformat() if r.deadline else None,
            "status": "Overdue" if (r.deadline and r.deadline < datetime.utcnow() and progress < 100) else "In Progress" if progress > 0 else "Pending",
            "pace": "Ahead of Schedule" if progress > 50 else "On Track"
        })
    return result

# ─── Assign people to a resource row ────────────────────────────────────────

@router.patch("/resources/{resource_id}/assign")
def assign_resource_person(
    resource_id: int,
    data: ResourceAssignInput,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    resource = db.query(ProjectResource).filter(ProjectResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    # Verify this resource belongs to a project of this manager
    project = db.query(Project).filter(
        Project.id == resource.project_id,
        Project.manager_id == current_manager.id
    ).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized")
    if project.status == "ACTIVE":
        # Cannot change person assignment after project is live (only VP can)
        raise HTTPException(status_code=400, detail="Cannot change assignment on an ACTIVE project")

    resource.name = data.name
    resource.email = data.email
    resource.mobile = data.mobile
    db.commit()
    return {"message": "Resource assigned", "resource_id": resource_id}


# ─── Start the project ───────────────────────────────────────────────────────

@router.post("/projects/{project_id}/start")
def start_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.manager_id == current_manager.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status == "ACTIVE":
        raise HTTPException(status_code=400, detail="Project is already active")

    # Validate all resources have name/email/mobile
    resources = project.resources or []
    incomplete = [r.role for r in resources if not (r.name and r.email and r.mobile)]
    if incomplete:
        raise HTTPException(
            status_code=400,
            detail=f"Incomplete assignments: {', '.join(incomplete)}"
        )

    project.status = "ACTIVE"
    project.start_date = datetime.utcnow()
    db.commit()
    return {"message": "Project is now ACTIVE", "start_date": project.start_date.isoformat()}
@router.post("/projects/{project_id}/approve")
def approve_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    """Step 5: Manager approves the proposal from VP."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.manager_id == current_manager.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "PROPOSAL":
        raise HTTPException(status_code=400, detail="Only PROPOSAL projects can be approved")
    
    # In this step, we assume manager has filled the names/emails
    project.status = "ASSIGNED"
    db.commit()
    return {"message": "Mission Proposal Approved & Synchronized", "status": "ASSIGNED"}

@router.post("/resources/{resource_id}/allocate")
def allocate_weekly_hours(
    resource_id: int,
    hours: float,
    months: float,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    """Step 6: Weekly allocation and tracking."""
    resource = db.query(ProjectResource).filter(ProjectResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Increment actual months
    resource.actual_months = (resource.actual_months or 0) + months
    db.commit()
    
    return {
        "message": "Weekly allocation updated",
        "current_total_months": resource.actual_months,
        "completion_pct": round((resource.actual_months / resource.planned_months) * 100, 2) if resource.planned_months > 0 else 100
    }


# ─── Update actual months for a resource ────────────────────────────────────

@router.patch("/resources/{resource_id}/actual-months")
def update_actual_months(
    resource_id: int,
    data: ActualMonthsInput,
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    resource = db.query(ProjectResource).filter(ProjectResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    project = db.query(Project).filter(
        Project.id == resource.project_id,
        Project.manager_id == current_manager.id
    ).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized")
    if project.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Tracking only available after project is started")

    resource.actual_months = data.actual_months
    db.commit()

    # Recompute and return live cost data
    actual_cost = resource.actual_months * resource.unit_price * resource.qty
    overrun = max(0, resource.actual_months - resource.planned_months) * resource.unit_price * resource.qty
    remaining = max(0, resource.planned_months - resource.actual_months)
    return {
        "resource_id": resource_id,
        "actual_months": resource.actual_months,
        "actual_cost": round(actual_cost, 2),
        "overrun_cost": round(overrun, 2),
        "remaining_months": round(remaining, 2)
    }


# ─── Legacy task endpoints ───────────────────────────────────────────────────

@router.post("/tasks", response_model=TaskResponse)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db), current_manager: User = Depends(get_current_manager)):
    project = db.query(Project).filter(Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.manager_id != current_manager.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    assignee = db.query(User).filter(User.id == task_in.assigned_to, User.role == "EMP").first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Employee not found")
    new_task = Task(
        project_id=task_in.project_id,
        title=task_in.title,
        assigned_to=task_in.assigned_to,
        expected_hours=task_in.expected_hours,
        priority=task_in.priority or "MEDIUM",
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.get("/employees", response_model=List[UserResponse])
def get_employees(db: Session = Depends(get_db), current_manager: User = Depends(get_current_manager)):
    return db.query(User).filter(User.role == "EMP").all()


# ─── Centralized Resource Pool CRUD Endpoints ───────────────────────────────

class CentralizedResourceCreate(BaseModel):
    employee_id: str
    name: str
    email: str
    grade: str
    role_practice: str
    hourly_billing_rate: float
    cost_rate: float
    skill_category: Optional[str] = None
    status: Optional[str] = "Available"
    region: Optional[str] = "GLOBAL"
    manager_email: Optional[str] = None

@router.get("/centralized-resources")
def get_centralized_resources(db: Session = Depends(get_db), current_user: User = Depends(get_current_manager)):
    from app.models.resource import CentralizedResource
    
    resources = db.query(CentralizedResource).all()
    
    # Calculate actual booking hours dynamically from project node assignments
    projects = db.query(ApprovedProject).all()
    booking_map = {}
    for p in projects:
        items = p.full_excel_data or []
        for item in items:
            person = item.get("assigned_person")
            if person and person != "Unassigned":
                hours = float(item.get("est_hours") or (float(item.get("qty", 0)) * 4))
                booking_map[person] = booking_map.get(person, 0.0) + hours
    
    result = []
    for r in resources:
        # Check dynamic hours by name or email
        dynamic_hours = booking_map.get(r.name, 0.0)
        if dynamic_hours == 0.0:
            dynamic_hours = booking_map.get(r.email, 0.0)
            
        hours = dynamic_hours
        
        # Utilization based on standard 160 hours per month
        utilization = (hours / 160) * 100
        # Determine status dynamically based on utilization
        status = "Overloaded" if utilization > 100 else "Allocated" if utilization > 0 else r.status or "Available"
        
        result.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "name": r.name,
            "email": r.email,
            "grade": r.grade,
            "role_practice": r.role_practice,
            "hourly_billing_rate": r.hourly_billing_rate,
            "cost_rate": r.cost_rate,
            "skill_category": r.skill_category,
            "status": status,
            "region": r.region,
            "manager_email": r.manager_email,
            "booking_hours": hours,
            "utilization": round(min(utilization, 120), 1)
        })
    return result

@router.post("/centralized-resources")
def create_centralized_resource(
    data: CentralizedResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    from app.models.resource import CentralizedResource
    
    # Validation and error handling for resource mismatches / duplicate identifiers
    existing = db.query(CentralizedResource).filter(
        (CentralizedResource.email == data.email) | 
        (CentralizedResource.employee_id == data.employee_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resource with this Employee ID or Email already exists.")
    
    new_res = CentralizedResource(
        employee_id=data.employee_id,
        name=data.name,
        email=data.email,
        grade=data.grade,
        role_practice=data.role_practice,
        hourly_billing_rate=data.hourly_billing_rate,
        cost_rate=data.cost_rate,
        skill_category=data.skill_category,
        status=data.status or "Available",
        region=data.region or "GLOBAL",
        manager_email=data.manager_email or current_user.email
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    return new_res

@router.delete("/centralized-resources/{resource_id}")
def delete_centralized_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    from app.models.resource import CentralizedResource
    res = db.query(CentralizedResource).filter(CentralizedResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.delete(res)
    db.commit()
    return {"status": "success", "message": "Resource deleted"}

