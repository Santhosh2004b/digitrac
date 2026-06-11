import logging
from sqlalchemy.orm import Session
from app.models.saas import Tenant, TenantSubscription
from app.models.project import Project, ApprovedProject
from app.models.governance import RIDEGovernance, AuditLog, ProjectBaseline
from app.models.workflow import WorkflowInstance, WorkflowStep, ProjectMilestone
from app.models.user import User
from app.models.resource import CentralizedResource
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger("digitrac.demo_seeder")

class DemoSandboxSeeder:
    @staticmethod
    def reset_and_seed_sandbox(db: Session):
        """
        Commercial Demo Reset Utility & PMO Data Generator (Objective 1)
        - Purges sandbox tables and seeds realistic mock tenants, projects, RIDE events, and workflows.
        """
        logger.info("Initiating platform-wide demo reset and sandbox seeding...")

        # 1. Clear existing tables (including dependent tables)
        from sqlalchemy import text
        db.execute(text("DELETE FROM timelogs"))
        db.execute(text("DELETE FROM tasks"))
        db.execute(text("DELETE FROM project_resources"))
        db.execute(text("DELETE FROM project_items"))
        db.execute(text("DELETE FROM mission_assignments"))
        db.query(WorkflowStep).delete()
        db.query(WorkflowInstance).delete()
        db.query(ProjectMilestone).delete()
        db.query(RIDEGovernance).delete()
        db.query(ProjectBaseline).delete()
        db.query(ApprovedProject).delete()
        db.query(Project).delete()
        db.query(CentralizedResource).delete()
        db.query(TenantSubscription).delete()
        db.query(Tenant).delete()
        
        # 2. Seed Corporate Tenants (Objective 1 & 2)
        tenant_arche = Tenant(
            name="Arche Global Sandbox",
            domain="sandbox.arche.global",
            theme_color="#00ffd1"
        )
        tenant_acme = Tenant(
            name="Acme Corporation",
            domain="acme.digitrac.com",
            theme_color="#6C63FF"
        )
        db.add(tenant_arche)
        db.add(tenant_acme)
        db.flush()

        # 3. Seed Subscription Plans (Objective 8)
        sub_arche = TenantSubscription(
            tenant_id=tenant_arche.id,
            plan_type="ENTERPRISE",
            max_users=1000,
            max_projects=9999,
            api_consumption_count=18400,
            notification_volume_count=450,
            ai_analytics_consumption=120
        )
        sub_acme = TenantSubscription(
            tenant_id=tenant_acme.id,
            plan_type="PROFESSIONAL",
            max_users=25,
            max_projects=15,
            api_consumption_count=4200,
            notification_volume_count=98,
            ai_analytics_consumption=15
        )
        db.add(sub_arche)
        db.add(sub_acme)

        # 4. Seed Centralized Resources
        res1 = CentralizedResource(
            employee_id="EMP-701",
            name="Ananya Sharma",
            email="ananya.sharma@arche.global",
            grade="E3",
            role_practice="Cloud Practice Lead",
            hourly_billing_rate=120.0,
            cost_rate=75.0,
            skill_category="Cloud Architecture",
            status="Allocated",
            region="IN",
            manager_email="manager@arche.global"
        )
        res2 = CentralizedResource(
            employee_id="EMP-702",
            name="Marcus Vance",
            email="marcus.vance@arche.global",
            grade="E2",
            role_practice="Security Consultant",
            hourly_billing_rate=95.0,
            cost_rate=55.0,
            skill_category="Cybersecurity",
            status="Allocated",
            region="US",
            manager_email="manager@arche.global"
        )
        res3 = CentralizedResource(
            employee_id="EMP-703",
            name="Samantha Lee",
            email="samantha.lee@arche.global",
            grade="E1",
            role_practice="Software Engineer",
            hourly_billing_rate=0.0, # Simulation unbillable leakage (Objective 1)
            cost_rate=45.0,
            skill_category="Digital Engineering",
            status="Bench",
            region="SG",
            manager_email="manager@arche.global"
        )
        db.add(res1)
        db.add(res2)
        db.add(res3)

        # 5. Seed Sandbox Projects
        ap1 = ApprovedProject(
            project_name="Acme Cloud Infrastructure Migration",
            assigned_manager_email="manager@digitrac.com",
            approved_by="vp@arche.global",
            full_excel_data={"budget": 500000, "margin": 45}
        )
        db.add(ap1)
        db.flush()
        
        p1 = Project(
            name="Acme Cloud Infrastructure Migration",
            status="ACTIVE",
            sale_value=800000.0,
            total_cost_baseline=450000.0,
            margin_pct_baseline=43.75,
            net_margin_baseline=350000.0
        )
        db.add(p1)
        db.flush()

        # Seed Project baseline targets for variance alerting
        base1 = ProjectBaseline(
            project_id=ap1.id,
            approved_budget=500000.0,
            approved_margin_threshold=45.0,
            approved_by="vp@arche.global"
        )
        db.add(base1)

        # Seed RIDE Governance logs
        ride1 = RIDEGovernance(
            project_id=ap1.id,
            type="RISK",
            severity="HIGH",
            priority="CRITICAL",
            title="Acme S3 database encryption configuration delay.",
            description="Acme S3 database encryption configuration delay.",
            owner_name="Marcus Vance",
            owner_email="marcus@arche.global",
            due_date=datetime.utcnow() + timedelta(days=5),
            status="OPEN"
        )
        db.add(ride1)

        # Seed Project milestones
        m1 = ProjectMilestone(
            project_id=p1.id,
            name="Milestone 1: Security Architecture Blueprint sign-off",
            due_date=datetime.utcnow() - timedelta(days=2),
            status="COMPLETED"
        )
        m2 = ProjectMilestone(
            project_id=p1.id,
            name="Milestone 2: Kubernetes Ingress routing deployment",
            due_date=datetime.utcnow() + timedelta(days=12),
            status="PENDING"
        )
        db.add(m1)
        db.add(m2)

        # Seed Prebuilt Workflow example (Objective 1)
        wf1 = WorkflowInstance(
            type="BUDGET_APPROVAL",
            project_id=p1.id,
            project_name=p1.name,
            initiator_email="pm@arche.global",
            status="PENDING",
            sla_hours=48,
            current_level=1,
            total_levels=2,
            is_escalated=False,
            created_at=datetime.utcnow() - timedelta(hours=12)
        )
        db.add(wf1)
        db.flush()

        step1 = WorkflowStep(
            workflow_instance_id=wf1.id,
            level=1,
            approver_role="VP",
            approver_email="vp@arche.global",
            status="PENDING"
        )
        db.add(step1)

        # Seed System Audits
        audit = AuditLog(
            user_email="superadmin@digitrac.com",
            role="VP",
            action="sandbox_reset",
            project_id=None,
            change_details={"seeded_tenants": 2, "seeded_projects": 1}
        )
        db.add(audit)

        db.commit()
        logger.info("SaaS Demo Sandbox database successfully seeded!")
