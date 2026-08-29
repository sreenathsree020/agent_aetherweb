import os
import json
import base64
import logging
import audioop
import asyncio
import time
from typing import Awaitable, Callable, Optional, Dict, Any

from app.services.voice_agent import VoiceAgent
from app.services.session_manager import SessionManager
from app.core.config import settings

logger = logging.getLogger(__name__)


class ExotelHandler:
    def __init__(self, voice_agent: VoiceAgent, session_manager: SessionManager):
        self.voice_agent = voice_agent
        self.session_manager = session_manager
        self._is_speaking = False

    def _get_host(self) -> str:
        url = settings.KOYEB_APP_URL or "localhost:8000"
        return url.replace("https://", "").replace("http://", "").strip("/")

    # ---------- Gather Method (HTTP Webhook / Passthru) ----------
    def incoming_call_gather(self, call_sid: str) -> str:
        koyeb_url = self._get_host()
        greeting = "Hello! Welcome to our AI support. How can I help you today?"
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Response>\n'
            f'    <Say>{greeting}</Say>\n'
            f'    <Gather action="https://{koyeb_url}/api/exotel/gather-response?call_sid={call_sid}" method="POST" input="speech" timeout="5">\n'
            '    </Gather>\n'
            f'    <Redirect>https://{koyeb_url}/api/exotel/incoming?call_sid={call_sid}</Redirect>\n'
            '</Response>'
        )

    async def gather_response(self, call_sid: str, speech_result: str, tenant_id: str = "default") -> str:
        koyeb_url = self._get_host()
        session = self.session_manager.get_session(call_sid, tenant_id) or {}
        history = session.get("conversation", [])
        context = session.get("data", {})

        if speech_result and speech_result.strip():
            logger.info(f"[GATHER] Call {call_sid} - Customer speech: \"{speech_result}\"")
            ai_text = await self.voice_agent.generate_response(
                user_input=speech_result,
                session_id=call_sid,
                conversation_history=history,
                tenant_id=tenant_id,
                call_context=context,
                on_tool_called=lambda tool, args, res: self.session_manager.record_tool_call(call_sid, tool, args, res, tenant_id)
            )
            self.session_manager.add_conversation_turn(call_sid, speech_result, ai_text, tenant_id)
            say_text = ai_text
        else:
            say_text = "I didn't quite catch that. Could you please repeat your question?"

        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Response>\n'
            f'    <Say>{say_text}</Say>\n'
            f'    <Gather action="https://{koyeb_url}/api/exotel/gather-response?call_sid={call_sid}" method="POST" input="speech" timeout="5">\n'
            '    </Gather>\n'
            f'    <Redirect>https://{koyeb_url}/api/exotel/incoming?call_sid={call_sid}</Redirect>\n'
            '</Response>'
        )

    # ---------- Media Streams Method (WebSocket Real-Time Voice) ----------
    def incoming_call_stream(self, call_sid: str) -> str:
        koyeb_url = self._get_host()
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Response>\n'
            f'    <Stream url="wss://{koyeb_url}/ws/exotel-stream?callSid={call_sid}" />\n'
            '</Response>'
        )

    async def send_audio_chunks(self, websocket, stream_sid: str, audio_bytes: bytes, audio_format: str = "mulaw"):
        if not audio_bytes or not stream_sid:
            return

        self._is_speaking = True
        try:
            chunk_size = 640 if audio_format == "pcm8" else 320
            for i in range(0, len(audio_bytes), chunk_size):
                chunk = audio_bytes[i:i + chunk_size]
                payload = base64.b64encode(chunk).decode("utf-8")
                msg = {
                    "event": "media",
                    "stream_sid": stream_sid,
                    "streamSid": stream_sid,
                    "media": {"payload": payload}
                }
                await websocket.send_text(json.dumps(msg))
                await asyncio.sleep(0.038)
        except Exception as e:
            logger.error(f"[MEDIA_OUT] Error sending audio chunks: {e}")
        finally:
            await asyncio.sleep(0.15)
            self._is_speaking = False

    async def process_media_stream(self, websocket, call_sid: str, tenant_id: str = "default"):
        await websocket.accept()
        logger.info(f"[WS] WebSocket connected for call SID: {call_sid} (tenant: {tenant_id})")

        stream_sid = None
        audio_buffer = b""
        audio_format = "mulaw"
        speech_started = False
        silence_frames = 0
        SILENCE_THRESHOLD = 25
        ENERGY_THRESHOLD = 250
        BARGE_IN_THRESHOLD = 800
        greeting_sent = False
        is_speaking = False
        playback_task: Optional[asyncio.Task] = None
        utterance_task: Optional[asyncio.Task] = None

        async def cancel_task(task: Optional[asyncio.Task], label: str):
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        async def start_playback(audio_bytes: bytes):
            nonlocal is_speaking, playback_task
            await cancel_task(playback_task, "MEDIA_OUT")
            curr_sid = stream_sid
            curr_fmt = audio_format

            async def run_playback():
                nonlocal is_speaking
                is_speaking = True
                try:
                    await self.send_audio_chunks(websocket, curr_sid or "", audio_bytes, curr_fmt)
                finally:
                    is_speaking = False

            playback_task = asyncio.create_task(run_playback())

        async def send_greeting_if_needed():
            nonlocal greeting_sent, stream_sid
            if not stream_sid:
                return
            if not greeting_sent:
                greeting_sent = True
                greeting_text = await self.voice_agent.generate_greeting()
                audio_greeting = await self.voice_agent.text_to_speech(greeting_text, format_type=audio_format)
                if audio_greeting:
                    await start_playback(audio_greeting)

        try:
            while True:
                message = await websocket.receive_text()
                data = json.loads(message)
                event = data.get("event")

                start_data = data.get("start", {})
                media_format = start_data.get("media_format") or data.get("media_format") or {}
                bit_rate = str(media_format.get("bit_rate", "")).lower()
                sample_rate = str(media_format.get("sample_rate", ""))
                if sample_rate == "8000" and "128" in bit_rate:
                    audio_format = "pcm8"

                incoming_sid = (
                    data.get("streamSid") or data.get("stream_sid")
                    or start_data.get("streamSid") or start_data.get("stream_sid")
                )
                if incoming_sid:
                    stream_sid = incoming_sid

                incoming_call_sid = (
                    data.get("callSid") or data.get("call_sid")
                    or start_data.get("callSid") or start_data.get("call_sid")
                )
                if incoming_call_sid and incoming_call_sid != "unknown":
                    call_sid = incoming_call_sid

                if event == "connected":
                    await send_greeting_if_needed()

                elif event == "start":
                    if not self.session_manager.get_session(call_sid, tenant_id):
                        self.session_manager.create_session(call_sid, tenant_id=tenant_id)
                    await send_greeting_if_needed()

                elif event == "media":
                    media_obj = data.get("media", {})
                    payload = media_obj.get("payload", "")
                    if not payload:
                        continue

                    if not greeting_sent:
                        await send_greeting_if_needed()

                    try:
                        audio_chunk = base64.b64decode(payload)
                        pcm_chunk = audio_chunk if audio_format == "pcm8" else audioop.ulaw2lin(audio_chunk, 2)
                    except Exception:
                        continue

                    energy = self._audio_energy(pcm_chunk)

                    if is_speaking:
                        if energy < BARGE_IN_THRESHOLD:
                            audio_buffer = b""
                            speech_started = False
                            silence_frames = 0
                            continue
                        # Barge-in
                        logger.info(f"[BARGE_IN] Interrupted playback (energy={energy:.0f})")
                        await cancel_task(playback_task, "MEDIA_OUT")
                        speech_started = True
                        audio_buffer = audio_chunk
                        silence_frames = 0
                        continue

                    if energy > ENERGY_THRESHOLD:
                        if not speech_started:
                            speech_started = True
                            audio_buffer = audio_chunk
                        else:
                            audio_buffer += audio_chunk
                        silence_frames = 0
                    else:
                        if speech_started:
                            audio_buffer += audio_chunk
                            silence_frames += 1

                            if silence_frames >= SILENCE_THRESHOLD:
                                speech_started = False
                                silence_frames = 0
                                if len(audio_buffer) >= 1600:
                                    utterance = audio_buffer
                                    audio_buffer = b""
                                    await cancel_task(utterance_task, "PIPELINE")
                                    utterance_task = asyncio.create_task(self._handle_user_utterance(
                                        websocket, stream_sid or "", call_sid, utterance, audio_format, start_playback, tenant_id
                                    ))
                                else:
                                    audio_buffer = b""

                elif event == "stop":
                    break

        except Exception as e:
            logger.error(f"[WS] Error in session: {e}")
        finally:
            await cancel_task(playback_task, "MEDIA_OUT")
            await cancel_task(utterance_task, "PIPELINE")
            self.session_manager.end_session(call_sid, tenant_id)
            self._is_speaking = False
            try:
                await websocket.close()
            except Exception:
                pass

    async def _handle_user_utterance(
        self,
        websocket,
        stream_sid: str,
        call_sid: str,
        audio_bytes: bytes,
        audio_format: str,
        play_audio: Optional[Callable[[bytes], Awaitable[None]]] = None,
        tenant_id: str = "default"
    ):
        try:
            # 1. STT
            text = await self.voice_agent.speech_to_text(
                audio_bytes,
                is_mulaw=(audio_format != "pcm8"),
                sample_rate=8000,
            )
            if not text or not text.strip():
                return

            logger.info(f"🗣️ [CALLER]: \"{text}\"")

            # 2. LLM response with session history & addon tools
            session = self.session_manager.get_session(call_sid, tenant_id) or {}
            history = session.get("conversation", [])
            context = session.get("data", {})

            ai_text = await self.voice_agent.generate_response(
                user_input=text,
                session_id=call_sid,
                conversation_history=history,
                tenant_id=tenant_id,
                call_context=context,
                on_tool_called=lambda tool, args, res: self.session_manager.record_tool_call(call_sid, tool, args, res, tenant_id)
            )
            self.session_manager.add_conversation_turn(call_sid, text, ai_text, tenant_id)
            logger.info(f"🤖 [AI AGENT]: \"{ai_text}\"")

            # 3. TTS
            audio_resp = await self.voice_agent.text_to_speech(ai_text, format_type=audio_format)
            if audio_resp:
                if play_audio:
                    await play_audio(audio_resp)
                else:
                    await self.send_audio_chunks(websocket, stream_sid, audio_resp, audio_format)
        except Exception as e:
            logger.error(f"[PIPELINE] Error handling utterance: {e}", exc_info=True)

    def _audio_energy(self, pcm_bytes: bytes) -> float:
        try:
            return float(audioop.rms(pcm_bytes, 2))
        except Exception:
            return 0.0
