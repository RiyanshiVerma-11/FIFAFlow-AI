from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import DigitalTwinNode, Match, Incident, Volunteer, AlertAndBriefing, User
from app.schemas.schemas import WhatIfQuery, WhatIfResponse, CopilotChatQuery, CopilotChatResponse
from app.services.gemini import gemini_service
from app.routes.auth import require_role

router = APIRouter(prefix="/copilot", tags=["AI Operations Copilot"])

def _get_stadium_state_summary(db: Session) -> dict:
    match = db.query(Match).first()
    nodes = db.query(DigitalTwinNode).all()
    incidents_count = db.query(Incident).filter(Incident.status != "resolved").count()
    volunteers_count = db.query(Volunteer).filter(Volunteer.status == "active").count()
    
    gate_3 = next((n.occupancy for n in nodes if "Gate 3" in n.name), 40)
    gate_5 = next((n.occupancy for n in nodes if "Gate 5" in n.name), 30)
    parking = next((n.occupancy for n in nodes if "parking" in n.type.lower() or "Terminal" in n.name), 25)
    
    return {
        "attendance": match.current_attendance if match else 75000,
        "capacity": match.stadium.capacity if match and match.stadium else 85000,
        "gate_3_occupancy": gate_3,
        "gate_5_occupancy": gate_5,
        "active_incidents": incidents_count,
        "active_volunteers": volunteers_count,
        "parking_occupancy": parking,
        "match_state": f"{match.team_a} vs {match.team_b} ({match.score})" if match else "No Match",
        "gate_3_status": next((n.status for n in nodes if "Gate 3" in n.name), "active"),
        "gate_5_status": next((n.status for n in nodes if "Gate 5" in n.name), "active"),
        "metro_congestion": "heavy" if gate_3 > 80 else "normal"
    }

@router.post("/what-if", response_model=WhatIfResponse)
async def what_if_simulation(
    query: WhatIfQuery, 
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer", "staff"]))
):
    state = _get_stadium_state_summary(db)
    sim_data = await gemini_service.run_what_if_simulation(query.scenario, state)
    return sim_data

@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat(
    query: CopilotChatQuery, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["organizer", "staff", "volunteer", "fan"]))
):
    state = _get_stadium_state_summary(db)
    ai_reply = await gemini_service.query_copilot(query.message, state, role=current_user.role)
    return ai_reply

@router.get("/briefing")
async def get_latest_briefing(db: Session = Depends(get_db)):
    # Look up last briefing inside DB
    last_briefing = db.query(AlertAndBriefing).filter(AlertAndBriefing.type == "briefing").order_by(AlertAndBriefing.created_at.desc()).first()
    if last_briefing:
        return {"briefing": last_briefing.content, "timestamp": last_briefing.created_at}
        
    # Else generate a fresh one
    state = _get_stadium_state_summary(db)
    briefing_txt = await gemini_service.generate_operational_briefing(state)
    
    # Save to DB
    log = AlertAndBriefing(type="briefing", content=briefing_txt, severity="info")
    db.add(log)
    db.commit()
    
    return {"briefing": briefing_txt, "timestamp": log.created_at}

@router.post("/post-match")
async def generate_report(
    db: Session = Depends(get_db),
    _ = Depends(require_role(["organizer"]))
):
    match = db.query(Match).first()
    nodes = db.query(DigitalTwinNode).all()
    incidents = db.query(Incident).all()
    
    summary = {
        "teams": f"{match.team_a} vs {match.team_b}" if match else "FIFA World Cup Fixture",
        "attendance": match.current_attendance if match else 82450,
        "peak_wait_minutes": max([n.queue_length_minutes for n in nodes]) if nodes else 15,
        "total_incidents": len(incidents)
    }
    
    report_md = await gemini_service.generate_post_match_report(summary)
    return {"report": report_md}
