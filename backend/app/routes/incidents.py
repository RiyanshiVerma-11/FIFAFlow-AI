from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Incident, User
from app.schemas.schemas import IncidentCreate, IncidentResponse
from app.routes.auth import get_current_user, require_role
from app.services.gemini import gemini_service
from app.core.event_engine import event_broker

router = APIRouter(prefix="/incidents", tags=["Incidents & Emergencies"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()

@router.post("", response_model=IncidentResponse)
async def report_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Ask Gemini to classify severity, create recommendations, and provide confidence
    ai_analysis = await gemini_service.analyze_incident(
        type=incident_in.type,
        severity=incident_in.severity,
        description=incident_in.description
    )
    
    incident = Incident(
        type=incident_in.type,
        severity=incident_in.severity,
        description=incident_in.description,
        status="pending",
        location_json=incident_in.location_json,
        reporter_id=current_user.id,
        ai_response_recommendation=ai_analysis.get("action_recommendation"),
        confidence_score=ai_analysis.get("confidence_score", 90),
        reasoning=ai_analysis.get("reasoning")
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    # 2. Publish to Redis Broker
    await event_broker.publish("stadium:events", {
        "type": "incident_reported",
        "incident_id": incident.id,
        "incident_type": incident.type,
        "severity": incident.severity,
        "description": incident.description,
        "recommendation": incident.ai_response_recommendation
    })
    
    return incident

@router.post("/{incident_id}/assign", response_model=IncidentResponse)
async def assign_incident(
    incident_id: int,
    responder_username: str,
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer", "staff"]))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    responder = db.query(User).filter(User.username == responder_username).first()
    if not responder:
        raise HTTPException(status_code=404, detail="Responder user not found")
        
    incident.assigned_responder_id = responder.id
    incident.status = "active"
    db.commit()
    db.refresh(incident)
    
    await event_broker.publish("stadium:events", {
        "type": "incident_assigned",
        "incident_id": incident.id,
        "responder": responder.username,
        "status": incident.status
    })
    
    return incident

@router.post("/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer", "staff"]))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    incident.status = "resolved"
    db.commit()
    db.refresh(incident)
    
    await event_broker.publish("stadium:events", {
        "type": "incident_resolved",
        "incident_id": incident.id,
        "status": incident.status
    })
    
    return incident
