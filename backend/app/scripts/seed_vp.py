from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def seed():
    db = SessionLocal()
    
    # 1. VP
    vp = db.query(User).filter(User.email == 'vp@digitrac.com').first()
    if not vp:
        vp = User(
            email='vp@digitrac.com',
            name='Executive VP',
            password=get_password_hash('vp123'),
            role='VP',
            salary=250000,
            department='Executive'
        )
        db.add(vp)
    
    # 2. Update existing users with some demo salary/dept
    mgr = db.query(User).filter(User.email == 'manager@digitrac.com').first()
    if mgr:
        mgr.salary = 120000
        mgr.department = 'Project Management'
        mgr.role = 'MNG' # Ensure role matches
        
    emp = db.query(User).filter(User.email == 'employee@digitrac.com').first()
    if emp:
        emp.salary = 60000
        emp.department = 'Engineering'
        emp.role = 'EMP'

    db.commit()
    print("Seed Complete")

if __name__ == "__main__":
    seed()
