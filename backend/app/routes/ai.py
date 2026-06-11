from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import json

from app.routes.auth import get_current_user_from_token
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
def ai_chat(request: ChatRequest, user: dict = Depends(get_current_user_from_token)):
    if user.get("role") not in ["VP", "MNG"]:
        raise HTTPException(status_code=403, detail="Only VPs and Managers can access the strategic AI intelligence.")
        
    db = SessionLocal()
    try:
        role = user.get("role")
        q = request.question.lower()
        ans = "I am a LangChain skeleton. Once you plug in your API keys, I will dynamically answer this based on the project database!"

        if role == "VP":
            projects = db.query(ApprovedProject).filter(ApprovedProject.status.in_(["Green", "Orange", "Red"])).all()
            if "overall portfolio health" in q:
                total = len(projects)
                green = sum(1 for p in projects if p.status == "Green")
                ans = f"The portfolio currently consists of {total} active projects. {green} of them are operating in a healthy 'Green' status. Overall enterprise burn is tracking steadily, though specific projects may require attention."
                
            elif "operating below their target margin" in q:
                at_risk = [p.project_name for p in projects if p.status in ["Orange", "Red"]]
                if at_risk:
                    ans = f"Yes, the following projects are operating below their target margins and are flagged as at-risk or critical: {', '.join(at_risk)}."
                else:
                    ans = "Currently, all projects are operating at or above their target margins."
                    
            elif "highest performing project" in q:
                if projects:
                    best = max(projects, key=lambda p: (p.kpis.get("forecast_margin_pct", 0) if isinstance(p.kpis, dict) else getattr(p.kpis, "forecast_margin_pct", 0)))
                    ans = f"The highest performing project by forecast margin is '{best.project_name}'."
                else:
                    ans = "There are no active projects to evaluate."
                    
            elif "critical governance escalations" in q:
                red = [p.project_name for p in projects if p.status == "Red"]
                if red:
                    ans = f"There are critical governance escalations for the following projects: {', '.join(red)}. Please review the Project Coordinator's escalation board immediately."
                else:
                    ans = "There are no critical governance escalations at this time. All operations are proceeding within acceptable risk tolerances."
                    
            elif "total planned vs actual cost" in q:
                planned = 0
                actual = 0
                for p in projects:
                    kpis = p.kpis if isinstance(p.kpis, dict) else {}
                    planned += kpis.get("planned_hours", 0) * 1500
                    actual += kpis.get("actual_hours", 0) * 1500
                ans = f"Across the enterprise, the estimated planned cost footprint is approximately ₹{planned:,.2f}, with actual incurred costs sitting at ₹{actual:,.2f}."

        elif role == "MNG":
            manager_email = user.get("email")
            projects = db.query(ApprovedProject).filter(ApprovedProject.manager_email == manager_email).all()
            
            if "current burn rate" in q:
                if not projects:
                    ans = "You do not have any active projects assigned to you."
                else:
                    total_actual = sum(p.kpis.get("actual_hours", 0) if isinstance(p.kpis, dict) else 0 for p in projects)
                    total_planned = sum(p.kpis.get("planned_hours", 0) if isinstance(p.kpis, dict) else 0 for p in projects)
                    burn_pct = (total_actual / total_planned * 100) if total_planned > 0 else 0
                    ans = f"Your current aggregate burn rate is {burn_pct:.1f}% ({total_actual} actual / {total_planned} planned hours)."
                    
            elif "0 hours logged" in q:
                if not projects:
                    ans = "You do not have any active projects assigned to you."
                else:
                    zero_count = 0
                    for p in projects:
                        for row in p.full_excel_data.get("WORKFORCE", []):
                            if str(row.get("Actual Hrs", 0)).strip() in ["", "0", "0.0"]:
                                zero_count += 1
                    ans = f"Across your projects, there are {zero_count} resource nodes with absolutely 0 hours logged so far."
                    
            elif "project's margin health" in q:
                if not projects:
                    ans = "You do not have any active projects assigned to you."
                else:
                    healthy = [p.project_name for p in projects if p.status == "Green"]
                    if healthy:
                        ans = f"Your projects are performing well. {len(healthy)} of your projects ({', '.join(healthy)}) are operating at or above their target margins."
                    else:
                        ans = "Warning: None of your active projects are currently maintaining 'Green' status. Immediate intervention may be required to prevent margin erosion."
            
        return ChatResponse(answer=ans)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
