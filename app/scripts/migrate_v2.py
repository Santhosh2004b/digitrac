from app.db.session import engine, Base
from app.models import user, project, task, timelog
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Add new columns to projects if they don't exist
        cols = [
            ("total_hours_used", "FLOAT DEFAULT 0.0"),
            ("expected_hours", "FLOAT DEFAULT 0.0"),
            ("efficiency_score", "FLOAT DEFAULT 0.0"),
            ("performance_score", "FLOAT DEFAULT 0.0"),
            ("optimized_hours", "FLOAT DEFAULT 0.0")
        ]
        for col_name, col_type in cols:
            try:
                conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}"))
                print(f"Added column {col_name} to projects")
            except Exception as e:
                print(f"Column {col_name} already exists or error: {e}")
        
        conn.commit()
    
    # Create new tables
    Base.metadata.create_all(bind=engine)
    print("Database sync completed.")

if __name__ == "__main__":
    migrate()
