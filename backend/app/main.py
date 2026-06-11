from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.sql import text
import traceback
import sys

from app.db.session import engine, Base
from app.models import user, project, task, timelog, resource, governance
from app.routes import auth, manager, employee, dashboard, excel, vp, ai
from app.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/healthz", tags=["compliance"])
def health_check():
    """
    Production-grade platform healthcheck
    """
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "telemetry": "active",
            "database_circuit": "CLOSED"
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database_circuit": "OPEN/CRITICAL",
                "error": str(e)
            }
        )
    finally:
        db.close()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = "".join(traceback.format_exception(*sys.exc_info()))
    with open("backend_error.log", "a") as f:
        f.write(f"\n\n--- ERROR AT {request.url} ---\n")
        f.write(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "x-correlation-id"
    ],
)

# Include routers
app.include_router(auth.router)
app.include_router(vp.router)
app.include_router(manager.router)
app.include_router(employee.router)
app.include_router(dashboard.router)
app.include_router(excel.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} Backend API"}
