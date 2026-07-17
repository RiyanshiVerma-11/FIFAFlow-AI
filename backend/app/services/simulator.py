import asyncio
import random
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import DigitalTwinNode, SustainabilityLog, AlertAndBriefing, Match
from app.core.event_engine import event_broker
from app.services.gemini import gemini_service
from app.core.observability import SYSTEM_METRICS

logger = logging.getLogger(__name__)

class Simulator:
    def __init__(self):
        self.is_running = False
        self._task = None
        self.iteration_count = 0

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("Simulation Engine started successfully.")

    def stop(self):
        if self.is_running:
            self.is_running = False
            if self._task:
                self._task.cancel()
            logger.info("Simulation Engine stopped.")

    async def _simulation_loop(self):
        # Allow the DB to spin up
        await asyncio.sleep(5)
        
        while self.is_running:
            db: Session = SessionLocal()
            try:
                # 1. Update Digital Twin Nodes occupancy randomly
                nodes = db.query(DigitalTwinNode).all()
                for node in nodes:
                    # Random fluctuation
                    change = random.randint(-5, 8)
                    node.occupancy = max(10, min(100, node.occupancy + change))
                    
                    # Update status depending on occupancy
                    if node.occupancy >= 90:
                        node.status = "congested"
                        node.queue_length_minutes = int(node.occupancy / 5) # ~18-20 mins
                        
                        # Generate Redis Event if it spikes
                        if random.random() < 0.3:  # avoid spamming
                            event_msg = {
                                "type": "node_surge",
                                "node_id": node.id,
                                "node_name": node.name,
                                "occupancy": node.occupancy,
                                "queue_length_minutes": node.queue_length_minutes,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                            await event_broker.publish("stadium:events", event_msg)
                    elif node.occupancy >= 60:
                        node.status = "active"
                        node.queue_length_minutes = int(node.occupancy / 10)
                    else:
                        node.status = "active"
                        node.queue_length_minutes = random.randint(1, 4)

                # 2. Update Match attendance & status
                match = db.query(Match).first()
                if match:
                    if match.status == "live":
                        # Fluctuates around capacity
                        match.current_attendance = max(78000, min(85000, match.current_attendance + random.randint(-100, 150)))
                        # Random score updates
                        if random.random() < 0.05:
                            goals_a, goals_b = map(int, match.score.split("-"))
                            if random.random() > 0.5:
                                goals_a += 1
                            else:
                                goals_b += 1
                            match.score = f"{goals_a}-{goals_b}"
                            await event_broker.publish("stadium:events", {
                                "type": "score_update",
                                "score": match.score,
                                "teams": f"{match.team_a} vs {match.team_b}"
                            })

                db.commit()

                # 3. Simulate Sustainability variables (every ~56 seconds)
                self.iteration_count += 1
                if self.iteration_count % 7 == 0:
                    last_log = db.query(SustainabilityLog).order_by(SustainabilityLog.timestamp.desc()).first()
                    energy = (last_log.energy_kwh + random.uniform(-10, 15)) if last_log else 12500.0
                    water = (last_log.water_liters + random.uniform(-50, 75)) if last_log else 45000.0
                    waste = (last_log.waste_kg + random.uniform(5, 20)) if last_log else 2300.0
                    carbon = energy * 0.42 # carbon multiplier

                    new_log = SustainabilityLog(
                        energy_kwh=energy,
                        water_liters=water,
                        waste_kg=waste,
                        carbon_kg=carbon,
                        ai_recommendation="Reduce stadium perimeter floodlights by 15% during non-match hours. Expected carbon drop: 4%."
                    )
                    db.add(new_log)
                    db.commit()

                # Broadcast digital twin update via WebSockets
                twin_update = {
                    "type": "digital_twin_sync",
                    "nodes": [
                        {
                            "id": n.id,
                            "name": n.name,
                            "type": n.type,
                            "status": n.status,
                            "occupancy": n.occupancy,
                            "queue_length_minutes": n.queue_length_minutes
                        } for n in nodes
                    ]
                }
                await event_broker.publish("stadium:sync", twin_update)

            except Exception as e:
                logger.error(f"Error in simulator loop execution: {str(e)}")
            finally:
                db.close()

            # Wait 8 seconds before next step (fast dashboard updates for hackathon demo)
            await asyncio.sleep(8)

# Initialize simulator instance
simulator = Simulator()
