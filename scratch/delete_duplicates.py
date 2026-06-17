import psycopg2
from app.config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

ids = [25, 26, 31, 32, 33, 34, 35, 36, 38, 39, 40, 42]
ids_str = ','.join(str(i) for i in ids)

# Find ALL foreign key constraints referencing projects table
fk_query = """
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints AS rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.table_constraints AS ccu ON ccu.constraint_name = rc.unique_constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'projects'
"""
cur.execute(fk_query)
fks = cur.fetchall()

print("All FK references to projects table:")
for fk in fks:
    table, col = fk
    print(f"  {table}.{col}")
    try:
        cur.execute(f"DELETE FROM {table} WHERE {col} IN ({ids_str})")
        print(f"    -> Deleted {cur.rowcount} rows")
    except Exception as e:
        print(f"    -> Error: {e}")

# Now delete the duplicate projects
cur.execute(f"DELETE FROM projects WHERE id IN ({ids_str})")
print(f"\nDeleted {cur.rowcount} duplicate projects!")

cur.execute("SELECT id, status, name FROM projects ORDER BY name, id")
rows = cur.fetchall()
print(f"\nRemaining {len(rows)} projects:")
for r in rows:
    print(f"  ID={r[0]:3d}  {r[1]:12s}  {r[2]}")

conn.close()
