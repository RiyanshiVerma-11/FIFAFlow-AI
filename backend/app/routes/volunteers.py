"""Volunteer shift management endpoints.

Supports listing volunteer shifts, creating new shift assignments,
and updating volunteer status with role-based permission checks.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Volunteer, User
from app.schemas.schemas import VolunteerResponse, VolunteerCreate
from app.routes.auth import require_role

router = APIRouter(prefix="/volunteer", tags=["Volunteer Roster"])


@router.get("/shifts", response_model=List[VolunteerResponse])
def get_shifts(db: Session = Depends(get_db)) -> list:
    """Retrieve all volunteer shift assignments."""
    return db.query(Volunteer).all()


@router.post("/shifts", response_model=VolunteerResponse)
def create_shift(
    volunteer_in: VolunteerCreate,
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer"])),
) -> Volunteer:
    """Create a new volunteer shift assignment for an existing user."""
    user = db.query(User).filter(User.username == volunteer_in.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    volunteer = Volunteer(
        user_id=user.id,
        shift_start=volunteer_in.shift_start,
        shift_end=volunteer_in.shift_end,
        status=volunteer_in.status,
        assigned_zone=volunteer_in.assigned_zone,
        location_json=volunteer_in.location_json or {"lat": 34.0535, "lng": -118.2430},
    )
    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)
    return volunteer


@router.put("/shifts/{volunteer_id}/status", response_model=VolunteerResponse)
def update_volunteer_status(
    volunteer_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["organizer", "volunteer", "staff"])),
) -> Volunteer:
    """Update a volunteer's active status with ownership validation."""
    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer record not found")

    # Check permissions — volunteers can only update their own status
    if current_user.role == "volunteer" and vol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot alter another volunteer's status")

    vol.status = status
    db.commit()
    db.refresh(vol)
    return vol
