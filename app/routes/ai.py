from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import json

from app.utils.deps import get_current_user
from app.models.user import User
from app.db.session import SessionLocal
from app.models.project import ApprovedProject

router = APIRouter(
    prefix="/ai",
    tags=["ai"]
)

class ChatRequest(BaseModel):
    question: str
    
class ChatResponse(BaseModel):
    answer: str
    
@router.post("/chat", response_model=ChatResponse)
def ai_chat(request: ChatRequest, user: User = Depends(get_current_user)):
    if user.role not in ["VP", "MNG"]:
        raise HTTPException(status_code=403, detail="Only VPs and Managers can access the strategic AI intelligence.")
        
    db = SessionLocal()
    try:
        role = user.role
        q = request.question.lower()
        ans = "I am a LangChain skeleton. Once you plug in your API keys, I will dynamically answer this based on the project database!"

        from app.routes.manager import get_my_projects
        enriched_projects = get_my_projects(db=db, current_manager=user, region="GLOBAL")

        if role == "VP":
            if "overall portfolio health" in q:
                total = len(enriched_projects)
                green = sum(1 for p in enriched_projects if p["status"] == "Green")
                ans = f"The portfolio currently consists of {total} active projects. {green} of them are operating in a healthy 'Green' status. Overall enterprise burn is tracking steadily, though specific projects may require attention."
                
            elif "operating below their target margin" in q:
                at_risk = [p["name"] for p in enriched_projects if p["status"] in ["Orange", "Red"]]
                if at_risk:
                    ans = f"Yes, the following projects are operating below their target margins and are flagged as at-risk or critical: {', '.join(at_risk)}."
                else:
                    ans = "Currently, all projects are operating at or above their target margins."
                    
            elif "highest performing project" in q:
                if enriched_projects:
                    best = max(enriched_projects, key=lambda p: p["kpis"].get("forecast_margin_pct", 0))
                    ans = f"The highest performing project by forecast margin is '{best['name']}'."
                else:
                    ans = "There are no active projects to evaluate."
                    
            elif "critical governance escalations" in q:
                red = [p["name"] for p in enriched_projects if p["status"] == "Red"]
                if red:
                    ans = f"There are critical governance escalations for the following projects: {', '.join(red)}. Please review the Project Coordinator's escalation board immediately."
                else:
                    ans = "There are no critical governance escalations at this time. All operations are proceeding within acceptable risk tolerances."
                    
            elif "total planned vs actual cost" in q:
                planned = sum(p["kpis"].get("planned_cost", 0) for p in enriched_projects)
                actual = sum(p["kpis"].get("actual_cost", 0) for p in enriched_projects)
                ans = f"Across the enterprise, the estimated planned cost footprint is approximately ₹{planned:,.2f}, with actual incurred costs sitting at ₹{actual:,.2f}."
                
            elif "margin deviation" in q:
                if enriched_projects:
                    # Assuming we want the one with the worst (lowest) margin deviation
                    worst = min(enriched_projects, key=lambda p: p["kpis"].get("margin_deviation_pct", 0))
                    ans = f"The project with the largest margin deviation is '{worst['name']}' with a deviation of {(worst['kpis'].get('margin_deviation_pct', 0) * 100):.2f}%."
                else:
                    ans = "There are no active projects to evaluate."
                    
            elif "critical (red)" in q or ("critical" in q and "red" in q):
                red = [p["name"] for p in enriched_projects if p["status"] == "Red"]
                if red:
                    ans = f"The following projects are currently marked as Critical (Red): {', '.join(red)}."
                else:
                    ans = "Excellent news: There are currently no Critical (Red) projects in the portfolio."
                    
            elif "implementation cost" in q:
                # We need to fetch the raw DB objects to get the summary data, or we can just mock the summation if it's not in enriched_projects
                all_db_projects = db.query(ApprovedProject).all()
                total_impl = sum(p.full_excel_data.get("summary", {}).get("implementation_cost", 0) if isinstance(p.full_excel_data, dict) else 0 for p in all_db_projects)
                ans = f"The total implementation cost across all assigned projects in the portfolio is approximately ₹{total_impl:,.2f}."

        elif role == "MNG":
            manager_email = user.email
            projects = db.query(ApprovedProject).filter(ApprovedProject.assigned_manager_email == manager_email).all()
            
            if "current burn rate" in q:
                if not enriched_projects:
                    ans = "You do not have any active projects assigned to you."
                else:
                    total_actual = sum(p["kpis"].get("actual_hours", 0) for p in enriched_projects)
                    total_planned = sum(p["kpis"].get("planned_hours", 0) for p in enriched_projects)
                    burn_pct = (total_actual / total_planned * 100) if total_planned > 0 else 0
                    ans = f"Your current aggregate burn rate is {burn_pct:.1f}% ({total_actual} actual / {total_planned} planned hours)."
                    
            elif "0 hours logged" in q:
                if not projects:
                    ans = "You do not have any active projects assigned to you."
                else:
                    zero_count = 0
                    for p in projects:
                        items = p.full_excel_data.get("project_costing", []) if isinstance(p.full_excel_data, dict) else []
                        for row in items:
                            if str(row.get("actual_hours", 0)).strip() in ["", "0", "0.0"]:
                                zero_count += 1
                    ans = f"Across your projects, there are {zero_count} resource nodes with absolutely 0 hours logged so far."
                    
            elif "project's margin health" in q:
                if not enriched_projects:
                    ans = "You do not have any active projects assigned to you."
                else:
                    healthy = [p["name"] for p in enriched_projects if p["status"] == "Green"]
                    if healthy:
                        ans = f"Your projects are performing well. {len(healthy)} of your projects ({', '.join(healthy)}) are operating at or above their target margins."
                    else:
                        ans = "Warning: None of your active projects are currently maintaining 'Green' status. Immediate intervention may be required to prevent margin erosion."
            
        return ChatResponse(answer=ans)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
