from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "fan"

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str
    username: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

# Digital Twin Schemas
class DigitalTwinNodeBase(BaseModel):
    type: str  # gate, concession, restroom, medical_point, transit_hub
    name: str
    location_json: Dict[str, Any]
    occupancy: int
    status: str
    queue_length_minutes: int
    capacity_limit: int

class DigitalTwinNodeResponse(DigitalTwinNodeBase):
    id: int

    class Config:
        from_attributes = True

# Incident Schemas
class IncidentCreate(BaseModel):
    type: str  # medical, fire, violence, suspicious_object, lost_child
    severity: str  # Low, Medium, High, Critical
    description: str
    location_json: Dict[str, Any]

class IncidentResponse(BaseModel):
    id: int
    type: str
    severity: str
    description: str
    status: str
    location_json: Dict[str, Any]
    reporter_id: Optional[int]
    assigned_responder_id: Optional[int]
    ai_response_recommendation: Optional[str]
    confidence_score: int
    reasoning: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Volunteer Schemas
class VolunteerBase(BaseModel):
    shift_start: datetime
    shift_end: datetime
    status: str
    assigned_zone: str
    location_json: Optional[Dict[str, Any]] = None

class VolunteerCreate(VolunteerBase):
    username: str  # maps to a user

class VolunteerResponse(VolunteerBase):
    id: int
    user: UserResponse

    class Config:
        from_attributes = True

# Route Navigation Schemas
class RouteQuery(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    require_accessible: Optional[bool] = False

class RouteNode(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None

class RouteResponse(BaseModel):
    path: List[RouteNode]
    distance_meters: float
    estimated_minutes: float
    accessibility_flag: bool
    safety_advisory: Optional[str] = None

# Translation Schemas
class TranslationQuery(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationResponse(BaseModel):
    translated_text: str
    pronunciation_text: Optional[str] = None

class TextToSpeechQuery(BaseModel):
    text: str
    lang: str

# Copilot Schemas
class WhatIfQuery(BaseModel):
    scenario: str  # gate_3_close, metro_delay, rain, spectator_surge

class WhatIfResponse(BaseModel):
    impact_description: str
    risk_level: str
    estimated_wait_time_impact_min: int
    volunteer_redistribution_recommendation: str
    suggested_reroute_nodes: List[str]
    confidence_score: int

class CopilotChatQuery(BaseModel):
    message: str

class CopilotChatResponse(BaseModel):
    reply: str
    system_briefing: Optional[str] = None
    suggested_actions: Optional[List[str]] = None

class SustainabilityResponse(BaseModel):
    energy_kwh: float
    water_liters: float
    waste_kg: float
    carbon_kg: float
    ai_recommendation: str
    timestamp: datetime

    class Config:
        from_attributes = True
