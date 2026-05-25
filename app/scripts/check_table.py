from app.db.session import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_resources'"))
        for row in res:
            print(row)

if __name__ == "__main__":
    check()
