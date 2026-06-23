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
from app.models.project import Project, ProjectItem, ApprovedProject, MissionAssignment, InAppNotification
from app.utils.deps import get_current_vp
from app.utils.security import get_password_hash
from app.utils.hours import get_smart_hours
from app.integrations.outlook.mail_service import MailService
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/excel", tags=["excel"])

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


@router.post("/upload")
async def upload_excel(file: UploadFile = File(...), current_user = Depends(get_current_vp)):
    contents = await file.read()
    try:
        os.makedirs("artifacts/uploads", exist_ok=True)
        artifact_filename = f"{uuid.uuid4()}_{file.filename}"
        artifact_path = os.path.abspath(os.path.join("artifacts/uploads", artifact_filename))
        with open(artifact_path, "wb") as f:
            f.write(contents)

        if file.filename.lower().endswith('.csv'):
            try:
                df = pd.read_csv(io.BytesIO(contents), header=None, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), header=None, encoding='latin1')
            all_sheets = {file.filename: df}
        elif file.filename.lower().endswith(('.xlsx', '.xls')):
            # Read ALL sheets with NO header so we can detect structure ourselves
            all_sheets = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=None, header=None)
        else:
            raise HTTPException(status_code=400, detail="Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.")

        project_info = {}
        project_costing = []
        workforce_budget = []
        implementation_resources = []

        # ── Labels to scan for across all sheets (label cell → adjacent value cell) ──
        info_keys = {
            "customer_name":             ["customer", "customer name"],
            "project_name":              ["project", "project name"],
            "project_duration":          ["project duration", "duration"],
            "customer_payment_terms":    ["customer payment term", "customer payment terms"],
            "vendor_payment_terms":      ["vendor payment terms", "vendor payment term"],
            "po_reference":              ["po reference", "po no", "purchase order"],
            "amendment_details":         ["amendment details", "amendment"],
            "total_cost_price":          ["total cost price", "total cost"],
            "total_sell_price":          ["total sell price", "total sell"],
            "gst":                       ["gst"],
            "total_sell_price_with_gst": ["total sell price with gst", "net value"],
            "implementation_cost":       ["implementation cost"],
            "pmc_cost":                  ["pmc cost"],
            "freight_cost":              ["freight cost", "freight"],
            "margin_amount":             ["margin amount", "margin"],
            "margin_pct":                ["margin %", "margin pct"],
            "margin_target":             ["margin target", "target margin", "fy 26 margin targets"],
            "margin_deviation_pct":      ["margin deviation", "deviation", "margin deviation %"],
            "account_manager":           ["account manager"],
            "sbu":                       ["sbu"],
        }

        # Triggers that identify the costing header row
        COSTING_TRIGGER_COLS = ["description", "qty", "unit price", "purchase unit"]

        for sheet_name, df in all_sheets.items():
            sheet_lower = sheet_name.lower().strip()

            # ── 1. Project Info — scan every cell for label/value pairs ──────
            for r_idx, row in df.iterrows():
                row_vals = list(row.values)
                for c_idx, cell_val in enumerate(row_vals):
                    if pd.isna(cell_val):
                        continue
                    cell_lower = str(cell_val).lower().strip().rstrip(':').strip()
                    for db_key, keywords in info_keys.items():
                        if db_key in project_info:
                            continue
                        if cell_lower in keywords:
                            # Value is in the next non-null cell on this row
                            for offset in range(1, len(row_vals) - c_idx):
                                next_val = row_vals[c_idx + offset]
                                if not pd.isna(next_val) and str(next_val).strip() not in ('', 'nan'):
                                    project_info[db_key] = str(next_val).strip()
                                    break

            # ── 2. Costing rows — any sheet whose header row contains item cols ──
            # Your Excel: sheet "AM Costing", header row 1:
            #   Sl.No | Make & Model | Item description | Qty | UoM |
            #   Unit Price (INR) | Total Price (INR) | <vendor> |
            #   Unit Cost | Total Cost | GST% | … | Remarks
            if not project_costing:
                header_row_idx = None
                for r_idx, row in df.iterrows():
                    row_lower = [str(v).lower().strip() for v in row.values if not pd.isna(v)]
                    hits = sum(1 for t in COSTING_TRIGGER_COLS if any(t in c for c in row_lower))
                    if hits >= 2:
                        header_row_idx = r_idx
                        break

                if header_row_idx is not None:
                    if file.filename.lower().endswith('.csv'):
                        try:
                            df_cost = pd.read_csv(io.BytesIO(contents), header=header_row_idx, encoding='utf-8')
                        except UnicodeDecodeError:
                            df_cost = pd.read_csv(io.BytesIO(contents), header=header_row_idx, encoding='latin1')
                    else:
                        df_cost = pd.read_excel(
                            io.BytesIO(contents), engine='openpyxl',
                            sheet_name=sheet_name, header=header_row_idx
                        )
                    df_cost.columns = [str(c).strip() for c in df_cost.columns]

                    # Map flexible column names → standard keys
                    col_map = {}
                    for col in df_cost.columns:
                        cl = col.lower()
                        if "description" in cl:
                            col_map["Description"] = col
                        elif cl in ("sl.no", "sl no", "slno") or (cl.startswith("sl") and len(cl) <= 6):
                            col_map["Sl.No"] = col
                        elif "sap material id" in cl or ("sap" in cl and "id" in cl):
                            col_map["SAP Material ID"] = col
                        elif "make" in cl:
                            col_map["Make & Model"] = col
                        elif "selling unit" in cl or ("unit price" in cl and "selling" in cl):
                            col_map["Unit Price (INR)"] = col
                        elif "purchase unit" in cl or ("unit price" in cl and "purchase" in cl):
                            col_map["Unit Cost"] = col
                        elif "unit price" in cl:
                            col_map["Unit Price (INR)"] = col
                        elif "selling total" in cl or ("total" in cl and "selling" in cl):
                            col_map["Total Price (INR)"] = col
                        elif "purchase total" in cl or ("total" in cl and "purchase" in cl):
                            col_map["Total Cost"] = col
                        elif "total price" in cl:
                            col_map["Total Price (INR)"] = col
                        elif "unit cost" in cl:
                            col_map["Unit Cost"] = col
                        elif "total cost" in cl:
                            col_map["Total Cost"] = col
                        elif cl.strip() == "qty":
                            col_map["Qty"] = col
                        elif cl.strip() == "uom":
                            col_map["UoM"] = col
                        elif "gst" in cl:
                            col_map["GST%"] = col
                        elif "remarks" in cl:
                            col_map["Remarks"] = col

                    desc_col = col_map.get("Description")
                    for _, row in df_cost.iterrows():
                        desc_val = row.get(desc_col) if desc_col else None
                        if pd.isna(desc_val) or str(desc_val).strip().lower() in ["nan", "", "total", "summary", "item description"]:
                            continue
                        item = {}
                        for std_key, orig_col in col_map.items():
                            val = row.get(orig_col)
                            if pd.isna(val):
                                val = None
                            if std_key in ("Unit Price (INR)", "Total Price (INR)", "Unit Cost", "Total Cost", "Qty", "GST%"):
                                item[std_key] = safe_parse_numeric(val)
                            else:
                                item[std_key] = str(val).strip() if val is not None else ""
                        if item:
                            project_costing.append(item)

            # ── 3. Workforce Budget — "Workforce Budget" sheet ────────────────
            # Structure: grades are column headers in a row (D2, D1, C4, C3…A2),
            # costs in the rows immediately below (per day, per hour).
            if ("workforce" in sheet_lower or len(all_sheets) == 1) and not workforce_budget:
                grade_row_idx = None
                for r_idx, row in df.iterrows():
                    row_vals = [str(v).strip() for v in row.values if not pd.isna(v)]
                    grade_like = [v for v in row_vals if len(v) <= 3 and v[:1].isalpha() and v[1:].isdigit()]
                    if len(grade_like) >= 4:
                        grade_row_idx = r_idx
                        break

                if grade_row_idx is not None:
                    grade_row = df.iloc[grade_row_idx]
                    day_cost_row = None
                    hour_cost_row = None
                    for r_idx in range(grade_row_idx + 1, min(grade_row_idx + 5, len(df))):
                        row_label = " ".join([
                            str(df.iloc[r_idx, c]) for c in range(min(3, df.shape[1]))
                            if not pd.isna(df.iloc[r_idx, c])
                        ]).lower()
                        if "day" in row_label:
                            day_cost_row = df.iloc[r_idx]
                        elif "hour" in row_label:
                            hour_cost_row = df.iloc[r_idx]

                    for c_idx, grade_val in enumerate(grade_row.values):
                        if pd.isna(grade_val):
                            continue
                        grade = str(grade_val).strip()
                        if not (len(grade) <= 3 and grade[:1].isalpha() and grade[1:].isdigit()):
                            continue
                        day_cost = safe_parse_numeric(day_cost_row.iloc[c_idx]) if day_cost_row is not None else 0.0
                        hour_cost = safe_parse_numeric(hour_cost_row.iloc[c_idx]) if hour_cost_row is not None else 0.0
                        if day_cost > 0 or hour_cost > 0:
                            workforce_budget.append({
                                "Grade": grade,
                                "Manpower Cost/Day": day_cost,
                                "Manpower Cost/Hour": hour_cost,
                            })

            # ── 4. Implementation Resources — "Implementation Resources" sheet ────────────────
            if ("implementation" in sheet_lower or "resource" in sheet_lower or len(all_sheets) == 1) and not implementation_resources:
                # Find header row with resource names, or assume standard structure
                header_row_idx = None
                for r_idx, row in df.iterrows():
                    row_lower = [str(v).lower().strip() for v in row.values if not pd.isna(v)]
                    hits = sum(1 for t in ["resource", "name", "role", "qty", "quantity", "months", "duration", "manmonth", "total"] if any(t in c for c in row_lower))
                    if hits >= 2:
                        header_row_idx = r_idx
                        break

                if header_row_idx is not None:
                    if file.filename.lower().endswith('.csv'):
                        try:
                            df_impl = pd.read_csv(io.BytesIO(contents), header=header_row_idx, encoding='utf-8')
                        except UnicodeDecodeError:
                            df_impl = pd.read_csv(io.BytesIO(contents), header=header_row_idx, encoding='latin1')
                    else:
                        df_impl = pd.read_excel(
                            io.BytesIO(contents), engine='openpyxl',
                            sheet_name=sheet_name, header=header_row_idx
                        )
                    df_impl.columns = [str(c).strip() for c in df_impl.columns]
                    
                    col_map = {}
                    for col in df_impl.columns:
                        cl = col.lower()
                        if "resource" in cl or "name" in cl or "role" in cl: col_map["Resource Name"] = col
                        elif "qty" in cl or "quantity" in cl: col_map["Qty"] = col
                        elif "month" in cl or "duration" in cl: col_map["Months"] = col
                        elif "total" in cl or "manmonth" in cl or "man-month" in cl: col_map["Total Manmonths"] = col

                    res_col = col_map.get("Resource Name")
                    if res_col:
                        for _, row in df_impl.iterrows():
                            res_val = row.get(res_col)
                            if pd.isna(res_val) or str(res_val).strip().lower() in ["nan", "", "total"]:
                                continue
                            
                            qty = safe_parse_numeric(row.get(col_map.get("Qty")))
                            months = safe_parse_numeric(row.get(col_map.get("Months")))
                            manmonths = safe_parse_numeric(row.get(col_map.get("Total Manmonths")))
                            
                            if qty > 0 or months > 0 or manmonths > 0:
                                implementation_resources.append({
                                    "Resource Name": str(res_val).strip(),
                                    "Qty": qty,
                                    "Months": months,
                                    "Total Manmonths": manmonths,
                                    "start_date": None,
                                    "utilization": 0
                                })

        # ── Numeric coercion for project_info ────────────────────────────────
        num_fields = [
            "total_cost_price", "total_sell_price", "gst", "total_sell_price_with_gst",
            "implementation_cost", "pmc_cost", "freight_cost", "margin_amount",
            "margin_pct", "margin_target", "margin_deviation_pct"
        ]
        for f in num_fields:
            if f in project_info:
                val = safe_parse_numeric(project_info[f])
                if f in ["margin_pct", "margin_target", "margin_deviation_pct"] and -1.0 <= val <= 1.0 and val != 0:
                    val *= 100.0
                project_info[f] = val

        if not project_info.get("project_name") or str(project_info.get("project_name")).lower() in ["n/a", "nan", ""]:
            project_info["project_name"] = os.path.splitext(file.filename)[0]
            
        if not project_info.get("customer_name") or str(project_info.get("customer_name")).lower() in ["n/a", "nan", ""]:
            project_info["customer_name"] = "Pending Customer Info"

        result = {
            "summary": {
                **project_info,
                "artifact_path": artifact_path,
                "costing_item_count": len(project_costing),
                "workforce_item_count": len(workforce_budget),
                "implementation_resources_count": len(implementation_resources),
            },
            "project_costing": project_costing,
            "workforce_budget": workforce_budget,
            "implementation_resources": implementation_resources,
        }

        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        tb_str = traceback.format_exc()
        print(tb_str)
        try:
            with open("excel_error.txt", "w", encoding="utf-8") as f:
                f.write(tb_str)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Analysis Failed: {str(e)}")

