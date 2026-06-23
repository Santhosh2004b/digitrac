import traceback, glob, io, os
import pandas as pd
import numpy as np
import sys

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

def test_parse():
    try:
        xlsx_files = glob.glob("artifacts/uploads/*.xlsx")
        if not xlsx_files:
            return "No xlsx files found"
            
        latest_file = max(xlsx_files, key=os.path.getmtime)
        with open(latest_file, "rb") as file_obj:
            contents = file_obj.read()
            
        all_sheets = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=None, header=None)
        
        project_info = {}
        project_costing = []
        workforce_budget = []
        implementation_resources = []
        
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
        
        COSTING_TRIGGER_COLS = ["description", "qty", "unit price", "purchase unit"]
        
        for sheet_name, df in all_sheets.items():
            sheet_lower = sheet_name.lower().strip()
            
            for r_idx, row in df.iterrows():
                row_vals = list(row.values)
                for c_idx, cell_val in enumerate(row_vals):
                    if pd.isna(cell_val): continue
                    cell_lower = str(cell_val).lower().strip().rstrip(':').strip()
                    for db_key, keywords in info_keys.items():
                        if db_key in project_info: continue
                        if cell_lower in keywords:
                            for offset in range(1, len(row_vals) - c_idx):
                                next_val = row_vals[c_idx + offset]
                                if not pd.isna(next_val) and str(next_val).strip() not in ('', 'nan'):
                                    project_info[db_key] = str(next_val).strip()
                                    break

            if not project_costing:
                header_row_idx = None
                for r_idx, row in df.iterrows():
                    row_lower = [str(v).lower().strip() for v in row.values if not pd.isna(v)]
                    hits = sum(1 for t in COSTING_TRIGGER_COLS if any(t in c for c in row_lower))
                    if hits >= 2:
                        header_row_idx = r_idx
                        break

                if header_row_idx is not None:
                    df_cost = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=sheet_name, header=header_row_idx)
                    df_cost.columns = [str(c).strip() for c in df_cost.columns]
                    col_map = {}
                    for col in df_cost.columns:
                        cl = col.lower()
                        if "description" in cl: col_map["Description"] = col
                        elif cl in ("sl.no", "sl no", "slno") or (cl.startswith("sl") and len(cl) <= 6): col_map["Sl.No"] = col
                        elif "sap material id" in cl or ("sap" in cl and "id" in cl): col_map["SAP Material ID"] = col
                        elif "make" in cl: col_map["Make & Model"] = col
                        elif "selling unit" in cl or ("unit price" in cl and "selling" in cl): col_map["Unit Price (INR)"] = col
                        elif "purchase unit" in cl or ("unit price" in cl and "purchase" in cl): col_map["Unit Cost"] = col
                        elif "unit price" in cl: col_map["Unit Price (INR)"] = col
                        elif "selling total" in cl or ("total" in cl and "selling" in cl): col_map["Total Price (INR)"] = col
                        elif "purchase total" in cl or ("total" in cl and "purchase" in cl): col_map["Total Cost"] = col
                        elif "total price" in cl: col_map["Total Price (INR)"] = col
                        elif "unit cost" in cl: col_map["Unit Cost"] = col
                        elif "total cost" in cl: col_map["Total Cost"] = col
                        elif cl.strip() == "qty": col_map["Qty"] = col
                        elif cl.strip() == "uom": col_map["UoM"] = col
                        elif "gst" in cl: col_map["GST%"] = col
                        elif "remarks" in cl: col_map["Remarks"] = col
                    
                    desc_col = col_map.get("Description")
                    for _, row in df_cost.iterrows():
                        desc_val = row.get(desc_col) if desc_col else None
                        if pd.isna(desc_val) or str(desc_val).strip().lower() in ["nan", "", "total", "summary", "item description"]: continue
                        item = {}
                        for std_key, orig_col in col_map.items():
                            val = row.get(orig_col)
                            if pd.isna(val): val = None
                            if std_key in ("Unit Price (INR)", "Total Price (INR)", "Unit Cost", "Total Cost", "Qty", "GST%"):
                                item[std_key] = safe_parse_numeric(val)
                            else:
                                item[std_key] = str(val).strip() if val is not None else ""
                        if item: project_costing.append(item)

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
                        row_label = " ".join([str(df.iloc[r_idx, c]) for c in range(min(3, df.shape[1])) if not pd.isna(df.iloc[r_idx, c])]).lower()
                        if "day" in row_label: day_cost_row = df.iloc[r_idx]
                        elif "hour" in row_label: hour_cost_row = df.iloc[r_idx]
                    for c_idx, grade_val in enumerate(grade_row.values):
                        if pd.isna(grade_val): continue
                        grade = str(grade_val).strip()
                        if not (len(grade) <= 3 and grade[:1].isalpha() and grade[1:].isdigit()): continue
                        day_cost = safe_parse_numeric(day_cost_row.iloc[c_idx]) if day_cost_row is not None else 0.0
                        hour_cost = safe_parse_numeric(hour_cost_row.iloc[c_idx]) if hour_cost_row is not None else 0.0
                        if day_cost > 0 or hour_cost > 0:
                            workforce_budget.append({"Grade": grade, "Manpower Cost/Day": day_cost, "Manpower Cost/Hour": hour_cost})

            if ("implementation" in sheet_lower or "resource" in sheet_lower or len(all_sheets) == 1) and not implementation_resources:
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
                                implementation_resources.append({
                                    "Resource Name": str(res_val).strip(),
                                    "Qty": qty,
                                    "Months": months,
                                    "Total Manmonths": manmonths,
                                    "start_date": None,
                                    "utilization": 0
                                })

        return f"File: {os.path.basename(latest_file)}\nInfo: {project_info}\nCosting items: {len(project_costing)}\nWorkforce items: {len(workforce_budget)}\nImplementation resources: {len(implementation_resources)}\nImpl rows: {implementation_resources}"
    except Exception as e:
        return f"ERROR: {traceback.format_exc()}"

if __name__ == "__main__":
    with open("scratch/test_parse_output.txt", "w") as f:
        f.write(test_parse())
