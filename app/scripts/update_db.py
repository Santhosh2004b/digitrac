from app.db.session import engine
from sqlalchemy import text

def update_db():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN priority VARCHAR DEFAULT 'MEDIUM'"))
            conn.commit()
            print("Successfully added priority column to projects table.")
        except Exception as e:
            print(f"Error or column already exists: {e}")

if __name__ == "__main__":
    update_db()
