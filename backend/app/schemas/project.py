from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class ProjectResourceBase(BaseModel):
    role: str
    qty: Optional[int] = 1
    planned_months: Optional[float] = 0.0
    unit_price: Optional[float] = 0.0
    total_price: Optional[float] = 0.0
    
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    actual_months: Optional[float] = 0.0
    manmonths: Optional[float] = 0.0
    work_start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    last_updated: Optional[datetime] = None

class ProjectResourceCreate(ProjectResourceBase):
    pass

class ProjectResourceResponse(ProjectResourceBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    status: Optional[str] = "DRAFT"
    start_date: Optional[datetime] = None
    
    sale_value: Optional[float] = 0.0
    capex: Optional[float] = 0.0
    opex: Optional[float] = 0.0
    it_cost: Optional[float] = 0.0
    non_it_cost: Optional[float] = 0.0
    implementation_cost: Optional[float] = 0.0
    risk_cost: Optional[float] = 0.0
    misc_cost: Optional[float] = 0.0
    freight: Optional[float] = 0.0
    
    total_cost_baseline: Optional[float] = 0.0
    margin_pct_baseline: Optional[float] = 0.0
    net_margin_baseline: Optional[float] = 0.0
    
    travel_cost: Optional[float] = 0.0
    accommodation_cost: Optional[float] = 0.0
    insurance_cost: Optional[float] = 0.0

class ProjectCreate(ProjectBase):
    manager_id: Optional[int] = None
    resources: List[ProjectResourceCreate] = []

class ProjectResponse(ProjectBase):
    id: int
    manager_id: Optional[int]
    resources: List[ProjectResourceResponse] = []

    class Config:
        from_attributes = True
