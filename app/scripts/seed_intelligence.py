import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.models.intelligence import IntelligenceEvent
from app.models.project import Project, ApprovedProject
from datetime import datetime, timedelta
import random

def seed():
    db = SessionLocal()
    
    projects = db.query(ApprovedProject).all()
    if not projects:
        print("Warning: No ApprovedProjects found. Run other seeds first.")
        return

    # Clear existing intelligence events to avoid clutter
    db.query(IntelligenceEvent).delete()
    db.commit()

    now = datetime.utcnow()

    for proj in projects:
        project_id = proj.id
        project_name = proj.project_name
        print(f"Seeding Intelligence Events for project: {project_name}")

        events = [
            IntelligenceEvent(
                project_id=project_id,
                project_name=project_name,
                sap_node_id="PRJ-SRV-01",
                sap_node_name="Server Infrastructure",
                category="MARGIN",
                priority="WARNING",
                message="Margin deviation detected in Server Infrastructure node.",
                metrics={
                    "Target Margin": "25.0%",
                    "Current Margin": "22.5%",
                    "Variance": "-2.5%"
                },
                created_at=now - timedelta(hours=1)
            ),
            IntelligenceEvent(
                project_id=project_id,
                project_name=project_name,
                sap_node_id="PRJ-DEV-02",
                sap_node_name="Frontend Development",
                category="HOURS",
                priority="CRITICAL",
                message="Resource hours exceeded planned budget by 15%.",
                metrics={
                    "Planned Hours": "200 Hrs",
                    "Actual Hours": "230 Hrs",
                    "Overrun": "30 Hrs"
                },
                created_at=now - timedelta(hours=3)
            ),
            IntelligenceEvent(
                project_id=project_id,
                project_name=project_name,
                sap_node_id="PROJECT_LEVEL",
                sap_node_name="Global",
                category="APPROVAL",
                priority="SUCCESS",
                message="Duration extension request approved by VP.",
                metrics={
                    "New Deadline": (now + timedelta(days=30)).strftime("%Y-%m-%d"),
                    "Approved By": "Executive VP"
                },
                created_at=now - timedelta(days=1)
            ),
            IntelligenceEvent(
                project_id=project_id,
                project_name=project_name,
                sap_node_id="PRJ-QA-01",
                sap_node_name="Quality Assurance",
                category="ASSIGNMENT",
                priority="INFO",
                message="New QA resource assigned to critical path task.",
                metrics={
                    "Resource": "Alex Chen",
                    "Role": "Senior QA Automation",
                    "Allocation": "100%"
                },
                created_at=now - timedelta(days=2)
            ),
            IntelligenceEvent(
                project_id=project_id,
                project_name=project_name,
                sap_node_id="PROJECT_LEVEL",
                sap_node_name="Global",
                category="ESCALATION",
                priority="CRITICAL",
                message="Project status automatically shifted to RED due to consecutive margin drops.",
                metrics={
                    "Previous Status": "ORANGE",
                    "New Status": "RED",
                    "Trigger": "3-week margin decline"
                },
                created_at=now - timedelta(days=3)
            ),
            IntelligenceEvent(
                project_id=project_id,
                project_name=project_name,
                sap_node_id="PRJ-DESIGN-01",
                sap_node_name="UI/UX Design",
                category="MILESTONE",
                priority="SUCCESS",
                message="Design phase completed 2 days ahead of schedule.",
                metrics={
                    "Planned End": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "Actual End": now.strftime("%Y-%m-%d"),
                    "Savings": "16 Hrs"
                },
                created_at=now - timedelta(days=4)
            )
        ]

        for event in events:
            db.add(event)
        
    db.commit()
    print("Intelligence Feed data seeded successfully.")

if __name__ == "__main__":
    seed()
