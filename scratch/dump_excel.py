import traceback, glob, io, os
import pandas as pd
import json

def test_parse():
    try:
        xlsx_files = glob.glob("artifacts/uploads/*.xlsx")
        if not xlsx_files: return "No xlsx files found"
        latest_file = max(xlsx_files, key=os.path.getmtime)
        
        with open(latest_file, "rb") as file_obj:
            contents = file_obj.read()
            
        all_sheets = pd.read_excel(io.BytesIO(contents), engine='openpyxl', sheet_name=None, header=None)
        
        output = {"file": os.path.basename(latest_file), "sheets": {}}
        for sheet_name, df in all_sheets.items():
            output["sheets"][sheet_name] = df.head(15).fillna("").to_dict(orient='records')
            
        return json.dumps(output, indent=2)
    except Exception as e:
        return f"ERROR: {traceback.format_exc()}"

if __name__ == "__main__":
    with open("scratch/excel_dump.json", "w") as f:
        f.write(test_parse())
