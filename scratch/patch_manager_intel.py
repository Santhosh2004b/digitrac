import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Patch `assign_item_task`
patch_assign = """
            from sqlalchemy.orm.attributes import flag_modified
            project.full_excel_data["project_costing"] = items
            flag_modified(project, "full_excel_data")
            db.commit()

            # Intelligence Event
            from app.models.intelligence import IntelligenceEvent
            intel = IntelligenceEvent(
                project_id=project.id,
                project_name=project.project_name,
                sap_node_id=str(node_id),
                sap_node_name=req.task_name,
                category="ASSIGNMENT",
                priority="INFO",
                message=f"Resource {req.assigned_person} assigned to Node.",
                metrics={
                    "Planned Hours": f"{req.planned_hours} Hrs",
                    "Implementation Cost": f"₹{req.total_implementation_cost}"
                }
            )
            db.add(intel)
            db.commit()

            return {"status": "success", "message": "Task assigned successfully"}
"""

content = re.sub(
    r'            from sqlalchemy.orm.attributes import flag_modified\n            project.full_excel_data\["project_costing"\] = items\n            flag_modified\(project, "full_excel_data"\)\n            db.commit\(\)\n\n            return \{"status": "success", "message": "Task assigned successfully"\}',
    patch_assign.strip('\n'),
    content
)

# 2. Patch `log_item_hours`
# I already added escalation logic to `log_item_hours` which ends with `db.commit()`. I need to insert the Intelligence events right before `return {"status": "success", "message": "Hours logged successfully"}`

patch_log = """
    # Intelligence Feed Generation
    from app.models.intelligence import IntelligenceEvent
    
    # 1. Standard Hours Event
    intel_hrs = IntelligenceEvent(
        project_id=project.id,
        project_name=project.project_name,
        sap_node_id=item_id,
        sap_node_name=target_item.get("task_name", "Unknown Node"),
        category="HOURS",
        priority="INFO",
        message=f"{req.hours} Hours logged by {target_item.get('assigned_person', 'Resource')}." + (f" ({req.remarks})" if req.remarks else ""),
        metrics={
            "Actual / Planned": f"{target_item.get('actual_hours', 0)} / {target_item.get('planned_hours', 0)} Hrs",
            "Utilization": f"{target_item.get('utilization_pct', 0)}%"
        }
    )
    db.add(intel_hrs)
    
    # 2. Margin Event
    if trigger_reason:
        priority = "CRITICAL" if "exceeded" in trigger_reason else "WARNING"
        intel_margin = IntelligenceEvent(
            project_id=project.id,
            project_name=project.project_name,
            sap_node_id=item_id,
            category="MARGIN",
            priority=priority,
            message=trigger_reason,
            metrics={
                "Target Margin": f"{target_margin_pct:.1f}%",
                "Current Margin": f"{current_margin_pct:.1f}%",
                "Forecast Margin": f"{forecast_margin_pct:.1f}%"
            }
        )
        db.add(intel_margin)
    elif current_margin_pct >= target_margin_pct and total_actual_hours > 0:
        intel_margin = IntelligenceEvent(
            project_id=project.id,
            project_name=project.project_name,
            sap_node_id=item_id,
            category="MARGIN",
            priority="SUCCESS",
            message="Project operating above approved margin threshold.",
            metrics={
                "Target Margin": f"{target_margin_pct:.1f}%",
                "Current Margin": f"{current_margin_pct:.1f}%",
                "Forecast Margin": f"{forecast_margin_pct:.1f}%"
            }
        )
        db.add(intel_margin)
        
    db.commit()

    return {"status": "success", "message": "Hours logged successfully"}
"""

content = re.sub(
    r'    return \{"status": "success", "message": "Hours logged successfully"\}',
    patch_log.strip('\n'),
    content
)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\manager.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated manager.py")
