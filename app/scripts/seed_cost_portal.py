from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.project import Project, ProjectResource
from app.utils.security import get_password_hash
from datetime import datetime

def seed():
    db = SessionLocal()
    try:
        # Create VP
        vp = db.query(User).filter(User.email == "vp@digitrac.com").first()
        if not vp:
            vp = User(
                name="Executive VP",
                email="vp@digitrac.com",
                password=get_password_hash("vp123"),
                role="VP"
            )
            db.add(vp)
            print("VP created: vp@digitrac.com / vp123")

        # Create Manager
        mgr = db.query(User).filter(User.email == "mgr@digitrac.com").first()
        if not mgr:
            mgr = User(
                name="Project Manager Alpha",
                email="mgr@digitrac.com",
                password=get_password_hash("mgr123"),
                role="MNG"
            )
            db.add(mgr)
            print("Manager created: mgr@digitrac.com / mgr123")

        db.commit()

        # Create a sample project if it doesn't exist
        sample = db.query(Project).filter(Project.name == "Sample Intelligence Node").first()
        if not sample:
            new_project = Project(
                name="Sample Intelligence Node",
                status="ASSIGNED",
                manager_id=mgr.id if mgr else None,
                sale_value=5000000,
                total_cost_baseline=3500000,
                margin_pct_baseline=30.0,
                net_margin_baseline=1500000,
                it_cost=500000,
                implementation_cost=200000
            )
            db.add(new_project)
            db.flush()

            resources = [
                {"role": "NON-IT Expert", "qty": 1, "planned": 8, "price": 150000},
                {"role": "Network Expert", "qty": 1, "planned": 4, "price": 200000}
            ]

            for r in resources:
                res = ProjectResource(
                    project_id=new_project.id,
                    role=r["role"],
                    qty=r["qty"],
                    planned_months=r["planned"],
                    unit_price=r["price"],
                    total_price=r["planned"] * r["price"] * r["qty"]
                )
                db.add(res)
            
            print("Sample project created and assigned to manager.")
        
        db.commit()
        print("Seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
