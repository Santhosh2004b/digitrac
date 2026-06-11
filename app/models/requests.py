from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class ResourceRequest(Base):
    __tablename__ = "resource_requests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    node_id = Column(String, nullable=False)
    type = Column(String, nullable=False) # ADDITIONAL_HOURS, DURATION_EXTENSION, REPLACEMENT
    requested_by = Column(String, nullable=False) # PM Email
    
    # Request Details
    current_hours = Column(Float, nullable=True)
    requested_additional_hours = Column(Float, nullable=True)
    current_end_date = Column(DateTime, nullable=True)
    requested_end_date = Column(DateTime, nullable=True)
    current_resource_id = Column(String, nullable=True)
    requested_role = Column(String, nullable=True)
    
    reason = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    approved_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class MarginEscalation(Base):
    __tablename__ = "margin_escalations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    target_margin = Column(Float, nullable=False)
    current_margin = Column(Float, nullable=False)
    forecast_margin = Column(Float, nullable=False)
    
    trigger_reason = Column(String, nullable=False) # e.g. "Margin dropped below 15%"
    status = Column(String, default="OPEN") # OPEN, ACKNOWLEDGED, RESOLVED
    action_plan = Column(String, nullable=True)
    escalated_to = Column(String, nullable=False) # VP Email
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
