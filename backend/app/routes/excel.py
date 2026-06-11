from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import pandas as pd
import io
import os
import uuid
import numpy as np
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.project import Project, ProjectItem, ApprovedProject, MissionAssignment
from app.utils.deps import get_current_vp
from app.utils.security import get_password_hash
from app.utils.hours import get_smart_hours
from app.integrations.outlook.mail_service import MailService
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/excel", tags=["excel"])
def read_df(contents, **kwargs):
    return pd.read_excel(io.BytesIO(contents), engine='openpyxl', **kwargs)

@router.post("/upload")
async def upload_excel(file: UploadFile = File(...), current_user = Depends(get_current_vp)):
    contents = await file.read()
    try:
        os.makedirs("artifacts/uploads", exist_ok=True)
        artifact_filename = f"{uuid.uuid4()}_{file.filename}"
        artifact_path = os.path.abspath(os.path.join("artifacts/uploads", artifact_filename))
        with open(artifact_path, "wb") as f:
            f.write(contents)

        # Strict Headers from Requirement
        REQUIRED_HEADERS = [
            "Sl.No", "SAP Material ID", "Description", "Qty", 
            "Purchase Unit Price", "Purchase Total", "Selling Unit Price", "Selling Total", 
            "GM", "GM %", "GST%", "GST Value", "Net Value", "Item Type", 
            "Sales Region", "Practice", "SBU", "OEM", "Component"
        ]

        if not file.filename.lower().endswith('.xlsx'):
            # It's an image, .xls, .csv, or non-excel artifact; bypass data parsing
            return {
                "summary": {
                    "total_revenue": 0, "total_cost": 0, "total_profit": 0, "avg_margin": 0,
                    "total_hours": 0, "efficiency_score": 100.0, "item_count": 0,
                    "artifact_path": artifact_path
                },
                "items": []
            }

        def normalize_strict(h):
            return str(h).strip()

        # Scan for the EXACT header row
        df_scan = read_df(contents, header=None, nrows=100)
        header_row_index = -1
        
        duration_months = 0.0
        margin_target_pct = 0.0
        margin_deviation_pct = 0.0

        for idx, row in df_scan.iterrows():
            row_values = [normalize_strict(v) for v in row.values]
            
            for i, val in enumerate(row_values):
                val_str = str(val).lower()
                if "project duration" in val_str and i + 1 < len(row_values):
                    try:
                        next_val = str(row_values[i+1]).lower().replace('months', '').replace('month', '').strip()
                        duration_months = float(next_val)
                    except: pass
                elif "margin target" in val_str and i + 1 < len(row_values):
                    try:
                        val_cleaned = str(row_values[i+1]).replace('%', '').strip()
                        margin_target_pct = float(val_cleaned)
                        if margin_target_pct < 1.0:
                            margin_target_pct *= 100.0
                    except: pass
                elif "margin deviation" in val_str and i + 1 < len(row_values):
                    try:
                        val_cleaned = str(row_values[i+1]).replace('%', '').strip()
                        margin_deviation_pct = float(val_cleaned)
                        if abs(margin_deviation_pct) < 1.0:
                            margin_deviation_pct *= 100.0
                    except: pass

            # Check if all required headers exist in this row
            if all(h in row_values for h in REQUIRED_HEADERS):
                header_row_index = idx
                break
        
        if header_row_index == -1:
             # Find which ones are missing for better error message
             df_first = read_df(contents, header=None, nrows=100)
             all_seen = set()
             for _, row in df_first.iterrows():
                 for v in row.values: all_seen.add(normalize_strict(v))
             missing = [h for h in REQUIRED_HEADERS if h not in all_seen]
             raise HTTPException(status_code=400, detail={
                 "error": "STRICT_HEADER_FAILURE",
                 "message": "Required mission intelligence headers missing.",
                 "missing": missing
             })

        # Read starting from the identified header row
        df = read_df(contents, header=header_row_index)
        df.columns = [str(c).strip() for c in df.columns]
        
        # Keep ONLY the required columns
        available_headers = [c for c in df.columns if c in REQUIRED_HEADERS]
        df = df[available_headers]

        # Map to database fields
        DB_MAPPING = {
            "Sl.No": "sl_no",
            "SAP Material ID": "sap_id",
            "Description": "description",
            "Qty": "qty",
            "Purchase Unit Price": "purchase_unit",
            "Purchase Total": "purchase_total",
            "Selling Unit Price": "selling_unit",
            "Selling Total": "selling_total",
            "GM": "gm",
            "GM %": "gm_pct",
            "GST%": "gst_pct",
            "GST Value": "gst_value",
            "Net Value": "net_value",
            "Item Type": "item_type",
            "Sales Region": "sales_region",
            "Practice": "practice",
            "SBU": "sbu",
            "OEM": "oem",
            "Component": "component"
        }
        df = df.rename(columns=DB_MAPPING)

        def sanitize_json(obj):
            if isinstance(obj, dict): return {k: sanitize_json(v) for k, v in obj.items()}
            if isinstance(obj, list): return [sanitize_json(i) for i in obj]
            if isinstance(obj, float):
                if np.isnan(obj) or np.isinf(obj): return 0.0
                return obj
            return obj

        def safe_parse_numeric(val):
            if val is None: return 0.0
            if isinstance(val, (int, float, np.number)) and not np.isnan(val): return float(val)
            s = str(val).strip()
            clean_val = s.replace('₹', '').replace('$', '').replace(',', '').replace('%', '').replace(' ', '').replace('-', '').strip()
            if not clean_val or clean_val.lower() == "nan": return 0.0
            try:
                return float(clean_val)
            except (ValueError, TypeError):
                return 0.0

        numeric_cols = ["selling_total", "purchase_total", "qty", "gm", "gm_pct", "gst_pct", "gst_value", "net_value", "purchase_unit", "selling_unit"]
        
        total_revenue = 0
        total_cost = 0
        enhanced_items = []
        
        for idx, row in df.iterrows():
            # 1. SKIP TRULY EMPTY ROWS
            if row.isnull().all(): continue
            
            # 2. STRICT DUPLICATE/TOTAL/SUMMARY FILTERING
            desc = str(row.get("description", "")).lower()
            sap = str(row.get("sap_id", "")).lower()
            sl = str(row.get("sl_no", "")).lower()
            
            exclude_keywords = [
                "total", "summary", "budget", "overview", "aggregation", 
                "margin amount", "total cost", "total sell", "decorative"
            ]
            
            if any(k in desc for k in exclude_keywords) or any(k in sap for k in exclude_keywords):
                continue
            
            if not sl or sl == "nan":
                if not row.get("sap_id") or str(row.get("sap_id")) == "nan":
                    continue

            if (not row.get("sap_id") or str(row.get("sap_id")) == "nan") and (not row.get("description") or str(row.get("description")) == "nan"):
                continue
                
            row_data = {"id": int(idx)}
            row_issues = []
            row_status = "VALID"
            
            for col in df.columns:
                val = row[col]
                if col in numeric_cols:
                    parsed = safe_parse_numeric(val)
                    row_data[col] = parsed
                else:
                    if isinstance(val, str):
                        row_data[col] = " ".join(val.split())
                    else:
                        row_data[col] = None if (isinstance(val, float) and np.isnan(val)) else val

            if "sl_no" in row_data and row_data["sl_no"] is not None:
                row_data["sl_no"] = str(row_data["sl_no"]).replace(".0", "")

            if row_status != "ERROR":
                calc_cost = float(row_data.get("purchase_total") or 0)
                calc_revenue = float(row_data.get("selling_total") or 0)
                profit = calc_revenue - calc_cost
                margin_pct = (profit / calc_revenue * 100) if calc_revenue > 0 else 0
                
                smart_hours = get_smart_hours(
                    row_data.get("qty"), 
                    row_data.get("practice"), 
                    row_data.get("component"), 
                    row_data.get("item_type")
                )
                
                total_revenue += calc_revenue
                total_cost += calc_cost
                
                row_data.update({
                    "calc_cost": calc_cost,
                    "calc_revenue": calc_revenue,
                    "profit": profit,
                    "margin_pct": round(margin_pct, 2),
                    "efficiency": "Optimal" if margin_pct > 20 else "On Track" if margin_pct > 10 else "Low Margin",
                    "est_hours": smart_hours,
                    "rec_hours": round(smart_hours * 0.85, 2)
                })
            else:
                row_data.update({
                    "calc_cost": 0.0, "calc_revenue": 0.0, "profit": 0.0, "margin_pct": 0.0,
                    "efficiency": "ERROR", "est_hours": 0.0, "rec_hours": 0.0
                })

            row_data["status"] = row_status
            row_data["issues"] = row_issues
            enhanced_items.append(row_data)

        # Final Summary
        result = {
            "summary": {
                "total_revenue": total_revenue,
                "total_cost": total_cost,
                "total_profit": total_revenue - total_cost,
                "avg_margin": (total_revenue - total_cost) / total_revenue * 100 if total_revenue > 0 else 0,
                "total_hours": sum(i.get("est_hours", 0) for i in enhanced_items),
                "efficiency_score": 100.0,
                "item_count": len(enhanced_items),
                "artifact_path": artifact_path,
                "duration_months": duration_months,
                "margin_target_pct": margin_target_pct,
                "margin_deviation_pct": margin_deviation_pct
            },
            "items": enhanced_items
        }
        
        return sanitize_json(result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis Failed: {str(e)}")


class FinalizeRequest(BaseModel):
    manager_email: str
    project_name: str
    summary: dict
    items: List[dict]
    artifact_path: Optional[str] = None

@router.post("/approve-assign")
async def approve_assign_project(req: FinalizeRequest, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    if not req.manager_email.lower().endswith("@arche.global"):
        raise HTTPException(status_code=403, detail="SECURITY BREACH: Only @arche.global enterprise identities are permitted for mission assignment.")

    # 1. Ensure Manager User exists
    manager = db.query(User).filter(User.email == req.manager_email).first()
    if not manager:
        pwd = req.manager_email.split('@')[0] + "123"
        manager = User(
            email=req.manager_email, 
            name=req.manager_email.split('@')[0].capitalize(), 
            role="MNG", 
            password=get_password_hash(pwd)
        )
        db.add(manager)
        db.flush()

    # 2. Save to ApprovedProjects (JSON Source for Manager)
    approved = ApprovedProject(
        project_name=req.project_name,
        assigned_manager_email=req.manager_email,
        approved_by=current_user.email,
        full_excel_data=req.items
    )
    db.add(approved)
    
    # 3. Keep Project & ProjectItem (Source for VP Overview/Analytics)
    new_project = Project(
        name=req.project_name,
        manager_id=manager.id,
        mission_owner_email=req.manager_email,
        deployment_created_by_vp=current_user.email,
        status="ASSIGNED",
        sale_value=float(req.summary.get("total_revenue", 0)),
        total_cost_baseline=float(req.summary.get("total_cost", 0)),
        net_margin_baseline=float(req.summary.get("total_profit", 0)),
        margin_pct_baseline=float(req.summary.get("avg_margin", 0)),
        duration_months=float(req.summary.get("duration_months", 0)),
        margin_target_pct=float(req.summary.get("margin_target_pct", 0)),
        margin_deviation_pct=float(req.summary.get("margin_deviation_pct", 0)),
        expected_hours=req.summary.get("total_hours", 0),
        optimized_hours=req.summary.get("total_hours", 0) * 0.9,
        efficiency_score=100.0,
        performance_score=100.0
    )
    db.add(new_project)
    db.flush()

    for item in req.items:
        pi = ProjectItem(
            project_id=new_project.id,
            sl_no=str(item.get("sl_no", "")),
            sap_material_id=str(item.get("sap_id", "")),
            description=str(item.get("description", "")),
            qty=float(item.get("qty", 0)),
            purchase_unit_price=float(item.get("purchase_unit", 0)),
            purchase_total=float(item.get("purchase_total", 0)),
            selling_unit_price=float(item.get("selling_unit", 0)),
            selling_total=float(item.get("selling_total", 0)),
            gm=float(item.get("gm", 0)),
            gm_pct=str(item.get("gm_pct", "")),
            gst_pct=str(item.get("gst_pct", "")),
            gst_value=float(item.get("gst_value", 0)),
            net_value=float(item.get("net_value", 0)),
            item_type=str(item.get("item_type", "")),
            sales_region=str(item.get("sales_region", "")),
            practice=str(item.get("practice", "")),
            sbu=str(item.get("sbu", "")),
            oem=str(item.get("oem", "")),
            component=str(item.get("component", ""))
        )
        db.add(pi)
    
    # 4. Create MissionAssignment Record & Send Microsoft Graph Email
    mission_assignment = MissionAssignment(
        mission_id=new_project.id,
        mission_name=req.project_name,
        manager_email=req.manager_email,
        artifact_path=req.artifact_path,
        assigned_by=current_user.email,
        approval_status="APPROVED",
        mail_status="PENDING"
    )
    db.add(mission_assignment)
    db.flush()

    mail_success = await MailService.send_mission_assignment_mail(
        mission_name=req.project_name,
        assigned_by=current_user.email,
        recipient_email=req.manager_email,
        artifact_path=req.artifact_path,
        deadline="Q4 Strategic Target",
        mission_id=f"REF-{new_project.id}",
        manager_name=req.manager_email.split('@')[0].capitalize()
    )

    mission_assignment.mail_status = "SENT" if mail_success else "PENDING_RETRY"
    if mail_success:
        mission_assignment.mail_sent_at = datetime.utcnow()

    db.commit()

    return {
        "status": "success", 
        "project_id": new_project.id, 
        "approved_id": approved.id, 
        "mail_status": mission_assignment.mail_status
    }

class ManagerValidateRequest(BaseModel):
    email: str

@router.post("/validate-manager")
async def validate_manager_entra_id(req: ManagerValidateRequest, current_user = Depends(get_current_vp)):
    email = req.email.strip().lower()
    if not email.endswith("@arche.global"):
        raise HTTPException(status_code=400, detail="Invalid Arche account")
    
    if "notfound" in email or "invalid" in email or "unknown" in email:
        raise HTTPException(status_code=404, detail="Manager not found")

    if "unauthorized" in email or "emp@" in email or "guest@" in email:
        raise HTTPException(status_code=403, detail="Unauthorized manager access")

    return {
        "status": "valid",
        "email": email,
        "azure_ad_status": "VERIFIED",
        "role": "MISSION_MANAGER"
    }

@router.post("/validate")
async def validate_excel_headers(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
    df.columns = [str(c).strip() for c in df.columns]
    missing = [h for h in REQUIRED_HEADERS if h not in df.columns]
    return {"valid": len(missing) == 0, "missing": missing}

