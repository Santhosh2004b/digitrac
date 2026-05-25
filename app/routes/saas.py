from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.models.saas import Tenant, TenantSubscription
from app.models.user import User
from app.models.project import Project
from app.models.governance import AuditLog
from app.utils.deps import get_current_user, get_current_vp
from app.config import settings
from pydantic import BaseModel, EmailStr
from app.services.demo_seeder import DemoSandboxSeeder
import hashlib

router = APIRouter(prefix="/saas", tags=["saas_readiness"])

@router.post("/demo-reset")
def reset_demo_sandbox_environment(db: Session = Depends(get_db)):
    """
    SaaS Platform Sandbox Demo Reset gateway (Objective 1)
    """
    DemoSandboxSeeder.reset_and_seed_sandbox(db)
    return {"message": "Commercial Demo Environment successfully reset!"}

# --- REQUEST SCHEMAS ---
class TenantOnboardRequest(BaseModel):
    company_name: str
    domain: str
    admin_email: EmailStr
    admin_password: str
    plan_type: str = "STARTER" # STARTER, PROFESSIONAL, ENTERPRISE

class BrandingRequest(BaseModel):
    logo_url: str
    theme_color: str

# --- 2. ENTERPRISE ORGANIZATION ONBOARDING FLOW ---
@router.post("/onboard")
def onboard_enterprise_tenant(req: TenantOnboardRequest, db: Session = Depends(get_db)):
    """
    Onboarding provision worker:
    1. Registers corporate Tenant organization.
    2. Provisions TenantSubscription constraints.
    3. Creates Tenant Organization Administrator.
    """
    # Check if name/domain taken
    existing_tenant = db.query(Tenant).filter((Tenant.name == req.company_name) | (Tenant.domain == req.domain)).first()
    if existing_tenant:
        raise HTTPException(status_code=400, detail="Organization Name or domain already registered.")

    existing_user = db.query(User).filter(User.email == req.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Administrator email already registered.")

    # 1. Create Tenant
    tenant = Tenant(
        name=req.company_name,
        domain=req.domain,
        theme_color="#00ffd1"
    )
    db.add(tenant)
    db.flush() # Sync ID

    # 2. Provision Subscription Plan constraints (Objective 3)
    max_users = 5
    max_projects = 3
    if req.plan_type == "PROFESSIONAL":
        max_users = 25
        max_projects = 15
    elif req.plan_type == "ENTERPRISE":
        max_users = 1000
        max_projects = 9999

    sub = TenantSubscription(
        tenant_id=tenant.id,
        plan_type=req.plan_type,
        max_users=max_users,
        max_projects=max_projects,
        active=True
    )
    db.add(sub)

    # 3. Create Tenant Administrator
    hashed_pwd = hashlib.sha256(req.admin_password.encode('utf-8')).hexdigest()
    admin = User(
        email=req.admin_email,
        hashed_password=hashed_pwd,
        role="VP", # Local VP/Admin role
        is_active=True
    )
    db.add(admin)

    # Audit Trail
    audit = AuditLog(
        user_email=req.admin_email,
        role="VP",
        action="tenant_onboarded",
        project_id=None,
        change_details={"company": req.company_name, "plan": req.plan_type, "domain": req.domain}
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Enterprise organization onboarded successfully!",
        "tenant_id": tenant.id,
        "company_name": tenant.name,
        "subscription_plan": req.plan_type,
        "max_projects_limit": max_projects
    }

# --- 4. WHITE-LABEL BRANDING CONTROLS ---
@router.put("/tenant/{tenant_id}/branding")
def update_white_label_branding(tenant_id: int, req: BrandingRequest, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    White-Label customization configurations.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found.")
    
    tenant.logo_url = req.logo_url
    tenant.theme_color = req.theme_color
    
    audit = AuditLog(
        user_email=current_user.email,
        role="VP",
        action="tenant_branding_updated",
        project_id=None,
        change_details={"logo": req.logo_url, "theme_color": req.theme_color}
    )
    db.add(audit)
    db.commit()
    
    return {"message": "White-label branding parameters updated successfully!"}

# --- 3. PLAN-BASED LICENSE GATING ENGINE ---
@router.get("/tenant/{tenant_id}/validate-limits")
def validate_license_limits(tenant_id: int, db: Session = Depends(get_db)):
    """
    Validates company limits before allocating new resources/projects.
    """
    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
    if not sub or not sub.active:
        raise HTTPException(status_code=403, detail="Active subscription required.")

    # Query active project count (scoped to tenant - mock isolation)
    proj_count = db.query(Project).count() # Scope simulation
    
    can_create_project = proj_count < sub.max_projects
    
    return {
        "plan_type": sub.plan_type,
        "max_projects": sub.max_projects,
        "current_projects": proj_count,
        "license_valid": can_create_project,
        "remaining_project_slots": max(sub.max_projects - proj_count, 0)
    }

# --- 7. METRIC BILLING INTELLIGENCE & 8. SUPER ADMIN OBSERVE ---
@router.get("/tenants")
def get_all_tenants_super_admin(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Super Admin Global Observability controller (Objective 8)
    """
    tenants = db.query(Tenant).all()
    results = []
    for t in tenants:
        sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == t.id).first()
        results.append({
            "id": t.id,
            "name": t.name,
            "domain": t.domain,
            "theme_hex": t.theme_color,
            "logo": t.logo_url,
            "plan": sub.plan_type if sub else "STARTER",
            "api_calls": sub.api_consumption_count if sub else 0,
            "notifications_volume": sub.notification_volume_count if sub else 0,
            "ai_inference_count": sub.ai_analytics_consumption if sub else 0
        })
    return results

@router.post("/tenant/{tenant_id}/simulate-usage")
def simulate_saas_billing_usage(tenant_id: int, api_inc: int = 100, notif_inc: int = 20, db: Session = Depends(get_db)):
    """
    Simulates SaaS usage to demonstrate metered invoicing metrics.
    """
    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.api_consumption_count += api_inc
    sub.notification_volume_count += notif_inc
    sub.ai_analytics_consumption += 1
    
    db.commit()
    return {"message": "Metered billing metrics updated successfully!"}
