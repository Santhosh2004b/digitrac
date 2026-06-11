"""
Test the new parser against the actual uploaded Excel file
"""
import os, sys, glob
sys.path.append(os.path.abspath('.'))

import pandas as pd
import io
import numpy as np

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

upload_dir = "artifacts/uploads"
files = glob.glob(os.path.join(upload_dir, "*"))
latest = max(files, key=os.path.getmtime)
print(f"Testing against: {os.path.basename(latest)}\n")

with open(latest, "rb") as f:
    contents = f.read()

all_sheets = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=None, header=None)

project_info = {}
project_costing = []
workforce_budget = []

info_keys = {
    "customer_name":             ["customer", "customer name"],
    "project_name":              ["project", "project name"],
    "project_duration":          ["project duration", "duration"],
    "customer_payment_terms":    ["customer payment term", "customer payment terms"],
    "vendor_payment_terms":      ["vendor payment terms", "vendor payment term"],
    "po_reference":              ["po reference", "po no", "purchase order"],
    "total_cost_price":          ["total cost price", "total cost"],
    "total_sell_price":          ["total sell price", "total sell"],
    "pmc_cost":                  ["pmc cost"],
    "margin_amount":             ["margin amount", "margin"],
    "account_manager":           ["account manager"],
}

COSTING_TRIGGER_COLS = ["item description", "qty", "unit price"]

for sheet_name, df in all_sheets.items():
    sheet_lower = sheet_name.lower().strip()

    # 1. Project Info
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

    # 2. Costing rows
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
                if "item description" in cl: col_map["Description"] = col
                elif "unit price" in cl: col_map["Unit Price (INR)"] = col
                elif "total price" in cl: col_map["Total Price (INR)"] = col
                elif "unit cost" in cl: col_map["Unit Cost"] = col
                elif "total cost" in cl: col_map["Total Cost"] = col
                elif cl.strip() == "qty": col_map["Qty"] = col
                elif "make" in cl: col_map["Make & Model"] = col

            desc_col = col_map.get("Description")
            for _, row in df_cost.iterrows():
                desc_val = row.get(desc_col) if desc_col else None
                if pd.isna(desc_val) or str(desc_val).strip().lower() in ["nan","","total","summary","item description"]: continue
                item = {}
                for std_key, orig_col in col_map.items():
                    val = row.get(orig_col)
                    if pd.isna(val): val = None
                    if std_key in ("Unit Price (INR)","Total Price (INR)","Unit Cost","Total Cost","Qty"):
                        item[std_key] = safe_parse_numeric(val)
                    else:
                        item[std_key] = str(val).strip() if val is not None else ""
                if item: project_costing.append(item)

    # 3. Workforce Budget
    if "workforce" in sheet_lower and not workforce_budget:
        grade_row_idx = None
        for r_idx, row in df.iterrows():
            row_vals = [str(v).strip() for v in row.values if not pd.isna(v)]
            grade_like = [v for v in row_vals if len(v) <= 3 and v[:1].isalpha() and v[1:].isdigit()]
            if len(grade_like) >= 4:
                grade_row_idx = r_idx
                break
        if grade_row_idx is not None:
            grade_row = df.iloc[grade_row_idx]
            day_cost_row = hour_cost_row = None
            for r_idx in range(grade_row_idx+1, min(grade_row_idx+5, len(df))):
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

print("=" * 50)
print("PROJECT INFO:")
for k, v in project_info.items():
    print(f"  {k}: {v}")

print(f"\nPROJECT COSTING: {len(project_costing)} items")
for item in project_costing[:3]:
    print(f"  {item}")
if len(project_costing) > 3:
    print(f"  ... and {len(project_costing)-3} more")

print(f"\nWORKFORCE BUDGET: {len(workforce_budget)} grades")
for item in workforce_budget[:5]:
    print(f"  {item}")
