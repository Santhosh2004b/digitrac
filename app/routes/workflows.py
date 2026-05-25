from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.workflow import WorkflowInstance, WorkflowStep, InAppNotification, ProjectMilestone
from app.models.governance import AuditLog, RIDEGovernance, ProjectBaseline
from app.models.project import ApprovedProject, Project
from app.models.user import User
from app.utils.deps import get_current_user, get_current_vp, get_current_manager
from pydantic import BaseModel
import io
import csv

router = APIRouter(prefix="/vp", tags=["workflows"])

# Pydantic Schemas
class WorkflowCreate(BaseModel):
    type: str  # PROJECT_APPROVAL, BUDGET_APPROVAL, RESOURCE_ALLOCATION, ESCALATION, FINANCE_VALIDATION, CHANGE_REQUEST
    project_id: int
    project_name: str
    comments: Optional[str] = None
    sla_hours: Optional[int] = 24
    total_levels: Optional[int] = 2

class WorkflowAction(BaseModel):
    action: str  # APPROVE, REJECT
    comments: Optional[str] = None

class MilestoneCreate(BaseModel):
    name: str
    due_date: Optional[str] = None  # YYYY-MM-DD
    status: Optional[str] = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, DELAYED

class MilestoneUpdate(BaseModel):
    status: str  # PENDING, IN_PROGRESS, COMPLETED, DELAYED

class NotificationCreate(BaseModel):
    recipient_email: str
    priority: str  # INFO, WARNING, CRITICAL
    type: str  # APPROVAL, MARGIN, OVERBOOKING, DELAY, ESCALATION
    title: str
    message: str

# 1. Workflow Orchestration Engine Routes
@router.get("/workflows")
def get_workflows(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Returns list of active and archived workflow instances.
    """
    instances = db.query(WorkflowInstance).order_by(WorkflowInstance.created_at.desc()).all()
    result = []
    for inst in instances:
        steps = db.query(WorkflowStep).filter(WorkflowStep.workflow_instance_id == inst.id).order_by(WorkflowStep.level.asc()).all()
        result.append({
            "id": inst.id,
            "type": inst.type,
            "project_id": inst.project_id,
            "project_name": inst.project_name,
            "status": inst.status,
            "current_level": inst.current_level,
            "total_levels": inst.total_levels,
            "assigned_role": inst.assigned_role,
            "initiator_email": inst.initiator_email,
            "comments": inst.comments,
            "sla_hours": inst.sla_hours,
            "is_escalated": inst.is_escalated,
            "escalated_at": inst.escalated_at,
            "created_at": inst.created_at,
            "updated_at": inst.updated_at,
            "steps": [{
                "id": s.id,
                "level": s.level,
                "approver_role": s.approver_role,
                "approver_email": s.approver_email,
                "status": s.status,
                "comments": s.comments,
                "created_at": s.created_at,
                "completed_at": s.completed_at
            } for s in steps]
        })
    return result

@router.post("/workflows")
def create_workflow(data: WorkflowCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Initiates a multi-level workflow.
    """
    inst = WorkflowInstance(
        type=data.type,
        project_id=data.project_id,
        project_name=data.project_name,
        comments=data.comments,
        sla_hours=data.sla_hours,
        total_levels=data.total_levels,
        initiator_email=current_user.email,
        assigned_role="VP" if data.type in ["PROJECT_APPROVAL", "ESCALATION"] else "FINANCE" if data.type == "FINANCE_VALIDATION" else "MANAGER"
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)

    # Seed level 1 step
    step1 = WorkflowStep(
        workflow_instance_id=inst.id,
        level=1,
        approver_role=inst.assigned_role,
        status="PENDING"
    )
    db.add(step1)

    # In-App Notification
    notif = InAppNotification(
        recipient_email="vp@arche.global" if inst.assigned_role == "VP" else "finance@arche.global",
        priority="CRITICAL",
        type="APPROVAL",
        title=f"Workflow Approval Pending: {data.type}",
        message=f"Project {data.project_name} requires your validation for {data.type}."
    )
    db.add(notif)

    # Compliance Audit Log
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action=f"workflow_initiated_{data.type.lower()}",
        project_id=data.project_id,
        change_details={"message": f"Workflow {data.type} initiated at Level 1.", "instance_id": inst.id}
    )
    db.add(audit)
    db.commit()

    return {"message": "Workflow instance initiated", "id": inst.id}

