import sqlite3

conn = sqlite3.connect('backend/digitrac.db') # Assuming it's in backend
cursor = conn.cursor()
try:
    cursor.execute("SELECT id, project_name, manager_name, created_at FROM projects ORDER BY id DESC LIMIT 5")
    print("Recent Projects:")
    for row in cursor.fetchall():
        print(row)
        
    cursor.execute("SELECT id, user_id, title, is_read, created_at FROM notifications ORDER BY id DESC LIMIT 5")
    print("\nRecent Notifications:")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("Error:", e)
    import os
    print("cwd:", os.getcwd())
    print("ls backend:", os.listdir('backend'))
finally:
    conn.close()
