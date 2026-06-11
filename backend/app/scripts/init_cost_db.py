from app.db.session import engine, Base
from app.models.user import User
from app.models.project import Project, ProjectResource
from app.models.task import Task
from app.models.timelog import TimeLog

def init_db():
    print("Creating new tables and columns...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    init_db()
