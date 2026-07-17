"""Redis Pub/Sub event broker with in-memory fallback.

Manages real-time event distribution across the platform using Redis
channels. Falls back to an in-memory asyncio queue when Redis is
unavailable or the ``redis`` package is not installed, ensuring the
digital-twin state synchronisation still operates in offline mode.
"""

import json
import logging
import asyncio
from typing import Any, Callable, Dict, List

from app.core.config import settings
from app.core.observability import SYSTEM_METRICS

# Try to import redis, but support full offline fallback when missing
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class RedisEventBroker:
    """Publish/subscribe event broker backed by Redis with in-memory fallback."""

    def __init__(self, redis_url: str) -> None:
        self.redis_url = redis_url
        self.client = None
        self.is_connected = False
        self._local_subscribers: List[Callable] = []
        self._local_queue: asyncio.Queue = asyncio.Queue()
        self._loop_task = None

    async def connect(self) -> None:
        """Establish connection to Redis or start the in-memory distributor."""
        if not REDIS_AVAILABLE:
            self.is_connected = False
            SYSTEM_METRICS["redis_status"] = "disabled"
            logger.info("Redis package not installed. Running in local in-memory mode.")
            self._loop_task = asyncio.create_task(self._in_memory_distributor())
            return

        try:
            self.client = aioredis.from_url(self.redis_url, decode_responses=True)
            await self.client.ping()
            self.is_connected = True
            SYSTEM_METRICS["redis_status"] = "connected"
            logger.info("Connected to Redis successfully. Event Engine active.")

            self._loop_task = asyncio.create_task(
                self.listen_redis_channels(["stadium:events", "stadium:sync"])
            )
        except Exception as e:
            self.is_connected = False
            SYSTEM_METRICS["redis_status"] = "disconnected"
            logger.warning("Could not connect to Redis: %s. Falling back to local in-memory mode.", str(e))
            self._loop_task = asyncio.create_task(self._in_memory_distributor())

    async def publish(self, channel: str, message: Dict[str, Any]) -> None:
        """Publish a message to a channel via Redis or the in-memory fallback queue."""
        payload = json.dumps(message)
        if self.is_connected and REDIS_AVAILABLE:
            try:
                await self.client.publish(channel, payload)
                logger.info("Published event to Redis channel '%s'", channel)
                return
            except Exception as e:
                logger.error("Failed to publish to Redis: %s. Using fallback channel distribution.", str(e))

        await self._local_queue.put((channel, payload))

    async def subscribe(self, callback: Callable) -> None:
        """Register a callback for all published events."""
        self._local_subscribers.append(callback)

    async def _in_memory_distributor(self) -> None:
        """Distribute queued events to local subscribers when Redis is unavailable."""
        logger.info("In-Memory Event Distributor loop started.")
        while True:
            try:
                channel, payload_str = await self._local_queue.get()
                payload = json.loads(payload_str)
                for cb in self._local_subscribers:
                    try:
                        if asyncio.iscoroutinefunction(cb):
                            await cb(channel, payload)
                        else:
                            cb(channel, payload)
                    except Exception as err:
                        logger.error("Error executing event subscription callback: %s", str(err))
                self._local_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in-memory distributor: %s", str(e))
                await asyncio.sleep(1)

    async def listen_redis_channels(self, channels: List[str]) -> None:
        """Listen for messages on the specified Redis Pub/Sub channels."""
        if not self.is_connected or not REDIS_AVAILABLE:
            return

        try:
            pubsub = self.client.pubsub()
            await pubsub.subscribe(*channels)
            logger.info("Subscribed to Redis channels: %s", channels)

            async for message in pubsub.listen():
                if message['type'] == 'message':
                    channel = message['channel']
                    payload = json.loads(message['data'])
                    for cb in self._local_subscribers:
                        try:
                            if asyncio.iscoroutinefunction(cb):
                                await cb(channel, payload)
                            else:
                                cb(channel, payload)
                        except Exception as err:
                            logger.error("Error in Redis callback: %s", str(err))
        except Exception as e:
            logger.error("Redis PubSub listener failed: %s", str(e))
            self.is_connected = False
            SYSTEM_METRICS["redis_status"] = "disconnected"


event_broker = RedisEventBroker(settings.REDIS_URL)
