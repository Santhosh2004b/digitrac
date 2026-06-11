from sqlalchemy import Column, Integer, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from app.db.session import Base
import datetime

class TimeLog(Base):
    __tablename__ = "timelogs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    hours = Column(Float, nullable=False)
    date = Column(Date, default=datetime.date.today)

    task = relationship("Task", back_populates="timelogs")
    user = relationship("User", back_populates="timelogs")
