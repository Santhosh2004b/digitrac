from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.session import Base
from datetime import datetime

class CentralizedResource(Base):
    __tablename__ = "centralized_resources"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False) # e.g. EMP-101
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    grade = Column(String, nullable=False)  # e.g., L1, L2, L3, Senior, Principal, Architect
    role_practice = Column(String, nullable=False)  # Role / Practice
    hourly_billing_rate = Column(Float, default=0.0)  # Hourly Billing Rate
    cost_rate = Column(Float, default=0.0)  # Cost Rate
    skill_category = Column(String, nullable=True)  # Skill Category (e.g. Cloud, Cybersecurity)
    status = Column(String, default="Available")  # Available / Allocated / Bench
    region = Column(String, default="GLOBAL")  # Region (APJ, EMEA, AMER, etc.)
    manager_email = Column(String, nullable=True)  # Manager Mapping (email of manager)
    created_at = Column(DateTime, default=datetime.utcnow)
