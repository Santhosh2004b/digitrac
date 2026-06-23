from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.models import user, project, task, timelog, resource, governance, workflow, saas, intelligence
from app.routes import auth, manager, employee, dashboard, excel, vp, intelligence, workflows, predictive, saas, notifications, workflow, ai
from app.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.utils.resilience import ObservabilityMiddleware, db_circuit_breaker
from sqlalchemy.sql import text
import traceback
import sys
import asyncio
import os

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    # Integrate deadline monitor to run daily in the background
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    try:
        from backend.deadline_monitor import check_deadlines
        
        async def run_daily():
            while True:
                try:
                    await check_deadlines()
                except Exception as e:
                    print(f"Error in daily deadline monitor: {e}")
                
                # Sleep for 24 hours (86400 seconds)
                await asyncio.sleep(86400)

        # Launch background task
        asyncio.create_task(run_daily())
        print("Daily Background Deadline Monitor initialized.")
        
        # Launch resource utilization monitor
        from app.utils.resource_scheduler import check_resource_utilization
        asyncio.create_task(check_resource_utilization())
        print("Resource Utilization Monitor initialized.")
    except Exception as e:
        print(f"Failed to initialize deadline monitor: {e}")

app.add_middleware(ObservabilityMiddleware)

@app.get("/healthz", tags=["compliance"])
def health_check():
    """
    Production-grade platform healthcheck (Objective 8)
    """
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        # Run DB query inside resilient circuit breaker
        db_circuit_breaker.call(db.execute, text("SELECT 1"))
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
    allow_origins=["*"],
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
app.include_router(intelligence.router)
app.include_router(workflows.router)
app.include_router(predictive.router)
app.include_router(saas.router)
app.include_router(notifications.router)
app.include_router(workflow.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} Backend API"}
