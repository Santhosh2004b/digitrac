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
    if current_manager.role == "VP" or current_manager.role == "PC":
        query = db.query(ApprovedProject)
    else:
        query = db.query(ApprovedProject).filter(ApprovedProject.assigned_manager_email == current_manager.email)
    
    projects = query.all()
    result = []
    
    for p in projects:
        full_data = p.full_excel_data
        items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
        project_info = full_data.get("project_info", {}) if isinstance(full_data, dict) else {}

        if not items and region != "GLOBAL":
            continue

        proj_model = db.query(Project).filter(Project.name == p.project_name).first()
        target_margin_pct = (proj_model.margin_target_pct or 0.0) if proj_model else 0.0
        original_margin_pct = (proj_model.margin_pct_baseline or 0.0) if proj_model else 0.0
        sell_value = proj_model.total_sell_price_with_gst if proj_model and (proj_model.total_sell_price_with_gst or 0) > 0 else ((proj_model.sale_value or 0.0) if proj_model else 0.0)
        baseline_cost = (proj_model.total_cost_price or 0.0) if proj_model else 0.0
        duration = (proj_model.duration_months or 0.0) if proj_model else 0.0
        
        total_planned_hours = 0.0
        total_actual_hours = 0.0
        total_implementation_cost = 0.0
        total_forecasted_implementation_cost = 0.0
        
        traffic_light = "Green" # Default

        for idx, i in enumerate(items):
            p_hrs = float(i.get("planned_hours", 0.0))
            a_hrs = float(i.get("actual_hours", 0.0))
            c_per_hr = float(i.get("cost_per_hour", 0.0))
            r_cost = float(i.get("resource_cost", 0.0))
            planned_r_cost = p_hrs * c_per_hr
            
            t_cost = float(i.get("travel_cost", 0.0))
            f_cost = float(i.get("food_cost", 0.0))
            s_cost = float(i.get("stay_cost", 0.0))
            o_cost = float(i.get("other_cost", 0.0))
            
            item_total_actual_cost = r_cost + t_cost + f_cost + s_cost + o_cost
            item_total_planned_cost = planned_r_cost + t_cost + f_cost + s_cost + o_cost
            
            total_planned_hours += p_hrs
            total_actual_hours += a_hrs
            total_implementation_cost += item_total_actual_cost
            total_forecasted_implementation_cost += max(item_total_actual_cost, item_total_planned_cost)

        current_total_cost = baseline_cost + total_implementation_cost
        current_margin_amt = sell_value - current_total_cost
        current_margin_pct = (current_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
        
        forecast_total_cost = baseline_cost + total_forecasted_implementation_cost
        forecast_margin_amt = sell_value - forecast_total_cost
        forecast_margin_pct = (forecast_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
        
        hours_consumed_pct = (total_actual_hours / total_planned_hours * 100) if total_planned_hours > 0 else 0
        
        if total_actual_hours > total_planned_hours or current_margin_pct <= target_margin_pct:
            traffic_light = "Red"
        elif hours_consumed_pct > 50 and current_margin_pct < original_margin_pct:
            traffic_light = "Orange"

        result.append({
            "id": p.id,
            "name": p.project_name,
            "customer_name": project_info.get("customer_name") or "N/A",
            "manager_name": p.assigned_manager_email.split('@')[0].capitalize(),
            "duration": duration,
            "status": traffic_light,
            "kpis": {
                "planned_hours": total_planned_hours,
                "actual_hours": total_actual_hours,
                "progress_pct": round(hours_consumed_pct, 1),
                "target_margin_pct": round(target_margin_pct, 2),
                "current_margin_pct": round(current_margin_pct, 2),
                "forecast_margin_pct": round(forecast_margin_pct, 2),
                "planned_cost": baseline_cost,
                "actual_cost": current_total_cost
            },
            "assigned_at": p.created_at.isoformat() if p.created_at else None
        })
    return result

class TaskAssignmentInput(BaseModel):
    assigned_person: str
    employee_id: str = None
    start_date: str = None
    planned_hours: float = 0.0
    travel_cost: float = 0.0
    food_cost: float = 0.0
    stay_cost: float = 0.0
    other_cost: float = 0.0

@router.post("/projects/{project_id}/items/{item_id}/assign")
def assign_item_task(
    project_id: int,
    item_id: str,
    assignment: TaskAssignmentInput,
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
        raise HTTPException(status_code=404, detail="Project not found or unauthorized.")

    full_data = project.full_excel_data
    items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
    workforce = full_data.get("workforce_budget", []) if isinstance(full_data, dict) else []
    
    updated = False
    
    for idx, i in enumerate(items):
        node_id = i.get("id") if i.get("id") is not None else str(i.get("sap_id") or i.get("SAP Material ID", ""))
        if not node_id:
            node_id = str(idx)
        
        if str(node_id) == str(item_id) or str(idx) == str(item_id):
            from app.models.resource import CentralizedResource
            # Find grade from central resource
            res_obj = db.query(CentralizedResource).filter(
                (CentralizedResource.name == assignment.assigned_person) | 
                (CentralizedResource.employee_id == assignment.employee_id)
            ).first()
            
            grade = res_obj.grade if res_obj else "N/A"
            cost_per_hour = 0.0
            
            # Fetch cost from workforce budget
            for wf in workforce:
                if wf.get("Grade") == grade:
                    cost_per_hour = float(wf.get("Manpower Cost/Hour", 0))
                    break
            
            resource_cost = assignment.planned_hours * cost_per_hour
            total_imp_cost = resource_cost + assignment.travel_cost + assignment.food_cost + assignment.stay_cost + assignment.other_cost
            
            # Intelligent End Date Calculation (9am - 5pm, 5 Days/Week)
            from datetime import datetime, timedelta
            
            end_date_str = assignment.start_date
            if assignment.planned_hours > 0:
                try:
                    s_date = datetime.strptime(assignment.start_date, "%Y-%m-%d")
                    current_time = datetime.now()
                    
                    hours_remaining_today = 8.0
                    if s_date.date() == current_time.date():
                        curr_hour = current_time.hour + (current_time.minute / 60.0)
                        if curr_hour < 9:
                            hours_remaining_today = 8.0
                        elif curr_hour >= 17:
                            hours_remaining_today = 0.0
                        else:
                            hours_remaining_today = 17.0 - curr_hour
                            
                    if s_date.weekday() >= 5: # Weekend
                        hours_remaining_today = 0.0
                        
                    rem_hrs = assignment.planned_hours
                    curr_proc_date = s_date
                    
                    if rem_hrs <= hours_remaining_today:
                        end_date_str = curr_proc_date.strftime("%Y-%m-%d")
                    else:
                        rem_hrs -= hours_remaining_today
                        while rem_hrs > 0:
                            curr_proc_date += timedelta(days=1)
                            if curr_proc_date.weekday() < 5:
                                if rem_hrs <= 8.0:
                                    rem_hrs = 0
                                else:
                                    rem_hrs -= 8.0
                        end_date_str = curr_proc_date.strftime("%Y-%m-%d")
                except:
                    pass
            
            planned_days = assignment.planned_hours / 8.0
            
            i.update({
                "assigned_person": assignment.assigned_person,
                "employee_id": res_obj.employee_id if res_obj else assignment.employee_id,
                "grade": grade,
                "start_date": assignment.start_date,
                "end_date": end_date_str,
                "planned_hours": assignment.planned_hours,
                "actual_hours": i.get("actual_hours", 0.0),
                "cost_per_hour": cost_per_hour,
                "resource_cost": resource_cost,
                "travel_cost": assignment.travel_cost,
                "food_cost": assignment.food_cost,
                "stay_cost": assignment.stay_cost,
                "other_cost": assignment.other_cost,
                "total_implementation_cost": total_imp_cost,
                "planned_days": round(planned_days, 2),
                "status": "Assigned"
            })
            updated = True
            break
            
    if not updated:
        raise HTTPException(status_code=404, detail="Mission node not found in project.")

    from sqlalchemy.orm.attributes import flag_modified
    if isinstance(project.full_excel_data, dict):
        project.full_excel_data["project_costing"] = items
    else:
        project.full_excel_data = items
    flag_modified(project, "full_excel_data")
    db.commit()
    return {"status": "success", "message": "Resource allocated successfully"}

class LogHoursInput(BaseModel):
    date: str
    hours: float
    remarks: str = ""

@router.post("/projects/{project_id}/items/{item_id}/log-hours")
def log_item_hours(
    project_id: int,
    item_id: str,
    log_data: LogHoursInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    import copy
    new_full_data = copy.deepcopy(project.full_excel_data)
    items_to_update = new_full_data.get("project_costing", []) if isinstance(new_full_data, dict) else (new_full_data or [])
    
    updated = False
    target_item = None
    
    for idx, i in enumerate(items_to_update):
        node_id = i.get("id") if i.get("id") is not None else str(i.get("sap_id") or i.get("SAP Material ID", ""))
        if not node_id:
            node_id = str(idx)
        
        if str(node_id) == str(item_id) or str(idx) == str(item_id):
            curr_actual = float(i.get("actual_hours", 0.0))
            new_actual = curr_actual + log_data.hours
            
            cost_per_hour = float(i.get("cost_per_hour", 0.0))
            new_res_cost = new_actual * cost_per_hour
            
            travel = float(i.get("travel_cost", 0.0))
            food = float(i.get("food_cost", 0.0))
            stay = float(i.get("stay_cost", 0.0))
            other = float(i.get("other_cost", 0.0))
            
            total_imp_cost = new_res_cost + travel + food + stay + other
            
            i.update({
                "actual_hours": new_actual,
                "resource_cost": new_res_cost, # Note: using actuals for cost here to track live margins
                "total_implementation_cost": total_imp_cost
            })
            updated = True
            target_item = i
            break
            
    if not updated:
        raise HTTPException(status_code=404, detail="Mission node not found in project.")

    from sqlalchemy.orm.attributes import flag_modified
    if isinstance(new_full_data, dict):
        new_full_data["project_costing"] = items_to_update
    else:
        new_full_data = items_to_update
        
    project.full_excel_data = new_full_data
    flag_modified(project, "full_excel_data")
    db.commit()
    
    # Calculate Project Level Totals for Escalation
    proj_model = db.query(Project).filter(Project.name == project.project_name).first()

    # Also log to timelogs table for history
    from app.models.timelog import TimeLog
    new_log = TimeLog(
        project_id=proj_model.id if proj_model else None,
        node_id=str(item_id),
        user_id=current_user.id,
        hours=log_data.hours,
        remarks=log_data.remarks
    )
    db.add(new_log)
    db.commit()
    
    target_margin_pct = (proj_model.margin_target_pct or 0.0) if proj_model else 0.0
    sell_value = proj_model.total_sell_price_with_gst if proj_model and (proj_model.total_sell_price_with_gst or 0) > 0 else ((proj_model.sale_value or 0.0) if proj_model else 0.0)
    baseline_cost = (proj_model.total_cost_price or 0.0) if proj_model else 0.0
    
    total_planned_hours = 0.0
    total_actual_hours = 0.0
    total_implementation_cost = 0.0
    total_forecasted_implementation_cost = 0.0

    for i in items:
        p_hrs = float(i.get("planned_hours", 0.0))
        a_hrs = float(i.get("actual_hours", 0.0))
        c_per_hr = float(i.get("cost_per_hour", 0.0))
        r_cost = float(i.get("resource_cost", 0.0))
        planned_r_cost = p_hrs * c_per_hr
        
        t_cost = float(i.get("travel_cost", 0.0))
        f_cost = float(i.get("food_cost", 0.0))
        s_cost = float(i.get("stay_cost", 0.0))
        o_cost = float(i.get("other_cost", 0.0))
        
        item_total_actual_cost = r_cost + t_cost + f_cost + s_cost + o_cost
        item_total_planned_cost = planned_r_cost + t_cost + f_cost + s_cost + o_cost
        
        total_planned_hours += p_hrs
        total_actual_hours += a_hrs
        total_implementation_cost += item_total_actual_cost
        total_forecasted_implementation_cost += max(item_total_actual_cost, item_total_planned_cost)

    current_total_cost = baseline_cost + total_implementation_cost
    current_margin_amt = sell_value - current_total_cost
    current_margin_pct = (current_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
    
    forecast_total_cost = baseline_cost + total_forecasted_implementation_cost
    forecast_margin_amt = sell_value - forecast_total_cost
    forecast_margin_pct = (forecast_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
    
    trigger_reason = None
    if current_margin_pct < target_margin_pct:
        trigger_reason = f"Current Margin ({current_margin_pct:.1f}%) dropped below Target ({target_margin_pct:.1f}%)"
    elif forecast_margin_pct < target_margin_pct:
        trigger_reason = f"Forecast Margin ({forecast_margin_pct:.1f}%) projected below Target ({target_margin_pct:.1f}%)"
    elif total_planned_hours > 0 and total_actual_hours > (total_planned_hours * 1.10):
        trigger_reason = f"Hours Variance exceeded 10% (Actual: {total_actual_hours}, Planned: {total_planned_hours})"
    
    if trigger_reason:
        from app.models.requests import MarginEscalation
        from app.models.workflow import InAppNotification
        # Check if already open
        existing = db.query(MarginEscalation).filter(MarginEscalation.project_id == project_id, MarginEscalation.status == "OPEN").first()
        if not existing:
            new_esc = MarginEscalation(
                project_id=project_id,
                target_margin=target_margin_pct,
                current_margin=current_margin_pct,
                forecast_margin=forecast_margin_pct,
                trigger_reason=trigger_reason,
                status="OPEN",
                escalated_to=project.approved_by or "vp@arche.global"
            )
            db.add(new_esc)
            
            new_notif = InAppNotification(
                recipient_email=project.approved_by or "vp@arche.global",
                priority="CRITICAL",
                type="ESCALATION",
                title=f"Margin Escalation: {project.project_name}",
                message=trigger_reason
            )
            db.add(new_notif)
            
            # Notifying PM softly
            new_notif_pm = InAppNotification(
                recipient_email=project.assigned_manager_email,
                priority="WARNING",
                type="MARGIN",
                title=f"Warning: Margin Risk on {project.project_name}",
                message=trigger_reason
            )
            db.add(new_notif_pm)
            
            db.commit()

    # Intelligence Feed Generation
    from app.models.intelligence import IntelligenceEvent
    
    # 1. Standard Hours Event
    p_hrs = float(target_item.get('planned_hours', 1) or 1)
    a_hrs = float(target_item.get('actual_hours', 0))
    util_pct = round((a_hrs / p_hrs) * 100, 1)
    
    intel_hrs = IntelligenceEvent(
        project_id=project.id,
        project_name=project.project_name,
        sap_node_id=item_id,
        sap_node_name=target_item.get("description") or target_item.get("Description", "Unknown Node"),
        category="HOURS",
        priority="INFO",
        message=f"{log_data.hours} Hours logged by {target_item.get('assigned_person', 'Resource')}." + (f" ({log_data.remarks})" if log_data.remarks else ""),
        metrics={
            "Actual / Planned": f"{a_hrs} / {target_item.get('planned_hours', 0)} Hrs",
            "Utilization": f"{util_pct}%"
        }
    )
    db.add(intel_hrs)
    
    # 2. Margin Event
    if trigger_reason:
        priority = "CRITICAL" if "exceeded" in trigger_reason else "WARNING"
        intel_margin = IntelligenceEvent(
            project_id=project.id,
            project_name=project.project_name,
            sap_node_id=item_id,
            category="MARGIN",
            priority=priority,
            message=trigger_reason,
            metrics={
                "Target Margin": f"{target_margin_pct:.1f}%",
                "Current Margin": f"{current_margin_pct:.1f}%",
                "Forecast Margin": f"{forecast_margin_pct:.1f}%"
            }
        )
        db.add(intel_margin)
    elif current_margin_pct >= target_margin_pct and total_actual_hours > 0:
        intel_margin = IntelligenceEvent(
            project_id=project.id,
            project_name=project.project_name,
            sap_node_id=item_id,
            category="MARGIN",
            priority="SUCCESS",
            message="Project operating above approved margin threshold.",
            metrics={
                "Target Margin": f"{target_margin_pct:.1f}%",
                "Current Margin": f"{current_margin_pct:.1f}%",
                "Forecast Margin": f"{forecast_margin_pct:.1f}%"
            }
        )
        db.add(intel_margin)
        
    db.commit()

    return {"status": "success", "message": "Hours logged successfully"}


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
        items = p.full_excel_data.get("project_costing", []) if isinstance(p.full_excel_data, dict) else (p.full_excel_data or [])
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
    if current_user.role == "VP" or current_user.role == "PC":
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    else:
        project = db.query(ApprovedProject).filter(
            ApprovedProject.id == project_id,
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not assigned to you.")

    full_data = project.full_excel_data
    items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
    project_info = full_data.get("project_info", {}) if isinstance(full_data, dict) else {}

    ma = db.query(MissionAssignment).filter(
        MissionAssignment.mission_name == project.project_name,
        MissionAssignment.manager_email == current_user.email
    ).first()
    artifact_path = ma.artifact_path if ma else None

    # Fetch DB Project for base financials
    proj_model = db.query(Project).filter(Project.name == project.project_name).first()
    target_margin_pct = (proj_model.margin_target_pct or 0.0) if proj_model else 0.0
    original_margin_pct = (proj_model.margin_pct_baseline or 0.0) if proj_model else 0.0
    sell_value = proj_model.total_sell_price_with_gst if proj_model and (proj_model.total_sell_price_with_gst or 0) > 0 else ((proj_model.sale_value or 0.0) if proj_model else 0.0)
    baseline_cost = (proj_model.total_cost_price or 0.0) if proj_model else 0.0

    resource_data = []
    
    total_planned_hours = 0.0
    total_actual_hours = 0.0
    total_implementation_cost = 0.0
    total_forecasted_implementation_cost = 0.0
    
    traffic_light = "Green" # Default

    for idx, i in enumerate(items):
        node_id = i.get("id") if i.get("id") is not None else str(i.get("sap_id") or i.get("SAP Material ID", ""))
        if not node_id:
            node_id = str(idx)
        
        p_hrs = float(i.get("planned_hours", 0.0))
        a_hrs = float(i.get("actual_hours", 0.0))
        c_per_hr = float(i.get("cost_per_hour", 0.0))
        r_cost = float(i.get("resource_cost", 0.0)) # this is actual cost currently
        
        planned_r_cost = p_hrs * c_per_hr
        
        t_cost = float(i.get("travel_cost", 0.0))
        f_cost = float(i.get("food_cost", 0.0))
        s_cost = float(i.get("stay_cost", 0.0))
        o_cost = float(i.get("other_cost", 0.0))
        
        item_total_actual_cost = r_cost + t_cost + f_cost + s_cost + o_cost
        item_total_planned_cost = planned_r_cost + t_cost + f_cost + s_cost + o_cost
        
        total_planned_hours += p_hrs
        total_actual_hours += a_hrs
        total_implementation_cost += item_total_actual_cost
        
        # Forecast cost: if actual > planned, use actual, else use planned
        total_forecasted_implementation_cost += max(item_total_actual_cost, item_total_planned_cost)
        
        utilization = (a_hrs / p_hrs * 100) if p_hrs > 0 else 0
        
        resource_data.append({
            "id": node_id,
            "sap_id": i.get("sap_id") or i.get("SAP Material ID") or i.get("Sl.No"),
            "task_name": i.get("description") or i.get("Description") or "N/A",
            "name": i.get("assigned_person") or "Unassigned",
            "employee_id": i.get("employee_id") or "N/A",
            "grade": i.get("grade") or "N/A",
            "planned_hours": p_hrs,
            "actual_hours": a_hrs,
            "remaining_hours": max(0, p_hrs - a_hrs),
            "utilization": round(utilization, 2),
            "cost_per_hour": c_per_hr,
            "resource_cost": r_cost,
            "total_implementation_cost": item_total_actual_cost,
            "planned_days": i.get("planned_days", 0),
            "start_date": i.get("start_date"),
            "end_date": i.get("end_date"),
            "status": i.get("status", "Pending")
        })

    # Calculations
    current_total_cost = baseline_cost + total_implementation_cost
    current_margin_amt = sell_value - current_total_cost
    current_margin_pct = (current_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
    
    forecast_total_cost = baseline_cost + total_forecasted_implementation_cost
    forecast_margin_amt = sell_value - forecast_total_cost
    forecast_margin_pct = (forecast_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
    
    margin_variance = current_margin_pct - target_margin_pct
    
    hours_variance = total_actual_hours - total_planned_hours
    hours_consumed_pct = (total_actual_hours / total_planned_hours * 100) if total_planned_hours > 0 else 0
    
    # Traffic Light Logic
    if total_actual_hours > total_planned_hours or current_margin_pct <= target_margin_pct:
        traffic_light = "Red"
    elif hours_consumed_pct > 50 and current_margin_pct < original_margin_pct:
        traffic_light = "Orange"

    kpis = {
        "planned_hours": total_planned_hours,
        "actual_hours": total_actual_hours,
        "hours_variance": hours_variance,
        "planned_cost": baseline_cost + sum(r["planned_hours"] * r["cost_per_hour"] for r in resource_data),
        "actual_cost": current_total_cost,
        "cost_variance": current_total_cost - (baseline_cost + sum(r["planned_hours"] * r["cost_per_hour"] for r in resource_data)),
        "target_margin_pct": target_margin_pct,
        "current_margin_pct": current_margin_pct,
        "forecast_margin_pct": forecast_margin_pct,
        "margin_variance": margin_variance,
        "traffic_light": traffic_light,
        "total_revenue": sell_value,
        "duration_months": proj_model.duration_months if proj_model else 0
    }

    return {
        "id": project.id,
        "name": project.project_name,
        "resources": resource_data,
        "kpis": kpis,
        "status": traffic_light,
        "approved_by": project.approved_by,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "artifact_path": artifact_path,
        "assigned_at": project.created_at.isoformat() if project.created_at else None
    }

@router.get("/projects/{project_id}/approved-data")
def get_project_approved_data(
    project_id: int,
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
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": project.id,
        "full_excel_data": project.full_excel_data
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
        raw = p.full_excel_data or []
        items = raw.get("project_costing", []) if isinstance(raw, dict) else raw
        for item in items:
            if not isinstance(item, dict):
                continue
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

