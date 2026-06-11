# Deployment Guide

## Docker Setup
The project uses `docker-compose` to run the frontend and backend together.

1. Ensure Docker Desktop is running.
2. Build and start the services:
```bash
docker-compose up --build -d
```
3. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - Swagger UI: `http://localhost:8000/docs`

## Manual Server Startup
If you prefer running without Docker:

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
