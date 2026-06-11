from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class WorkflowInstance(Base):
    __tablename__ = "workflow_instances"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # PROJECT_APPROVAL, BUDGET_APPROVAL, RESOURCE_ALLOCATION, ESCALATION, FINANCE_VALIDATION, CHANGE_REQUEST
    project_id = Column(Integer, nullable=True)  # Links to approved_projects or projects
    project_name = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    current_level = Column(Integer, default=1)
    total_levels = Column(Integer, default=2)
    assigned_role = Column(String, default="VP")  # VP, FINANCE, MANAGER
    initiator_email = Column(String, nullable=False)
    comments = Column(String, nullable=True)
    sla_hours = Column(Integer, default=24)
    is_escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    steps = relationship("WorkflowStep", back_populates="instance", cascade="all, delete-orphan")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    workflow_instance_id = Column(Integer, ForeignKey("workflow_instances.id", ondelete="CASCADE"), nullable=False)
    level = Column(Integer, nullable=False)
    approver_role = Column(String, nullable=False)  # VP, FINANCE, MANAGER
    approver_email = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    comments = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    instance = relationship("WorkflowInstance", back_populates="steps")

class InAppNotification(Base):
    __tablename__ = "in_app_notifications"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    recipient_email = Column(String, nullable=False)
    priority = Column(String, default="INFO")  # INFO, WARNING, CRITICAL
    type = Column(String, default="INFO")  # ESCALATION, MARGIN, OVERBOOKING, DELAY, APPROVAL
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProjectMilestone(Base):
    __tablename__ = "project_milestones"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED, DELAYED
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
