"""FIFAFlow AI — FastAPI application entry point.

Configures the ASGI server with CORS, security headers, observability
middleware, and registers all API route modules. Manages application
lifecycle including database seeding, Redis event broker connectivity,
and the real-time telemetry simulation engine.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db, SessionLocal
from app.core.observability import ObservabilityMiddleware, SYSTEM_METRICS
from app.core.event_engine import event_broker

# Models — imported to register ORM mappings with SQLAlchemy metadata
from app.models.models import (
    User, Stadium, Match, DigitalTwinNode,
    Volunteer, SustainabilityLog, AlertAndBriefing,
)
from app.core.security import get_password_hash
from app.core.seeder import seed_database

# Routers
from app.routes import (
    auth, twin, incidents, copilot,
    translate, volunteers, sustainability,
    transport, navigation,
)

# Simulator
from app.services.simulator import simulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fifaflow_main")


# ---------------------------------------------------------------------------
# Application Lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage startup and shutdown lifecycle events."""
    # ── Startup ──────────────────────────────────────────────────────────
    if settings.ENV != "development" and settings.JWT_SECRET == "fifaflow_ai_jwt_secret_key_2026_super_secure":
        logger.warning(
            "CRITICAL SECURITY WARNING: System is running with default JWT secret in non-development mode!"
        )
    seed_database()
    await event_broker.connect()
    simulator.start()
    logger.info("FIFAFlow AI startup complete.")

    yield  # Application is running

    # ── Shutdown ─────────────────────────────────────────────────────────
    simulator.stop()
    from app.services.gemini import gemini_service
    await gemini_service.close()
    logger.info("FIFAFlow AI shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FIFA World Cup 2026 GenAI Operations & Digital Twin Platform Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject browser security headers into every HTTP response."""

    async def dispatch(self, request: Request, call_next):
        """Add X-Content-Type-Options, X-Frame-Options, HSTS, and CSP headers."""
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://*.tile.openstreetmap.org; "
            "connect-src 'self' ws: wss: https://generativelanguage.googleapis.com https://translate.googleapis.com"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=(self)"
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ObservabilityMiddleware)


# ---------------------------------------------------------------------------
# Rate Limiting Middleware (simple in-memory counter for auth endpoints)
# ---------------------------------------------------------------------------
import time
from collections import defaultdict

_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 20  # max requests per window


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple sliding-window rate limiter for authentication endpoints."""

    async def dispatch(self, request: Request, call_next):
        """Enforce rate limits on /api/auth/* endpoints."""
        if request.url.path.startswith("/api/auth/"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            # Prune expired entries
            _rate_limit_store[client_ip] = [
                t for t in _rate_limit_store[client_ip] if now - t < RATE_LIMIT_WINDOW
            ]
            if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                )
            _rate_limit_store[client_ip].append(now)
        return await call_next(request)


app.add_middleware(RateLimitMiddleware)


# ---------------------------------------------------------------------------
# Register API Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(twin.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(translate.router, prefix=settings.API_V1_STR)
app.include_router(volunteers.router, prefix=settings.API_V1_STR)
app.include_router(sustainability.router, prefix=settings.API_V1_STR)
app.include_router(transport.router, prefix=settings.API_V1_STR)
app.include_router(navigation.router, prefix=settings.API_V1_STR)


# ---------------------------------------------------------------------------
# Observability Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["Observability"])
def health_check(db: Session = Depends(get_db)) -> dict:
    """Return system health status including database and Redis connectivity."""
    try:
        db.execute(text("SELECT 1"))
        SYSTEM_METRICS["db_status"] = "healthy"
    except Exception as e:
        SYSTEM_METRICS["db_status"] = "unhealthy"
        logger.error("DB health check failed: %s", str(e))

    return {
        "status": "healthy" if SYSTEM_METRICS["db_status"] == "healthy" else "degraded",
        "redis": SYSTEM_METRICS["redis_status"],
        "database": SYSTEM_METRICS["db_status"],
        "timestamp": datetime.now(timezone.utc),
    }


@app.get("/api/metrics", tags=["Observability"])
def get_metrics(_ = Depends(auth.require_role(["organizer"]))) -> dict:
    """Expose real-time system performance counters for the dashboard analytics panel."""
    return SYSTEM_METRICS


# ---------------------------------------------------------------------------
# Live Event WebSocket Channel
# ---------------------------------------------------------------------------
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Accept WebSocket connections for real-time stadium event streaming."""
    await websocket.accept()
    SYSTEM_METRICS["active_websockets"] += 1
    logger.info("New WebSocket client connected.")

    async def broker_callback(channel: str, message: dict) -> None:
        """Forward event broker messages to the connected WebSocket client."""
        try:
            await websocket.send_json({"channel": channel, "data": message})
        except Exception:
            pass  # Socket might be closed

    await event_broker.subscribe(broker_callback)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    finally:
        SYSTEM_METRICS["active_websockets"] = max(0, SYSTEM_METRICS["active_websockets"] - 1)
