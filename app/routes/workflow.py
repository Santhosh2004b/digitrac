from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.models.project import ApprovedProject, Project
from app.models.requests import ResourceRequest, MarginEscalation
from app.models.governance import AuditLog
from app.models.workflow import InAppNotification
from app.utils.deps import get_current_manager, get_current_user
from app.integrations.outlook.mail_service import MailService

router = APIRouter(prefix="/workflow", tags=["workflow"])

class HoursRequestInput(BaseModel):
    project_id: int
    node_id: str
    current_planned_hours: float
    requested_additional_hours: float
    reason: str

class DurationRequestInput(BaseModel):
    project_id: int
    current_end_date: str
    requested_end_date: str
    additional_days: int
    reason: str

class ActionInput(BaseModel):
    action: str # APPROVE, REJECT, CLARIFY
    comments: str

@router.post("/requests/hours")
async def request_additional_hours(
    req: HoursRequestInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(ApprovedProject).filter(ApprovedProject.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_req = ResourceRequest(
        project_id=req.project_id,
        node_id=req.node_id,
        type="ADDITIONAL_HOURS",
        requested_by=current_user.email,
        current_hours=req.current_planned_hours,
        requested_additional_hours=req.requested_additional_hours,
        reason=req.reason,
        status="PENDING"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    # Intelligence Event
    from app.models.intelligence import IntelligenceEvent
    intel = IntelligenceEvent(
        project_id=project.id,
        project_name=project.project_name,
        sap_node_id=req.node_id,
        category="ESCALATION",
        priority="WARNING",
        message=f"Additional Hours Requested: +{req.requested_additional_hours} Hrs",
        metrics={
            "Current Planned": f"{req.current_planned_hours} Hrs",
            "Requested Additional": f"+{req.requested_additional_hours} Hrs"
        }
    )
    db.add(intel)
    db.commit()

    # Optional: Send Mail

    # await MailService.send_workflow_request_mail(...)
    
    return {"status": "success", "request_id": new_req.id}

@router.post("/requests/duration")
async def request_additional_duration(
    req: DurationRequestInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(ApprovedProject).filter(ApprovedProject.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Assuming node_id is PROJECT_LEVEL
    new_req = ResourceRequest(
        project_id=req.project_id,
        node_id="PROJECT_LEVEL",
        type="DURATION_EXTENSION",
        requested_by=current_user.email,
        current_end_date=datetime.strptime(req.current_end_date, "%Y-%m-%d") if req.current_end_date else None,
        requested_end_date=datetime.strptime(req.requested_end_date, "%Y-%m-%d") if req.requested_end_date else None,
        reason=req.reason,
        status="PENDING"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    # Intelligence Event
    from app.models.intelligence import IntelligenceEvent
    intel = IntelligenceEvent(
        project_id=project.id,
        project_name=project.project_name,
        category="ESCALATION",
        priority="WARNING",
        message=f"Duration Extension Requested to {req.requested_end_date}",
        metrics={
            "Reason": req.reason[:50] + "..." if len(req.reason) > 50 else req.reason
        }
    )
    db.add(intel)
    db.commit()

    return {"status": "success", "request_id": new_req.id}


@router.get("/requests")
def get_workflow_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in ["VP", "PC"]:
        requests = db.query(ResourceRequest).order_by(ResourceRequest.created_at.desc()).all()
    else:
        requests = db.query(ResourceRequest).filter(ResourceRequest.requested_by == current_user.email).order_by(ResourceRequest.created_at.desc()).all()
    
    result = []
    for r in requests:
        proj = db.query(ApprovedProject).filter(ApprovedProject.id == r.project_id).first()
        result.append({
            "id": r.id,
            "project_name": proj.project_name if proj else "Unknown",
            "node_id": r.node_id,
            "type": r.type,
            "requested_by": r.requested_by,
            "current_hours": r.current_hours,
            "requested_additional_hours": r.requested_additional_hours,
            "current_end_date": r.current_end_date.isoformat() if r.current_end_date else None,
            "requested_end_date": r.requested_end_date.isoformat() if r.requested_end_date else None,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result

@router.post("/requests/{req_id}/action")
def action_workflow_request(
    req_id: int,
    action_data: ActionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["VP", "PC"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    req = db.query(ResourceRequest).filter(ResourceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if action_data.action == "APPROVE":
        req.status = "APPROVED"
        # Actual modifications to project JSON happen here if automated, else it's manual update by PM
        if req.type == "ADDITIONAL_HOURS":
            # Find node in project and update
            project = db.query(ApprovedProject).filter(ApprovedProject.id == req.project_id).first()
            if project:
                full_data = project.full_excel_data
                if isinstance(full_data, dict) and "project_costing" in full_data:
                    items = full_data["project_costing"]
                    for i in items:
                        node_id = i.get("id") if i.get("id") is not None else str(i.get("SAP Material ID", ""))
                        if str(node_id) == req.node_id:
                            current_planned = float(i.get("planned_hours", 0.0))
                            i["planned_hours"] = current_planned + float(req.requested_additional_hours or 0)
                            # recalculate days
                            i["planned_days"] = round(i["planned_hours"] / 9.0, 2)
                            break
                    
                    from sqlalchemy.orm.attributes import flag_modified
                    project.full_excel_data["project_costing"] = items
                    flag_modified(project, "full_excel_data")
        
    elif action_data.action == "REJECT":
        req.status = "REJECTED"
    else:
        req.status = "CLARIFICATION_REQUIRED"

    req.approved_by = current_user.email
    req.resolved_at = datetime.utcnow()
    
    # Audit Log
    audit = AuditLog(
        entity_type="RESOURCE_REQUEST",
        entity_id=req.id,
        action=action_data.action,
        performed_by=current_user.email,
        details=action_data.comments
    )
    db.add(audit)
    db.commit()

    # Intelligence Event
    from app.models.intelligence import IntelligenceEvent
    project = db.query(ApprovedProject).filter(ApprovedProject.id == req.project_id).first()
    intel = IntelligenceEvent(
        project_id=req.project_id,
        project_name=project.project_name if project else "Unknown",
        category="APPROVAL",
        priority="SUCCESS" if action_data.action == "APPROVE" else "CRITICAL",
        message=f"Request {action_data.action}: {req.type}",
        metrics={
            "Action By": current_user.email.split('@')[0].capitalize(),
            "Comments": action_data.comments[:50] + "..." if len(action_data.comments) > 50 else action_data.comments
        }
    )
    db.add(intel)
    db.commit()

    return {"status": "success", "new_status": req.status}


@router.get("/escalations")
def get_escalations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["VP", "PC"]:
        # PM can see escalations for their projects
        projects = db.query(ApprovedProject.id).filter(ApprovedProject.assigned_manager_email == current_user.email).all()
        project_ids = [p[0] for p in projects]
        escalations = db.query(MarginEscalation).filter(MarginEscalation.project_id.in_(project_ids)).order_by(MarginEscalation.created_at.desc()).all()
    else:
        escalations = db.query(MarginEscalation).order_by(MarginEscalation.created_at.desc()).all()

    result = []
    for e in escalations:
        proj = db.query(ApprovedProject).filter(ApprovedProject.id == e.project_id).first()
        result.append({
            "id": e.id,
            "project_id": e.project_id,
            "project_name": proj.project_name if proj else "Unknown",
            "manager_email": proj.assigned_manager_email if proj else "Unknown",
            "target_margin": e.target_margin,
            "current_margin": e.current_margin,
            "forecast_margin": e.forecast_margin,
            "trigger_reason": e.trigger_reason,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return result

@router.post("/escalations/{esc_id}/action")
def action_escalation(
    esc_id: int,
    action_data: ActionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["VP", "PC"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    esc = db.query(MarginEscalation).filter(MarginEscalation.id == esc_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
        
    esc.status = action_data.action # ACKNOWLEDGED, RESOLVED
    esc.action_plan = action_data.comments
    esc.resolved_at = datetime.utcnow()
    
    db.commit()
    return {"status": "success"}
