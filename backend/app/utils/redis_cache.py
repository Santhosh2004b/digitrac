import redis
import json
from typing import Optional, Any
from app.config import settings

class RedisCache:
    def __init__(self):
        self._disabled = False
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=0.5, socket_timeout=0.5)

    def set(self, key: str, value: Any, expire: int = 300):
        if self._disabled: return
        try:
            self.client.setex(key, expire, json.dumps(value))
        except redis.exceptions.RedisError:
            self._disabled = True # Disable on first error

    def get(self, key: str) -> Optional[Any]:
        if self._disabled: return None
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except redis.exceptions.RedisError:
            self._disabled = True
            return None

    def delete(self, key: str):
        if self._disabled: return
        try:
            self.client.delete(key)
        except redis.exceptions.RedisError:
            self._disabled = True

redis_cache = RedisCache()
