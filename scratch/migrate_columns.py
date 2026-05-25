from sqlalchemy import text
from app.db.session import engine

def migrate():
    with engine.connect() as conn:
        print("Adding columns...")
        conn.execute(text('ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_cost FLOAT DEFAULT 0.0'))
        conn.execute(text('ALTER TABLE projects ADD COLUMN IF NOT EXISTS accommodation_cost FLOAT DEFAULT 0.0'))
        conn.execute(text('ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_cost FLOAT DEFAULT 0.0'))
        conn.execute(text('ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS manmonths FLOAT DEFAULT 0.0'))
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    migrate()
