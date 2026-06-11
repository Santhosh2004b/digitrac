from sqlalchemy import Column, Integer, ForeignKey, Float, Date, String
from sqlalchemy.orm import relationship
from app.db.session import Base
import datetime

class TimeLog(Base):
    __tablename__ = "timelogs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True) # Legacy task reference
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    node_id = Column(String, nullable=True) # SAP Material ID or SL No
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    employee_email = Column(String, nullable=True) # New tracking via central resources
    
    hours = Column(Float, nullable=False)
    date = Column(Date, default=datetime.date.today)
    remarks = Column(String, nullable=True)

    task = relationship("Task", back_populates="timelogs")
    user = relationship("User", back_populates="timelogs")
