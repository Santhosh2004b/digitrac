"""
Print just the first 5 rows of each sheet to see column names
"""
import os, sys, glob
sys.path.append(os.path.abspath('.'))
import pandas as pd

upload_dir = "artifacts/uploads"
files = glob.glob(os.path.join(upload_dir, "*"))
latest = max(files, key=os.path.getmtime)
print(f"Reading: {os.path.basename(latest)}\n")

xls = pd.read_excel(latest, sheet_name=None, header=None)

for sheet_name, df in xls.items():
    print(f"{'='*50}")
    print(f"SHEET: '{sheet_name}' — {df.shape[0]} rows x {df.shape[1]} cols")
    # Print first 8 rows only
    for i, row in df.head(8).iterrows():
        non_null = [(j, str(v)[:40]) for j, v in enumerate(row.values) if str(v) not in ['nan', 'None', '']]
        if non_null:
            print(f"  Row {i}: {non_null}")
    print()
