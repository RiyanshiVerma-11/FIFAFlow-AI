from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import SustainabilityLog
from app.schemas.schemas import SustainabilityResponse

router = APIRouter(prefix="/sustainability", tags=["Sustainability Analytics"])

@router.get("", response_model=List[SustainabilityResponse])
def get_sustainability_logs(db: Session = Depends(get_db)):
    return db.query(SustainabilityLog).order_by(SustainabilityLog.timestamp.desc()).limit(20).all()
