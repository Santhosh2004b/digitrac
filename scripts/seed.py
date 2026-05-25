"""
Seed script for DigiTrac — creates demo users, projects, tasks, and timelogs
to showcase the Time Allocation & Revenue Intelligence features.
"""
import sys
import datetime
from pathlib import Path

# Ensure the project root is on sys.path so 'app' is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.timelog import TimeLog
from app.utils.security import get_password_hash


def seed_db():
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    # ─── Users ───
    manager = db.query(User).filter(User.email == "manager@digitrac.com").first()
    if not manager:
        manager = User(
            name="John Manager",
            email="manager@digitrac.com",
            password=get_password_hash("manager123"),
            role="MNG"
        )
        db.add(manager)

    emp1 = db.query(User).filter(User.email == "employee@digitrac.com").first()
    if not emp1:
        emp1 = User(
            name="Alice Employee",
            email="employee@digitrac.com",
            password=get_password_hash("employee123"),
            role="EMP"
        )
        db.add(emp1)

    emp2 = db.query(User).filter(User.email == "bob@digitrac.com").first()
    if not emp2:
        emp2 = User(
            name="Bob Developer",
            email="bob@digitrac.com",
            password=get_password_hash("bob123"),
            role="EMP"
        )
        db.add(emp2)

    db.commit()
    db.refresh(manager)
    db.refresh(emp1)
    db.refresh(emp2)

    # ─── Projects with Time & Revenue Planning ───
    proj1 = Project(
        name="DigiTrac v2.0 Launch",
        manager_id=manager.id,
        total_expected_hours=16,
        revenue_value=180000000  # ₹18 Cr
    )
    db.add(proj1)

    proj2 = Project(
        name="Mobile App Redesign",
        manager_id=manager.id,
        total_expected_hours=24,
        revenue_value=95000000  # ₹9.5 Cr
    )
    db.add(proj2)

    proj3 = Project(
        name="API Gateway Migration",
        manager_id=manager.id,
        total_expected_hours=12,
        revenue_value=45000000  # ₹4.5 Cr
    )
    db.add(proj3)

    db.commit()
    db.refresh(proj1)
    db.refresh(proj2)
    db.refresh(proj3)

    # ─── Tasks ───
    # Project 1 tasks (early completion scenario)
    t1 = Task(project_id=proj1.id, title="Backend API Development", assigned_to=emp1.id, expected_hours=8, status="completed",
              start_time=datetime.datetime(2026, 4, 10, 9, 0), end_time=datetime.datetime(2026, 4, 11, 15, 0))
    t2 = Task(project_id=proj1.id, title="Frontend Dashboard Build", assigned_to=emp1.id, expected_hours=8, status="completed",
              start_time=datetime.datetime(2026, 4, 12, 9, 0), end_time=datetime.datetime(2026, 4, 13, 14, 0))
    db.add_all([t1, t2])

    # Project 2 tasks (in progress /delayed scenario)
    t3 = Task(project_id=proj2.id, title="UI Component Library", assigned_to=emp1.id, expected_hours=8, status="in_progress",
              start_time=datetime.datetime(2026, 4, 13, 9, 0))
    t4 = Task(project_id=proj2.id, title="Navigation Redesign", assigned_to=emp2.id, expected_hours=8, status="in_progress",
              start_time=datetime.datetime(2026, 4, 13, 9, 0))
    t5 = Task(project_id=proj2.id, title="Performance Optimization", assigned_to=emp2.id, expected_hours=8, status="pending")
    db.add_all([t3, t4, t5])

    # Project 3 tasks (on track)
    t6 = Task(project_id=proj3.id, title="API Route Migration", assigned_to=emp2.id, expected_hours=6, status="completed",
              start_time=datetime.datetime(2026, 4, 8, 9, 0), end_time=datetime.datetime(2026, 4, 9, 16, 0))
    t7 = Task(project_id=proj3.id, title="Load Testing & Validation", assigned_to=emp2.id, expected_hours=6, status="in_progress",
              start_time=datetime.datetime(2026, 4, 14, 9, 0))
    db.add_all([t6, t7])

    db.commit()
    db.refresh(t1)
    db.refresh(t2)
    db.refresh(t3)
    db.refresh(t4)
    db.refresh(t5)
    db.refresh(t6)
    db.refresh(t7)

    # ─── Time Logs ───
    today = datetime.date.today()
    logs = [
        # Project 1 — completed early (14h vs 16h expected)
        TimeLog(task_id=t1.id, user_id=emp1.id, hours=4, date=today - datetime.timedelta(days=5)),
        TimeLog(task_id=t1.id, user_id=emp1.id, hours=3, date=today - datetime.timedelta(days=4)),
        TimeLog(task_id=t2.id, user_id=emp1.id, hours=4, date=today - datetime.timedelta(days=3)),
        TimeLog(task_id=t2.id, user_id=emp1.id, hours=3, date=today - datetime.timedelta(days=2)),

        # Project 2 — over budget so far (18h logged vs 24h total, but still in progress)
        TimeLog(task_id=t3.id, user_id=emp1.id, hours=5, date=today - datetime.timedelta(days=2)),
        TimeLog(task_id=t3.id, user_id=emp1.id, hours=4, date=today - datetime.timedelta(days=1)),
        TimeLog(task_id=t4.id, user_id=emp2.id, hours=5, date=today - datetime.timedelta(days=2)),
        TimeLog(task_id=t4.id, user_id=emp2.id, hours=4, date=today - datetime.timedelta(days=1)),

        # Project 3 — on track (5h vs 12h expected)
        TimeLog(task_id=t6.id, user_id=emp2.id, hours=3, date=today - datetime.timedelta(days=6)),
        TimeLog(task_id=t6.id, user_id=emp2.id, hours=2, date=today - datetime.timedelta(days=5)),
    ]
    db.add_all(logs)
    db.commit()

    print("=" * 50)
    print("  DigiTrac Seeding Complete!")
    print("=" * 50)
    print()
    print("  Users:")
    print("    Manager: manager@digitrac.com / manager123")
    print("    Employee: employee@digitrac.com / employee123")
    print("    Employee: bob@digitrac.com / bob123")
    print()
    print("  Projects:")
    print(f"    1. {proj1.name} — {proj1.total_expected_hours}h / ₹{proj1.revenue_value/10000000:.1f} Cr")
    print(f"    2. {proj2.name} — {proj2.total_expected_hours}h / ₹{proj2.revenue_value/10000000:.1f} Cr")
    print(f"    3. {proj3.name} — {proj3.total_expected_hours}h / ₹{proj3.revenue_value/10000000:.1f} Cr")
    print()
    print("  7 Tasks & 10 Time Logs created.")
    print("=" * 50)

    db.close()


if __name__ == "__main__":
    seed_db()
