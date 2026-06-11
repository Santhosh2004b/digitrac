import os, sys
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.project import ApprovedProject
import json

session = SessionLocal()

print("=" * 60)
print("ALL APPROVED PROJECTS IN DATABASE")
print("=" * 60)
projects = session.query(ApprovedProject).all()
print(f"Total: {len(projects)} project(s)")
print()

for p in projects:
    print(f"ID: {p.id}")
    print(f"  Project: {p.project_name}")
    print(f"  Manager: {p.assigned_manager_email}")
    print(f"  Approved by: {p.approved_by}")
    # Check full_excel_data
    try:
        if p.full_excel_data:
            if isinstance(p.full_excel_data, dict):
                sheets = list(p.full_excel_data.keys())
                print(f"  full_excel_data sheets: {sheets}")
                for sheet, rows in p.full_excel_data.items():
                    if isinstance(rows, list):
                        print(f"    Sheet '{sheet}': {len(rows)} rows")
                        if rows:
                            print(f"    First row keys: {list(rows[0].keys()) if isinstance(rows[0], dict) else rows[0]}")
                    else:
                        print(f"    Sheet '{sheet}': not a list -> {type(rows)}")
            else:
                print(f"  full_excel_data type: {type(p.full_excel_data)} | raw: {str(p.full_excel_data)[:200]}")
        else:
            print(f"  full_excel_data: EMPTY/NULL")
    except Exception as e:
        print(f"  full_excel_data ERROR: {e}")
    print()

session.close()
