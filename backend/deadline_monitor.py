import asyncio
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.user import User
from app.integrations.outlook.mail_service import MailService

async def check_deadlines():
    db = SessionLocal()
    print(f"[{datetime.utcnow().isoformat()}] Starting Daily Deadline Check...")
    
    # We look at ACTIVE projects that have a start_date and duration_months
    active_projects = db.query(Project).filter(
        Project.status == "ACTIVE", 
        Project.start_date.isnot(None), 
        Project.duration_months > 0
    ).all()

    for proj in active_projects:
        # Calculate the absolute end date (assuming 30 days per month for simplicity)
        end_date = proj.start_date + timedelta(days=proj.duration_months * 30)
        days_left = (end_date - datetime.utcnow()).days
        
        print(f"Project: {proj.name} | Days Left: {days_left} | Margin Target: {proj.margin_target_pct}%")
        
        # Trigger condition: Exactly 15 days left or less (could limit to exactly 15 to avoid daily spam)
        # We will trigger if days_left == 15
        if days_left == 15:
            print(f"--> URGENT ALERT TRIGGERED FOR: {proj.name}")
            
            manager = db.query(User).filter(User.id == proj.manager_id).first()
            if manager and manager.email:
                success = await MailService.send_deadline_alert_mail(
                    mission_name=proj.name,
                    recipient_email=manager.email,
                    days_left=days_left,
                    margin_target=proj.margin_target_pct,
                    manager_name=manager.name or "Manager"
                )
                if success:
                    print(f"--> Successfully sent alert email to {manager.email}")
                else:
                    print(f"--> Failed to send alert email to {manager.email}")

    db.close()
    print("Deadline Check Complete.")

if __name__ == "__main__":
    asyncio.run(check_deadlines())
