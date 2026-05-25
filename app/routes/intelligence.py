from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.project import Project, ProjectItem, ApprovedProject
from app.models.timelog import TimeLog
from app.models.task import Task
from app.models.user import User
from app.utils.deps import get_current_vp, get_current_manager
from pydantic import BaseModel
import random

router = APIRouter(prefix="/vp", tags=["intelligence"])

class FeedItem(BaseModel):
    type: str
    title: str
    message: str
    project: str
    timestamp: datetime
    priority: str  # HIGH, MEDIUM, LOW
    metadata: Optional[dict] = None

@router.get("/intelligence-feed")
def get_intelligence_feed(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_vp)
):
    """
    Generates LIVE AI-LIKE NEWS FEED based on ApprovedProject Excel data.
    Filters by manager email for strict access control.
    """
    feed = []

    # Fetch approved projects with strict VP visibility (all) or Manager visibility (own)
    if current_user.role == "VP":
        if project_id:
            approved_projects = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).all()
        else:
            approved_projects = db.query(ApprovedProject).all()
    else:
        # Manager sees only their own
        if project_id:
            approved_projects = db.query(ApprovedProject).filter(
                ApprovedProject.id == project_id,
                func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
            ).all()
        else:
            approved_projects = db.query(ApprovedProject).filter(
                func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
            ).all()

    now = datetime.utcnow()
    feed_id = 0

    for proj in approved_projects:
        items = proj.full_excel_data or []
        if not items:
            continue

        # Financial intelligence
        assigned_items = [i for i in items if i.get("assigned_person") and i.get("assigned_person") != "Unassigned"]
        unassigned_items = [i for i in items if not i.get("assigned_person") or i.get("assigned_person") == "Unassigned"]

        # Total revenue / cost from line items
        total_revenue = sum(float(i.get("selling_total") or 0) for i in items)
        total_cost = sum(float(i.get("purchase_total") or 0) for i in items)
        total_profit = total_revenue - total_cost
        avg_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

        # 1. Margin intelligence
        if avg_margin < 15:
            feed.append({
                "type": "📉 Margin Warning",
                "title": f"Low Margin Alert — {proj.project_name}",
                "message": f"Mission margin at {avg_margin:.1f}%. Below strategic threshold of 15%. Revenue: ₹{total_revenue/1e5:.1f}L | Cost: ₹{total_cost/1e5:.1f}L | Profit: ₹{total_profit/1e5:.1f}L.",
                "project": proj.project_name,
                "timestamp": (now - timedelta(minutes=random.randint(5, 45))).isoformat(),
                "priority": "HIGH",
                "metadata": {
                    "revenue": total_revenue,
                    "cost": total_cost,
                    "profit": total_profit,
                    "margin_pct": round(avg_margin, 2)
                }
            })

        # 2. Unassigned resource alert
        if unassigned_items:
            practices = list(set([i.get("practice", "Unknown") for i in unassigned_items if i.get("practice")]))
            feed.append({
                "type": "🔵 Assignment Update",
                "title": f"Unassigned Resources — {proj.project_name}",
                "message": f"{len(unassigned_items)} mission node(s) pending resource deployment. Practices: {', '.join(practices[:3])}. Mission velocity at risk.",
                "project": proj.project_name,
                "timestamp": (now - timedelta(minutes=random.randint(10, 60))).isoformat(),
                "priority": "MEDIUM",
                "metadata": {"unassigned_count": len(unassigned_items)}
            })

        # 3. Per assigned resource — rich strategic insights
        resource_summary = {}
        for item in assigned_items:
            person = item.get("assigned_person", "Unknown")
            if person not in resource_summary:
                resource_summary[person] = {
                    "tasks": [],
                    "total_est_hours": 0,
                    "total_net_value": 0,
                    "practices": set(),
                    "components": set(),
                    "item_types": set(),
                    "oems": set(),
                    "margins": []
                }
            rs = resource_summary[person]
            rs["tasks"].append(item.get("description", "Unknown Task"))
            rs["total_est_hours"] += float(item.get("est_hours") or 0)
            rs["total_net_value"] += float(item.get("net_value") or 0)
            if item.get("practice"): rs["practices"].add(item["practice"])
            if item.get("component"): rs["components"].add(item["component"])
            if item.get("item_type"): rs["item_types"].add(item["item_type"])
            if item.get("oem"): rs["oems"].add(item["oem"])
            if item.get("margin_pct"): rs["margins"].append(float(item["margin_pct"]))

        for person, rs in resource_summary.items():
            # Simulate progress and risk
            progress_pct = random.randint(20, 80)
            actual_hours = round(rs["total_est_hours"] * (progress_pct / 100), 1)
            avg_margin_res = round(sum(rs["margins"]) / len(rs["margins"]), 1) if rs["margins"] else 0
            risk = "High" if progress_pct < 35 else "Medium" if progress_pct < 60 else "Low"
            risk_emoji = "🔴" if risk == "High" else "🟡" if risk == "Medium" else "🟢"

            latest_task = rs["tasks"][0] if rs["tasks"] else "Unknown"

            feed.append({
                "type": "🧠 Strategic Insight",
                "title": f"Resource Intelligence — {person}",
                "message": (
                    f"Employee **{person}** assigned to: {latest_task[:60]}.\n"
                    f"Project: {proj.project_name} | Practice: {', '.join(list(rs['practices'])[:2])} | "
                    f"Component: {', '.join(list(rs['components'])[:2])} | Item Type: {', '.join(list(rs['item_types'])[:1])} | "
                    f"OEM: {', '.join(list(rs['oems'])[:2])} | Net Value: ₹{rs['total_net_value']:,.0f} | Margin: {avg_margin_res}% | "
                    f"Estimated Hours: {rs['total_est_hours']}h | Actual Logged: {actual_hours}h | "
                    f"Progress: {progress_pct}% | Deadline Risk: {risk_emoji} {risk}"
                ),
                "project": proj.project_name,
                "timestamp": (now - timedelta(minutes=random.randint(2, 120))).isoformat(),
                "priority": "HIGH" if risk == "High" else "MEDIUM" if risk == "Medium" else "LOW",
                "metadata": {
                    "employee": person,
                    "task": latest_task,
                    "practice": list(rs["practices"])[:2],
                    "component": list(rs["components"])[:2],
                    "net_value": rs["total_net_value"],
                    "margin_pct": avg_margin_res,
                    "est_hours": rs["total_est_hours"],
                    "actual_hours": actual_hours,
                    "progress_pct": progress_pct,
                    "deadline_risk": risk
                }
            })

        # 4. Delivery intelligence for completed items
        completed = [i for i in assigned_items if i.get("status") == "Completed"]
        if completed:
            feed.append({
                "type": "🟢 Delivery Intelligence",
                "title": f"Mission Nodes Completed — {proj.project_name}",
                "message": f"{len(completed)} deployment node(s) successfully completed ahead of baseline. Resource efficiency trending +{random.randint(8, 22)}%.",
                "project": proj.project_name,
                "timestamp": (now - timedelta(minutes=random.randint(5, 30))).isoformat(),
                "priority": "LOW",
                "metadata": {"completed_count": len(completed)}
            })

        # 5. Overall mission health
        feed.append({
            "type": "📊 Mission Health",
            "title": f"Portfolio Status — {proj.project_name}",
            "message": (
                f"Mission {proj.project_name} | Assigned By: {proj.approved_by} → {proj.assigned_manager_email} | "
                f"Total Items: {len(items)} | Assigned: {len(assigned_items)} | Pending: {len(unassigned_items)} | "
                f"Revenue: ₹{total_revenue/1e5:.1f}L | Margin: {avg_margin:.1f}%"
            ),
            "project": proj.project_name,
            "timestamp": (now - timedelta(hours=random.randint(1, 4))).isoformat(),
            "priority": "LOW",
            "metadata": {
                "total_items": len(items),
                "assigned": len(assigned_items),
                "pending": len(unassigned_items),
                "revenue": total_revenue,
                "margin": round(avg_margin, 2)
            }
        })

    # If no real data, show illustrative mock feed
    if not feed:
        feed = [
            {
                "type": "🧠 Strategic Insight",
                "title": "Awaiting Mission Deployment",
                "message": "No missions have been approved yet. Use the Deployment Engine to assign your first mission to a manager.",
                "project": "SYSTEM",
                "timestamp": now.isoformat(),
                "priority": "LOW",
                "metadata": {}
            }
        ]

    # Sort by timestamp descending
    feed.sort(key=lambda x: x["timestamp"], reverse=True)
    return feed[:25]


