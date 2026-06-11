import sys
import os
sys.path.insert(0, os.path.abspath('.'))

import psycopg2
from app.config import settings

def migrate():
    print("Fixing missing columns using psycopg2...")
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    queries = [
        'ALTER TABLE timelogs ADD COLUMN IF NOT EXISTS remarks VARCHAR'
    ]
    
    for q in queries:
        try:
            cur.execute(q)
            print(f"Executed: {q}")
        except Exception as e:
            print(f"Error on '{q}': {e}")
            
    cur.close()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    migrate()
