import os
import sys

from app.db.session import SessionLocal
from app.models.user import User

def main():
    db = SessionLocal()
    users = db.query(User).all()
    print("USERS:")
    for u in users:
        print(f"{u.email} - {u.role}")

if __name__ == "__main__":
    main()
