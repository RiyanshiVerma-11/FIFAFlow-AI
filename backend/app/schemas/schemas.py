"""Pydantic request/response validation schemas for FIFAFlow AI.

Enforces strict input validation using ``Literal`` types for enumerated
fields (roles, severity levels, incident types) and ``Field`` constraints
for password strength, ensuring data integrity at the API boundary.
"""

from datetime import datetime
from typing import Dict, Any, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Authentication Schemas
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    """Base schema containing common user identity fields."""

    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration requests with password and role validation."""

    password: str = Field(..., min_length=8, max_length=128, description="Minimum 8 characters")
    role: Optional[Literal["fan", "volunteer", "staff", "organizer"]] = "fan"


class UserResponse(UserBase):
    """Schema for user data returned in API responses."""

    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token pair returned after successful authentication."""

    access_token: str
    refresh_token: str
    token_type: str
    role: str
    username: str


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""

    sub: Optional[str] = None
    type: Optional[str] = None


# ---------------------------------------------------------------------------
# Digital Twin Schemas
# ---------------------------------------------------------------------------

class DigitalTwinNodeBase(BaseModel):
    """Schema for creating or updating a digital-twin node."""

    type: str  # gate, concession, restroom, medical_point, transit_hub
    name: str
    location_json: Dict[str, Any]
    occupancy: int = Field(..., ge=0, le=100, description="Occupancy percentage 0-100")
    status: str
    queue_length_minutes: int = Field(..., ge=0)
    capacity_limit: int = Field(100, ge=1)


class DigitalTwinNodeResponse(DigitalTwinNodeBase):
    """Schema for digital-twin node data returned in API responses."""

    id: int

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Incident Schemas
# ---------------------------------------------------------------------------

class IncidentCreate(BaseModel):
    """Schema for reporting a new emergency incident with validated severity and type."""

    type: Literal["medical", "fire", "violence", "suspicious_object", "lost_child"] = Field(
        ..., description="Category of the emergency incident"
    )
    severity: Literal["Low", "Medium", "High", "Critical"] = Field(
        ..., description="Incident severity classification"
    )
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed incident description")
    location_json: Dict[str, Any]


class IncidentResponse(BaseModel):
    """Schema for incident data returned in API responses including AI analysis."""

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


# ---------------------------------------------------------------------------
# Volunteer Schemas
# ---------------------------------------------------------------------------

class VolunteerBase(BaseModel):
    """Base schema for volunteer shift information."""

    shift_start: datetime
    shift_end: datetime
    status: str
    assigned_zone: str
    location_json: Optional[Dict[str, Any]] = None


class VolunteerCreate(VolunteerBase):
    """Schema for creating a new volunteer shift assignment."""

    username: str  # maps to a user


class VolunteerResponse(VolunteerBase):
    """Schema for volunteer data returned in API responses."""

    id: int
    user: UserResponse

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Navigation / Route Schemas
# ---------------------------------------------------------------------------

class RouteQuery(BaseModel):
    """Schema for pathfinding requests with optional accessibility constraint."""

    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    require_accessible: Optional[bool] = False


class RouteNode(BaseModel):
    """Single waypoint in a calculated navigation path."""

    lat: float
    lng: float
    name: Optional[str] = None


class RouteResponse(BaseModel):
    """Calculated route with distance, time estimate, and safety advisory."""

    path: List[RouteNode]
    distance_meters: float
    estimated_minutes: float
    accessibility_flag: bool
    safety_advisory: Optional[str] = None


# ---------------------------------------------------------------------------
# Translation Schemas
# ---------------------------------------------------------------------------

class TranslationQuery(BaseModel):
    """Schema for text translation requests."""

    text: str = Field(..., min_length=1, max_length=5000)
    source_lang: str
    target_lang: str


class TranslationResponse(BaseModel):
    """Translated text with optional pronunciation guide."""

    translated_text: str
    pronunciation_text: Optional[str] = None


class TextToSpeechQuery(BaseModel):
    """Schema for text-to-speech synthesis requests."""

    text: str
    lang: str


# ---------------------------------------------------------------------------
# Copilot / What-If Schemas
# ---------------------------------------------------------------------------

class WhatIfQuery(BaseModel):
    """Schema for hypothetical scenario simulation requests."""

    scenario: str  # gate_3_close, metro_delay, rain, spectator_surge


class WhatIfResponse(BaseModel):
    """AI-generated impact analysis for a simulated scenario."""

    impact_description: str
    risk_level: str
    estimated_wait_time_impact_min: int
    volunteer_redistribution_recommendation: str
    suggested_reroute_nodes: List[str]
    confidence_score: int


class CopilotChatQuery(BaseModel):
    """Schema for interactive copilot chat queries."""

    message: str = Field(..., min_length=1, max_length=2000)


class CopilotChatResponse(BaseModel):
    """AI copilot response with suggested operational actions."""

    reply: str
    system_briefing: Optional[str] = None
    suggested_actions: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Sustainability Schemas
# ---------------------------------------------------------------------------

class SustainabilityResponse(BaseModel):
    """Time-series sustainability metrics record."""

    energy_kwh: float
    water_liters: float
    waste_kg: float
    carbon_kg: float
    ai_recommendation: str
    timestamp: datetime

    class Config:
        from_attributes = True