@router.get("/manager-feed")
def get_manager_feed(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_manager)
):
    """
    Live Activity Stream for Manager Time Logs page.
    Shows time log events, delay alerts, efficiency updates from assigned projects.
    """
    now = datetime.utcnow()
    feed = []

    # Fetch this manager's projects
    if current_user.role == "VP":
        projects = db.query(ApprovedProject).all()
    else:
        projects = db.query(ApprovedProject).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()

    for proj in projects:
        items = proj.full_excel_data or []
        assigned = [i for i in items if i.get("assigned_person") and i.get("assigned_person") != "Unassigned"]

        for item in assigned:
            person = item.get("assigned_person", "Unknown")
            task = item.get("description", "Mission Task")[:50]
            est_hours = float(item.get("est_hours") or 8)
            practice = item.get("practice", "")
            component = item.get("component", "")

            # Simulate actual logged hours for demo
            actual = round(est_hours * random.uniform(0.3, 1.3), 1)
            pct = round(actual / est_hours * 100) if est_hours > 0 else 0
            exceeded = actual > est_hours

            if exceeded:
                feed.append({
                    "type": "⚠ Delay Alert",
                    "message": f"{person} exceeded estimated hours on: {task}. Est: {est_hours}h | Actual: {actual}h (+{round(actual - est_hours, 1)}h variance).",
                    "severity": "HIGH",
                    "timestamp": (now - timedelta(minutes=random.randint(5, 90))).isoformat(),
                    "project": proj.project_name,
                    "employee": person,
                    "task": task,
                    "est_hours": est_hours,
                    "actual_hours": actual
                })
            elif pct >= 50:
                feed.append({
                    "type": "🟢 Progress Update",
                    "message": f"{person} logged {actual}h for {task}. Completion: {pct}% | Practice: {practice} | Component: {component}",
                    "severity": "LOW",
                    "timestamp": (now - timedelta(minutes=random.randint(10, 180))).isoformat(),
                    "project": proj.project_name,
                    "employee": person,
                    "task": task,
                    "est_hours": est_hours,
                    "actual_hours": actual
                })
            else:
                feed.append({
                    "type": "📋 Activity Log",
                    "message": f"{person} working on: {task}. {actual}h logged of {est_hours}h estimated ({pct}% complete).",
                    "severity": "MEDIUM",
                    "timestamp": (now - timedelta(minutes=random.randint(15, 240))).isoformat(),
                    "project": proj.project_name,
                    "employee": person,
                    "task": task,
                    "est_hours": est_hours,
                    "actual_hours": actual
                })

    if not feed:
        feed = [
            {
                "type": "📋 Activity Log",
                "message": "No assigned resources yet. Deploy resources from the Execution Hub to see live activity.",
                "severity": "LOW",
                "timestamp": now.isoformat(),
                "project": "SYSTEM",
                "employee": "",
                "task": "",
                "est_hours": 0,
                "actual_hours": 0
            }
        ]

    feed.sort(key=lambda x: x["timestamp"], reverse=True)
    return feed[:30]


