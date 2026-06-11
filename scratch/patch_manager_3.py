import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'r', encoding='utf-8') as f:
    content = f.read()

get_my_proj_code = """
@router.get("/projects")
def get_my_projects(db: Session = Depends(get_db), current_manager: User = Depends(get_current_manager), region: str = "GLOBAL"):
    if current_manager.role == "VP" or current_manager.role == "PC":
        query = db.query(ApprovedProject)
    else:
        query = db.query(ApprovedProject).filter(ApprovedProject.assigned_manager_email == current_manager.email)
    
    projects = query.all()
    result = []
    
    for p in projects:
        full_data = p.full_excel_data
        items = full_data.get("project_costing", []) if isinstance(full_data, dict) else (full_data or [])
        project_info = full_data.get("project_info", {}) if isinstance(full_data, dict) else {}

        if not items and region != "GLOBAL":
            continue

        proj_model = db.query(Project).filter(Project.name == p.project_name).first()
        target_margin_pct = proj_model.margin_target_pct if proj_model else 0.0
        original_margin_pct = proj_model.margin_pct_baseline if proj_model else 0.0
        sell_value = proj_model.total_sell_price_with_gst if proj_model and proj_model.total_sell_price_with_gst > 0 else (proj_model.sale_value if proj_model else 0.0)
        baseline_cost = proj_model.total_cost_price if proj_model else 0.0
        duration = proj_model.duration_months if proj_model else 0.0
        
        total_planned_hours = 0.0
        total_actual_hours = 0.0
        total_implementation_cost = 0.0
        total_forecasted_implementation_cost = 0.0
        
        traffic_light = "Green" # Default

        for idx, i in enumerate(items):
            p_hrs = float(i.get("planned_hours", 0.0))
            a_hrs = float(i.get("actual_hours", 0.0))
            c_per_hr = float(i.get("cost_per_hour", 0.0))
            r_cost = float(i.get("resource_cost", 0.0))
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
            total_forecasted_implementation_cost += max(item_total_actual_cost, item_total_planned_cost)

        current_total_cost = baseline_cost + total_implementation_cost
        current_margin_amt = sell_value - current_total_cost
        current_margin_pct = (current_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
        
        forecast_total_cost = baseline_cost + total_forecasted_implementation_cost
        forecast_margin_amt = sell_value - forecast_total_cost
        forecast_margin_pct = (forecast_margin_amt / sell_value * 100) if sell_value > 0 else 0.0
        
        hours_consumed_pct = (total_actual_hours / total_planned_hours * 100) if total_planned_hours > 0 else 0
        
        if total_actual_hours > total_planned_hours or current_margin_pct <= target_margin_pct:
            traffic_light = "Red"
        elif hours_consumed_pct > 50 and current_margin_pct < original_margin_pct:
            traffic_light = "Orange"

        result.append({
            "id": p.id,
            "name": p.project_name,
            "customer_name": project_info.get("customer_name") or "N/A",
            "manager_name": p.assigned_manager_email.split('@')[0].capitalize(),
            "duration": duration,
            "status": traffic_light,
            "kpis": {
                "planned_hours": total_planned_hours,
                "actual_hours": total_actual_hours,
                "progress_pct": round(hours_consumed_pct, 1),
                "target_margin_pct": round(target_margin_pct, 2),
                "current_margin_pct": round(current_margin_pct, 2),
                "forecast_margin_pct": round(forecast_margin_pct, 2),
                "planned_cost": baseline_cost,
                "actual_cost": current_total_cost
            },
            "assigned_at": p.created_at.isoformat() if p.created_at else None
        })
    return result
"""

pattern = re.compile(r'@router\.get\("/projects"\)\ndef get_my_projects.*?return result', re.DOTALL)
content = pattern.sub(get_my_proj_code.strip(), content)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated get_my_projects")
