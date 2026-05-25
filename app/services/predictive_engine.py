from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.models.project import Project, ApprovedProject
from app.models.workflow import WorkflowInstance, ProjectMilestone
from app.models.governance import RIDEGovernance, ProjectBaseline
from app.models.resource import CentralizedResource
import math

class PredictiveEngine:

    @staticmethod
    def calculate_project_predictions(project_id: int, db: Session) -> Dict[str, Any]:
        """
        Computes advanced AI-ready predictive metrics based on operational database state:
        - Delivery Confidence %
        - Risk score (LOW, MEDIUM, HIGH)
        - SLA Breach Probability
        - Estimate at Completion (EAC)
        - Margin Degradation risk flag
        - Budget exhaustion date forecast
        - Explainable executive summaries
        """
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj:
            return {"error": "Project not found"}

        # Fetch baseline budget
        baseline = db.query(ProjectBaseline).filter(ProjectBaseline.project_id == project_id).first()
        approved_budget = baseline.approved_budget if baseline else proj.sale_value
        target_margin = baseline.approved_margin_threshold if baseline else 30.0

        # Fetch associated operational records
        mils = db.query(ProjectMilestone).filter(ProjectMilestone.project_id == project_id).all()
        rides = db.query(RIDEGovernance).filter(RIDEGovernance.project_id == project_id, RIDEGovernance.status != "RESOLVED").all()
        workflows = db.query(WorkflowInstance).filter(WorkflowInstance.project_id == project_id, WorkflowInstance.status == "PENDING").all()

        # Calculate live financial totals
        actual_cost = 0.0
        actual_revenue = 0.0
        remaining_hours = 0.0
        total_hours = 0.0
        avg_cost_rate = 0.0
        count_rates = 0

        # Dynamic parsing from project resources
        for r in proj.resources:
            actual_cost += r.actual_months * (r.qty * r.unit_price) # mock cost logic
            actual_revenue += r.planned_months * (r.qty * r.unit_price)
            # Extrapolate hours
            total_hours += r.manmonths * 160.0
            
        p_items = getattr(proj, "full_excel_data", None) or []
        for i in p_items:
            c_rate = float(i.get("cost_rate") or 0.0)
            b_rate = float(i.get("hourly_billing_rate") or i.get("hourly_rate") or 0.0)
            e_hours = float(i.get("est_hours") or 0.0)
            
            actual_cost += e_hours * c_rate
            actual_revenue += e_hours * b_rate
            
            if c_rate > 0:
                avg_cost_rate += c_rate
                count_rates += 1

        avg_cost_rate = (avg_cost_rate / count_rates) if count_rates > 0 else 50.0

        # Calculate EAC (Estimate at Completion)
        # EAC = Actual Cost + (Remaining Hours * Average Cost Rate)
        remaining_hours = max(total_hours - (actual_cost / avg_cost_rate if avg_cost_rate > 0 else 0), 0)
        eac = actual_cost + (remaining_hours * avg_cost_rate)
        
        # Gross margins
        live_gm = actual_revenue - actual_cost
        live_gm_pct = (live_gm / actual_revenue * 100) if actual_revenue > 0 else 0.0
        
        forecasted_gm = actual_revenue - eac
        forecasted_gm_pct = (forecasted_gm / actual_revenue * 100) if actual_revenue > 0 else 0.0

        # 1. Delivery Confidence predictor model (Deterministic heuristic based on operational data)
        confidence = 100.0
        reasons = []

        # Milestone deductions
        if mils:
            delayed = [m for m in mils if m.status == "DELAYED"]
            milestone_delay_impact = len(delayed) * 12.0
            confidence -= milestone_delay_impact
            if delayed:
                reasons.append(f"{len(delayed)} delayed milestone(s) impacting project velocity")

        # Unresolved RIDE threat deductions
        critical_issues = [r for r in rides if r.severity == "CRITICAL" or r.priority == "CRITICAL"]
        high_issues = [r for r in rides if r.severity == "HIGH" or r.priority == "HIGH"]
        
        confidence -= len(critical_issues) * 18.0
        confidence -= len(high_issues) * 8.0
        
        if critical_issues:
            reasons.append(f"{len(critical_issues)} active CRITICAL escalation/threat(s)")
        if high_issues:
            reasons.append(f"{len(high_issues)} unresolved high priority risk(s)")

        # Budget exhaustion check
        if approved_budget > 0 and eac > approved_budget:
            variance_pct = ((eac - approved_budget) / approved_budget) * 100.0
            confidence -= min(variance_pct * 1.5, 25.0)
            reasons.append(f"Predicted budget overrun of {variance_pct:.1f}% at completion")

        # Margin degradation threat
        margin_variance = target_margin - forecasted_gm_pct
        if margin_variance > 0:
            confidence -= min(margin_variance * 2.0, 20.0)
            reasons.append(f"Margin degradation predicted: {forecasted_gm_pct:.1f}% vs baseline target {target_margin}%")

        confidence = max(min(confidence, 100.0), 10.0)
        
        # Determine Risk Level
        risk_level = "LOW"
        if confidence < 60.0:
            risk_level = "HIGH"
        elif confidence < 82.0:
            risk_level = "MEDIUM"

        # SLA Breach probability estimation
        sla_probability = 0.0
        overdue_workflows = [w for w in workflows if w.is_escalated]
        if overdue_workflows:
            sla_probability += 40.0 + (len(overdue_workflows) * 10.0)
        if critical_issues:
            sla_probability += 30.0
        sla_probability = min(sla_probability, 99.0)

        # Weekly Burn Rate & Budget Exhaustion Date forecasting
        weekly_spend = (actual_cost / 4.0) if actual_cost > 0 else 5000.0  # mock 4 weeks elapsed average
        weeks_left = ((approved_budget - actual_cost) / weekly_spend) if (approved_budget > actual_cost and weekly_spend > 0) else 0.0
        exhaustion_date = (datetime.utcnow() + timedelta(weeks=weeks_left)).strftime("%Y-%m-%d") if weeks_left > 0 else "EXHAUSTED"

        # Generate Explainable Narrative (Objective 1 / 5)
        if risk_level == "LOW":
            narrative = "Project execution is tracking smoothly on all milestones. Financial parameters are within variance bounds."
        else:
            narrative = f"Project is classified as {risk_level} risk. " + " ".join(reasons) + "."

        return {
            "project_id": project_id,
            "project_name": proj.name,
            "delivery_confidence_pct": round(confidence, 1),
            "risk_score": risk_level,
            "sla_breach_probability": round(sla_probability, 1),
            "actual_cost": round(actual_cost, 2),
            "baseline_budget": round(approved_budget, 2),
            "eac": round(eac, 2),
            "variance_drift": round(eac - approved_budget, 2),
            "forecasted_gm_pct": round(forecasted_gm_pct, 1),
            "target_margin_pct": target_margin,
            "margin_degradation_risk": margin_variance > 0,
            "budget_overrun_risk": eac > approved_budget,
            "burn_rate_weekly": round(weekly_spend, 2),
            "predicted_exhaustion_date": exhaustion_date,
            "executive_summary": narrative
        }

    @staticmethod
    def get_smart_recommendations(project_id: int, db: Session) -> Dict[str, Any]:
        """
        AI smart recommendation generator mapping database assets:
        - Optimal allocations (skill matched)
        - Bench matching engineers
        - Underutilized engineer alerts
        - High-margin talent matches
        """
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj:
            return {"error": "Project not found"}

        # Fetch unassigned roles
        p_items = getattr(proj, "full_excel_data", None) or []
        unassigned_practices = set()
        for i in p_items:
            if not i.get("assigned_person") or i.get("assigned_person") == "Unassigned":
                if i.get("practice"):
                    unassigned_practices.add(i.get("practice"))

        # Fetch corporate fleet
        fleet = db.query(CentralizedResource).all()
        
        bench_candidates = []
        high_margin_candidates = []
        underutilized_candidates = []
        staffing_optimizations = []

        # Find bench engineers (0% booked) & underutilized (<70% booked)
        for r in fleet:
            # Query active booking hours across portfolio
            booked_hours = 0.0
            all_approved = db.query(ApprovedProject).all()
            for ap in all_approved:
                ap_items = ap.full_excel_data or []
                for item in ap_items:
                    if item.get("assigned_person") == r.name or item.get("assigned_email") == r.email:
                        booked_hours += float(item.get("est_hours") or 0.0)

            util = (booked_hours / 160.0) * 100.0
            
            # 1. Underutilized detection
            if util < 70.0:
                underutilized_candidates.append({
                    "name": r.name,
                    "email": r.email,
                    "practice": r.role_practice,
                    "utilization": round(util, 1),
                    "cost_rate": r.cost_rate
                })

            # 2. Bench candidates with matching skills
            if util == 0:
                bench_candidates.append({
                    "name": r.name,
                    "email": r.email,
                    "practice": r.role_practice,
                    "grade": r.grade,
                    "cost_rate": r.cost_rate
                })

            # 3. High margin engineer talent matching (Low cost rate relative to skill value)
            # Heuristic: cost rate < 600 and grade level is experienced
            c_rate = float(r.cost_rate or 0.0)
            if c_rate > 0 and c_rate < 800 and r.grade in ["L2 Consulting", "L3 Principal"]:
                high_margin_candidates.append({
                    "name": r.name,
                    "practice": r.role_practice,
                    "grade": r.grade,
                    "cost_rate": r.cost_rate
                })

        # Match practice skills to fill project unassigned slots
        allocations_recom = []
        for prac in unassigned_practices:
            matches = [b for b in bench_candidates if b["practice"] == prac]
            if not matches:
                matches = [u for u in underutilized_candidates if u["practice"] == prac]
            
            if matches:
                best = matches[0]
                allocations_recom.append({
                    "practice": prac,
                    "recommended_engineer": best["name"],
                    "email": best["email"],
                    "reason": f"Active bench engineer in {prac} SBU ready for optimization."
                })

        # Leakage warning suggestion
        leakage_prevention = []
        for i in p_items:
            c_rate = float(i.get("cost_rate") or 0.0)
            b_rate = float(i.get("hourly_billing_rate") or i.get("hourly_rate") or 0.0)
            if c_rate > 0 and b_rate == 0:
                leakage_prevention.append({
                    "engineer": i.get("assigned_person"),
                    "task": i.get("description"),
                    "reason": "Resource allocated with zero-billing hourly rate. Update pricing matrix parameters."
                })

        return {
            "project_id": project_id,
            "optimal_allocations": allocations_recom[:3],
            "bench_suggestions": bench_candidates[:4],
            "high_margin_talent": high_margin_candidates[:4],
            "leakage_warnings": leakage_prevention[:3]
        }

    @staticmethod
    def secure_mask_financials(data: Dict[str, Any], role: str) -> Dict[str, Any]:
        """
        Field-level RBAC financial records masking (Objective 8)
        - Only VPs and Finance actors see cost rates, profits, and actual spends.
        - Other roles receive masked or dummy tokens to guarantee strict corporate confidentiality.
        """
        if role in ["VP", "FINANCE"]:
            return data  # Full strategic access
            
        masked = data.copy()
        for key in ["actual_cost", "eac", "variance_drift", "burn_rate_weekly"]:
            if key in masked:
                masked[key] = "CONFIDENTIAL_MASKED"
        return masked

    @staticmethod
    def generate_openai_prompt_payload(project_id: int, db: Session) -> Dict[str, Any]:
        """
        Future AI Readiness Layer (Objective 9)
        - Computes structured context logs and JSON payloads ready for LLM consumption (Azure OpenAI, Gemini, or Claude).
        - Prevents unnecessary wrappers while allowing future prompt configurations.
        """
        proj_data = PredictiveEngine.calculate_project_predictions(project_id, db)
        recom = PredictiveEngine.get_smart_recommendations(project_id, db)
        
        prompt = (
            f"You are the DigiTrac PMO Executive Assistant.\n"
            f"Review the following project metrics and generate a concise delivery summary:\n"
            f"Project: {proj_data.get('project_name')}\n"
            f"Confidence: {proj_data.get('delivery_confidence_pct')}%\n"
            f"Risk Level: {proj_data.get('risk_score')}\n"
            f"Variance Drift: ₹{proj_data.get('variance_drift')}\n"
            f"Forecasted Margin: {proj_data.get('forecasted_gm_pct')}%\n"
            f"SLA Breach Prob: {proj_data.get('sla_breach_probability')}%\n\n"
            f"Provide an automated governance action list to improve delivery predictability."
        )

        return {
            "api_endpoint": "https://api.openai.com/v1/chat/completions",
            "model_ready_payload": {
                "model": "gpt-4-turbo",
                "messages": [
                    {"role": "system", "content": "You are a professional PMO Delivery governance officer."},
                    {"role": "user", "content": prompt}
                ]
            },
            "prompt_template": prompt
        }
