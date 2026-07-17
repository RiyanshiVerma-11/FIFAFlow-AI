"""HTTP request observability middleware and system metrics registry.

Tracks per-request latency, total request count, active WebSocket
connections, and Gemini API call volume. Exposes a rolling average
latency computed over the last 100 requests.
"""

import time
import logging
from typing import Any, Dict, List

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure structured JSON logging format
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": "%(message)s"}',
)
logger = logging.getLogger("fifaflow_observability")

# Operational Metrics Dictionary
SYSTEM_METRICS: Dict[str, Any] = {
    "total_requests": 0,
    "active_websockets": 0,
    "gemini_api_calls": 0,
    "redis_status": "disconnected",
    "db_status": "healthy",
    "average_latency_ms": 0.0,
    "latencies": [],
}


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Record HTTP request latency and maintain rolling performance metrics."""

    async def dispatch(self, request: Request, call_next):
        """Measure request processing time and update system metrics."""
        start_time = time.time()
        SYSTEM_METRICS["total_requests"] += 1

        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000

            # Keep a rolling record of last 100 request latencies
            latencies: List[float] = SYSTEM_METRICS["latencies"]
            latencies.append(process_time)
            if len(latencies) > 100:
                latencies.pop(0)
            SYSTEM_METRICS["average_latency_ms"] = sum(latencies) / len(latencies)

            logger.info(
                "HTTP Request: %s %s - Status: %d - Latency: %.2fms",
                request.method, request.url.path, response.status_code, process_time,
            )
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                "HTTP Request Failed: %s %s - Error: %s - Latency: %.2fms",
                request.method, request.url.path, str(e), process_time,
            )
            raise
