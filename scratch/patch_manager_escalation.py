import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'r', encoding='utf-8') as f:
    content = f.read()

# I need to insert escalation logic at the end of log_item_hours
escalation_logic = """
    # Calculate Project Level Totals for Escalation
    proj_model = db.query(Project).filter(Project.name == project.project_name).first()
    target_margin_pct = proj_model.margin_target_pct if proj_model else 0.0
    sell_value = proj_model.total_sell_price_with_gst if proj_model and proj_model.total_sell_price_with_gst > 0 else (proj_model.sale_value if proj_model else 0.0)
    baseline_cost = proj_model.total_cost_price if proj_model else 0.0
    
    total_planned_hours = 0.0
    total_actual_hours = 0.0
    total_implementation_cost = 0.0
    total_forecasted_implementation_cost = 0.0

    for i in items:
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
    
    trigger_reason = None
    if current_margin_pct < target_margin_pct:
        trigger_reason = f"Current Margin ({current_margin_pct:.1f}%) dropped below Target ({target_margin_pct:.1f}%)"
    elif forecast_margin_pct < target_margin_pct:
        trigger_reason = f"Forecast Margin ({forecast_margin_pct:.1f}%) projected below Target ({target_margin_pct:.1f}%)"
    elif total_planned_hours > 0 and total_actual_hours > (total_planned_hours * 1.10):
        trigger_reason = f"Hours Variance exceeded 10% (Actual: {total_actual_hours}, Planned: {total_planned_hours})"
    
    if trigger_reason:
        from app.models.requests import MarginEscalation
        from app.models.workflow import InAppNotification
        # Check if already open
        existing = db.query(MarginEscalation).filter(MarginEscalation.project_id == project_id, MarginEscalation.status == "OPEN").first()
        if not existing:
            new_esc = MarginEscalation(
                project_id=project_id,
                target_margin=target_margin_pct,
                current_margin=current_margin_pct,
                forecast_margin=forecast_margin_pct,
                trigger_reason=trigger_reason,
                status="OPEN",
                escalated_to=project.approved_by or "vp@arche.global"
            )
            db.add(new_esc)
            
            new_notif = InAppNotification(
                recipient_email=project.approved_by or "vp@arche.global",
                priority="CRITICAL",
                type="ESCALATION",
                title=f"Margin Escalation: {project.project_name}",
                message=trigger_reason
            )
            db.add(new_notif)
            
            # Notifying PM softly
            new_notif_pm = InAppNotification(
                recipient_email=project.assigned_manager_email,
                priority="WARNING",
                type="MARGIN",
                title=f"Warning: Margin Risk on {project.project_name}",
                message=trigger_reason
            )
            db.add(new_notif_pm)
            
            db.commit()

    return {"status": "success", "message": "Hours logged successfully"}
"""

pattern = re.compile(r'    return \{"status": "success", "message": "Hours logged successfully"\}', re.DOTALL)
content = pattern.sub(escalation_logic.strip(), content)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated log_item_hours with automatic escalation triggers")
