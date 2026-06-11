from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class IntelligenceEvent(Base):
    __tablename__ = "intelligence_events"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True) # Optional if it's a global event
    project_name = Column(String, nullable=True)
    sap_node_id = Column(String, nullable=True)
    sap_node_name = Column(String, nullable=True)
    
    category = Column(String, nullable=False) # MARGIN, HOURS, ESCALATION, APPROVAL, ASSIGNMENT, MILESTONE
    priority = Column(String, nullable=False) # INFO, WARNING, CRITICAL, SUCCESS
    
    metrics = Column(JSON, nullable=True) 
    # Example format:
    # {
    #    "Current Margin": "14.2%",
    #    "Target Margin": "15.0%",
    #    "Forecast Margin": "13.5%"
    # }
    
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