@router.get("/test-parser")
async def debug_parser():
    try:
        import glob
        xlsx_files = glob.glob("artifacts/uploads/*.xlsx")
        if not xlsx_files: return {"error": "No xlsx files"}
        latest = max(xlsx_files, key=os.path.getmtime)
        with open(latest, "rb") as f: contents = f.read()
        all_sheets = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=None, header=None)
        
        implementation_resources = []
        for sheet_name, df in all_sheets.items():
            sheet_lower = sheet_name.lower().strip()
            if ("implementation" in sheet_lower or "resource" in sheet_lower or len(all_sheets) == 1):
                header_row_idx = None
                for r_idx, row in df.iterrows():
                    row_lower = [str(v).lower().strip() for v in row.values if not pd.isna(v)]
                    hits = sum(1 for t in ["resource", "name", "role", "qty", "quantity", "months", "duration", "manmonth", "total"] if any(t in c for c in row_lower))
                    if hits >= 2:
                        header_row_idx = r_idx
                        break
                if header_row_idx is not None:
                    df_impl = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=sheet_name, header=header_row_idx)
                    df_impl.columns = [str(c).strip() for c in df_impl.columns]
                    col_map = {}
                    for col in df_impl.columns:
                        cl = col.lower()
                        if "resource" in cl or "name" in cl or "role" in cl: col_map["Resource Name"] = col
                        elif "qty" in cl or "quantity" in cl: col_map["Qty"] = col
                        elif "month" in cl or "duration" in cl: col_map["Months"] = col
                        elif "total" in cl or "manmonth" in cl or "man-month" in cl: col_map["Total Manmonths"] = col

                    res_col = col_map.get("Resource Name")
                    if res_col:
                        for _, row in df_impl.iterrows():
                            res_val = row.get(res_col)
                            if pd.isna(res_val) or str(res_val).strip().lower() in ["nan", "", "total"]: continue
                            qty = safe_parse_numeric(row.get(col_map.get("Qty")))
                            months = safe_parse_numeric(row.get(col_map.get("Months")))
                            manmonths = safe_parse_numeric(row.get(col_map.get("Total Manmonths")))
                            if qty > 0 or months > 0 or manmonths > 0:
                                implementation_resources.append({"Resource Name": str(res_val).strip(), "Qty": qty})
        return {"file": os.path.basename(latest), "impl_resources": implementation_resources, "sheet_names": list(all_sheets.keys())}
    except Exception as e:
        import traceback
        return {"error": traceback.format_exc()}



