from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
import datetime

class TaskStatus(str):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    expected_hours = Column(Float, nullable=False)
    status = Column(String, default="pending")
    priority = Column(String, default="MEDIUM")
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")
    timelogs = relationship("TimeLog", back_populates="task")
