from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="fan", nullable=False)  # organizer, volunteer, staff, fan
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    volunteers = relationship("Volunteer", back_populates="user", cascade="all, delete-orphan")
    reported_incidents = relationship("Incident", back_populates="reporter", foreign_keys="[Incident.reporter_id]")
    assigned_incidents = relationship("Incident", back_populates="responder", foreign_keys="[Incident.assigned_responder_id]")

class Stadium(Base):
    __tablename__ = "stadiums"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    layout_json = Column(JSON, nullable=True)  # Zones layout, dimensions, gates coords

    # Relationships
    matches = relationship("Match", back_populates="stadium")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    team_a = Column(String, nullable=False)
    team_b = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    stadium_id = Column(Integer, ForeignKey("stadiums.id"), nullable=False)
    status = Column(String, default="scheduled")  # scheduled, live, completed
    current_attendance = Column(Integer, default=0)
    score = Column(String, default="0-0")
    weather = Column(String, default="Clear")

    # Relationships
    stadium = relationship("Stadium", back_populates="matches")

class DigitalTwinNode(Base):
    __tablename__ = "digital_twin_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # gate, concession, restroom, medical_point, transit_hub
    name = Column(String, nullable=False)
    location_json = Column(JSON, nullable=False)  # {"lat": 1.23, "lng": 4.56, "zone": "Zone A"}
    occupancy = Column(Integer, default=0)  # percentage 0-100
    status = Column(String, default="active")  # active, congested, restricted, closed
    queue_length_minutes = Column(Integer, default=0)
    capacity_limit = Column(Integer, default=100)

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # medical, fire, violence, suspicious_object, lost_child
    severity = Column(String, nullable=False)  # Low, Medium, High, Critical
    description = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, active, resolved
    location_json = Column(JSON, nullable=False)  # {"lat": 1.23, "lng": 4.56}
    
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_responder_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    ai_response_recommendation = Column(Text, nullable=True)
    confidence_score = Column(Integer, default=0)
    reasoning = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    responder = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_responder_id])

class Volunteer(Base):
    __tablename__ = "volunteers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_start = Column(DateTime, nullable=False)
    shift_end = Column(DateTime, nullable=False)
    status = Column(String, default="inactive")  # active, inactive, on_break
    assigned_zone = Column(String, nullable=False)
    location_json = Column(JSON, nullable=True)  # {"lat": 1.23, "lng": 4.56}

    # Relationships
    user = relationship("User", back_populates="volunteers")

class SustainabilityLog(Base):
    __tablename__ = "sustainability_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    energy_kwh = Column(Float, default=0.0)
    water_liters = Column(Float, default=0.0)
    waste_kg = Column(Float, default=0.0)
    carbon_kg = Column(Float, default=0.0)
    ai_recommendation = Column(Text, nullable=True)

class AlertAndBriefing(Base):
    __tablename__ = "alerts_and_briefings"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # briefing, copilot_alert
    content = Column(Text, nullable=False)
    severity = Column(String, default="info")  # info, warning, critical
    created_at = Column(DateTime, default=datetime.utcnow)