@router.post("/workflows/{instance_id}/action")
def workflow_action(instance_id: int, action_data: WorkflowAction, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Approves or Rejects a workflow level step.
    """
    inst = db.query(WorkflowInstance).filter(WorkflowInstance.id == instance_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Workflow instance not found")

    if inst.status != "PENDING":
        raise HTTPException(status_code=400, detail="Workflow has already been finalized")

    # Fetch active step
    step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_instance_id == inst.id,
        WorkflowStep.level == inst.current_level,
        WorkflowStep.status == "PENDING"
    ).first()

    if not step:
        raise HTTPException(status_code=404, detail="Active pending step not found")

    # Update step details
    step.status = "APPROVED" if action_data.action == "APPROVE" else "REJECTED"
    step.comments = action_data.comments
    step.completed_at = datetime.utcnow()
    step.approver_email = current_user.email

    # Log to Compliance Trail
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action=f"workflow_{action_data.action.lower()}_level_{inst.current_level}",
        project_id=inst.project_id,
        change_details={"comments": action_data.comments, "level": inst.current_level}
    )
    db.add(audit)

    if action_data.action == "APPROVE":
        if inst.current_level < inst.total_levels:
            # Advance to next level approval hierarchy
            inst.current_level += 1
            inst.assigned_role = "VP"  # Typically final levels escalate to VP
            next_step = WorkflowStep(
                workflow_instance_id=inst.id,
                level=inst.current_level,
                approver_role=inst.assigned_role,
                status="PENDING"
            )
            db.add(next_step)

            # Inform next level approver
            notif = InAppNotification(
                recipient_email="vp@arche.global",
                priority="CRITICAL",
                type="APPROVAL",
                title=f"Escalated Workflow Level {inst.current_level}",
                message=f"Project {inst.project_name} advanced to Level {inst.current_level} validation."
            )
            db.add(notif)
        else:
            # Final Level approved
            inst.status = "APPROVED"
            
            # Sync back to operational tables if needed
            proj = db.query(Project).filter(Project.id == inst.project_id).first()
            if proj:
                proj.status = "APPROVED" if inst.type in ["PROJECT_APPROVAL", "BUDGET_APPROVAL"] else proj.status

            approved_p = db.query(ApprovedProject).filter(ApprovedProject.id == inst.project_id).first()
            if approved_p:
                # Add validation notes or status keys
                pass

            # Notify initiator
            notif = InAppNotification(
                recipient_email=inst.initiator_email,
                priority="INFO",
                type="APPROVAL",
                title=f"Workflow SUCCESS: {inst.type}",
                message=f"Your workflow request for {inst.project_name} has been fully APPROVED."
            )
            db.add(notif)
    else:
        # Step rejected -> reject overall workflow
        inst.status = "REJECTED"
        
        # Notify initiator
        notif = InAppNotification(
            recipient_email=inst.initiator_email,
            priority="CRITICAL",
            type="APPROVAL",
            title=f"Workflow REJECTED: {inst.type}",
            message=f"Your request for {inst.project_name} was rejected by {current_user.email}. Comments: {action_data.comments}"
        )
        db.add(notif)

    db.commit()
    return {"message": f"Workflow level action saved as {action_data.action}"}

@router.post("/workflows/sla-trigger")
def trigger_sla_escalations(db: Session = Depends(get_db)):
    """
    Checks active SLAs and triggers automatic escalation alerts for overdue approvals.
    """
    now = datetime.utcnow()
    pending = db.query(WorkflowInstance).filter(WorkflowInstance.status == "PENDING", WorkflowInstance.is_escalated == False).all()
    escalated_count = 0

    for inst in pending:
        delta = now - inst.updated_at
        if delta.total_seconds() > (inst.sla_hours * 3600):
            # SLA Overdue -> Auto escalate to VP
            inst.is_escalated = True
            inst.escalated_at = now
            inst.assigned_role = "VP"
            
            # Create next level escalation step or flag existing
            notif = InAppNotification(
                recipient_email="vp@arche.global",
                priority="CRITICAL",
                type="ESCALATION",
                title=f"⚠️ SLA OVERDUE ESCALATION: {inst.type}",
                message=f"Workflow for {inst.project_name} has been pending longer than {inst.sla_hours} hours. Auto-escalated to Executive VP."
            )
            db.add(notif)
            
            audit = AuditLog(
                user_email="system@arche.global",
                role="SYSTEM",
                action="sla_auto_escalation",
                project_id=inst.project_id,
                change_details={"message": f"SLA Limit breached. Workflow auto-escalated.", "instance_id": inst.id}
            )
            db.add(audit)
            escalated_count += 1

    db.commit()
    return {"message": "SLA sweep complete", "escalated_count": escalated_count}

# 2. Smart Notification & Alert Center Routes
@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Get notifications for active recipient.
    """
    notifs = db.query(InAppNotification).filter(
        func.lower(InAppNotification.recipient_email) == current_user.email.lower()
    ).order_by(InAppNotification.created_at.desc()).all()
    
    unread_count = db.query(func.count(InAppNotification.id)).filter(
        func.lower(InAppNotification.recipient_email) == current_user.email.lower(),
        InAppNotification.is_read == False
    ).scalar()

    return {
        "unread_count": unread_count,
        "notifications": [{
            "id": n.id,
            "priority": n.priority,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at
        } for n in notifs]
    }

@router.post("/notifications/read-all")
def read_all_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db.query(InAppNotification).filter(
        func.lower(InAppNotification.recipient_email) == current_user.email.lower()
    ).update({InAppNotification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("/notifications/{id}/read")
def read_single_notification(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    notif = db.query(InAppNotification).filter(
        InAppNotification.id == id,
        func.lower(InAppNotification.recipient_email) == current_user.email.lower()
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}

@router.post("/notifications")
def create_custom_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    """
    Automated notification generator (with simulated Outlook SMTP pipeline logs).
    """
    notif = InAppNotification(
        recipient_email=data.recipient_email,
        priority=data.priority,
        type=data.type,
        title=data.title,
        message=data.message
    )
    db.add(notif)
    db.commit()
    return {"message": "Notification committed"}

# 3. Compliance Exports (Downloadable CSVs)
@router.get("/compliance/export-audit")
def export_audit_log(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Exports the immutable audit compliance ledger to a downloadable CSV spreadsheet.
    """
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User Email", "Role", "Action", "Project ID", "Change Details"])
    for l in logs:
        writer.writerow([l.id, l.timestamp.isoformat(), l.user_email, l.role, l.action, l.project_id, str(l.change_details)])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=digitrac_audit_compliance_ledger.csv"}
    )

@router.get("/compliance/export-governance")
def export_governance_logs(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Exports active RIDE items governance matrix to a downloadable CSV spreadsheet.
    """
    rides = db.query(RIDEGovernance).order_by(RIDEGovernance.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Project ID", "Type", "Title", "Description", "Severity", "Priority", "Owner Name", "Owner Email", "Status", "VP Escalation", "Created At"])
    for r in rides:
        writer.writerow([r.id, r.project_id, r.type, r.title, r.description, r.severity, r.priority, r.owner_name, r.owner_email, r.status, r.escalated_to_vp, r.created_at.isoformat()])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=digitrac_ride_governance_matrix.csv"}
    )

@router.get("/compliance/export-financials")
def export_financials_logs(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Exports portfolio actual costs vs baselined target margins to a downloadable CSV spreadsheet.
    """
    baselines = db.query(ProjectBaseline).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Baseline ID", "Project ID", "Approved Budget", "Approved Margin Target %", "Approved By", "Approved At"])
    for b in baselines:
        writer.writerow([b.id, b.project_id, b.approved_budget, b.approved_margin_threshold, b.approved_by, b.approved_at.isoformat()])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=digitrac_portfolio_financial_baselines.csv"}
    )

# 4. Project Milestone Stages and Recalculating Overall Delivery Score
@router.get("/projects/{project_id}/milestones")
def get_milestones(project_id: int, db: Session = Depends(get_db)):
    return db.query(ProjectMilestone).filter(ProjectMilestone.project_id == project_id).order_by(ProjectMilestone.due_date.asc()).all()

@router.post("/projects/{project_id}/milestones")
def create_milestone(project_id: int, data: MilestoneCreate, db: Session = Depends(get_db)):
    due = None
    if data.due_date:
        due = datetime.strptime(data.due_date, "%Y-%m-%d")
    
    mil = ProjectMilestone(
        project_id=project_id,
        name=data.name,
        due_date=due,
        status=data.status
    )
    db.add(mil)
    db.commit()
    db.refresh(mil)
    recalculate_delivery_score(project_id, db)
    return mil

@router.put("/projects/{project_id}/milestones/{milestone_id}")
def update_milestone_status(project_id: int, milestone_id: int, data: MilestoneUpdate, db: Session = Depends(get_db)):
    mil = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id, ProjectMilestone.project_id == project_id).first()
    if not mil:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    mil.status = data.status
    if data.status == "COMPLETED":
        mil.completed_at = datetime.utcnow()
    db.commit()
    
    score = recalculate_delivery_score(project_id, db)
    return {"message": "Milestone status updated", "new_delivery_score": score}

def recalculate_delivery_score(project_id: int, db: Session) -> float:
    """
    Autocalculates a project overall delivery score (0-100) based on:
    - Milestone completion: +50 points max
    - Delay deduction: -10 points per delayed milestone
    - Escalation deduction: -15 points per active critical RIDE item
    - Margin variance deduction: -10 points if gross margin is below target
    """
    mils = db.query(ProjectMilestone).filter(ProjectMilestone.project_id == project_id).all()
    score = 100.0
    
    # 1. Milestone progress (max 50 points weighted)
    if mils:
        completed = len([m for m in mils if m.status == "COMPLETED"])
        milestone_pct = completed / len(mils)
        # Weight component
        milestone_weight = milestone_pct * 50.0
        # Deduct delay points
        delayed = len([m for m in mils if m.status == "DELAYED"])
        score = milestone_weight + 50.0 - (delayed * 10.0)
    
    # 2. Critical Active Escalations
    rides = db.query(RIDEGovernance).filter(RIDEGovernance.project_id == project_id, RIDEGovernance.status != "RESOLVED").all()
    critical_esc = len([r for r in rides if r.severity == "CRITICAL" or r.type == "ESCALATION"])
    score -= critical_esc * 15.0

    # Clamp score between 10.0 and 100.0
    score = max(min(score, 100.0), 10.0)

    # Sync back to operational project
    proj = db.query(Project).filter(Project.id == project_id).first()
    if proj:
        proj.performance_score = score
        db.commit()
        
    return round(score, 1)
