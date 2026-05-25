from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    VP = "VP"
    MANAGER = "MNG"
    EMPLOYEE = "EMP"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # VP, MNG, or EMP
    salary = Column(Integer, nullable=True) # Monthly salary
    department = Column(String, nullable=True)
    is_setup_complete = Column(Integer, default=0) # 0: New, 1: Setup Complete
    is_online = Column(Integer, default=0) # 0: Offline, 1: Online

    projects = relationship("Project", back_populates="manager")
    tasks = relationship("Task", back_populates="assignee")
    timelogs = relationship("TimeLog", back_populates="user")
