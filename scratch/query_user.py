import os, sys
sys.path.append(os.path.abspath('.'))
from app.db.session import SessionLocal
from app.models.user import User

session = SessionLocal()
user = session.query(User).filter(User.email == 'manager@digitrac.com').first()
if user:
    print('ID:', user.id)
    print('Email:', user.email)
    print('Role:', user.role)
    print('Password hash:', user.password)
    print('Setup complete:', user.is_setup_complete)
else:
    print('User not found')
session.close()
