"""
Fix script:
1. manoharan@arche.global has Setup complete=0 → login blocked
2. manoharan@arche.global password needs to be set
3. Reset password to a known value so we can log in
"""
import os, sys
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash, verify_password

session = SessionLocal()

# Fix manoharan@arche.global - set password + mark setup complete
manoharan = session.query(User).filter(User.email == 'manoharan@arche.global').first()
if manoharan:
    new_pass = 'Arche@2024'
    manoharan.password = get_password_hash(new_pass)
    manoharan.is_setup_complete = 1
    print(f"Fixed manoharan@arche.global -> password set to '{new_pass}', setup complete=1")

# Fix manager@digitrac.com - is_setup_complete=0 blocks login in some flows
mgr = session.query(User).filter(User.email == 'manager@digitrac.com').first()
if mgr:
    mgr.is_setup_complete = 1
    print(f"Fixed manager@digitrac.com -> setup complete=1")

# Fix all MNG/VP users with is_setup_complete=0
others = session.query(User).filter(
    User.is_setup_complete == 0,
    User.role.in_(['MNG', 'VP'])
).all()
for u in others:
    u.is_setup_complete = 1
    print(f"Fixed {u.email} -> setup complete=1")

session.commit()
session.close()

print()
print("Done! Now verify:")
print("  manoharan@arche.global  / Arche@2024")
print("  manager@digitrac.com    / Manager123")
