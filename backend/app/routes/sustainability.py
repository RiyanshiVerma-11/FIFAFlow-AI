"""Sustainability analytics endpoint.

Exposes time-series energy, water, waste, and carbon metrics
with AI-generated optimisation recommendations for stadium
resource management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import SustainabilityLog
from app.schemas.schemas import SustainabilityResponse

router = APIRouter(prefix="/sustainability", tags=["Sustainability Analytics"])


@router.get("", response_model=List[SustainabilityResponse])
def get_sustainability_logs(db: Session = Depends(get_db)) -> list:
    """Retrieve the 20 most recent sustainability metric records."""
    return db.query(SustainabilityLog).order_by(SustainabilityLog.timestamp.desc()).limit(20).all()
