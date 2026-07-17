"""Transportation intelligence endpoint.

Provides real-time simulated data for parking zone occupancy forecasts,
shuttle schedules, metro line status, and post-match exit rush predictions.
"""

from fastapi import APIRouter
from typing import Any, Dict

router = APIRouter(prefix="/transport", tags=["Transportation Intelligence"])


@router.get("/status")
def get_transport_status() -> Dict[str, Any]:
    """Return real-time parking, shuttle, metro, and prediction data for transit planning."""
    return {
        "parking": [
            {"zone": "Zone A", "occupancy": 88, "capacity": 2000, "forecast_30m": 94},
            {"zone": "Zone B", "occupancy": 92, "capacity": 1500, "forecast_30m": 99},
            {"zone": "Zone C", "occupancy": 45, "capacity": 3000, "forecast_30m": 60},
        ],
        "shuttles": [
            {"route": "Bus Station Express 1", "next_arrival_min": 4, "occupancy": 80},
            {"route": "Metro Station Link 2", "next_arrival_min": 7, "occupancy": 95},
            {"route": "VIP Hotel Direct", "next_arrival_min": 12, "occupancy": 20},
        ],
        "metro": [
            {"line": "Metro Red Line (Stadium Stn)", "frequency_min": 3, "status": "delayed", "delay_min": 6},
            {"line": "Metro Blue Line (Outer Stn)", "frequency_min": 5, "status": "on_time", "delay_min": 0},
        ],
        "predictions": {
            "exit_rush_peak_minutes_post_match": 45,
            "peak_traffic_gridlock_index": 7.8,
        },
    }
