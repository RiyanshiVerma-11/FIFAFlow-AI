"""Database engine, session factory, and declarative base.

Provides resilient connectivity with automatic PostgreSQL retry logic
and a transparent SQLite fallback for offline or local development.
"""

import logging
import time
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base class for all SQLAlchemy ORM models."""

    pass


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
            logger.warning(
                "Database connection failed. Retrying in 3 seconds... (%d retries left)", retries
            )
            time.sleep(3)
    if not connected:
        logger.error("Could not connect to PostgreSQL. Falling back to local SQLite.")
        db_url = "sqlite:///./fifaflow.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """Yield a scoped database session and ensure it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
