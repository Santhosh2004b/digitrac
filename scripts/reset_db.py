import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import engine, Base
from app.models.user import User
from app.models.project import Project, ProjectItem, ProjectResource, ApprovedProject
from app.models.task import Task
from app.models.timelog import TimeLog

def reset_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully.")

if __name__ == "__main__":
    reset_db()
