from app.db.session import SessionLocal, engine
from app.models.user import User, Base
from app.utils.security import get_password_hash

def seed_users():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # We create the requested user and standard demo users
    users_to_seed = [
        {"name": "Manoharan", "email": "manoharan@arche.global", "password": "password123", "role": "VP"},
        {"name": "Manager", "email": "manager@arche.global", "password": "password123", "role": "MNG"},
        {"name": "VP User", "email": "vp@arche.global", "password": "password123", "role": "VP"},
        {"name": "Employee", "email": "employee@arche.global", "password": "password123", "role": "EMP"},
    ]
    
    for u in users_to_seed:
        db_user = db.query(User).filter(User.email == u["email"]).first()
        if not db_user:
            new_user = User(
                name=u["name"],
                email=u["email"],
                password=get_password_hash(u["password"]),
                role=u["role"],
                is_setup_complete=1
            )
            db.add(new_user)
            print(f"Added {u['email']} with password: {u['password']}")
        else:
            # Update password just in case it got messed up
            db_user.password = get_password_hash(u["password"])
            print(f"Updated {u['email']} password to: {u['password']}")
            
    db.commit()
    db.close()
    print("Database seeded successfully with users!")

if __name__ == "__main__":
    seed_users()
