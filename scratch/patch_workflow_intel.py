import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\workflow.py', 'r', encoding='utf-8') as f:
    content = f.read()

patch_hours = """
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
"""

content = re.sub(
    r'    db.commit\(\)\n    db.refresh\(new_req\)\n\n    # Optional: Send Mail',
    patch_hours.strip('\n') + '\n',
    content
)

patch_duration = """
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
"""

content = re.sub(
    r'    db.commit\(\)\n    db.refresh\(new_req\)\n\n    return \{"status": "success", "request_id": new_req.id\}',
    patch_duration.strip('\n') + '\n',
    content
)

patch_action = """
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
"""

content = re.sub(
    r'    db.add\(audit\)\n    db.commit\(\)\n\n    return \{"status": "success", "new_status": req.status\}',
    patch_action.strip('\n') + '\n',
    content
)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\workflow.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated workflow.py")
