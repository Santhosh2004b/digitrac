from app.db.session import engine
from sqlalchemy import text

def migrate():
    columns = [
        ("status", "VARCHAR", "'DRAFT'"),
        ("start_date", "TIMESTAMP", "NULL"),
        ("sale_value", "FLOAT", "0"),
        ("capex", "FLOAT", "0"),
        ("opex", "FLOAT", "0"),
        ("it_cost", "FLOAT", "0"),
        ("non_it_cost", "FLOAT", "0"),
        ("implementation_cost", "FLOAT", "0"),
        ("risk_cost", "FLOAT", "0"),
        ("misc_cost", "FLOAT", "0"),
        ("freight", "FLOAT", "0"),
        ("total_cost_baseline", "FLOAT", "0"),
        ("margin_pct_baseline", "FLOAT", "0"),
        ("net_margin_baseline", "FLOAT", "0")
    ]
    
    with engine.connect() as conn:
        print("Starting migration for 'projects' table...")
        for col_name, col_type, default in columns:
            try:
                conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type} DEFAULT {default}"))
                conn.commit()
                print(f"Added column {col_name}")
            except Exception as e:
                print(f"Column {col_name} might already exist: {e}")
        
        print("\nCreating 'project_resources' table if not exists...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS project_resources (
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
            print("Table 'project_resources' created/verified.")
        except Exception as e:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    migrate()
