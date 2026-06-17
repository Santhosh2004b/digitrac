import asyncio
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.user import User
from app.models.governance import ProjectHealthSnapshot
from app.integrations.outlook.mail_service import MailService

async def check_deadlines():
    db = SessionLocal()
    print(f"[{datetime.utcnow().isoformat()}] Starting Daily Timeline & Buffer Engine...")
    
    # 1. Timeline Utilization Engine
    active_projects = db.query(Project).filter(
        Project.status == "ACTIVE", 
        Project.start_date.isnot(None), 
        Project.duration_months > 0
    ).all()

    for proj in active_projects:
        total_planned_days = proj.duration_months * 30
        end_date = proj.start_date + timedelta(days=total_planned_days)
        elapsed_days = (datetime.utcnow() - proj.start_date).days
        remaining_days = max(0, (end_date - datetime.utcnow()).days)
        
        if total_planned_days > 0:
            utilization_pct = (elapsed_days / total_planned_days) * 100
        else:
            utilization_pct = 0
            
        print(f"Project: {proj.name} | Util: {utilization_pct:.1f}% | Elapsed: {elapsed_days} | Remaining: {remaining_days}")
        
        # Determine exact triggers. To avoid daily spam, only trigger on exact match (or close if running daily)
        # Assuming we check daily, integer math can work.
        vp_email = proj.deployment_created_by_vp
        
        subject = None
        if 50 <= utilization_pct < 51:
            subject = "PROJECT 50% TIMELINE REACHED"
        elif 90 <= utilization_pct < 91:
            subject = "PROJECT NEARING COMPLETION"
        elif 100 <= utilization_pct < 101:
            subject = "PROJECT DURATION COMPLETED"
            
        if subject and vp_email:
            manager = db.query(User).filter(User.id == proj.manager_id).first()
            # Actual calculations for cost/margin
            # Simplified for now, getting from baseline
            actual_cost = proj.total_cost_price
            current_margin = proj.margin_pct_baseline
            forecast_margin = proj.margin_pct_baseline
            
            success = await MailService.send_utilization_alert_mail(
                subject=subject,
                mission_name=proj.name,
                recipient_email=vp_email,
                customer_name=proj.customer_name or "Unknown",
                pm_name=manager.name if manager else "Unknown",
                elapsed_days=elapsed_days,
                remaining_days=remaining_days,
                target_margin=proj.margin_target_pct or 0.0,
                current_margin=current_margin,
                forecast_margin=forecast_margin,
                actual_cost=actual_cost
            )
            print(f"--> Sent {subject} to {vp_email}: {success}")
            
        # 3. Project Health Snapshot
        # Simplified metrics for the snapshot
        cost_utilization_pct = 0
        if proj.total_sell_price and proj.total_sell_price > 0:
            cost_utilization_pct = (actual_cost / proj.total_sell_price) * 100
            
        hours_utilization_pct = 0
        if proj.expected_hours and proj.expected_hours > 0:
            hours_utilization_pct = (proj.total_hours_used / proj.expected_hours) * 100
            
        margin_health = "GREEN"
        if current_margin < (proj.margin_target_pct or 0.0):
            margin_health = "RED"
        elif current_margin < (proj.margin_pct_baseline or 0.0):
            margin_health = "ORANGE"
            
        traffic_light = "GREEN"
        if margin_health == "RED" or hours_utilization_pct > 100:
            traffic_light = "RED"
        elif margin_health == "ORANGE" or hours_utilization_pct > 80:
            traffic_light = "ORANGE"
            
        snapshot = ProjectHealthSnapshot(
            project_id=proj.id,
            timeline_utilization_pct=utilization_pct,
            cost_utilization_pct=cost_utilization_pct,
            hours_utilization_pct=hours_utilization_pct,
            margin_health=margin_health,
            traffic_light=traffic_light
        )
        db.add(snapshot)
    
    db.commit()

    # 2. Buffer Expiry Engine
    held_projects = db.query(Project).filter(
        Project.status.in_(["ON HOLD", "SITE HOLD"]),
        Project.buffer_end_date.isnot(None)
    ).all()
    
    for proj in held_projects:
        if datetime.utcnow() >= proj.buffer_end_date:
            manager = db.query(User).filter(User.id == proj.manager_id).first()
            if manager and manager.email:
                print(f"--> Buffer Expired for: {proj.name}")
                success = await MailService.send_buffer_expiry_mail(
                    project_name=proj.name,
                    recipient_email=manager.email,
                    project_id=proj.id
                )
                print(f"--> Sent buffer expiry mail to {manager.email}: {success}")

    db.close()
    print("Timeline & Buffer Engine Complete.")

if __name__ == "__main__":
    asyncio.run(check_deadlines())
