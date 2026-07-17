import json
import logging
import asyncio
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
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.client = None
        self.is_connected = False
        self._local_subscribers = []
        self._local_queue = asyncio.Queue()
        self._loop_task = None

    async def connect(self):
        if not REDIS_AVAILABLE:
            self.is_connected = False
            SYSTEM_METRICS["redis_status"] = "disabled"
            logger.info("Redis package not installed. Running in local in-memory mode.")
            self._loop_task = asyncio.create_task(self._in_memory_distributor())
            return

        try:
            # Attempt to connect to Redis
            self.client = aioredis.from_url(self.redis_url, decode_responses=True)
            # Verify connectivity via ping
            await self.client.ping()
            self.is_connected = True
            SYSTEM_METRICS["redis_status"] = "connected"
            logger.info("Connected to Redis successfully. Event Engine active.")
            
            # Start pub/sub listener loop in background for channels
            self._loop_task = asyncio.create_task(self.listen_redis_channels(["stadium:events", "stadium:sync"]))
        except Exception as e:
            self.is_connected = False
            SYSTEM_METRICS["redis_status"] = "disconnected"
            logger.warning(f"Could not connect to Redis: {str(e)}. Falling back to local in-memory mode.")
            self._loop_task = asyncio.create_task(self._in_memory_distributor())

    async def publish(self, channel: str, message: dict):
        payload = json.dumps(message)
        if self.is_connected and REDIS_AVAILABLE:
            try:
                await self.client.publish(channel, payload)
                logger.info(f"Published event to Redis channel '{channel}'")
                return
            except Exception as e:
                logger.error(f"Failed to publish to Redis: {str(e)}. Using fallback channel distribution.")
        
        # Fallback in-memory distribution queue
        await self._local_queue.put((channel, payload))

    async def subscribe(self, callback):
        """Register a callback for all published events."""
        self._local_subscribers.append(callback)

    async def _in_memory_distributor(self):
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
                        logger.error(f"Error executing event subscription callback: {str(err)}")
                self._local_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in-memory distributor: {str(e)}")
                await asyncio.sleep(1)

    async def listen_redis_channels(self, channels: list):
        # Skip listening if Redis is disabled or not available
        if not self.is_connected or not REDIS_AVAILABLE:
            return
        
        try:
            pubsub = self.client.pubsub()
            await pubsub.subscribe(*channels)
            logger.info(f"Subscribed to Redis channels: {channels}")
            
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
                            logger.error(f"Error in Redis callback: {str(err)}")
        except Exception as e:
            logger.error(f"Redis PubSub listener failed: {str(e)}")
            self.is_connected = False
            SYSTEM_METRICS["redis_status"] = "disconnected"

event_broker = RedisEventBroker(settings.REDIS_URL)
