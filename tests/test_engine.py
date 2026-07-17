import pytest
from app.services.route_optimizer import route_optimizer
from app.services.gemini import gemini_service

def test_route_optimizer_basic():
    # Route from Gate 1 to Restrooms North
    route_data = route_optimizer.find_path(
        start_lat=34.0522, 
        start_lng=-118.2437, 
        end_lat=34.0558, 
        end_lng=-118.2462, 
        require_accessible=False
    )
    
    assert "path" in route_data
    assert len(route_data["path"]) > 0
    assert route_data["distance_meters"] > 0
    assert route_data["estimated_minutes"] > 0

def test_route_optimizer_accessibility():
    # Route from Gate 1 (wheelchair-friendly) to Concessions Plaza
    # Calculates a path that keeps accessibility active
    route_accessible = route_optimizer.find_path(
        start_lat=34.0522, 
        start_lng=-118.2437, # Coordinates of Gate 1
        end_lat=34.0548, 
        end_lng=-118.2452, # Concessions Plaza
        require_accessible=True
    )
    
    # Must flag accessibility as True
    assert route_accessible["accessibility_flag"] is True

@pytest.mark.asyncio
async def test_gemini_fallback():
    # If API key is missing or call fails, it should gracefully return rule-based fallback recommendations
    analysis = await gemini_service.analyze_incident(
        type="medical", 
        severity="High", 
        description="Spectator collapsed in Row C"
    )
    
    assert "confidence_score" in analysis
    assert "action_recommendation" in analysis
    assert "reasoning" in analysis
    assert analysis["confidence_score"] > 0
