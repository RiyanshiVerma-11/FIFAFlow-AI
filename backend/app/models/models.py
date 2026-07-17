"""SQLAlchemy ORM model definitions for FIFAFlow AI.

Each class maps to a database table and defines columns, relationships,
and default values used across the stadium operations platform.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """Platform user account with role-based access (organizer, volunteer, staff, fan)."""

    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    username: str = Column(String, unique=True, index=True, nullable=False)  # type: ignore
    email: str = Column(String, unique=True, index=True, nullable=False)  # type: ignore
    password_hash: str = Column(String, nullable=False)  # type: ignore
    role: str = Column(String, default="fan", nullable=False)  # type: ignore # organizer, volunteer, staff, fan
    created_at: datetime = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # type: ignore

    # Relationships
    volunteers = relationship("Volunteer", back_populates="user", cascade="all, delete-orphan")
    reported_incidents = relationship("Incident", back_populates="reporter", foreign_keys="[Incident.reporter_id]")
    assigned_incidents = relationship("Incident", back_populates="responder", foreign_keys="[Incident.assigned_responder_id]")


class Stadium(Base):
    """Physical venue with capacity and spatial layout metadata."""

    __tablename__ = "stadiums"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    name: str = Column(String, nullable=False, index=True)  # type: ignore
    location: str = Column(String, nullable=False)  # type: ignore
    capacity: int = Column(Integer, nullable=False)  # type: ignore
    layout_json: Optional[Dict[str, Any]] = Column(JSON, nullable=True)  # type: ignore # Zones layout, dimensions, gates coords

    # Relationships
    matches = relationship("Match", back_populates="stadium")


class Match(Base):
    """Scheduled or live match fixture with real-time attendance and score tracking."""

    __tablename__ = "matches"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    team_a: str = Column(String, nullable=False)  # type: ignore
    team_b: str = Column(String, nullable=False)  # type: ignore
    start_time: datetime = Column(DateTime, nullable=False)  # type: ignore
    stadium_id: int = Column(Integer, ForeignKey("stadiums.id"), nullable=False)  # type: ignore
    status: str = Column(String, default="scheduled")  # type: ignore # scheduled, live, completed
    current_attendance: int = Column(Integer, default=0)  # type: ignore
    score: str = Column(String, default="0-0")  # type: ignore
    weather: str = Column(String, default="Clear")  # type: ignore

    # Relationships
    stadium = relationship("Stadium", back_populates="matches")


class DigitalTwinNode(Base):
    """Virtual representation of a physical stadium node (gate, concession, restroom, etc.)."""

    __tablename__ = "digital_twin_nodes"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    type: str = Column(String, nullable=False)  # type: ignore # gate, concession, restroom, medical_point, transit_hub
    name: str = Column(String, nullable=False)  # type: ignore
    location_json: Dict[str, Any] = Column(JSON, nullable=False)  # type: ignore # {"lat": 1.23, "lng": 4.56, "zone": "Zone A"}
    occupancy: int = Column(Integer, default=0)  # type: ignore # percentage 0-100
    status: str = Column(String, default="active")  # type: ignore # active, congested, restricted, closed
    queue_length_minutes: int = Column(Integer, default=0)  # type: ignore
    capacity_limit: int = Column(Integer, default=100)  # type: ignore


class Incident(Base):
    """Emergency or safety incident reported within the stadium perimeter."""

    __tablename__ = "incidents"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    type: str = Column(String, nullable=False)  # type: ignore # medical, fire, violence, suspicious_object, lost_child
    severity: str = Column(String, nullable=False)  # type: ignore # Low, Medium, High, Critical
    description: str = Column(Text, nullable=False)  # type: ignore
    status: str = Column(String, default="pending")  # type: ignore # pending, active, resolved
    location_json: Dict[str, Any] = Column(JSON, nullable=False)  # type: ignore # {"lat": 1.23, "lng": 4.56}

    reporter_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True)  # type: ignore
    assigned_responder_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True)  # type: ignore

    ai_response_recommendation: Optional[str] = Column(Text, nullable=True)  # type: ignore
    confidence_score: int = Column(Integer, default=0)  # type: ignore
    reasoning: Optional[str] = Column(Text, nullable=True)  # type: ignore

    created_at: datetime = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # type: ignore

    # Relationships
    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    responder = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_responder_id])


class Volunteer(Base):
    """Volunteer shift assignment with zone allocation and location tracking."""

    __tablename__ = "volunteers"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)  # type: ignore
    shift_start: datetime = Column(DateTime, nullable=False)  # type: ignore
    shift_end: datetime = Column(DateTime, nullable=False)  # type: ignore
    status: str = Column(String, default="inactive")  # type: ignore # active, inactive, on_break
    assigned_zone: str = Column(String, nullable=False)  # type: ignore
    location_json: Optional[Dict[str, Any]] = Column(JSON, nullable=True)  # type: ignore # {"lat": 1.23, "lng": 4.56}

    # Relationships
    user = relationship("User", back_populates="volunteers")


class SustainabilityLog(Base):
    """Time-series record of stadium energy, water, waste, and carbon metrics."""

    __tablename__ = "sustainability_logs"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    timestamp: datetime = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # type: ignore
    energy_kwh: float = Column(Float, default=0.0)  # type: ignore
    water_liters: float = Column(Float, default=0.0)  # type: ignore
    waste_kg: float = Column(Float, default=0.0)  # type: ignore
    carbon_kg: float = Column(Float, default=0.0)  # type: ignore
    ai_recommendation: Optional[str] = Column(Text, nullable=True)  # type: ignore


class AlertAndBriefing(Base):
    """Operational briefing or system alert stored for the command center timeline."""

    __tablename__ = "alerts_and_briefings"

    id: int = Column(Integer, primary_key=True, index=True)  # type: ignore
    type: str = Column(String, nullable=False)  # type: ignore # briefing, copilot_alert
    content: str = Column(Text, nullable=False)  # type: ignore
    severity: str = Column(String, default="info")  # type: ignore # info, warning, critical
    created_at: datetime = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # type: ignore
