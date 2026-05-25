from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.services.predictive_engine import PredictiveEngine
from app.models.governance import AuditLog
from app.models.user import User
from app.utils.deps import get_current_user, get_current_vp
import logging

router = APIRouter(prefix="/vp/predictive", tags=["predictive"])
logger = logging.getLogger("uvicorn.error")

@router.get("/project/{project_id}")
def get_project_predictions(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Exposes AI-ready operational forecasts (confidence %, risks, EAC, Weekly Burn)
    Secured with strict field-level RBAC financial masking.
    """
    preds = PredictiveEngine.calculate_project_predictions(project_id, db)
    if "error" in preds:
        raise HTTPException(status_code=404, detail=preds["error"])
    
    # Secure RBAC masking (Objective 8)
    masked_preds = PredictiveEngine.secure_mask_financials(preds, current_user.role)
    return masked_preds

@router.get("/recommendations/{project_id}")
def get_project_recommendations(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Exposes AI smart staffing matching, optimal resource placement, and leakage prevention suggestions.
    """
    recom = PredictiveEngine.get_smart_recommendations(project_id, db)
    if "error" in recom:
        raise HTTPException(status_code=404, detail=recom["error"])
    return recom

@router.get("/ai-payload/{project_id}")
def get_openai_ready_prompt(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Future AI Readiness prompt prep (Objective 9) - pre-computes OpenAI model messages.
    """
    prompt = PredictiveEngine.generate_openai_prompt_payload(project_id, db)
    if "error" in prompt:
        raise HTTPException(status_code=404, detail=prompt["error"])
    return prompt

@router.get("/copilot-narrative/{project_id}")
def get_copilot_governance_report(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    AI Governance Copilot (Objective 5)
    - Formulates an automated project summary, delivery health narrative, and threshold warning list.
    """
    preds = PredictiveEngine.calculate_project_predictions(project_id, db)
    recom = PredictiveEngine.get_smart_recommendations(project_id, db)
    
    if "error" in preds:
        raise HTTPException(status_code=404, detail=preds["error"])

    report = (
        f"🏆 DIGITRAC PMO EXECUTIVE COPILOT REPORT\n"
        f"-----------------------------------------\n"
        f"Project Name: {preds.get('project_name')}\n"
        f"Delivery Confidence Score: {preds.get('delivery_confidence_pct')}%\n"
        f"Risk Exposure Classification: {preds.get('risk_score')}\n"
        f"SLA Breach Risk Index: {preds.get('sla_breach_probability')}%\n"
        f"Predicted Exhaustion Date: {preds.get('predicted_exhaustion_date')}\n\n"
        f"📋 PMO DELIVERY HEALTH ANALYSIS:\n"
        f"{preds.get('executive_summary')}\n\n"
        f"💡 STRATEGIC RECOMMENDATIONS:\n"
    )

    for i, r in enumerate(recom.get("optimal_allocations", [])):
        report += f"  {i+1}. Optimal Allocation: Place {r.get('recommended_engineer')} for unassigned {r.get('practice')} node.\n"

    for i, w in enumerate(recom.get("leakage_warnings", [])):
        report += f"  ⚠️ Margin warning: {w.get('engineer')} on {w.get('task')} is leaking cost. {w.get('reason')}\n"

    return {
        "project_name": preds.get("project_name"),
        "delivery_confidence_pct": preds.get("delivery_confidence_pct"),
        "risk_score": preds.get("risk_score"),
        "copilot_text_summary": report,
        "raw_data": {
            "predictions": preds,
            "recommendations": recom
        }
    }

# 7. Enterprise Event Background Worker (Simulating Nightly Recalculations Async)
def run_nightly_recalculations_worker(db_session_factory):
    """
    Scalable background task to sweep and sync project analytics nightly.
    Logs audit compliance trails dynamically.
    """
    db = db_session_factory()
    try:
        logger.info("Initializing Nightly background operational intelligence calculations...")
        projects = db.query(Project).all()
        recalc_count = 0
        
        for p in projects:
            # Recompute delivery predictions
            preds = PredictiveEngine.calculate_project_predictions(p.id, db)
            
            # Log background sync
            audit = AuditLog(
                user_email="background_worker@arche.global",
                role="SYSTEM",
                action="nightly_recalculation_sync",
                project_id=p.id,
                change_details={"recalculated_risk": preds.get("risk_score"), "recalculated_confidence": preds.get("delivery_confidence_pct")}
            )
            db.add(audit)
            recalc_count += 1
            
        db.commit()
        logger.info(f"Nightly background sync complete. Recalculated {recalc_count} projects.")
    except Exception as e:
        logger.error(f"Nightly background worker sync failed: {str(e)}")
        db.rollback()
    finally:
        db.close()

@router.post("/trigger-nightly-recalc")
def trigger_nightly_recalc(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """
    Triggers an asynchronous nightly forecast sweep via FastAPI background tasks.
    """
    from app.db.session import SessionLocal
    background_tasks.add_task(run_nightly_recalculations_worker, SessionLocal)
    
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="manual_trigger_nightly_recalc",
        project_id=None,
        change_details={"message": "Nightly forecast sweeps queued in background worker thread."}
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Background nightly forecast sweep successfully queued."}