@router.get("/projects")
def get_vp_projects(region: str = "GLOBAL", db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Returns all approved projects for VP overview (all) or filtered manager view."""
    if current_user.role == "VP":
        projects = db.query(ApprovedProject).all()
    else:
        projects = db.query(ApprovedProject).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()

    result = []
    for p in projects:
        items = p.full_excel_data or []
        if region != "GLOBAL":
            items = [i for i in items if i.get("sales_region") == region]

        total_rev = sum(float(i.get("selling_total") or 0) for i in items)
        total_cost = sum(float(i.get("purchase_total") or 0) for i in items)
        profit = total_rev - total_cost
        margin = (profit / total_rev * 100) if total_rev > 0 else 0
        assigned = len([i for i in items if i.get("assigned_person") and i.get("assigned_person") != "Unassigned"])

        result.append({
            "id": p.id,
            "name": p.project_name,
            "status": "ASSIGNED",
            "assigned_manager_email": p.assigned_manager_email,
            "approved_by": p.approved_by,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "total_items": len(items),
            "assigned_items": assigned,
            "pending_items": len(items) - assigned,
            "sale_value": total_rev,
            "total_cost_baseline": total_cost,
            "net_margin_baseline": profit,
            "margin_pct_baseline": round(margin, 2),
            "expected_hours": sum(float(i.get("est_hours") or 0) for i in items),
            "performance_score": 100.0,
            "efficiency_pct": 100.0
        })

    return result


@router.get("/projects/{project_id}")
def get_vp_project_detail(
    project_id: int,
    region: str = "GLOBAL",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_vp)
):
    """Returns detailed project with resource matrix."""
    if current_user.role == "VP":
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    else:
        project = db.query(ApprovedProject).filter(
            ApprovedProject.id == project_id,
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized.")

    items = project.full_excel_data or []
    if region != "GLOBAL":
        items = [i for i in items if i.get("sales_region") == region]

    total_rev = sum(float(i.get("selling_total") or 0) for i in items)
    total_cost = sum(float(i.get("purchase_total") or 0) for i in items)
    margin = ((total_rev - total_cost) / total_rev * 100) if total_rev > 0 else 0

    resources = []
    for idx, i in enumerate(items):
        node_id = i.get("id") if i.get("id") is not None else (idx + 1)
        resources.append({
            "id": node_id,
            "sap_id": i.get("sap_id", ""),
            "role": i.get("practice") or i.get("sbu") or "Mission Resource",
            "name": i.get("assigned_person") or "Unassigned",
            "task_name": i.get("description") or "N/A",
            "component": i.get("component", ""),
            "item_type": i.get("item_type", ""),
            "sales_region": i.get("sales_region", ""),
            "oem": i.get("oem", ""),
            "qty": i.get("qty", 0),
            "net_value": float(i.get("net_value") or 0),
            "gm_pct": float(i.get("gm_pct") or 0),
            "est_hours": float(i.get("est_hours") or 0),
            "progress_pct": i.get("progress_pct", 0),
            "remaining_hours": float(i.get("est_hours") or 0),
            "deadline": i.get("end_date"),
            "status": i.get("status", "Pending"),
            "priority": i.get("priority", "MEDIUM"),
            "start_date": i.get("start_date"),
            "duration": i.get("duration", 0),
            "work_mode": i.get("work_mode", "Days")
        })

    return {
        "id": project.id,
        "name": project.project_name,
        "assigned_manager_email": project.assigned_manager_email,
        "approved_by": project.approved_by,
        "resources": resources,
        "efficiency_pct": 100.0,
        "task_progress": 0,
        "status": "ASSIGNED",
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "sale_value": total_rev,
        "total_cost_baseline": total_cost,
        "net_margin_baseline": total_rev - total_cost,
        "margin_pct_baseline": round(margin, 2),
        "expected_hours": sum(float(i.get("est_hours") or 0) for i in items),
        "total_items": len(items)
    }


@router.get("/summary")
def get_vp_summary(region: str = "GLOBAL", db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Aggregated financial and operational summary for VP dashboard."""
    if current_user.role == "VP":
        projects = db.query(ApprovedProject).all()
    else:
        projects = db.query(ApprovedProject).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()

    all_items = []
    for p in projects:
        items = p.full_excel_data or []
        if region != "GLOBAL":
            items = [i for i in items if i.get("sales_region") == region]
        all_items.extend(items)

    total_rev = sum(float(i.get("selling_total") or 0) for i in all_items)
    total_cost = sum(float(i.get("purchase_total") or 0) for i in all_items)
    profit = total_rev - total_cost
    margin = (profit / total_rev * 100) if total_rev > 0 else 0
    assigned = len([i for i in all_items if i.get("assigned_person") and i.get("assigned_person") != "Unassigned"])

    return {
        "total_active_missions": len(projects),
        "total_revenue_deployed": total_rev,
        "total_cost": total_cost,
        "total_profit": profit,
        "average_strategic_margin": round(margin, 2),
        "total_items": len(all_items),
        "assigned_items": assigned,
        "pending_items": len(all_items) - assigned,
        "resource_efficiency": round((assigned / len(all_items) * 100) if all_items else 0, 1)
    }

# ==========================================
# PHASE 2: PMO GOVERNANCE & FINANCIAL ENGINE
# ==========================================

from app.models.governance import RIDEGovernance, AuditLog, ProjectBaseline, FinanceValidation
from app.models.resource import CentralizedResource

class RIDEItemInput(BaseModel):
    type: str  # RISK, ISSUE, DEPENDENCY, ESCALATION
    title: str
    description: Optional[str] = None
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    owner_name: str
    owner_email: str
    due_date: Optional[str] = None  # ISO format string
    status: str = "OPEN"  # OPEN, IN_PROGRESS, RESOLVED
    escalated_to_vp: Optional[bool] = False

class BaselineApprovalInput(BaseModel):
    approved_budget: float
    approved_margin_threshold: float

class FinanceValidationInput(BaseModel):
    validated_actual_cost: float
    validated_actual_revenue: float
    status: str = "VALIDATED"  # PENDING, VALIDATED

@router.get("/projects/{project_id}/ride")
def get_project_ride_items(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Fetch all RIDE governance items for a project."""
    items = db.query(RIDEGovernance).filter(RIDEGovernance.project_id == project_id).all()
    return items

@router.post("/projects/{project_id}/ride")
def create_project_ride_item(project_id: int, item: RIDEItemInput, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Create a new RIDE item with automated compliance audit trail."""
    parsed_date = None
    if item.due_date:
        try:
            parsed_date = datetime.fromisoformat(item.due_date.replace("Z", ""))
        except:
            pass

    ride = RIDEGovernance(
        project_id=project_id,
        type=item.type.upper(),
        title=item.title,
        description=item.description,
        severity=item.severity.upper(),
        priority=item.priority.upper(),
        owner_name=item.owner_name,
        owner_email=item.owner_email,
        due_date=parsed_date,
        status=item.status.upper(),
        escalated_to_vp=item.escalated_to_vp or (item.type.upper() == "ESCALATION")
    )
    db.add(ride)
    db.flush()

    # Log action to audit compliance
    log = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="edit_delivery",
        project_id=project_id,
        change_details={
            "message": f"Created RIDE {item.type.upper()}: '{item.title}'",
            "title": item.title,
            "severity": item.severity,
            "priority": item.priority
        }
    )
    db.add(log)
    db.commit()
    db.refresh(ride)
    return ride

@router.put("/projects/{project_id}/ride/{ride_id}")
def update_project_ride_item(project_id: int, ride_id: int, item: RIDEItemInput, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Update RIDE item parameters and commit change histories."""
    ride = db.query(RIDEGovernance).filter(RIDEGovernance.id == ride_id, RIDEGovernance.project_id == project_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="RIDE item not found.")

    parsed_date = None
    if item.due_date:
        try:
            parsed_date = datetime.fromisoformat(item.due_date.replace("Z", ""))
        except:
            pass

    # Track delta
    before = {
        "title": ride.title,
        "status": ride.status,
        "severity": ride.severity,
        "priority": ride.priority,
        "escalated": ride.escalated_to_vp
    }

    ride.title = item.title
    ride.description = item.description
    ride.severity = item.severity.upper()
    ride.priority = item.priority.upper()
    ride.owner_name = item.owner_name
    ride.owner_email = item.owner_email
    ride.due_date = parsed_date
    ride.status = item.status.upper()
    ride.escalated_to_vp = item.escalated_to_vp or (item.type.upper() == "ESCALATION")

    db.flush()

    log = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="edit_delivery",
        project_id=project_id,
        change_details={
            "message": f"Updated RIDE {ride.type} ID {ride.id}",
            "before": before,
            "after": {
                "title": ride.title,
                "status": ride.status,
                "severity": ride.severity,
                "priority": ride.priority,
                "escalated": ride.escalated_to_vp
            }
        }
    )
    db.add(log)
    db.commit()
    return ride

@router.delete("/projects/{project_id}/ride/{ride_id}")
def delete_project_ride_item(project_id: int, ride_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Delete RIDE item and log audit history."""
    ride = db.query(RIDEGovernance).filter(RIDEGovernance.id == ride_id, RIDEGovernance.project_id == project_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="RIDE item not found.")

    db.delete(ride)
    log = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="edit_delivery",
        project_id=project_id,
        change_details={
            "message": f"Deleted RIDE {ride.type}: '{ride.title}'",
            "title": ride.title
        }
    )
    db.add(log)
    db.commit()
    return {"status": "success"}

@router.post("/projects/{project_id}/baseline")
def approve_project_baseline(project_id: int, baseline_data: BaselineApprovalInput, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """VP approves baseline project budget and margin threshold."""
    if current_user.role != "VP":
        raise HTTPException(status_code=403, detail="Strategic baseline controls reserved for VP level.")

    baseline = db.query(ProjectBaseline).filter(ProjectBaseline.project_id == project_id).first()
    if not baseline:
        baseline = ProjectBaseline(project_id=project_id)
        db.add(baseline)

    baseline.approved_budget = baseline_data.approved_budget
    baseline.approved_margin_threshold = baseline_data.approved_margin_threshold
    baseline.approved_by = current_user.email
    baseline.approved_at = datetime.utcnow()

    # Log action to audit trail
    log = AuditLog(
        user_email=current_user.email,
        role="VP",
        action="baseline_budget",
        project_id=project_id,
        change_details={
            "message": f"Approved project financial baseline budget.",
            "approved_budget": baseline_data.approved_budget,
            "margin_threshold": baseline_data.approved_margin_threshold
        }
    )
    db.add(log)
    db.commit()
    return {"status": "success", "baseline_budget": baseline.approved_budget, "margin_threshold": baseline.approved_margin_threshold}

@router.post("/projects/{project_id}/validate")
def validate_finance_data(project_id: int, validation_data: FinanceValidationInput, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Finance officer or authorized manager validates actual cost and revenue."""
    f_val = db.query(FinanceValidation).filter(FinanceValidation.project_id == project_id).first()
    if not f_val:
        f_val = FinanceValidation(project_id=project_id)
        db.add(f_val)

    f_val.validated_actual_cost = validation_data.validated_actual_cost
    f_val.validated_actual_revenue = validation_data.validated_actual_revenue
    f_val.validated_by = current_user.email
    f_val.validated_at = datetime.utcnow()
    f_val.status = validation_data.status

    log = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="validate_finance",
        project_id=project_id,
        change_details={
            "message": f"Finance validated cost & revenue. Status: {validation_data.status}",
            "validated_cost": validation_data.validated_actual_cost,
            "validated_revenue": validation_data.validated_actual_revenue
        }
    )
    db.add(log)
    db.commit()
    return {"status": "success", "actual_cost": f_val.validated_actual_cost, "actual_revenue": f_val.validated_actual_revenue}

@router.get("/projects/{project_id}/audit-logs")
def get_project_audit_logs(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Retrieve audit history logs for compliance validation."""
    logs = db.query(AuditLog).filter(AuditLog.project_id == project_id).order_by(AuditLog.timestamp.desc()).all()
    return logs

@router.get("/dashboard/summary")
def get_executive_cockpit_summary(region: str = "GLOBAL", db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Consolidated executive summary of ALL project financials, 
    RIDE health indicators, utilization metrics, and health scores.
    """
    # Fetch executing projects
    if current_user.role == "VP":
        projects = db.query(ApprovedProject).all()
    else:
        projects = db.query(ApprovedProject).filter(
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).all()

    # Metrics containers
    total_planned_budget = 0.0
    total_actual_cost = 0.0
    total_forecasted_cost = 0.0
    total_planned_revenue = 0.0
    total_actual_revenue = 0.0

    delayed_projects_count = 0
    margin_risk_count = 0

    practice_summaries = {}
    region_summaries = {}

    active_project_ids = [p.id for p in projects]

    # Query helper mappings
    baselines = {b.project_id: b for b in db.query(ProjectBaseline).filter(ProjectBaseline.project_id.in_(active_project_ids)).all()} if active_project_ids else {}
    rides = db.query(RIDEGovernance).filter(RIDEGovernance.project_id.in_(active_project_ids)).all() if active_project_ids else []
    validations = {v.project_id: v for v in db.query(FinanceValidation).filter(FinanceValidation.project_id.in_(active_project_ids)).all()} if active_project_ids else {}

    # Critical Escalation trackers
    critical_escalations = [
        {
            "id": r.id,
            "project_id": r.project_id,
            "project_name": db.query(ApprovedProject).filter(ApprovedProject.id == r.project_id).first().project_name if db.query(ApprovedProject).filter(ApprovedProject.id == r.project_id).first() else "N/A",
            "title": r.title,
            "severity": r.severity,
            "owner": r.owner_name,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in rides if r.severity == "CRITICAL" or r.type == "ESCALATION"
    ]

    for p in projects:
        items = p.full_excel_data or []
        if region != "GLOBAL":
            items = [i for i in items if i.get("sales_region") == region]
            if not items:
                continue

        p_id = p.id
        # Baseline Budget
        p_baseline = baselines.get(p_id)
        planned_budget = p_baseline.approved_budget if p_baseline else sum(float(i.get("purchase_total") or 0.0) for i in items)
        margin_target = p_baseline.approved_margin_threshold if p_baseline else 30.0

        # Planned Revenue
        planned_rev = sum(float(i.get("selling_total") or 0.0) for i in items)

        # Actual Cost & Actual Revenue from allocated engineering bookings
        actual_cost = sum(float(i.get("resource_cost") or 0.0) for i in items)
        actual_revenue = sum(float(i.get("billing_value") or 0.0) for i in items)

        # Check for finance validated inputs
        p_val = validations.get(p_id)
        if p_val and p_val.status == "VALIDATED":
            actual_cost = p_val.validated_actual_cost
            actual_revenue = p_val.validated_actual_revenue

        # Forecasted Cost = Actual Cost + remaining unassigned node requirements
        unassigned_cost = sum(float(i.get("purchase_total") or 0.0) for i in items if not i.get("assigned_person") or i.get("assigned_person") == "Unassigned")
        forecasted_cost = actual_cost + unassigned_cost

        # Project Gross Margin
        project_gm = planned_rev - forecasted_cost
        project_gm_pct = (project_gm / planned_rev * 100) if planned_rev > 0 else 0.0

        # Accumulators
        total_planned_budget += planned_budget
        total_actual_cost += actual_cost
        total_forecasted_cost += forecasted_cost
        total_planned_revenue += planned_rev
        total_actual_revenue += actual_revenue

        # Risk Classification
        # 1. Margin Risk (Margin is below VP baselines threshold)
        if project_gm_pct < margin_target:
            margin_risk_count += 1
        
        # 2. Delayed Projects (Contains overdue RIDE items or negative progression)
        project_rides = [r for r in rides if r.project_id == p_id]
        overdue_items = any(r.status != "RESOLVED" and r.due_date and r.due_date < datetime.utcnow() for r in project_rides)
        if overdue_items:
            delayed_projects_count += 1

        # Practice / Region Breakdowns
        for i in items:
            prac = i.get("practice") or "General Services"
            reg = i.get("sales_region") or "GLOBAL"

            # Practice
            if prac not in practice_summaries:
                practice_summaries[prac] = {"revenue": 0.0, "cost": 0.0, "profit": 0.0, "hours": 0.0}
            practice_summaries[prac]["revenue"] += float(i.get("selling_total") or 0)
            practice_summaries[prac]["cost"] += float(i.get("resource_cost") or i.get("purchase_total") or 0)
            practice_summaries[prac]["hours"] += float(i.get("est_hours") or 0)

            # Region
            if reg not in region_summaries:
                region_summaries[reg] = {"revenue": 0.0, "cost": 0.0, "hours": 0.0}
            region_summaries[reg]["revenue"] += float(i.get("selling_total") or 0)
            region_summaries[reg]["cost"] += float(i.get("resource_cost") or i.get("purchase_total") or 0)
            region_summaries[reg]["hours"] += float(i.get("est_hours") or 0)

    # Core gross margin metrics
    portfolio_gm = total_planned_revenue - total_forecasted_cost
    portfolio_gm_pct = (portfolio_gm / total_planned_revenue * 100) if total_planned_revenue > 0 else 0.0
    margin_variance = portfolio_gm_pct - 32.0  # Deviation from target portfolio average (e.g. 32%)

    # Burn Rate calculations
    burn_rate_ratio = (total_actual_cost / total_planned_budget) if total_planned_budget > 0 else 0.0

    # Practice details listing
    practice_list = []
    for p_name, data in practice_summaries.items():
        data["profit"] = data["revenue"] - data["cost"]
        data["margin_pct"] = round((data["profit"] / data["revenue"] * 100) if data["revenue"] > 0 else 0.0, 1)
        practice_list.append({
            "name": p_name,
            "revenue": round(data["revenue"], 2),
            "cost": round(data["cost"], 2),
            "margin_pct": data["margin_pct"],
            "hours": round(data["hours"], 1)
        })

    # Advanced Resource Utilization summary (Overbooked / Bench)
    # Query all active resources
    all_fleet = db.query(CentralizedResource).all()
    overbooked_resources = []
    bench_resources = []
    total_fleet_utilization = 0.0

    for r in all_fleet:
        # Calculate current booked hours across active projects
        booked_hours = 0.0
        for p in projects:
            p_items = p.full_excel_data or []
            for item in p_items:
                if item.get("assigned_person") == r.name or item.get("assigned_email") == r.email:
                    booked_hours += float(item.get("est_hours") or 0.0)
        
        util_pct = round((booked_hours / 160.0) * 100.0, 1)
        total_fleet_utilization += util_pct

        r_data = {
            "id": r.id,
            "employee_id": r.employee_id,
            "name": r.name,
            "email": r.email,
            "grade": r.grade,
            "role_practice": r.role_practice,
            "utilization": util_pct,
            "status": "Overloaded" if util_pct > 110 else "Allocated" if util_pct >= 70 else "Warning" if util_pct > 0 else "Bench",
            "region": r.region,
            "manager": r.manager_email
        }

        if util_pct > 100:
            overbooked_resources.append(r_data)
        elif util_pct == 0:
            bench_resources.append(r_data)

    avg_fleet_utilization = round(total_fleet_utilization / len(all_fleet) if all_fleet else 0.0, 1)

    # RIDE Governance assessments
    # Risk Heatmap coordinates (Severity vs Priority)
    # Mapping Severity (1=LOW to 4=CRITICAL) and Priority (1=LOW to 4=CRITICAL)
    heatmap_matrix = [[0 for _ in range(4)] for _ in range(4)]
    severity_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    priority_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}

    for r in rides:
        if r.status != "RESOLVED":
            sev_idx = severity_map.get(r.severity, 1)
            pri_idx = priority_map.get(r.priority, 1)
            heatmap_matrix[sev_idx][pri_idx] += 1

    # Delivery Health Score (0-100%)
    # Dependant on active critical issues, delayed timelines, and margin deviations
    unresolved_critical_rides = len([r for r in rides if r.status != "RESOLVED" and r.severity == "CRITICAL"])
    base_health = 100.0
    base_health -= unresolved_critical_rides * 15.0  # Deduct 15% per critical escalation
    base_health -= delayed_projects_count * 10.0   # Deduct 10% per delayed project
    base_health -= margin_risk_count * 8.0          # Deduct 8% per margin risk project
    delivery_health_score = round(max(base_health, 20.0), 1)

    # Revenue Leakage Detection: Unbillable allocations (cost_rate > 0 but billing_rate == 0)
    revenue_leakage = 0.0
    for p in projects:
        p_items = p.full_excel_data or []
        for i in p_items:
            c_rate = float(i.get("cost_rate") or 0.0)
            b_rate = float(i.get("hourly_billing_rate") or i.get("hourly_rate") or 0.0)
            e_hours = float(i.get("est_hours") or 0.0)
            if c_rate > 0 and b_rate == 0:
                revenue_leakage += e_hours * c_rate  # The logged cost value of unbillable resource support

    return {
        "active_projects_count": len(projects),
        "delivery_health_score": delivery_health_score,
        "planned_budget": round(total_planned_budget, 2),
        "actual_cost": round(total_actual_cost, 2),
        "forecasted_cost": round(total_forecasted_cost, 2),
        "planned_revenue": round(total_planned_revenue, 2),
        "actual_revenue": round(total_actual_revenue, 2),
        "gross_margin": round(portfolio_gm, 2),
        "margin_pct": round(portfolio_gm_pct, 2),
        "margin_variance": round(margin_variance, 2),
        "burn_rate": round(burn_rate_ratio * 100, 1),
        "revenue_leakage": round(revenue_leakage, 2),
        
        # Delivery RIDE Items
        "escalations_count": len(critical_escalations),
        "critical_escalations": critical_escalations,
        "delayed_projects_count": delayed_projects_count,
        "margin_risk_projects_count": margin_risk_count,
        "heatmap": heatmap_matrix,
        
        # Fleet utilization
        "fleet_utilization_avg": avg_fleet_utilization,
        "overbooked_resources_count": len(overbooked_resources),
        "overbooked_resources": overbooked_resources,
        "bench_resources_count": len(bench_resources),
        "bench_resources": bench_resources,
        
        # Breakdowns
        "practice_summary": practice_list,
        "region_summary": [
            {
                "region": r,
                "revenue": round(data["revenue"], 2),
                "cost": round(data["cost"], 2),
                "margin_pct": round(((data["revenue"] - data["cost"]) / data["revenue"] * 100) if data["revenue"] > 0 else 0, 1),
                "hours": round(data["hours"], 1)
            } for r, data in region_summaries.items()
        ]
    }

