import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update assign_item_task
assign_code = """
class TaskAssignmentInput(BaseModel):
    assigned_person: str
    employee_id: str = None
    start_date: str = None
    planned_hours: float = 0.0
    travel_cost: float = 0.0
    food_cost: float = 0.0
    stay_cost: float = 0.0
    other_cost: float = 0.0

@router.post("/projects/{project_id}/items/{item_id}/assign")
def assign_item_task(
    project_id: int,
    item_id: str,
    assignment: TaskAssignmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    if current_user.role == "VP":
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    else:
        project = db.query(ApprovedProject).filter(
            ApprovedProject.id == project_id,
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized.")

    full_data = project.full_excel_data
    items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
    workforce = full_data.get("workforce_budget", []) if isinstance(full_data, dict) else []
    
    updated = False
    
    for idx, i in enumerate(items):
        node_id = i.get("id") if i.get("id") is not None else str(i.get("SAP Material ID", ""))
        
        if str(node_id) == str(item_id):
            from app.models.resource import CentralizedResource
            # Find grade from central resource
            res_obj = db.query(CentralizedResource).filter(
                (CentralizedResource.name == assignment.assigned_person) | 
                (CentralizedResource.employee_id == assignment.employee_id)
            ).first()
            
            grade = res_obj.grade if res_obj else "N/A"
            cost_per_hour = 0.0
            
            # Fetch cost from workforce budget
            for wf in workforce:
                if wf.get("Grade") == grade:
                    cost_per_hour = float(wf.get("Manpower Cost/Hour", 0))
                    break
            
            resource_cost = assignment.planned_hours * cost_per_hour
            total_imp_cost = resource_cost + assignment.travel_cost + assignment.food_cost + assignment.stay_cost + assignment.other_cost
            
            planned_days = assignment.planned_hours / 9.0
            
            i.update({
                "assigned_person": assignment.assigned_person,
                "employee_id": res_obj.employee_id if res_obj else assignment.employee_id,
                "grade": grade,
                "start_date": assignment.start_date,
                "planned_hours": assignment.planned_hours,
                "actual_hours": i.get("actual_hours", 0.0),
                "cost_per_hour": cost_per_hour,
                "resource_cost": resource_cost,
                "travel_cost": assignment.travel_cost,
                "food_cost": assignment.food_cost,
                "stay_cost": assignment.stay_cost,
                "other_cost": assignment.other_cost,
                "total_implementation_cost": total_imp_cost,
                "planned_days": round(planned_days, 2),
                "status": "Assigned"
            })
            updated = True
            break
            
    if not updated:
        raise HTTPException(status_code=404, detail="Mission node not found in project.")

    from sqlalchemy.orm.attributes import flag_modified
    if isinstance(project.full_excel_data, dict):
        project.full_excel_data["project_costing"] = items
    else:
        project.full_excel_data = items
    flag_modified(project, "full_excel_data")
    db.commit()
    return {"status": "success", "message": "Resource allocated successfully"}

class LogHoursInput(BaseModel):
    date: str
    hours: float
    remarks: str = ""

@router.post("/projects/{project_id}/items/{item_id}/log-hours")
def log_item_hours(
    project_id: int,
    item_id: str,
    log_data: LogHoursInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    full_data = project.full_excel_data
    items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
    
    updated = False
    
    for idx, i in enumerate(items):
        node_id = i.get("id") if i.get("id") is not None else str(i.get("SAP Material ID", ""))
        
        if str(node_id) == str(item_id):
            curr_actual = float(i.get("actual_hours", 0.0))
            new_actual = curr_actual + log_data.hours
            
            cost_per_hour = float(i.get("cost_per_hour", 0.0))
            new_res_cost = new_actual * cost_per_hour
            
            travel = float(i.get("travel_cost", 0.0))
            food = float(i.get("food_cost", 0.0))
            stay = float(i.get("stay_cost", 0.0))
            other = float(i.get("other_cost", 0.0))
            
            total_imp_cost = new_res_cost + travel + food + stay + other
            
            i.update({
                "actual_hours": new_actual,
                "resource_cost": new_res_cost, # Note: using actuals for cost here to track live margins
                "total_implementation_cost": total_imp_cost
            })
            updated = True
            break
            
    if not updated:
        raise HTTPException(status_code=404, detail="Mission node not found in project.")

    from sqlalchemy.orm.attributes import flag_modified
    if isinstance(project.full_excel_data, dict):
        project.full_excel_data["project_costing"] = items
    flag_modified(project, "full_excel_data")
    db.commit()
    
    # Also log to timelogs table for history
    from app.models.timelog import TimeLog
    new_log = TimeLog(
        project_id=project_id,
        node_id=str(item_id),
        user_id=current_user.id,
        hours=log_data.hours,
        remarks=log_data.remarks
    )
    db.add(new_log)
    db.commit()
    
    return {"status": "success", "message": "Hours logged successfully"}
"""

# Replace assign_item_task
pattern = re.compile(r'class TaskAssignmentInput\(BaseModel\):.*?return \{"status": "success", "message": "Resource allocated successfully"\}', re.DOTALL)
content = pattern.sub(assign_code.strip(), content)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated assign_item_task and log_item_hours.")
