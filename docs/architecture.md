# System Architecture

DigiTrac MVP is structured as a standard client-server enterprise application.

## 1. Frontend
- Built on **Next.js** (React framework).
- Uses simple modular CSS (`.css` files per page) for an enterprise layout.
- Reaches out to the backend via REST API (`http://127.0.0.1:8000`).

## 2. Backend
- Built on **FastAPI** (Python).
- Core router namespaces:
  - `/auth`: Login and session management.
  - `/vp`: Operations for VP roles (portfolio view).
  - `/manager`: Managerial operations (resource allocation).
  - `/employee`: Time logging.
  - `/dashboard`: Unified dashboard metrics.
  - `/excel`: Project creation from structural uploads.

## 3. Database
- **SQLite** default. Uses SQLAlchemy ORM for relational schemas.
- Core Models:
  - `User`: RBAC mapping (VP, EMP, MGR).
  - `Project`, `ApprovedProject`: Mission nodes and high-level tracking.
  - `Task`, `TimeLog`: Operational resource management.
  - `RIDEGovernance`: Risk & Issue ledger.
