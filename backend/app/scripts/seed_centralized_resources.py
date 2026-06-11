from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.resource import CentralizedResource
from sqlalchemy import text

def seed_resources():
    db = SessionLocal()
    try:
        # Drop table first to avoid sqlite schema mismatch
        print("Dropping old table if it exists...")
        db.execute(text("DROP TABLE IF EXISTS centralized_resources"))
        db.commit()
        
        # Recreate tables
        print("Recreating database tables...")
        CentralizedResource.metadata.create_all(bind=engine)
        
        resources = [
            {
                "employee_id": "EMP-101",
                "name": "Aarav Sharma",
                "email": "aarav.sharma@arche.global",
                "grade": "L2 Senior Consultant",
                "role_practice": "Cloud Engineering",
                "hourly_billing_rate": 2500.0,
                "cost_rate": 1200.0,
                "skill_category": "Cloud & Infrastructure",
                "status": "Available",
                "region": "APJ",
                "manager_email": "manager@digitrac.com"
            },
            {
                "employee_id": "EMP-102",
                "name": "Diya Patel",
                "email": "diya.patel@arche.global",
                "grade": "L3 Lead Consultant",
                "role_practice": "Cybersecurity",
                "hourly_billing_rate": 3200.0,
                "cost_rate": 1800.0,
                "skill_category": "Cybersecurity & IAM",
                "status": "Available",
                "region": "APJ",
                "manager_email": "manager@digitrac.com"
            },
            {
                "employee_id": "EMP-103",
                "name": "Ishaan Verma",
                "email": "ishaan.verma@arche.global",
                "grade": "L1 Consultant",
                "role_practice": "Application Development",
                "hourly_billing_rate": 1500.0,
                "cost_rate": 800.0,
                "skill_category": "Frontend (React/Next)",
                "status": "Available",
                "region": "EMEA",
                "manager_email": "mgr@digitrac.com"
            },
            {
                "employee_id": "EMP-104",
                "name": "Ananya Iyer",
                "email": "ananya.iyer@arche.global",
                "grade": "Principal Consultant",
                "role_practice": "Application Development",
                "hourly_billing_rate": 4500.0,
                "cost_rate": 2200.0,
                "skill_category": "Backend (Java/Python)",
                "status": "Bench",
                "region": "AMER",
                "manager_email": "manager@digitrac.com"
            },
            {
                "employee_id": "EMP-105",
                "name": "Kabir Malhotra",
                "email": "kabir.malhotra@arche.global",
                "grade": "Architect",
                "role_practice": "Solutions Architecture",
                "hourly_billing_rate": 5500.0,
                "cost_rate": 3000.0,
                "skill_category": "Enterprise Architecture",
                "status": "Allocated",
                "region": "GLOBAL",
                "manager_email": "manager@digitrac.com"
            },
            {
                "employee_id": "EMP-106",
                "name": "Riya Sen",
                "email": "riya.sen@arche.global",
                "grade": "L2 Senior Consultant",
                "role_practice": "DevOps",
                "hourly_billing_rate": 2800.0,
                "cost_rate": 1400.0,
                "skill_category": "CI/CD & CloudOps",
                "status": "Available",
                "region": "APJ",
                "manager_email": "mgr@digitrac.com"
            }
        ]

        for r_data in resources:
            res = CentralizedResource(
                employee_id=r_data["employee_id"],
                name=r_data["name"],
                email=r_data["email"],
                grade=r_data["grade"],
                role_practice=r_data["role_practice"],
                hourly_billing_rate=r_data["hourly_billing_rate"],
                cost_rate=r_data["cost_rate"],
                skill_category=r_data["skill_category"],
                status=r_data["status"],
                region=r_data["region"],
                manager_email=r_data["manager_email"]
            )
            db.add(res)
            print(f"Seeded resource: {r_data['name']} [{r_data['employee_id']}]")
        
        db.commit()
        print("Centralized Resource seeding completed successfully with all MVP fields.")
    except Exception as e:
        print(f"Error seeding resources: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_resources()
