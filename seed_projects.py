from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import engine, SessionLocal
from app.models.project import Project, ApprovedProject
from datetime import datetime
import json

db = SessionLocal()

try:
    # Clear existing data for a clean slate
    
    
    db.commit()

    projects_data = [
        {
            "name": "Project Apollo",
            "customer": "Stark Industries",
            "duration": 6,
            "manager": "manager@arche.global",
            "status": "ACTIVE",
            "total_sell": 150000.0,
            "total_cost": 100000.0,
            "target_margin": 33.3,
            "costing": [
                { "planned_hours": 500, "actual_hours": 200, "cost_per_hour": 50, "resource_cost": 10000 }
            ]
        },
        {
            "name": "Project Artemis",
            "customer": "Wayne Enterprises",
            "duration": 12,
            "manager": "manager@arche.global",
            "status": "ACTIVE",
            "total_sell": 300000.0,
            "total_cost": 250000.0,
            "target_margin": 16.6,
            "costing": [
                { "planned_hours": 1200, "actual_hours": 1000, "cost_per_hour": 75, "resource_cost": 85000, "travel_cost": 20000 }
            ]
        },
        {
            "name": "Project Hermes",
            "customer": "Oscorp",
            "duration": 4,
            "manager": "manager@arche.global",
            "status": "ACTIVE",
            "total_sell": 80000.0,
            "total_cost": 75000.0,
            "target_margin": 6.25,
            "costing": [
                { "planned_hours": 300, "actual_hours": 350, "cost_per_hour": 100, "resource_cost": 40000, "stay_cost": 15000 }
            ]
        },
        {
            "name": "Project Athena",
            "customer": "Daily Bugle",
            "duration": 8,
            "manager": "manager@arche.global",
            "status": "ACTIVE",
            "total_sell": 200000.0,
            "total_cost": 140000.0,
            "target_margin": 30.0,
            "costing": [
                { "planned_hours": 800, "actual_hours": 400, "cost_per_hour": 60, "resource_cost": 24000 }
            ]
        }
    ]

    for p_data in projects_data:
        # Create Project Model
        proj = Project(
            name=p_data["name"],
            status=p_data["status"],
            customer_name=p_data["customer"],
            total_sell_price_with_gst=p_data["total_sell"],
            total_cost_price=p_data["total_cost"],
            margin_target_pct=p_data["target_margin"],
            duration_months=p_data["duration"]
        )
        db.add(proj)
        db.flush() # To get ID

        # Create ApprovedProject Model
        full_data = {
            "project_info": {
                "project_name": p_data["name"],
                "customer_name": p_data["customer"]
            },
            "project_costing": p_data["costing"]
        }
        
        aproj = ApprovedProject(
            project_name=p_data["name"],
            assigned_manager_email=p_data["manager"],
            approved_by="vp@arche.global",
            full_excel_data=full_data,
            created_at=datetime.utcnow()
        )
        db.add(aproj)
        
    db.commit()
    print("Seeded database with real project data!")
except Exception as e:
    db.rollback()
    print(f"Error seeding database: {e}")
finally:
    db.close()
