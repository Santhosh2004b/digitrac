import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'r', encoding='utf-8') as f:
    content = f.read()

get_project_code = """
@router.get("/projects/{project_id}")
def get_project_detail(
    project_id: int,
    region: str = "GLOBAL",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    if current_user.role == "VP" or current_user.role == "PC":
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
    else:
        project = db.query(ApprovedProject).filter(
            ApprovedProject.id == project_id,
            func.lower(ApprovedProject.assigned_manager_email) == current_user.email.lower()
        ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not assigned to you.")

    full_data = project.full_excel_data
    items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
    project_info = full_data.get("project_info", {}) if isinstance(full_data, dict) else {}

    ma = db.query(MissionAssignment).filter(
        MissionAssignment.mission_name == project.project_name,
        MissionAssignment.manager_email == current_user.email
    ).first()
    artifact_path = ma.artifact_path if ma else None

    # Fetch DB Project for base financials
    proj_model = db.query(Project).filter(Project.name == project.project_name).first()
    target_margin_pct = proj_model.margin_target_pct if proj_model else 0.0
    original_margin_pct = proj_model.margin_pct_baseline if proj_model else 0.0
    sell_value = proj_model.total_sell_price_with_gst if proj_model and proj_model.total_sell_price_with_gst > 0 else (proj_model.sale_value if proj_model else 0.0)
    baseline_cost = proj_model.total_cost_price if proj_model else 0.0

    resource_data = []
    
    total_planned_hours = 0.0
    total_actual_hours = 0.0
    total_implementation_cost = 0.0
    total_forecasted_implementation_cost = 0.0
    
    traffic_light = "Green" # Default

    for idx, i in enumerate(items):
        node_id = i.get("id") if i.get("id") is not None else str(i.get("SAP Material ID", ""))
        
        p_hrs = float(i.get("planned_hours", 0.0))
        a_hrs = float(i.get("actual_hours", 0.0))
        c_per_hr = float(i.get("cost_per_hour", 0.0))
        r_cost = float(i.get("resource_cost", 0.0)) # this is actual cost currently
        
        planned_r_cost = p_hrs * c_per_hr
        
        t_cost = float(i.get("travel_cost", 0.0))
        f_cost = float(i.get("food_cost", 0.0))
        s_cost = float(i.get("stay_cost", 0.0))
        o_cost = float(i.get("other_cost", 0.0))
        
        item_total_actual_cost = r_cost + t_cost + f_cost + s_cost + o_cost
        item_total_planned_cost = planned_r_cost + t_cost + f_cost + s_cost + o_cost
        
        total_planned_hours += p_hrs
        total_actual_hours += a_hrs
        total_implementation_cost += item_total_actual_cost
        
        # Forecast cost: if actual > planned, use actual, else use planned
        total_forecasted_implementation_cost += max(item_total_actual_cost, item_total_planned_cost)
        
        utilization = (a_hrs / p_hrs * 100) if p_hrs > 0 else 0
        
        resource_data.append({
            "id": node_id,
            "sap_id": i.get("SAP Material ID"),
            "task_name": i.get("Description") or "N/A",
            "name": i.get("assigned_person") or "Unassigned",
            "employee_id": i.get("employee_id") or "N/A",
            "grade": i.get("grade") or "N/A",
            "planned_hours": p_hrs,
            "actual_hours": a_hrs,
            "remaining_hours": max(0, p_hrs - a_hrs),
            "utilization": round(utilization, 2),
            "cost_per_hour": c_per_hr,
            "resource_cost": r_cost,
            "total_implementation_cost": item_total_actual_cost,
            "planned_days": i.get("planned_days", 0),
            "start_date": i.get("start_date"),
            "status": i.get("status", "Pending")
        })

    # Calculations
    current_total_cost = baseline_cost + total_implementation_cost
    current_margin_amt = sell_value - current_total_cost
    current_margin_pct = (current_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
    
    forecast_total_cost = baseline_cost + total_forecasted_implementation_cost
    forecast_margin_amt = sell_value - forecast_total_cost
    forecast_margin_pct = (forecast_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
    
    margin_variance = current_margin_pct - target_margin_pct
    
    hours_variance = total_actual_hours - total_planned_hours
    hours_consumed_pct = (total_actual_hours / total_planned_hours * 100) if total_planned_hours > 0 else 0
    
    # Traffic Light Logic
    if total_actual_hours > total_planned_hours or current_margin_pct <= target_margin_pct:
        traffic_light = "Red"
    elif hours_consumed_pct > 50 and current_margin_pct < original_margin_pct:
        traffic_light = "Orange"

    kpis = {
        "planned_hours": total_planned_hours,
        "actual_hours": total_actual_hours,
        "hours_variance": hours_variance,
        "planned_cost": baseline_cost + sum(r["planned_hours"] * r["cost_per_hour"] for r in resource_data),
        "actual_cost": current_total_cost,
        "cost_variance": current_total_cost - (baseline_cost + sum(r["planned_hours"] * r["cost_per_hour"] for r in resource_data)),
        "target_margin_pct": target_margin_pct,
        "current_margin_pct": current_margin_pct,
        "forecast_margin_pct": forecast_margin_pct,
        "margin_variance": margin_variance,
        "traffic_light": traffic_light
    }

    return {
        "id": project.id,
        "name": project.project_name,
        "resources": resource_data,
        "kpis": kpis,
        "status": traffic_light,
        "approved_by": project.approved_by,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "artifact_path": artifact_path,
        "assigned_at": project.created_at.isoformat() if project.created_at else None
    }
"""

pattern2 = re.compile(r'@router\.get\("/projects/\{project_id\}"\)\ndef get_project_detail.*?return \{.*?"assigned_at":.*?\}', re.DOTALL)
content = pattern2.sub(get_project_code.strip(), content)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated get_project_detail")
