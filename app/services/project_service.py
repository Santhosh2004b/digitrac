from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.project import Project, ProjectItem
from app.models.user import UserRole
from datetime import datetime

class ProjectService:
    @staticmethod
    def get_project_analytics(db: Session, project: Project, role: str, region_filter: str = "GLOBAL"):
        # Base Analytics (Internal)
        # Filter items based on region if not GLOBAL
        query = db.query(ProjectItem).filter(ProjectItem.project_id == project.id)
        if region_filter != "GLOBAL":
            query = query.filter(ProjectItem.sales_region == region_filter)
        
        items = query.order_by(ProjectItem.id).all()
        
        if not items and region_filter != "GLOBAL":
            # If no items for this region, return empty state
            return None

        total_revenue = sum(i.selling_total for i in items)
        total_cost = sum(i.purchase_total for i in items)
        profit = total_revenue - total_cost
        margin_pct = (profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Region/Practice Analytics
        practice_stats = {}
        for i in items:
            p = i.practice or "Unknown"
            if p not in practice_stats: practice_stats[p] = {"rev": 0, "cost": 0}
            practice_stats[p]["rev"] += i.selling_total
            practice_stats[p]["cost"] += i.purchase_total

        # Role-Based Masking
        if role == "VP":
            project_items = []
            for item in items:
                project_items.append({
                    "id": item.id,
                    "sl_no": item.sl_no,
                    "sap_id": item.sap_material_id,
                    "description": item.description,
                    "qty": item.qty,
                    "purchase_unit": item.purchase_unit_price,
                    "purchase_total": item.purchase_total,
                    "selling_unit": item.selling_unit_price,
                    "selling_total": item.selling_total,
                    "gm": item.gm,
                    "gm_pct": item.gm_pct,
                    "gst_pct": item.gst_pct,
                    "gst_value": item.gst_value,
                    "net_value": item.net_value,
                    "practice": item.practice,
                    "sales_region": item.sales_region,
                    "calc_cost": item.purchase_total,
                    "calc_revenue": item.selling_total,
                    "profit": item.gm,
                    "margin_pct": item.gm_pct,
                    "status": "VALID"
                })

            intelligence_feed = [
                {"type": "blue", "label": "🧠 Strategic Insight", "text": f"Mission {project.name} ({region_filter}) execution is {project.performance_score}% aligned with baseline."}
            ]
            
            if margin_pct < 15:
                intelligence_feed.append({"type": "red", "label": "🚨 Margin Alert", "text": f"Current margin ({margin_pct:.1f}%) is below 15% threshold. Strategic intervention required."})
            
            return {
                "id": project.id,
                "name": project.name,
                "revenue": total_revenue,
                "cost": total_cost,
                "profit": profit,
                "margin_pct": round(margin_pct, 2),
                "total_hours_used": project.total_hours_used,
                "expected_hours": project.expected_hours,
                "efficiency_score": project.efficiency_score,
                "performance_score": project.performance_score,
                "status": "Good" if margin_pct > 20 else "Risk" if margin_pct > 5 else "Loss",
                "intelligence_feed": intelligence_feed,
                "items": project_items,
                "practice_stats": [{"practice": k, "revenue": v["rev"], "cost": v["cost"]} for k, v in practice_stats.items()]
            }
        
        elif role == "MNG":
            # Financials HIDDEN
            # Use aggregated item data for efficiency if no tasks exist
            total_expected = project.expected_hours or 1
            total_logged = project.total_hours_used or 0
            
            efficiency = round((total_logged / total_expected * 100), 2) if total_expected > 0 else 0
            
            # Populate resources from ProjectItems (acting as roles)
            # This fulfills "Resource Allocation Matrix Fix" with REAL data
            resources = []
            for i in items:
                # Map ProjectItem to a Resource row for the Manager
                resources.append({
                    "id": i.id,
                    "role": i.practice or "Generic Node",
                    "name": i.description[:30] + "...",
                    "sap_id": i.sap_material_id,
                    "qty": i.qty,
                    "progress": 0, # To be filled by tasks/timelogs
                    "remaining": 100, # Mock for now
                    "status": "Good" if efficiency > 80 else "Risk",
                    "deadline": "N/A"
                })

            return {
                "id": project.id,
                "name": project.name,
                "efficiency_pct": efficiency,
                "performance_score": project.performance_score,
                "time_used": total_logged,
                "expected_time": total_expected,
                "status": "Good" if efficiency > 80 else "Risk",
                "resources": resources,
                "insights": ["Manager command layer operational. Financial data masked."]
            }
        
        else: # Employee
            return {
                "id": project.id,
                "name": project.name,
                "remaining_hours": project.expected_hours - project.total_hours_used
            }
