import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def seed_specific_user():
    db = SessionLocal()
    email = "sathishbalaji.k@arche.global"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name="Sathish Balaji",
            email=email,
            password=get_password_hash("QwertyuiopasdfghjkL2004"), # Taking from screenshot length/common pattern
            role="VP"
        )
        db.add(user)
        db.commit()
        print(f"User {email} created as VP.")
    else:
        print(f"User {email} already exists.")
    db.close()

if __name__ == "__main__":
    seed_specific_user()
