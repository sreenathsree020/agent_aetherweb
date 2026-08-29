import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class LiveMonitorHub:
    """Supervisor Live Call Monitoring Hub supporting Listen, Whisper, and Barge-in."""

    def __init__(self):
        self._listeners: Dict[str, Set[WebSocket]] = {}
        self._whisperers: Dict[str, WebSocket] = {}

    async def connect_supervisor(self, session_id: str, ws: WebSocket):
        await ws.accept()
        self._listeners.setdefault(session_id, set()).add(ws)
        logger.info(f"🎧 Supervisor connected to session {session_id}")

    def disconnect_supervisor(self, session_id: str, ws: WebSocket):
        if session_id in self._listeners:
            self._listeners[session_id].discard(ws)
            if not self._listeners[session_id]:
                del self._listeners[session_id]

    async def broadcast_audio(self, session_id: str, pcm_chunk: bytes):
        """Broadcast live PCM audio frame to listening supervisor sockets."""
        if session_id in self._listeners:
            dead_sockets = set()
            for ws in self._listeners[session_id]:
                try:
                    await ws.send_bytes(pcm_chunk)
                except Exception:
                    dead_sockets.add(ws)
            for d in dead_sockets:
                self.disconnect_supervisor(session_id, d)

    async def broadcast_event(self, session_id: str, payload: dict):
        """Broadcast event payload (transcripts, tools, telemetry) to supervisors."""
        if session_id in self._listeners:
            dead_sockets = set()
            for ws in self._listeners[session_id]:
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead_sockets.add(ws)
            for d in dead_sockets:
                self.disconnect_supervisor(session_id, d)


# Global singleton
live_monitor = LiveMonitorHub()
