from app.main import SessionLocal
from app.models.workflow import Notification
from app.models.project import Project

db = SessionLocal()
notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(5).all()
for n in notifs:
    print(f"Notif {n.id} to {n.user_id}: {n.title} - Read: {n.is_read}")

projs = db.query(Project).order_by(Project.created_at.desc()).limit(2).all()
for p in projs:
    print(f"Project {p.id}: {p.name} - Assigned to: {p.manager_name} ({p.manager_id})")
