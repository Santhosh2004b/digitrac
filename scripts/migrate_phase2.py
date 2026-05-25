import sys
import datetime
from pathlib import Path

# Setup PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.project import ApprovedProject, Project
from app.models.governance import RIDEGovernance, AuditLog, ProjectBaseline, FinanceValidation

def migrate_and_seed_phase2():
    print("=" * 60)
    print("  DIGITRAC PHASE-2 DATABASE MIGRATION & SEEDING")
    print("=" * 60)

    # Recreate tables (creating newly defined schemas without dropping operational data)
    print("\nCreating new Phase-2 database tables in SQLite...")
    Base.metadata.create_all(bind=engine)
    print("New tables generated successfully.")

    db: Session = SessionLocal()
    try:
        # Check if we have approved projects
        projects = db.query(ApprovedProject).all()
        if not projects:
            print("\nOperational projects missing. Seeding fallback ApprovedProject first...")
            
            # Create a fallback executing project
            fallback_proj = ApprovedProject(
                project_name="DigiTrac v2.0 Launch",
                assigned_manager_email="manager@digitrac.com",
                approved_by="vp@digitrac.com",
                full_excel_data=[
                    {
                        "id": 1,
                        "sap_id": "SAP-M1001",
                        "description": "Backend API Development Core Setup",
                        "practice": "Cloud Engineering",
                        "component": "Software Dev",
                        "item_type": "Resource",
                        "sales_region": "APJ",
                        "oem": "Arche",
                        "qty": 20,
                        "purchase_total": 4500000,
                        "selling_total": 6000000,
                        "net_value": 1500000,
                        "margin_pct": 25.0,
                        "est_hours": 80.0,
                        "status": "In Progress",
                        "assigned_person": "Aarav Sharma",
                        "employee_id": "EMP-101",
                        "grade": "L2 Senior Consultant",
                        "role_practice": "Cloud Engineering",
                        "hourly_billing_rate": 2500.0,
                        "cost_rate": 1200.0,
                        "resource_cost": 96000.0,
                        "billing_value": 200000.0,
                        "resource_margin": 104000.0,
                        "assigned_email": "aarav.sharma@arche.global",
                        "progress_pct": 45,
                        "end_date": "2026-06-30",
                        "priority": "HIGH",
                        "start_date": "2026-05-15",
                        "duration": 45.0,
                        "work_mode": "Days"
                    },
                    {
                        "id": 2,
                        "sap_id": "SAP-M1002",
                        "description": "Mobile App UI Framework Assembly",
                        "practice": "Application Development",
                        "component": "Design",
                        "item_type": "Resource",
                        "sales_region": "EMEA",
                        "oem": "Arche",
                        "qty": 15,
                        "purchase_total": 2800000,
                        "selling_total": 4000000,
                        "net_value": 1200000,
                        "margin_pct": 30.0,
                        "est_hours": 60.0,
                        "status": "Pending",
                        "assigned_person": "Ishaan Verma",
                        "employee_id": "EMP-103",
                        "grade": "L1 Consultant",
                        "role_practice": "Application Development",
                        "hourly_billing_rate": 1500.0,
                        "cost_rate": 800.0,
                        "resource_cost": 48000.0,
                        "billing_value": 90000.0,
                        "resource_margin": 42000.0,
                        "assigned_email": "ishaan.verma@arche.global",
                        "progress_pct": 0,
                        "end_date": "2026-07-15",
                        "priority": "MEDIUM",
                        "start_date": "2026-06-01",
                        "duration": 30.0,
                        "work_mode": "Days"
                    }
                ]
            )
            db.add(fallback_proj)
            db.commit()
            db.refresh(fallback_proj)
            projects = [fallback_proj]
            print(f"Fallback project seeded: {fallback_proj.project_name} [ID: {fallback_proj.id}]")

        # Let's seed project baselines
        print("\nSeeding PMO Project Baselines...")
        for p in projects:
            existing_baseline = db.query(ProjectBaseline).filter(ProjectBaseline.project_id == p.id).first()
            if not existing_baseline:
                baseline = ProjectBaseline(
                    project_id=p.id,
                    approved_budget=8000000.0,  # ₹80 Lakhs planned budget
                    approved_margin_threshold=32.0,  # Target 32% margin
                    approved_by="vp@digitrac.com"
                )
                db.add(baseline)
                print(f"Seeded baseline for project ID {p.id} (Threshold: 32%)")

        # Let's seed RIDE items
        print("\nSeeding RIDE Governance Modules...")
        ride_seeded = 0
        for p in projects:
            existing_ride = db.query(RIDEGovernance).filter(RIDEGovernance.project_id == p.id).first()
            if not existing_ride:
                items = [
                    RIDEGovernance(
                        project_id=p.id,
                        type="RISK",
                        title="API Integration Rate Limit Constraints",
                        description="External authentication API has strict transaction limitations which could delay bulk migrations.",
                        severity="HIGH",
                        priority="MEDIUM",
                        owner_name="Aarav Sharma",
                        owner_email="aarav.sharma@arche.global",
                        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=14),
                        status="OPEN",
                        escalated_to_vp=False
                    ),
                    RIDEGovernance(
                        project_id=p.id,
                        type="ESCALATION",
                        title="Critical Resource Allocation Congestion in APJ Practice",
                        description="Senior Cloud engineering resources are overbooked above 120% capacity, risking delivery timelines.",
                        severity="CRITICAL",
                        priority="CRITICAL",
                        owner_name="John Manager",
                        owner_email="manager@digitrac.com",
                        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=3),
                        status="OPEN",
                        escalated_to_vp=True
                    ),
                    RIDEGovernance(
                        project_id=p.id,
                        type="DEPENDENCY",
                        title="SAP ID Validation Artifact Dependency",
                        description="PMO requires validated SAP material nodes from corporate Finance prior to production release.",
                        severity="MEDIUM",
                        priority="HIGH",
                        owner_name="Finance Officer",
                        owner_email="finance@digitrac.com",
                        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=7),
                        status="IN_PROGRESS",
                        escalated_to_vp=False
                    ),
                    RIDEGovernance(
                        project_id=p.id,
                        type="ISSUE",
                        title="AMER Regional Compliance License Delay",
                        description="Compliance clearance is delayed at external security auditors for AMER deployment modules.",
                        severity="HIGH",
                        priority="HIGH",
                        owner_name="Ananya Iyer",
                        owner_email="ananya.iyer@arche.global",
                        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=10),
                        status="OPEN",
                        escalated_to_vp=False
                    )
                ]
                db.add_all(items)
                ride_seeded += len(items)
                print(f"Seeded {len(items)} RIDE items for Project: {p.project_name}")
        
        # Let's seed Finance Validations
        print("\nSeeding Finance Validation workflows...")
        for p in projects:
            existing_val = db.query(FinanceValidation).filter(FinanceValidation.project_id == p.id).first()
            if not existing_val:
                f_val = FinanceValidation(
                    project_id=p.id,
                    validated_actual_cost=144000.0,
                    validated_actual_revenue=290000.0,
                    validated_by="finance@digitrac.com",
                    status="PENDING"
                )
                db.add(f_val)
                print(f"Seeded Finance validation state for project ID {p.id}")

        # Let's seed compliant Audit Logs
        print("\nSeeding Compliance Audit Logs...")
        logs_seeded = 0
        for p in projects:
            existing_logs = db.query(AuditLog).filter(AuditLog.project_id == p.id).first()
            if not existing_logs:
                audit_logs = [
                    AuditLog(
                        user_email="vp@digitrac.com",
                        role="VP",
                        action="baseline_budget",
                        project_id=p.id,
                        change_details={
                            "message": "Approved project baseline budget and threshold.",
                            "baseline_budget": 8000000.0,
                            "margin_threshold": 32.0
                        }
                    ),
                    AuditLog(
                        user_email="manager@digitrac.com",
                        role="PM",
                        action="update_booking",
                        project_id=p.id,
                        change_details={
                            "message": "Assigned engineer Aarav Sharma to Backend API task.",
                            "engineer": "Aarav Sharma",
                            "booking_hours": 80.0,
                            "cost_rate": 1200.0
                        }
                    ),
                    AuditLog(
                        user_email="manager@digitrac.com",
                        role="PM",
                        action="edit_delivery",
                        project_id=p.id,
                        change_details={
                            "message": "Created high severity delivery Risk for integration limits.",
                            "ride_type": "RISK",
                            "severity": "HIGH",
                            "title": "API Integration Rate Limit Constraints"
                        }
                    )
                ]
                db.add_all(audit_logs)
                logs_seeded += len(audit_logs)
                print(f"Seeded {len(audit_logs)} compliance audit logs for project: {p.project_name}")

        db.commit()
        print("\n" + "=" * 60)
        print("  PHASE-2 SEEDING & MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\nSeeding Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_and_seed_phase2()
