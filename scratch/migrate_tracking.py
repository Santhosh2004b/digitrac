from sqlalchemy import text
from app.db.session import engine

def migrate():
    with engine.connect() as conn:
        print("Adding tracking columns...")
        conn.execute(text('ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS work_start_date TIMESTAMP'))
        conn.execute(text('ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS deadline TIMESTAMP'))
        conn.execute(text('ALTER TABLE project_resources ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    migrate()