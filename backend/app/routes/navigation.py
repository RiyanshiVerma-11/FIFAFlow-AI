"""Accessible navigation routing endpoint.

Computes congestion-aware, wheelchair-accessible pathfinding routes
through the stadium graph using the Dijkstra-based route optimiser,
dynamically incorporating live digital-twin occupancy data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import DigitalTwinNode
from app.schemas.schemas import RouteQuery, RouteResponse
from app.services.route_optimizer import route_optimizer

router = APIRouter(prefix="/navigation", tags=["Navigation Routing"])


@router.post("/route", response_model=RouteResponse)
def calculate_route(query: RouteQuery, db: Session = Depends(get_db)) -> dict:
    """Calculate an optimal route between two coordinates using live congestion data."""
    # 1. Fetch current digital twin nodes congestion to feed into pathfinder
    nodes = db.query(DigitalTwinNode).all()
    node_congestion = {node.name: node.occupancy for node in nodes}

    # 2. Run Route Optimizer path calculation
    path_data = route_optimizer.find_path(
        start_lat=query.start_lat,
        start_lng=query.start_lng,
        end_lat=query.end_lat,
        end_lng=query.end_lng,
        require_accessible=query.require_accessible,
        node_congestion=node_congestion,
    )
    return path_data
