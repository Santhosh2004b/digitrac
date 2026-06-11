import os, sys
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash, verify_password

session = SessionLocal()

# Reset ALL user passwords to known values
password_map = {
    'manoharan@arche.global':       'Arche@2024',
    'sathishbalaji.k@arche.global': 'Arche@2024',
    'santhosh.b@arche.global':      'Arche@2024',
    'as@arche.global':              'Arche@2024',
    'k@arche.global':               'Arche@2024',
    'sukanya.p@arche.global':       'Arche@2024',
    'sreenivasulu.t@arche.global':  'Arche@2024',
    'rex.g@arche.global':           'Arche@2024',
    'manager@digitrac.com':         'Manager123',
    'vp@digitrac.com':              'Admin123',
    'employee@digitrac.com':        'Employee123',
    'bob@digitrac.com':             'Employee123',
}

for email, new_pass in password_map.items():
    user = session.query(User).filter(User.email == email).first()
    if user:
        user.password = get_password_hash(new_pass)
        user.is_setup_complete = 1
        # Verify it works
        ok = verify_password(new_pass, user.password)
        print(f"  {email:40s} -> {new_pass:15s} role={user.role} verify={ok}")
    else:
        print(f"  {email:40s} -> NOT FOUND")

session.commit()
session.close()

print()
print("All passwords reset. Use these to login:")
print("  VP:  manoharan@arche.global / Arche@2024")
print("  VP:  sathishbalaji.k@arche.global / Arche@2024")
print("  MNG: santhosh.b@arche.global / Arche@2024")
print("  MNG: manager@digitrac.com / Manager123")
