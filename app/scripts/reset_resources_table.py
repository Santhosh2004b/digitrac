from app.db.session import engine
from sqlalchemy import text

def reset_table():
    with engine.connect() as conn:
        print("Dropping 'project_resources'...")
        conn.execute(text("DROP TABLE IF EXISTS project_resources CASCADE"))
        conn.commit()
        
        print("Creating 'project_resources' with correct columns...")
        conn.execute(text("""
            CREATE TABLE project_resources (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id),
                role VARCHAR NOT NULL,
                qty INTEGER DEFAULT 1,
                planned_months FLOAT DEFAULT 0,
                unit_price FLOAT DEFAULT 0,
                total_price FLOAT DEFAULT 0,
                name VARCHAR,
                email VARCHAR,
                mobile VARCHAR,
                actual_months FLOAT DEFAULT 0
            )
        """))
        conn.commit()
        print("Done!")

if __name__ == "__main__":
    reset_table()
