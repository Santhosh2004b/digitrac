from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class RIDEGovernance(Base):
    __tablename__ = "ride_governance"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("approved_projects.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # RISK, ISSUE, DEPENDENCY, ESCALATION
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    owner_name = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="OPEN")  # OPEN, IN_PROGRESS, RESOLVED
    escalated_to_vp = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Optional: Relationship mapping if approved projects model relationship is needed
    project = relationship("ApprovedProject", back_populates="ride_items")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String, nullable=False)
    role = Column(String, nullable=False)  # VP, PM, MANAGER, FINANCE
    action = Column(String, nullable=False)  # baseline_budget, update_booking, validate_finance, edit_delivery
    project_id = Column(Integer, ForeignKey("approved_projects.id", ondelete="SET NULL"), nullable=True)
    change_details = Column(JSON, nullable=True)  # Before/After snapshots

class ProjectBaseline(Base):
    __tablename__ = "project_baselines"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("approved_projects.id", ondelete="CASCADE"), nullable=False)
    approved_budget = Column(Float, default=0.0)
    approved_margin_threshold = Column(Float, default=30.0)  # Default target 30% margin
    approved_by = Column(String, nullable=False)
    approved_at = Column(DateTime, default=datetime.utcnow)

class FinanceValidation(Base):
    __tablename__ = "finance_validations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("approved_projects.id", ondelete="CASCADE"), nullable=False)
    validated_actual_cost = Column(Float, default=0.0)
    validated_actual_revenue = Column(Float, default=0.0)
    validated_by = Column(String, nullable=False)
    validated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="PENDING")  # PENDING, VALIDATED

class ProjectHealthSnapshot(Base):
    __tablename__ = "project_health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    snapshot_date = Column(DateTime, default=datetime.utcnow)
    
    timeline_utilization_pct = Column(Float, default=0.0)
    cost_utilization_pct = Column(Float, default=0.0)
    hours_utilization_pct = Column(Float, default=0.0)
    margin_health = Column(String, default="GREEN")
    
    traffic_light = Column(String, default="GREEN") # GREEN, ORANGE, RED
