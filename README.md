# DigiTrac Enterprise MVP

A stable, production-ready enterprise resource management and governance platform.

## Architecture
- **Backend:** FastAPI (Python), SQLite
- **Frontend:** Next.js (React)
- **Deployment:** Docker, Docker Compose

## Core Modules
1. **Authentication & RBAC:** Role-based access for VP, Manager, and Employee.
2. **Project Intelligence Upload:** Excel parsing for Resource Matrices.
3. **Resource Management:** Resource allocation, time logging, cost, and margin tracking.
4. **Governance:** RIDE (Risk, Issue, Dependency, Escalation) tracking, Audit logs.
5. **Dashboard:** Clean VP and Manager executive dashboards.

## Quick Start
```bash
# Backend
cd backend
python -m venv .venv
source .venv/scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

For docker deployment, see `docs/deployment.md`.
