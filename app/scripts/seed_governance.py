import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.models.requests import ResourceRequest, MarginEscalation
from app.models.project import ApprovedProject, Project
from datetime import datetime, timedelta

def seed():
    db = SessionLocal()
    
    # Check for projects
    proj = db.query(Project).first()
    if not proj:
        proj = Project(name="Project Alpha", status="ACTIVE")
        db.add(proj)
        db.commit()
        db.refresh(proj)
        
    project_id = proj.id
    
    # Also ensure there is an ApprovedProject with the SAME ID because workflow.py joins on ApprovedProject
    ap = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    if not ap:
        ap = ApprovedProject(
            id=project_id,
            project_name=proj.name,
            assigned_manager_email="pm@arche.global",
            approved_by="vp@arche.global",
            full_excel_data={}
        )
        db.add(ap)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Skipping ApprovedProject insert: {e}")

    # Clear existing requests/escalations for clean slate
    db.query(ResourceRequest).delete()
    db.query(MarginEscalation).delete()
    db.commit()

    print(f"Seeding for project ID: {project_id}")

    # Seed Margin Escalation
    esc1 = MarginEscalation(
        project_id=project_id,
        target_margin=25.0,
        current_margin=18.5,
        forecast_margin=15.0,
        trigger_reason="Current Margin (18.5%) dropped below Target (25.0%)",
        status="OPEN",
        escalated_to="vp@arche.global"
    )
    db.add(esc1)
    
    esc2 = MarginEscalation(
        project_id=project_id,
        target_margin=30.0,
        current_margin=28.0,
        forecast_margin=20.0,
        trigger_reason="Forecast Margin (20.0%) projected below Target (30.0%)",
        status="OPEN",
        escalated_to="vp@arche.global",
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(esc2)

    # Seed Resource Requests
    req1 = ResourceRequest(
        project_id=project_id,
        node_id="NODE-101",
        type="ADDITIONAL_HOURS",
        requested_by="pm@arche.global",
        current_hours=120.0,
        requested_additional_hours=40.0,
        reason="Unexpected complexity in authentication module requires more senior dev hours.",
        status="PENDING",
        created_at=datetime.utcnow() - timedelta(hours=5)
    )
    db.add(req1)

    req2 = ResourceRequest(
        project_id=project_id,
        node_id="PROJECT_LEVEL",
        type="DURATION_EXTENSION",
        requested_by="pm@arche.global",
        current_end_date=datetime.utcnow() + timedelta(days=30),
        requested_end_date=datetime.utcnow() + timedelta(days=60),
        reason="Client requested delay in UAT phase due to internal holiday schedules.",
        status="PENDING",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(req2)
    
    req3 = ResourceRequest(
        project_id=project_id,
        node_id="NODE-105",
        type="ADDITIONAL_HOURS",
        requested_by="pm@arche.global",
        current_hours=80.0,
        requested_additional_hours=20.0,
        reason="Additional scope for reporting module requested.",
        status="APPROVED",
        approved_by="vp@arche.global",
        resolved_at=datetime.utcnow(),
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(req3)

    db.commit()
    print("Governance data seeded successfully.")

if __name__ == "__main__":
    seed()
