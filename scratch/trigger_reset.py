import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.services.demo_seeder import DemoSandboxSeeder

db = SessionLocal()
try:
    DemoSandboxSeeder.reset_and_seed_sandbox(db)
    print("Database successfully reset and seeded with high fidelity data!")
finally:
    db.close()
