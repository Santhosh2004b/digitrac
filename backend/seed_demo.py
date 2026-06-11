import psycopg2
from app.utils.security import get_password_hash

conn = psycopg2.connect('postgresql://postgres:QwertyuiopasdfghjkL2004@localhost:5432/digitrac')
cur = conn.cursor()

def seed_demo_user(name, email, pwd, role):
    h = get_password_hash(pwd)
    cur.execute(
        "INSERT INTO users (name, email, password, role, is_setup_complete) VALUES (%s, %s, %s, %s, 1) ON CONFLICT (email) DO NOTHING;",
        (name, email, h, role)
    )

seed_demo_user("Demo VP", "vp@digitrac.com", "VP123", "VP")
seed_demo_user("Demo MGR", "manager@digitrac.com", "MNG123", "MNG")
seed_demo_user("Demo EMP", "employee@digitrac.com", "EMP123", "EMP")

conn.commit()
print("Seeded demo users")
