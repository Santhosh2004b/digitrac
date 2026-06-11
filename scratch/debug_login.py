import os, sys
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import verify_password

session = SessionLocal()

print("=" * 60)
print("ALL USERS IN DATABASE")
print("=" * 60)
users = session.query(User).all()
for u in users:
    print(f"  ID: {u.id}")
    print(f"  Email: {u.email}")
    print(f"  Role: {u.role}")
    print(f"  Password: {u.password}")
    print(f"  Setup complete: {u.is_setup_complete}")
    print("-" * 40)

print()
print("=" * 60)
print("TESTING PASSWORD VERIFICATION")
print("=" * 60)

test_cases = [
    ("manager@digitrac.com", "Manager123"),
    ("manoharan@arche.global", "Manager123"),
    ("manoharan@arche.global", "manager123"),
    ("manoharan@arche.global", "Manoharan123"),
    ("vp@digitrac.com", "Admin123"),
]

for email, password in test_cases:
    u = session.query(User).filter(User.email == email).first()
    if u:
        result = verify_password(password, u.password)
        print(f"  {email} / {password} -> verify={result}")
    else:
        print(f"  {email} -> USER NOT FOUND")

session.close()
