import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Any

# Configure structured logging format
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": "%(message)s"}'
)
logger = logging.getLogger("fifaflow_observability")

# Operational Metrics Dictionary
SYSTEM_METRICS = {
    "total_requests": 0,
    "active_websockets": 0,
    "gemini_api_calls": 0,
    "redis_status": "disconnected",
    "db_status": "healthy",
    "average_latency_ms": 0.0,
    "latencies": []
}

class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        SYSTEM_METRICS["total_requests"] += 1
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            # Keep a rolling record of last 100 request latencies
            SYSTEM_METRICS["latencies"].append(process_time)
            if len(SYSTEM_METRICS["latencies"]) > 100:
                SYSTEM_METRICS["latencies"].pop(0)
            SYSTEM_METRICS["average_latency_ms"] = sum(SYSTEM_METRICS["latencies"]) / len(SYSTEM_METRICS["latencies"])
            
            logger.info(f"HTTP Request: {request.method} {request.url.path} - Status: {response.status_code} - Latency: {process_time:.2f}ms")
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"HTTP Request Failed: {request.method} {request.url.path} - Error: {str(e)} - Latency: {process_time:.2f}ms")
            raise e
