from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.models.timelog import TimeLog
from app.schemas.task import TaskResponse
from app.schemas.timelog import TimeLogCreate, TimeLogResponse
from app.utils.deps import get_current_employee

router = APIRouter(prefix="/employee", tags=["employee"])

from sqlalchemy import case

@router.get("/tasks", response_model=List[TaskResponse])
def get_assigned_tasks(db: Session = Depends(get_db), current_employee: User = Depends(get_current_employee)):
    priority_order = case(
        (Task.priority == 'CRITICAL', 4),
        (Task.priority == 'HIGH', 3),
        (Task.priority == 'MEDIUM', 2),
        (Task.priority == 'LOW', 1),
        else_=0
    )
    
    tasks = db.query(Task).filter(Task.assigned_to == current_employee.id).order_by(priority_order.desc(), Task.id.desc()).all()
    
    # Assign project_name manually since schema expects it
    for task in tasks:
        if task.project:
            task.project_name = task.project.name
        task.logged_hours = sum(log.hours for log in task.timelogs)
            
    return tasks

@router.post("/tasks/{task_id}/start", response_model=TaskResponse)
def start_task(task_id: int, db: Session = Depends(get_db), current_employee: User = Depends(get_current_employee)):
    task = db.query(Task).filter(Task.id == task_id, Task.assigned_to == current_employee.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
    if task.status != "pending":
        raise HTTPException(status_code=400, detail=f"Task is already {task.status}")
    
    task.status = "in_progress"
    task.start_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task

@router.post("/logs", response_model=TimeLogResponse)
def log_time(log_in: TimeLogCreate, db: Session = Depends(get_db), current_employee: User = Depends(get_current_employee)):
    task = db.query(Task).filter(Task.id == log_in.task_id, Task.assigned_to == current_employee.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
    if task.status == "pending":
        raise HTTPException(status_code=400, detail="Task must be started before logging time")
    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot log time to a completed task")

    new_log = TimeLog(
        task_id=log_in.task_id,
        user_id=current_employee.id,
        hours=log_in.hours,
        date=log_in.date or datetime.date.today()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.post("/tasks/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: int, db: Session = Depends(get_db), current_employee: User = Depends(get_current_employee)):
    task = db.query(Task).filter(Task.id == task_id, Task.assigned_to == current_employee.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Task is already completed")
    
    task.status = "completed"
    task.end_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task
@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_employee: User = Depends(get_current_employee)):
    task = db.query(Task).filter(Task.id == task_id, Task.assigned_to == current_employee.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
    
    db.delete(task)
    db.commit()
    return {"message": "Mission Node decommissioned successfully"}
