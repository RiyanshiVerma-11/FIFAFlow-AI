"""Digital Twin node management endpoints.

Exposes CRUD operations on stadium digital-twin nodes and provides
a surge simulation trigger for testing crowd management scenarios.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import DigitalTwinNode
from app.schemas.schemas import DigitalTwinNodeResponse, DigitalTwinNodeBase
from app.routes.auth import require_role
from app.core.event_engine import event_broker

router = APIRouter(prefix="/twin", tags=["Digital Twin"])


@router.get("/nodes", response_model=List[DigitalTwinNodeResponse])
def get_nodes(db: Session = Depends(get_db)) -> list:
    """Retrieve all digital-twin nodes with current occupancy and status."""
    return db.query(DigitalTwinNode).all()


@router.put("/nodes/{node_id}", response_model=DigitalTwinNodeResponse)
async def update_node(
    node_id: int,
    node_data: DigitalTwinNodeBase,
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer", "staff"])),
) -> DigitalTwinNode:
    """Update a digital-twin node and broadcast the change via the event broker."""
    node = db.query(DigitalTwinNode).filter(DigitalTwinNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Digital Twin Node not found")

    node.type = node_data.type
    node.name = node_data.name
    node.location_json = node_data.location_json
    node.occupancy = node_data.occupancy
    node.status = node_data.status
    node.queue_length_minutes = node_data.queue_length_minutes
    node.capacity_limit = node_data.capacity_limit

    db.commit()
    db.refresh(node)

    await event_broker.publish("stadium:events", {
        "type": "manual_node_update",
        "node_id": node.id,
        "name": node.name,
        "status": node.status,
        "occupancy": node.occupancy,
    })

    return node


@router.post("/nodes/{node_id}/surge", response_model=DigitalTwinNodeResponse)
async def simulate_surge(
    node_id: int,
    occupancy: int,
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer"])),
) -> DigitalTwinNode:
    """Simulate an occupancy surge on a specific node for crowd management testing."""
    node = db.query(DigitalTwinNode).filter(DigitalTwinNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Digital Twin Node not found")

    node.occupancy = occupancy
    node.status = "congested" if occupancy >= 85 else "active"
    node.queue_length_minutes = int(occupancy / 5)

    db.commit()
    db.refresh(node)

    await event_broker.publish("stadium:events", {
        "type": "node_surge",
        "node_id": node.id,
        "node_name": node.name,
        "occupancy": node.occupancy,
        "queue_length_minutes": node.queue_length_minutes,
    })

    return node
