import asyncio
import logging
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db, SessionLocal
from app.core.observability import ObservabilityMiddleware, SYSTEM_METRICS
from app.core.event_engine import event_broker

# Models
from app.models.models import User, Stadium, Match, DigitalTwinNode, Volunteer, SustainabilityLog, AlertAndBriefing
from app.core.security import get_password_hash
from app.core.seeder import seed_database

# Routers
from app.routes import auth, twin, incidents, copilot, translate, volunteers, sustainability, transport, navigation

# Simulator
from app.services.simulator import simulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fifaflow_main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FIFA World Cup 2026 GenAI Operations & Digital Twin Platform Backend",
    version="1.0.0"
)

# CORS configuration
allowed_origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)
# Observability middleware
app.add_middleware(ObservabilityMiddleware)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(twin.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(translate.router, prefix=settings.API_V1_STR)
app.include_router(volunteers.router, prefix=settings.API_V1_STR)
app.include_router(sustainability.router, prefix=settings.API_V1_STR)
app.include_router(transport.router, prefix=settings.API_V1_STR)
app.include_router(navigation.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Observability"])
def health_check(db: Session = Depends(get_db)):
    # Verify DB connectivity
    try:
        db.execute("SELECT 1")
        SYSTEM_METRICS["db_status"] = "healthy"
    except Exception as e:
        SYSTEM_METRICS["db_status"] = "unhealthy"
        logger.error(f"DB health check failed: {str(e)}")
        
    return {
        "status": "healthy" if SYSTEM_METRICS["db_status"] == "healthy" else "degraded",
        "redis": SYSTEM_METRICS["redis_status"],
        "database": SYSTEM_METRICS["db_status"],
        "timestamp": datetime.utcnow()
    }

@app.get("/api/metrics", tags=["Observability"])
def get_metrics(_ = Depends(auth.require_role(["organizer"]))):
    """Exposes real-time system performance and counts for the dashboard's analytics telemetry."""
    return SYSTEM_METRICS

# Live Event WebSockets Channel
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    SYSTEM_METRICS["active_websockets"] += 1
    logger.info("New WebSocket client connected.")
    
    # Define callback to send alerts directly down the socket
    async def broker_callback(channel: str, message: dict):
        try:
            await websocket.send_json({
                "channel": channel,
                "data": message
            })
        except Exception:
            pass # Socket might be closed

    # Subscribe websocket listener to event broker
    await event_broker.subscribe(broker_callback)
    
    try:
        # Keep connection open and listen for user commands
        while True:
            data = await websocket.receive_text()
            # Respond to client heartbeats
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    finally:
        SYSTEM_METRICS["active_websockets"] = max(0, SYSTEM_METRICS["active_websockets"] - 1)

@app.on_event("startup")
async def startup_event():
    # 1. Verify JWT key safety
    if settings.ENV != "development" and settings.JWT_SECRET == "fifaflow_ai_jwt_secret_key_2026_super_secure":
        logger.warning("CRITICAL SECURITY WARNING: System is running with default JWT secret in non-development mode!")
    # 2. Create tables & seed data
    seed_database()
    # 3. Connect to redis broker
    await event_broker.connect()
    # 4. Start Telemetry Simulation
    simulator.start()

@app.on_event("shutdown")
async def shutdown_event():
    # Stop simulation
    simulator.stop()
    # Close Gemini HTTP client pool
    from app.services.gemini import gemini_service
    await gemini_service.close()
