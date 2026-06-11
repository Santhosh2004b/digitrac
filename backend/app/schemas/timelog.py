from pydantic import BaseModel
from typing import Optional
from datetime import date as datetime_date

class TimeLogBase(BaseModel):
    task_id: int
    hours: float
    date: Optional[datetime_date] = None

class TimeLogCreate(TimeLogBase):
    pass

class TimeLogResponse(TimeLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
