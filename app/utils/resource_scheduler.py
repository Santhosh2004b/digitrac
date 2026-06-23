import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.db.session import SessionLocal
from app.models.project import ApprovedProject

async def check_resource_utilization():
    while True:
        try:
            db = SessionLocal()
            projects = db.query(ApprovedProject).all()
            for project in projects:
                full_data = project.full_excel_data
                if not isinstance(full_data, dict):
                    continue
                
                impl_res = full_data.get("implementation_resources", [])
                updated = False
                
                for res in impl_res:
                    start_date_str = res.get("start_date")
                    if not start_date_str:
                        continue
                    
                    try:
                        start_date = datetime.fromisoformat(start_date_str)
                    except ValueError:
                        continue
                        
                    planned_months = float(res.get("Months", 0))
                    if planned_months <= 0:
                        continue
                        
                    days_passed = (datetime.utcnow() - start_date).days
                    months_passed = days_passed / 30.0
                    
                    utilization = (months_passed / planned_months) * 100
                    res["utilization"] = round(utilization, 2)
                    updated = True
                
                if updated:
                    project.full_excel_data = full_data
                    flag_modified(project, "full_excel_data")
                    db.commit()
            db.close()
        except Exception as e:
            print(f"Error in resource utilization monitor: {e}")
            
        # Run daily (86400 seconds)
        await asyncio.sleep(86400)
