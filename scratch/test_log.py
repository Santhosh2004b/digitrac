import sys
import os

# Add the project root to sys.path so we can import from app
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.project import ApprovedProject, Project
from app.models.intelligence import IntelligenceEvent
from app.models.timelog import TimeLog

def test_log_hours():
    db = SessionLocal()
    try:
        project_id = 34
        item_id = "0"
        
        project = db.query(ApprovedProject).filter(ApprovedProject.id == project_id).first()
        full_data = project.full_excel_data
        items = full_data.get("project_costing", [])
        
        updated = False
        target_item = None
        
        log_hours = 1.0
        log_remarks = "Testing"
        
        for idx, i in enumerate(items):
            node_id = i.get("id") if i.get("id") is not None else str(i.get("sap_id") or i.get("SAP Material ID", ""))
            if not node_id: node_id = str(idx)
            
            if str(node_id) == str(item_id) or str(idx) == str(item_id):
                updated = True
                target_item = i
                break
                
        if not updated:
            print("Item not found")
            return
            
        # Also log to timelogs table for history
        new_log = TimeLog(
            project_id=project_id,
            node_id=str(item_id),
            user_id=1,
            hours=log_hours,
            remarks=log_remarks
        )
        db.add(new_log)
        db.flush() # test the insert
        
        # Intelligence Feed Generation
        p_hrs = float(target_item.get('planned_hours', 1) or 1)
        a_hrs = float(target_item.get('actual_hours', 0) or 0)
        util_pct = round((a_hrs / p_hrs) * 100, 1)
        
        intel_hrs = IntelligenceEvent(
            project_id=project.id,
            project_name=project.project_name,
            sap_node_id=item_id,
            sap_node_name=target_item.get("description") or target_item.get("Description", "Unknown Node"),
            category="HOURS",
            priority="INFO",
            message=f"{log_hours} Hours logged by {target_item.get('assigned_person', 'Resource')}. ({log_remarks})",
            metrics={
                "Actual / Planned": f"{a_hrs} / {target_item.get('planned_hours', 0)} Hrs",
                "Utilization": f"{util_pct}%"
            }
        )
        db.add(intel_hrs)
        db.flush()
        
        print("Success! No exception thrown during DB operations.")
        db.rollback() # Don't save
        
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_log_hours()
