import redis
import os
import json
from datetime import datetime
import logging
from typing import Optional, Dict, Any, List

from app.core.config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.timeout = settings.SESSION_TIMEOUT
        self._memory_store: Dict[str, Dict[str, Any]] = {}
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=2.0,
                socket_timeout=2.0
            )
        except Exception as e:
            logger.warning(f"Redis initialization failed: {e}. In-memory fallback will be used.")
            self.redis_client = None

    def _key(self, session_id: str, tenant_id: str = "default") -> str:
        return f"tenant:{tenant_id}:session:{session_id}"

    def create_session(self, session_id: str, data: Optional[dict] = None, tenant_id: str = "default") -> dict:
        session = {
            "session_id": session_id,
            "tenant_id": tenant_id,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "conversation": [],
            "tools_used": [],
            "status": "active",
            "data": data or {}
        }
        self.save(session_id, session, tenant_id)
        return session

    def get_session(self, session_id: str, tenant_id: str = "default") -> Optional[dict]:
        if self.redis_client:
            try:
                raw = self.redis_client.get(self._key(session_id, tenant_id))
                if raw:
                    return json.loads(raw)
            except Exception as e:
                logger.warning(f"Redis get error: {e}")
        return self._memory_store.get(session_id)

    def save(self, session_id: str, session: dict, tenant_id: str = "default") -> None:
        session["last_activity"] = datetime.now().isoformat()
        self._memory_store[session_id] = session
        if self.redis_client:
            try:
                self.redis_client.setex(
                    self._key(session_id, tenant_id),
                    self.timeout,
                    json.dumps(session)
                )
            except Exception as e:
                logger.warning(f"Redis save error: {e}")

    def add_conversation_turn(
        self,
        session_id: str,
        customer_text: str,
        agent_response: str,
        tenant_id: str = "default"
    ) -> None:
        session = self.get_session(session_id, tenant_id) or self.create_session(session_id, tenant_id=tenant_id)
        session.setdefault("conversation", []).append({
            "timestamp": datetime.now().isoformat(),
            "customer": customer_text,
            "agent": agent_response
        })
        # Keep last 50 turns
        session["conversation"] = session["conversation"][-50:]
        self.save(session_id, session, tenant_id)

    def record_tool_call(
        self,
        session_id: str,
        tool_name: str,
        arguments: dict,
        result: dict,
        tenant_id: str = "default"
    ) -> None:
        session = self.get_session(session_id, tenant_id)
        if session:
            session.setdefault("tools_used", []).append({
                "timestamp": datetime.now().isoformat(),
                "tool": tool_name,
                "arguments": arguments,
                "result": result
            })
            self.save(session_id, session, tenant_id)

    def end_session(self, session_id: str, tenant_id: str = "default") -> None:
        session = self.get_session(session_id, tenant_id)
        if session:
            session["status"] = "ended"
            session["ended_at"] = datetime.now().isoformat()
            self.save(session_id, session, tenant_id)
            if self.redis_client:
                try:
                    self.redis_client.delete(self._key(session_id, tenant_id))
                except Exception as e:
                    logger.warning(f"Redis delete error: {e}")
            self._memory_store.pop(session_id, None)

    def active_count(self) -> int:
        return sum(1 for s in self._memory_store.values() if s.get("status") == "active")

    def get_all_recent_sessions(self) -> List[dict]:
        return list(self._memory_store.values())
