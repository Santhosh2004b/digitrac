import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def reset_user_password():
    db = SessionLocal()
    email = "sathishbalaji.k@arche.global"
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.password = get_password_hash("arche123")
        db.commit()
        print(f"Password for {email} reset to 'arche123'")
    else:
        print(f"User {email} not found.")
    db.close()

if __name__ == "__main__":
    reset_user_password()
