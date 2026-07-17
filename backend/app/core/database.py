import time
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
# Resilient database fallback: If not in postgres mode or fails, use sqlite locally.
if not db_url.startswith("postgresql"):
    db_url = "sqlite:///./fifaflow.db"

# For SQLite, specify connect_args to allow multithreading
if db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    # Adding retry mechanism for PostgreSQL startup inside docker-compose
    retries = 5
    connected = False
    while retries > 0 and not connected:
        try:
            engine = create_engine(db_url, pool_pre_ping=True)
            # Try to connect
            conn = engine.connect()
            conn.close()
            connected = True
            logger.info("Connected to PostgreSQL successfully.")
        except Exception as e:
            retries -= 1
            logger.warning(f"Database connection failed. Retrying in 3 seconds... ({retries} retries left)")
            time.sleep(3)
    if not connected:
        logger.error("Could not connect to PostgreSQL. Falling back to local SQLite.")
        db_url = "sqlite:///./fifaflow.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
