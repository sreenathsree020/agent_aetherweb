import os
import logging
import uuid
import asyncio
import json
import audioop
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import HTMLResponse, Response, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.addons.runner import AddonRunner
from app.services.voice_agent import VoiceAgent
from app.services.session_manager import SessionManager
from app.services.exotel_handler import ExotelHandler

from app.api.v1.addons import router as addons_router
from app.api.v1.workflows import router as workflows_router
from app.api.v1.calls import router as calls_router
from app.api.v1.oauth import router as oauth_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.rag import router as rag_router
from app.api.v1.campaigns import router as campaigns_router
from app.api.v1.monitor import router as monitor_router
from app.api.v1.billing import router as billing_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("voice_agent_app")

# Global singletons
addon_runner = AddonRunner()
voice_agent = VoiceAgent(addon_runner=addon_runner)
session_manager = SessionManager()
exotel_handler = ExotelHandler(voice_agent, session_manager)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database & checking environment...")
    settings.validate()
    await init_db()
    # Preload default addons
    await addon_runner.load_tenant_addons("default")
    yield
    # Shutdown
    await voice_agent.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(addons_router, prefix="/api/v1")
app.include_router(workflows_router, prefix="/api/v1")
app.include_router(calls_router, prefix="/api/v1")
app.include_router(oauth_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(rag_router, prefix="/api/v1")
app.include_router(campaigns_router, prefix="/api/v1")
app.include_router(monitor_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")

# Mount static files if present
static_dir = "static" if os.path.exists("static") else ("backend/static" if os.path.exists("backend/static") else None)
if static_dir:
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount built React frontend if dist exists
dist_assets = None
for p in ["frontend/dist/assets", "../frontend/dist/assets", "backend/../frontend/dist/assets"]:
    if os.path.exists(p):
        dist_assets = p
        break
if dist_assets:
    app.mount("/assets", StaticFiles(directory=dist_assets), name="frontend-assets")


async def extract_params(request: Request) -> dict:
    params = dict(request.query_params)
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
            if isinstance(body, dict):
                params.update(body)
        elif "form" in content_type:
            form = await request.form()
            params.update(dict(form))
    except Exception:
        pass
    return params


# ----------------------- Root & Health -----------------------
@app.get("/")
async def root():
    # Prefer React build if present, else fallback to static/index.html
    for dist_index in ["frontend/dist/index.html", "../frontend/dist/index.html", "backend/../frontend/dist/index.html"]:
        if os.path.exists(dist_index):
            return FileResponse(dist_index)
    for st_index in ["static/index.html", "backend/static/index.html"]:
        if os.path.exists(st_index):
            with open(st_index, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
    return {"status": "online", "service": settings.PROJECT_NAME}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "active_sessions": session_manager.active_count(),
        "stt_provider": settings.STT_PROVIDER,
        "tts_provider": settings.TTS_PROVIDER,
        "deepgram_configured": bool(settings.DEEPGRAM_API_KEY and not settings.DEEPGRAM_API_KEY.startswith("your_")),
        "azure_configured": bool(settings.AZURE_SPEECH_KEY and not settings.AZURE_SPEECH_KEY.startswith("your_")),
        "exotel_configured": bool(settings.EXOTEL_ACCOUNT_SID and settings.EXOTEL_API_KEY),
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY and not settings.OPENROUTER_API_KEY.startswith("your_")),
        "openrouter_model": settings.OPENROUTER_MODEL,
        "streaming_mode": settings.EXOTEL_USE_STREAM,
        "addons_active": len(await addon_runner.get_openai_tools_for_tenant("default"))
    }


# ----------------------- Exotel Telephony Endpoints -----------------------
@app.api_route("/api/exotel/incoming", methods=["GET", "POST"])
@app.api_route("/api/exotel/passthru", methods=["GET", "POST"])
async def exotel_incoming(request: Request):
    params = await extract_params(request)
    call_sid = params.get("CallSid") or params.get("CallUUID") or params.get("Sid") or str(uuid.uuid4())
    from_number = params.get("From") or params.get("Caller") or params.get("CallFrom") or "unknown"
    to_number = params.get("To") or params.get("CallTo") or "unknown"

    logger.info(f"📞 [INCOMING CALL] From={from_number} | To={to_number} | CallSid={call_sid}")

    if not session_manager.get_session(call_sid):
        session_manager.create_session(call_sid, {"from": from_number, "to": to_number, "caller": from_number})

    if settings.EXOTEL_USE_STREAM:
        exoml = exotel_handler.incoming_call_stream(call_sid)
    else:
        exoml = exotel_handler.incoming_call_gather(call_sid)

    return Response(content=exoml, media_type="application/xml")


@app.api_route("/api/exotel/gather-response", methods=["GET", "POST"])
async def exotel_gather_response(request: Request):
    params = await extract_params(request)
    call_sid = params.get("call_sid") or params.get("CallSid") or params.get("CallUUID") or "default"
    speech_result = params.get("SpeechResult") or params.get("Digits") or ""
    exoml = await exotel_handler.gather_response(call_sid, speech_result)
    return Response(content=exoml, media_type="application/xml")


@app.api_route("/api/exotel/status", methods=["GET", "POST"])
async def exotel_status_callback(request: Request):
    params = await extract_params(request)
    call_sid = params.get("CallSid") or params.get("CallUUID")
    status = params.get("Status") or params.get("CallStatus") or "unknown"
    logger.info(f"ℹ️ [STATUS CALLBACK] CallSid={call_sid} | Status={status}")

    if status in ["completed", "failed", "busy", "no-answer", "canceled"] and call_sid:
        session_manager.end_session(call_sid)

    return JSONResponse({"status": "received"})


# ----------------------- Exotel WebSocket Telephony Stream -----------------------
@app.websocket("/ws/exotel-stream")
@app.websocket("/ws/media")
@app.websocket("/ws/audio")
@app.websocket("/ws/stream")
async def exotel_media_stream_ws(websocket: WebSocket):
    call_sid = websocket.query_params.get("callSid") or websocket.query_params.get("call_sid") or "unknown"
    await exotel_handler.process_media_stream(websocket, call_sid)


# ----------------------- Browser WebSocket Endpoint -----------------------
@app.websocket("/ws/browser")
async def browser_voice(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    session_manager.create_session(session_id, {"caller": "+1-800-DEMO-CALLER", "caller_phone": "+1-800-DEMO-CALLER"})
    logger.info(f"🌐 [BROWSER] Connected: {session_id}")

    try:
        greeting = await voice_agent.generate_greeting()
        await websocket.send_json({"type": "greeting", "text": greeting})
        audio_greeting = await voice_agent.text_to_speech(greeting, format_type="pcm")
        if audio_greeting:
            await websocket.send_bytes(audio_greeting)

        pcm_audio_buffer = b""
        speech_started = False
        silence_chunks = 0
        energy_threshold = 500
        silence_chunk_limit = 3
        min_audio_bytes = 16000

        while True:
            data = await websocket.receive()
            if data.get("type") == "websocket.disconnect":
                break

            if "bytes" in data and data["bytes"]:
                pcm_chunk = data["bytes"]
                try:
                    energy = audioop.rms(pcm_chunk, 2)
                except Exception:
                    continue

                if energy > energy_threshold:
                    if not speech_started:
                        speech_started = True
                        pcm_audio_buffer = pcm_chunk
                    else:
                        pcm_audio_buffer += pcm_chunk
                    silence_chunks = 0
                    continue

                if speech_started:
                    pcm_audio_buffer += pcm_chunk
                    silence_chunks += 1
                    if silence_chunks < silence_chunk_limit:
                        continue

                    utterance = pcm_audio_buffer
                    pcm_audio_buffer = b""
                    speech_started = False
                    silence_chunks = 0

                    if len(utterance) < min_audio_bytes:
                        continue

                    text = await voice_agent.speech_to_text(utterance, is_mulaw=False)
                    if not text:
                        continue

                    await websocket.send_json({"type": "transcript", "speaker": "user", "text": text})
                    session = session_manager.get_session(session_id) or {}
                    history = session.get("conversation", [])
                    context = session.get("data", {})

                    def on_tool(tool, args, res):
                        session_manager.record_tool_call(session_id, tool, args, res)
                        asyncio.create_task(websocket.send_json({
                            "type": "tool_call",
                            "tool": tool,
                            "arguments": args,
                            "result": res
                        }))

                    ai_text = await voice_agent.generate_response(
                        user_input=text,
                        session_id=session_id,
                        conversation_history=history,
                        tenant_id="default",
                        call_context=context,
                        on_tool_called=on_tool
                    )
                    session_manager.add_conversation_turn(session_id, text, ai_text)
                    await websocket.send_json({"type": "transcript", "speaker": "ai", "text": ai_text})

                    audio_resp = await voice_agent.text_to_speech(ai_text, format_type="pcm")
                    if audio_resp:
                        await websocket.send_bytes(audio_resp)

            elif "text" in data and data["text"]:
                try:
                    msg = json.loads(data["text"])
                    if msg.get("type") == "end":
                        break
                    if msg.get("type") == "text_message":
                        text = str(msg.get("message", "")).strip()
                        if not text:
                            continue

                        session = session_manager.get_session(session_id) or {}
                        history = session.get("conversation", [])
                        context = session.get("data", {})

                        def on_tool(tool, args, res):
                            session_manager.record_tool_call(session_id, tool, args, res)
                            asyncio.create_task(websocket.send_json({
                                "type": "tool_call",
                                "tool": tool,
                                "arguments": args,
                                "result": res
                            }))

                        ai_text = await voice_agent.generate_response(
                            user_input=text,
                            session_id=session_id,
                            conversation_history=history,
                            tenant_id="default",
                            call_context=context,
                            on_tool_called=on_tool
                        )
                        session_manager.add_conversation_turn(session_id, text, ai_text)
                        await websocket.send_json({"type": "transcript", "speaker": "ai", "text": ai_text})

                        audio_resp = await voice_agent.text_to_speech(ai_text, format_type="pcm")
                        if audio_resp:
                            await websocket.send_bytes(audio_resp)
                except Exception:
                    pass

    except WebSocketDisconnect:
        logger.info(f"🌐 [BROWSER] Disconnected: {session_id}")
    finally:
        session_manager.end_session(session_id)


# ----------------------- Session APIs -----------------------
@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.post("/api/session/{session_id}/end")
async def end_session_api(session_id: str):
    session_manager.end_session(session_id)
    return {"status": "ended"}
