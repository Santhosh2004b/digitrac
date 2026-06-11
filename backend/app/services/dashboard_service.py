from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.project import Project
from app.models.task import Task
from app.models.timelog import TimeLog
from app.models.user import User
from app.utils.redis_cache import redis_cache
import json
import datetime

DAILY_CAPACITY_HOURS = 9.0

class DashboardService:
    @staticmethod
    def get_vp_dashboard(db: Session):
        cache_key = "dashboard_vp_global"
        cached_data = redis_cache.get(cache_key)
        if cached_data: return cached_data

        projects = db.query(Project).all()
        employees = db.query(User).filter(User.role == "EMP").all()
        
        total_revenue = sum(p.revenue_value or 0 for p in projects)
        total_expected_hours = sum(p.total_expected_hours or 0 for p in projects)
        
        actual_hours_query = db.query(Task.project_id, func.sum(TimeLog.hours)).join(TimeLog, Task.id == TimeLog.task_id).group_by(Task.project_id).all()
        actual_hours_map = {p_id: float(h) for p_id, h in actual_hours_query}
        total_actual_hours = sum(actual_hours_map.values())

        active_emp_ids = db.query(Task.assigned_to).filter(Task.status == "in_progress").distinct().all()
        active_emp_count = len(active_emp_ids)
        idle_emp_count = len(employees) - active_emp_count

        overall_efficiency = round((total_expected_hours / total_actual_hours * 100), 1) if total_actual_hours > 0 else 0
        
        insights = []
        for project in projects:
            p_actual = actual_hours_map.get(project.id, 0)
            p_expected = project.total_expected_hours or 1
            completion_pct = round((p_actual / p_expected) * 100)
            lead_task = db.query(Task).filter(Task.project_id == project.id).order_by(Task.expected_hours.desc()).first()
            emp_name = lead_task.assignee.name if lead_task and lead_task.assignee else "The team"
            
            if completion_pct > 0:
                insights.append(f"{emp_name} is working on the ₹{project.revenue_value or 0:,.0f} '{project.name}' portfolio and is currently {completion_pct}% complete.")

        if idle_emp_count > 0:
            insights.append(f"Strategic Warning: {idle_emp_count} employees currently have 100% idle capacity. Suggest immediate project deployment.")
            
        overdue_count = db.query(func.count(Task.id)).filter(Task.status != "completed", Task.deadline < datetime.datetime.utcnow()).scalar()
        if overdue_count > 0:
            insights.append(f"CRITICAL ALERT: {overdue_count} mission-critical tasks are currently overdue. Revenue at risk.")
        else:
            insights.append("Systemic Health: All active project timelines are currently within nominal lead-time parameters.")
            
        low_margin_projects = [p for p in projects if p.revenue_value and p.total_expected_hours and (p.revenue_value / p.total_expected_hours < 500)]
        if low_margin_projects:
            insights.append(f"Financial Insight: Portfolio '{low_margin_projects[0].name}' is generating lower-than-average margin. review resource allocation.")

        # Priority Distribution
        priority_counts = db.query(Project.priority, func.count(Project.id)).group_by(Project.priority).all()
        priority_dist = {p: count for p, count in priority_counts}
        
        vp_data = {
            "total_revenue": total_revenue,
            "total_hours": round(total_actual_hours, 1),
            "avg_time_per_project": round(total_actual_hours / len(projects), 1) if projects else 0,
            "profit_margin": 22.5,
            "overall_efficiency": overall_efficiency,
            "expected_vs_actual": f"{total_expected_hours}h / {total_actual_hours:.1f}h",
            "active_employees": active_emp_count,
            "idle_employees": idle_emp_count,
            "priority_distribution": priority_dist,
            "projects_list": [
                {"id": p.id, "name": p.name, "revenue": p.revenue_value, "priority": p.priority, "margin": 22, "efficiency": round((p.total_expected_hours / actual_hours_map.get(p.id, 1) * 100), 1) if actual_hours_map.get(p.id, 0) > 0 else 0, "status": "Good" if actual_hours_map.get(p.id, 0) <= (p.total_expected_hours or 0) else "Risk"} for p in projects
            ],
            "smart_insights": insights[:6]
        }
        redis_cache.set(cache_key, vp_data, expire=600)
        return vp_data

    @staticmethod
    def get_manager_dashboard(db: Session, manager_id: int):
        cache_key = f"dashboard_manager_{manager_id}"
        cached_data = redis_cache.get(cache_key)
        if cached_data: return cached_data

        projects = db.query(Project).filter(Project.manager_id == manager_id).all()
        project_ids = [p.id for p in projects]
        if not project_ids: return {"total_projects": 0, "insights": [], "projects_summary": [], "alerts": []}

        actual_hours_query = db.query(Task.project_id, func.sum(TimeLog.hours)).join(TimeLog).filter(Task.project_id.in_(project_ids)).group_by(Task.project_id).all()
        actual_hours_map = {p_id: float(h) for p_id, h in actual_hours_query}

        summary = []
        insights = []
        alerts = []
        total_actual = 0
        total_expected = 0
        total_revenue = 0

        for p in projects:
            actual = actual_hours_map.get(p.id, 0)
            total_actual += actual
            total_expected += (p.total_expected_hours or 0)
            total_revenue += (p.revenue_value or 0)
            eff = round(((p.total_expected_hours or 0) / actual * 100), 1) if actual > 0 else 0
            
            is_delayed = actual > (p.total_expected_hours or 0) and (p.total_expected_hours or 0) > 0
            if is_delayed:
                alerts.append({"type": "warning", "message": f"Project '{p.name}' is over capacity by {round(actual - p.total_expected_hours, 1)}h"})
            
            summary.append({
                "project_id": p.id,
                "project_name": p.name,
                "actual_hours": actual,
                "expected_hours": p.total_expected_hours,
                "efficiency_pct": eff,
                "delayed": is_delayed,
                "revenue": p.revenue_value,
                "priority": p.priority
            })

        # Critical Pending
        crit_tasks = db.query(Task).join(Project).filter(Project.manager_id == manager_id, Task.priority == "CRITICAL", Task.status != "completed").count()
        if crit_tasks > 0:
            alerts.append({"type": "error", "message": f"{crit_tasks} CRITICAL tasks are currently pending!"})

        # Idle Employees
        employees = db.query(User).filter(User.role == "EMP").all()
        idle_count = 0
        for emp in employees:
            if db.query(Task).filter(Task.assigned_to == emp.id, Task.status == "in_progress").count() == 0:
                idle_count += 1
        if idle_count > 0:
            alerts.append({"type": "info", "message": f"{idle_count} employees have spare capacity (Idle)."})

        data = {
            "total_revenue": total_revenue,
            "overall_efficiency": round((total_expected / total_actual * 100), 1) if total_actual > 0 else 0,
            "total_actual_hours": total_actual,
            "total_expected_hours": total_expected,
            "projects_summary": summary,
            "insights": insights,
            "alerts": alerts
        }
        redis_cache.set(cache_key, data, expire=300)
        return data

    @staticmethod
    def clear_dashboard_cache(manager_id: int):
        redis_cache.delete(f"dashboard_manager_{manager_id}")
        redis_cache.delete("dashboard_vp_global")
