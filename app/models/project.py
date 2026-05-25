from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class ApprovedProject(Base):
    __tablename__ = "approved_projects"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, nullable=False)
    assigned_manager_email = Column(String, nullable=False)
    approved_by = Column(String) # VP Name/Email
    full_excel_data = Column(JSON) # Exact Excel data
    created_at = Column(DateTime, default=datetime.utcnow)

    ride_items = relationship("RIDEGovernance", back_populates="project", cascade="all, delete-orphan")

class MissionAssignment(Base):
    __tablename__ = "mission_assignments"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    mission_name = Column(String, nullable=False)
    manager_email = Column(String, nullable=False)
    artifact_path = Column(String, nullable=True)
    assigned_by = Column(String, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    approval_status = Column(String, default="APPROVED")
    mail_status = Column(String, default="PENDING")
    mail_sent_at = Column(DateTime, nullable=True)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"))
    mission_owner_email = Column(String, nullable=True)
    deployment_created_by_vp = Column(String, nullable=True)
    deployment_timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="DRAFT") # DRAFT, PROPOSAL, ASSIGNED, ACTIVE, COMPLETED
    start_date = Column(DateTime, nullable=True)

    # Cost Summary Fields (Baseline)
    sale_value = Column(Float, default=0.0)
    capex = Column(Float, default=0.0)
    opex = Column(Float, default=0.0)
    it_cost = Column(Float, default=0.0)
    non_it_cost = Column(Float, default=0.0)
    implementation_cost = Column(Float, default=0.0)
    travel_cost = Column(Float, default=0.0)
    accommodation_cost = Column(Float, default=0.0)
    insurance_cost = Column(Float, default=0.0)
    risk_cost = Column(Float, default=0.0)
    misc_cost = Column(Float, default=0.0)
    freight = Column(Float, default=0.0)
    
    total_cost_baseline = Column(Float, default=0.0)
    margin_pct_baseline = Column(Float, default=0.0)
    net_margin_baseline = Column(Float, default=0.0)

    # Budget & Margin Overview Fields
    duration_months = Column(Float, default=0.0)
    margin_target_pct = Column(Float, default=0.0)
    margin_deviation_pct = Column(Float, default=0.0)

    # Intelligence & Efficiency Fields
    total_hours_used = Column(Float, default=0.0)
    expected_hours = Column(Float, default=0.0)
    efficiency_score = Column(Float, default=0.0)
    performance_score = Column(Float, default=0.0)
    optimized_hours = Column(Float, default=0.0)

    # Legacy fields (keeping for compatibility if needed, but using new fields)
    total_expected_hours = Column(Float, default=0.0)
    revenue_value = Column(Float, default=0.0)
    priority = Column(String, default="MEDIUM")

    manager = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")
    resources = relationship("ProjectResource", back_populates="project", cascade="all, delete-orphan")
    items = relationship("ProjectItem", back_populates="project", cascade="all, delete-orphan")

class ProjectResource(Base):
    __tablename__ = "project_resources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    # VP Defined Fields
    role = Column(String, nullable=False) # e.g. "NON-IT Expert"
    qty = Column(Integer, default=1)
    planned_months = Column(Float, default=0.0)
    manmonths = Column(Float, default=0.0)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0) # planned_months * unit_price * qty
    
    # Manager Filled Fields
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    
    # Execution Tracking Fields
    actual_months = Column(Float, default=0.0)
    work_start_date = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="resources")

class ProjectItem(Base):
    __tablename__ = "project_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    sl_no = Column(Integer)
    sap_material_id = Column(String)
    description = Column(String)
    qty = Column(Integer)
    purchase_unit_price = Column(Float)
    purchase_total = Column(Float)
    selling_unit_price = Column(Float)
    selling_total = Column(Float)
    gm = Column(Float)
    gm_pct = Column(Float)
    gst_pct = Column(Float)
    gst_value = Column(Float)
    net_value = Column(Float)
    item_type = Column(String)
    sales_region = Column(String)
    practice = Column(String)
    sbu = Column(String)
    oem = Column(String)
    component = Column(String)

    project = relationship("Project", back_populates="items")