class FinalizeRequest(BaseModel):
    manager_email: str
    project_name: str
    summary: dict
    project_costing: List[dict]
    workforce_budget: List[dict]
    implementation_resources: Optional[List[dict]] = []

@router.post("/approve-assign")
async def approve_assign_project(req: FinalizeRequest, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    try:
        return await _approve_assign_project(req, db, current_user)
    except Exception as e:
        import traceback
        with open("err.txt", "w") as f:
            f.write(traceback.format_exc())
        raise

async def _approve_assign_project(req: FinalizeRequest, db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    if not req.manager_email.lower().endswith("@arche.global"):
        raise HTTPException(status_code=403, detail="SECURITY BREACH: Only @arche.global enterprise identities are permitted for assignment.")

    # Auto-version if project name already exists to prevent 400 errors on re-assignment
    base_name = req.project_name
    existing_project = db.query(Project).filter(Project.name == base_name).first()
    if existing_project:
        from datetime import datetime
        req = req.copy(update={"project_name": f"{base_name} ({datetime.now().strftime('%d%b%Y %H:%M')})"})



    # 1. Ensure Manager User exists
    manager = db.query(User).filter(User.email == req.manager_email).first()
    if not manager:
        pwd = req.manager_email.split('@')[0] + "123"
        manager = User(
            email=req.manager_email,
            name=req.manager_email.split('@')[0].capitalize(),
            role="MNG",
            password=get_password_hash(pwd),
            is_setup_complete=1
        )
        db.add(manager)
        db.flush()

    customer_name = req.summary.get("customer_name", "Unknown Customer")
    duration = req.summary.get("project_duration", "Unknown Duration")

    # 2. Save to ApprovedProjects (JSON Source for Manager)
    approved = ApprovedProject(
        project_name=req.project_name,
        assigned_manager_email=req.manager_email,
        approved_by=current_user.email,
        full_excel_data={
            "project_info": req.summary,
            "project_costing": req.project_costing,
            "workforce_budget": req.workforce_budget,
            "implementation_resources": req.implementation_resources or []
        }
    )
    db.add(approved)

    # 3. Create Project
    new_project = Project(
        name=req.project_name,
        manager_id=manager.id,
        mission_owner_email=req.manager_email,
        deployment_created_by_vp=current_user.email,
        status="ASSIGNED",
        customer_name=customer_name,
        customer_payment_terms=req.summary.get("customer_payment_terms"),
        vendor_payment_terms=req.summary.get("vendor_payment_terms"),
        po_reference=req.summary.get("po_reference"),
        amendment_details=req.summary.get("amendment_details"),
        total_cost_price=float(req.summary.get("total_cost_price", 0)),
        total_sell_price=float(req.summary.get("total_sell_price", 0)),
        gst=float(req.summary.get("gst", 0)),
        total_sell_price_with_gst=float(req.summary.get("total_sell_price_with_gst", 0)),
        pmc_cost=float(req.summary.get("pmc_cost", 0)),
        margin_amount=float(req.summary.get("margin_amount", 0)),
        margin_pct_baseline=float(req.summary.get("margin_pct", 0)),
        margin_target_pct=float(req.summary.get("margin_target", 0)),
        margin_deviation_pct=float(req.summary.get("margin_deviation_pct", 0)),
        duration_months=safe_parse_numeric(duration.split(' ')[0]) if ' ' in str(duration) else 0.0
    )
    db.add(new_project)
    db.flush()

    # 4. InAppNotification for PM
    notification = InAppNotification(
        pm_email=req.manager_email,
        project_id=new_project.id,
        project_name=req.project_name,
        customer_name=customer_name,
        assigned_by=current_user.name,
        project_duration=str(duration)
    )
    db.add(notification)

    # 5. Send Microsoft Graph Email
    artifact_path = req.summary.get("artifact_path")
    mail_success = await MailService.send_mission_assignment_mail(
        mission_name=req.project_name,
        assigned_by=current_user.name,
        recipient_email=req.manager_email,
        artifact_path=artifact_path,
        deadline=str(duration),
        mission_id=f"REF-{new_project.id}",
        manager_name=req.manager_email.split('@')[0].capitalize(),
        sender_email=current_user.email
    )

    db.commit()

    return {
        "status": "success",
        "project_id": new_project.id,
        "mail_status": "SENT" if mail_success else "PENDING_RETRY"
    }


class ManagerValidateRequest(BaseModel):
    email: str

@router.post("/validate-manager")
async def validate_manager_entra_id(req: ManagerValidateRequest, current_user = Depends(get_current_vp)):
    email = req.email.strip().lower()
    if not email.endswith("@arche.global"):
        raise HTTPException(status_code=400, detail="Invalid Arche account")

    return {
        "status": "valid",
        "email": email,
        "azure_ad_status": "VERIFIED",
        "role": "PM"
    }

@router.get("/assignment-history")
async def get_assignment_history(db: Session = Depends(get_db), current_user = Depends(get_current_vp)):
    """Fetch history of project assignments by the current VP."""
    # Assuming the VP wants to see assignments they made, or all assignments.
    # InAppNotification has assigned_by = current_user.name
    history = db.query(InAppNotification, Project).outerjoin(Project, InAppNotification.project_id == Project.id).filter(InAppNotification.assigned_by == current_user.name).order_by(InAppNotification.created_at.desc()).all()
    
    return [
        {
            "id": notif.id,
            "project_name": notif.project_name,
            "customer_name": notif.customer_name,
            "manager_email": notif.pm_email,
            "assigned_by": notif.assigned_by,
            "duration": notif.project_duration,
            "assigned_date": notif.created_at.isoformat(),
            "margin_amount": proj.margin_amount if proj else 0,
            "margin_pct": proj.margin_pct_baseline if proj else 0
        } for notif, proj in history
    ]

@router.post("/preview-mail")
async def preview_assignment_mail(req: FinalizeRequest, current_user = Depends(get_current_vp)):
    """Generate HTML preview of the assignment email."""
    import os
    
    duration = req.summary.get("project_duration", "TBD")
    manager_name = req.manager_email.split('@')[0].capitalize()
    
    template_path = os.path.join(os.path.dirname(__file__), "..", "integrations", "outlook", "templates", "mission_assignment.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            html_body = f.read()
        html_body = html_body.replace("{{mission_name}}", req.project_name)
        html_body = html_body.replace("{{assigned_by}}", current_user.name)
        html_body = html_body.replace("{{deadline}}", str(duration))
        html_body = html_body.replace("{{mission_id}}", "REF-PREVIEW")
        html_body = html_body.replace("{{manager_name}}", manager_name)
    else:
        html_body = f"""
        <h3>Hello {manager_name},</h3>
        <p>You have been assigned a new project in DigiTrac.</p>
        <p>Project: {req.project_name}</p>
        <p>Assigned By: {current_user.name}</p>
        <p>Deadline: {duration}</p>
        <p>Project Reference: REF-PREVIEW</p>
        <p>Please login to DigiTrac portal: https://digitrac.arche.global/login</p>
        """
    return {
        "html_body": html_body,
        "from_email": current_user.email,
        "to_email": req.manager_email
    }

