import sqlite3
import json

conn = sqlite3.connect('digitrac.db')
cursor = conn.cursor()
cursor.execute("SELECT id, project_name, full_excel_data FROM approved_projects ORDER BY id DESC LIMIT 1;")
row = cursor.fetchone()

with open('scratch_inspect.py', 'w') as f:
    f.write(f"ID: {row[0]}\nProject: {row[1]}\nData length: {len(str(row[2]))}\n")
    data = json.loads(row[2])
    if isinstance(data, dict):
        f.write(f"Is Dict. Keys: {list(data.keys())}\n")
        f.write(f"Implementation Resources: {json.dumps(data.get('implementation_resources', []), indent=2)}\n")
    else:
        f.write("Is List.\n")
