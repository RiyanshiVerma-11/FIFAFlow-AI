import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.models.models import User, Stadium, Match, DigitalTwinNode, Volunteer, SustainabilityLog, AlertAndBriefing
from app.core.security import get_password_hash

logger = logging.getLogger("fifaflow_seeder")

def seed_database():
    """Initializes tables and populates base seed records for mock presentation mode."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if database already seeded
        if db.query(User).filter(User.username == "organizer").first():
            logger.info("Database already seeded.")
            return

        logger.info("Seeding initial database content...")
        
        # 1. Users
        organizer = User(
            username="organizer",
            email="organizer@fifa.org",
            password_hash=get_password_hash("organizer123"),
            role="organizer"
        )
        volunteer1 = User(
            username="volunteer1",
            email="vol1@fifaflow.com",
            password_hash=get_password_hash("volunteer123"),
            role="volunteer"
        )
        volunteer2 = User(
            username="volunteer2",
            email="vol2@fifaflow.com",
            password_hash=get_password_hash("volunteer123"),
            role="volunteer"
        )
        staff = User(
            username="staff1",
            email="staff1@stadium.org",
            password_hash=get_password_hash("staff123"),
            role="staff"
        )
        fan = User(
            username="fan1",
            email="fan1@stadium.org",
            password_hash=get_password_hash("fan123"),
            role="fan"
        )
        db.add_all([organizer, volunteer1, volunteer2, staff, fan])
        db.commit()

        # 2. Stadium
        stadium = Stadium(
            name="MetLife Stadium",
            location="East Rutherford, NJ, USA",
            capacity=82500,
            layout_json={
                "lat": 34.0522,
                "lng": -118.2437,
                "zones": ["Zone A", "Zone B", "Zone C", "VIP Zone"]
            }
        )
        db.add(stadium)
        db.commit()

        # 3. Match
        match = Match(
            team_a="USA",
            team_b="Mexico",
            start_time=datetime.utcnow() + timedelta(hours=2),
            stadium_id=stadium.id,
            status="live",
            current_attendance=79450,
            score="1-0",
            weather="Sunny, 24°C"
        )
        db.add(match)
        db.commit()

        # 4. Digital Twin Nodes (Gates, concessions, etc.)
        nodes = [
            DigitalTwinNode(type="gate", name="Gate 1", location_json={"lat": 34.0522, "lng": -118.2437}, occupancy=45, status="active", queue_length_minutes=3),
            DigitalTwinNode(type="gate", name="Gate 2", location_json={"lat": 34.0532, "lng": -118.2447}, occupancy=52, status="active", queue_length_minutes=4),
            DigitalTwinNode(type="gate", name="Gate 3 (Congested)", location_json={"lat": 34.0542, "lng": -118.2457}, occupancy=92, status="congested", queue_length_minutes=18),
            DigitalTwinNode(type="gate", name="Gate 4", location_json={"lat": 34.0552, "lng": -118.2467}, occupancy=61, status="active", queue_length_minutes=5),
            DigitalTwinNode(type="gate", name="Gate 5", location_json={"lat": 34.0562, "lng": -118.2477}, occupancy=35, status="active", queue_length_minutes=2),
            DigitalTwinNode(type="concession", name="Concessions Plaza", location_json={"lat": 34.0548, "lng": -118.2452}, occupancy=75, status="active", queue_length_minutes=8),
            DigitalTwinNode(type="restroom", name="Restrooms North", location_json={"lat": 34.0558, "lng": -118.2462}, occupancy=80, status="active", queue_length_minutes=6),
            DigitalTwinNode(type="medical_point", name="Medical Station 1", location_json={"lat": 34.0538, "lng": -118.2442}, occupancy=10, status="active", queue_length_minutes=0),
            DigitalTwinNode(type="transit_hub", name="Transport Terminal", location_json={"lat": 34.0512, "lng": -118.2427}, occupancy=58, status="active", queue_length_minutes=5)
        ]
        db.add_all(nodes)
        db.commit()

        # 5. Volunteers schedule
        vols = [
            Volunteer(user_id=volunteer1.id, shift_start=datetime.utcnow() - timedelta(hours=2), shift_end=datetime.utcnow() + timedelta(hours=4), status="active", assigned_zone="Zone A", location_json={"lat": 34.0522, "lng": -118.2437}),
            Volunteer(user_id=volunteer2.id, shift_start=datetime.utcnow() - timedelta(hours=1), shift_end=datetime.utcnow() + timedelta(hours=5), status="active", assigned_zone="Zone B", location_json={"lat": 34.0542, "lng": -118.2457})
        ]
        db.add_all(vols)
        db.commit()

        # 6. Sustainability baseline logs
        for i in range(12):
            log = SustainabilityLog(
                timestamp=datetime.utcnow() - timedelta(hours=12-i),
                energy_kwh=12000.0 + (i * 120) + random_fluctuation(-100, 200),
                water_liters=40000.0 + (i * 350) + random_fluctuation(-500, 1000),
                waste_kg=2000.0 + (i * 110) + random_fluctuation(-100, 300),
                carbon_kg=(12000.0 + (i * 120)) * 0.42,
                ai_recommendation="Optimize HVAC settings in Ring Section 3 to save 40 kWh per hour."
            )
            db.add(log)
        db.commit()

        # 7. Initial operational briefing
        brief = AlertAndBriefing(
            type="briefing",
            content="FIFA World Cup 2026 Aztec Arena Command Center active. Attendance: 79,450. Gate 3 queue is at 18 minutes (high density). Volunteers deployed to perimeter links.",
            severity="info"
        )
        db.add(brief)
        db.commit()

        logger.info("Database seeding successfully completed.")
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
    finally:
        db.close()

def random_fluctuation(low, high):
    import random
    return random.randint(low, high)
