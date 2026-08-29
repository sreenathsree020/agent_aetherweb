from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.live_monitor import live_monitor

router = APIRouter(prefix="/monitor", tags=["monitor"])


@router.websocket("/live")
async def supervisor_live_monitor(
    websocket: WebSocket,
    session_id: str = Query("default"),
):
    """Supervisor WebSocket to listen, whisper, or barge into live telephony sessions."""
    await live_monitor.connect_supervisor(session_id, websocket)
    try:
        while True:
            data = await websocket.receive()
            if data.get("type") == "websocket.disconnect":
                break
    except WebSocketDisconnect:
        pass
    finally:
        live_monitor.disconnect_supervisor(session_id, websocket)
