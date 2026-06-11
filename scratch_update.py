import pandas as pd
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.project import ApprovedProject

db = SessionLocal()
ap = db.query(ApprovedProject).order_by(ApprovedProject.id.desc()).first()

if ap and "artifacts" in ap.full_excel_data.get("project_info", {}).get("artifact_path", ""):
    artifact_path = ap.full_excel_data["project_info"]["artifact_path"]
    
    # Run the exact logic from excel.py
    import io
    with open(artifact_path, "rb") as f:
        contents = f.read()
    
    all_sheets = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=None, header=None)
    COSTING_TRIGGER_COLS = ["item description", "qty", "unit price"]
    project_costing = []
    
    def safe_parse_numeric(val):
        import numpy as np
        if val is None: return 0.0
        if isinstance(val, (int, float, np.number)) and not np.isnan(val): return float(val)
        s = str(val).strip()
        clean_val = s.replace('₹', '').replace('$', '').replace(',', '').replace('%', '').replace(' ', '').replace('-', '').strip()
        if not clean_val or clean_val.lower() == "nan": return 0.0
        try:
            return float(clean_val)
        except:
            return 0.0

    for sheet_name, df in all_sheets.items():
        if not project_costing:
            header_row_idx = None
            for r_idx, row in df.iterrows():
                row_lower = [str(v).lower().strip() for v in row.values if not pd.isna(v)]
                hits = sum(1 for t in COSTING_TRIGGER_COLS if any(t in c for c in row_lower))
                if hits >= 2:
                    header_row_idx = r_idx
                    break

            if header_row_idx is not None:
                df_cost = pd.read_excel(
                    io.BytesIO(contents), engine='openpyxl',
                    sheet_name=sheet_name, header=header_row_idx
                )
                df_cost.columns = [str(c).strip() for c in df_cost.columns]
                
                col_map = {}
                for col in df_cost.columns:
                    cl = col.lower()
                    if "item description" in cl or ("description" in cl and "item" in cl) or cl == "description":
                        col_map["Description"] = col
                    elif cl in ("sl.no", "sl no", "slno") or (cl.startswith("sl") and len(cl) <= 6):
                        col_map["Sl.No"] = col
                    elif "sap material id" in cl or ("sap" in cl and "id" in cl):
                        col_map["SAP Material ID"] = col
                    elif "make" in cl:
                        col_map["Make & Model"] = col
                    elif "unit price" in cl:
                        col_map["Unit Price (INR)"] = col
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

    print("Found new items:", len(project_costing))
    
    # We must MERGE the new project_costing with the existing one to preserve assigned hours, etc!
    existing_costing = ap.full_excel_data.get("project_costing", [])
    
    for ex in existing_costing:
        desc = ex.get("description") or ex.get("Description")
        sl = ex.get("Sl.No") or ex.get("sl_no")
        # Find match in new
        match = next((n for n in project_costing if (n.get("Description") == desc and n.get("Sl.No") == sl)), None)
        if match:
            # We add the missing SAP Material ID!
            ex["SAP Material ID"] = match.get("SAP Material ID", "")
            print(f"Updated {sl} with SAP: {ex['SAP Material ID']}")
    
    from sqlalchemy.orm.attributes import flag_modified
    if isinstance(ap.full_excel_data, dict):
        ap.full_excel_data["project_costing"] = existing_costing
    flag_modified(ap, "full_excel_data")
    db.commit()
    print("Database updated!")
