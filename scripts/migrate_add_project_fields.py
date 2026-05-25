"""
Migration script to add new columns to the projects table.
Run this once to upgrade existing databases.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text, inspect
from app.db.session import engine

def migrate():
    inspector = inspect(engine)
    existing_columns = [c['name'] for c in inspector.get_columns('projects')]

    with engine.begin() as conn:
        if 'total_expected_hours' not in existing_columns:
            conn.execute(text("ALTER TABLE projects ADD COLUMN total_expected_hours FLOAT DEFAULT 0.0"))
            print("Added column 'total_expected_hours' to projects.")
        else:
            print("Column 'total_expected_hours' already exists.")

        if 'revenue_value' not in existing_columns:
            conn.execute(text("ALTER TABLE projects ADD COLUMN revenue_value FLOAT DEFAULT 0.0"))
            print("Added column 'revenue_value' to projects.")
        else:
            print("Column 'revenue_value' already exists.")

    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
