import os
import json
import base64
import logging
import audioop
import asyncio
import time
from typing import Awaitable, Callable, Optional
from voice_agent import VoiceAgent
from session_manager import SessionManager
from config import Config

logger = logging.getLogger(__name__)


class ExotelHandler:
    def __init__(self, voice_agent: VoiceAgent, session_manager: SessionManager):
        self.voice_agent = voice_agent
        self.session_manager = session_manager
        self._is_speaking = False

    def _get_host(self) -> str:
        url = Config.KOYEB_APP_URL or "localhost:8000"
        return url.replace("https://", "").replace("http://", "").strip("/")

    # ---------- Gather Method (HTTP Webhook / Passthru) ----------
    def incoming_call_gather(self, call_sid: str) -> str:
        """Return Exotel ExoML for initial greeting and speech gather."""
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

    async def gather_response(self, call_sid: str, speech_result: str) -> str:
        """Process gathered speech from Exotel and return next ExoML response."""
        koyeb_url = self._get_host()
        session = self.session_manager.get_session(call_sid) or {}
        history = session.get("conversation", [])

        if speech_result and speech_result.strip():
            logger.info(f"[GATHER] Call {call_sid} - Customer speech: \"{speech_result}\"")
            ai_text = await self.voice_agent.generate_response(speech_result, call_sid, history)
            self.session_manager.add_conversation_turn(call_sid, speech_result, ai_text)
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
        """Return Exotel ExoML that connects to a WebSocket media stream."""
        koyeb_url = self._get_host()
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Response>\n'
            f'    <Stream url="wss://{koyeb_url}/ws/exotel-stream?callSid={call_sid}" />\n'
            '</Response>'
        )

    async def send_audio_chunks(self, websocket, stream_sid: str, audio_bytes: bytes, audio_format: str = "mulaw"):
        """Stream telephony audio chunks directly to Exotel."""
        if not audio_bytes:
            return
        if not stream_sid:
            logger.warning("[MEDIA_OUT] Cannot stream audio without stream_sid.")
            return

        self._is_speaking = True
        try:
            chunk_size = 640 if audio_format == "pcm8" else 320
            total_chunks = (len(audio_bytes) + chunk_size - 1) // chunk_size
            logger.info(f"[MEDIA_OUT] Streaming {len(audio_bytes)} bytes {audio_format} ({total_chunks} chunks) to stream: {stream_sid}")

            for i in range(0, len(audio_bytes), chunk_size):
                chunk = audio_bytes[i:i + chunk_size]
                payload = base64.b64encode(chunk).decode("utf-8")
                msg = {
                    "event": "media",
                    "stream_sid": stream_sid,
                    "streamSid": stream_sid,
                    "media": {
                        "payload": payload
                    }
                }
                await websocket.send_text(json.dumps(msg))
                await asyncio.sleep(0.038)  # 40ms pacing

            logger.info(f"[MEDIA_OUT] Finished playing audio to caller (stream: {stream_sid})")
        except Exception as e:
            logger.error(f"[MEDIA_OUT] Error sending audio chunks: {e}", exc_info=True)
        finally:
            await asyncio.sleep(0.2)
            self._is_speaking = False

    async def process_media_stream(self, websocket, call_sid: str):
        """Handle full bi-directional real-time media stream with Exotel VoiceBot."""
        await websocket.accept()
        logger.info(f"============================================================")
        logger.info(f"[WS] WebSocket connected for call SID: {call_sid}")
        logger.info(f"============================================================")

        stream_sid = None
        audio_buffer = b""
        audio_format = "mulaw"
        speech_started = False
        silence_frames = 0
        SILENCE_THRESHOLD = 25   # ~500ms of silence at 20ms frames
        ENERGY_THRESHOLD = 250    # Sensitive speech activity threshold
        BARGE_IN_THRESHOLD = 800  # Caller speech level required to interrupt playback
        greeting_sent = False
        is_speaking = False
        playback_task: Optional[asyncio.Task] = None
        utterance_task: Optional[asyncio.Task] = None

        async def cancel_task(task: Optional[asyncio.Task], label: str):
            if task and not task.done():
                logger.info(f"[{label}] Canceling previous task.")
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        async def start_playback(audio_bytes: bytes):
            nonlocal is_speaking, playback_task
            await cancel_task(playback_task, "MEDIA_OUT")

            current_stream_sid = stream_sid
            current_audio_format = audio_format

            async def run_playback():
                nonlocal is_speaking
                is_speaking = True
                try:
                    await self.send_audio_chunks(websocket, current_stream_sid or "", audio_bytes, current_audio_format)
                finally:
                    is_speaking = False

            playback_task = asyncio.create_task(run_playback())

        async def send_greeting_if_needed():
            nonlocal greeting_sent, stream_sid
            if not stream_sid:
                logger.info("[AI_GREETING] Waiting for stream_sid before sending greeting.")
                return
            if not greeting_sent:
                greeting_sent = True
                greeting_text = await self.voice_agent.generate_greeting()
                logger.info(f"[AI_GREETING] Synthesizing greeting: \"{greeting_text}\"")
                audio_greeting = await self.voice_agent.text_to_speech(greeting_text, format_type=audio_format)
                if audio_greeting:
                    await start_playback(audio_greeting)

        try:
            while True:
                message = await websocket.receive_text()
                data = json.loads(message)
                event = data.get("event")

                # Exotel may use snake_case, while browser/tests may use camelCase.
                start_data = data.get("start", {})
                media_format = start_data.get("media_format") or data.get("media_format") or {}
                bit_rate = str(media_format.get("bit_rate", "")).lower()
                sample_rate = str(media_format.get("sample_rate", ""))
                if sample_rate == "8000" and "128" in bit_rate:
                    audio_format = "pcm8"
                incoming_sid = (
                    data.get("streamSid")
                    or data.get("stream_sid")
                    or start_data.get("streamSid")
                    or start_data.get("stream_sid")
                )
                if incoming_sid:
                    stream_sid = incoming_sid

                incoming_call_sid = (
                    data.get("callSid")
                    or data.get("call_sid")
                    or start_data.get("callSid")
                    or start_data.get("call_sid")
                )
                if incoming_call_sid and incoming_call_sid != "unknown":
                    call_sid = incoming_call_sid

                if event == "connected":
                    protocol = data.get("protocol", "Call")
                    logger.info(f"[WS] Exotel connected (protocol={protocol}) | {data}")
                    # Exotel sends the usable stream id in the subsequent start event.
                    await send_greeting_if_needed()

                elif event == "start":
                    logger.info(f"[WS] Stream started: streamSid={stream_sid}, callSid={call_sid}, audio_format={audio_format} | {data}")
                    if not self.session_manager.get_session(call_sid):
                        self.session_manager.create_session(call_sid)
                    await send_greeting_if_needed()

                elif event == "media":
                    media_obj = data.get("media", {})
                    payload = media_obj.get("payload", "")
                    if not payload:
                        continue

                    # Trigger greeting if not yet sent
                    if not greeting_sent:
                        await send_greeting_if_needed()

                    # Decode Exotel base64 audio chunk.
                    try:
                        audio_chunk = base64.b64decode(payload)
                        pcm_chunk = audio_chunk if audio_format == "pcm8" else audioop.ulaw2lin(audio_chunk, 2)
                    except Exception:
                        continue

                    # Energy calculation for Voice Activity Detection
                    energy = self._audio_energy(pcm_chunk)

                    if is_speaking:
                        if energy < BARGE_IN_THRESHOLD:
                            audio_buffer = b""
                            speech_started = False
                            silence_frames = 0
                            continue

                        logger.info(f"[BARGE_IN] Caller interrupted playback (energy={energy:.0f}).")
                        await cancel_task(playback_task, "MEDIA_OUT")
                        speech_started = True
                        audio_buffer = audio_chunk
                        silence_frames = 0
                        continue

                    if energy > ENERGY_THRESHOLD:
                        if not speech_started:
                            speech_started = True
                            audio_buffer = audio_chunk
                            logger.info(f"[VAD] Caller speaking (energy={energy:.0f})...")
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
                                logger.info(f"[VAD] Speech ended. Buffer: {len(audio_buffer)} bytes {audio_format}. Processing STT...")

                                if len(audio_buffer) >= 1600:  # at least ~200ms of speech
                                    utterance = audio_buffer
                                    audio_buffer = b""
                                    await cancel_task(utterance_task, "PIPELINE")
                                    utterance_task = asyncio.create_task(self._handle_user_utterance(
                                        websocket, stream_sid or "", call_sid, utterance, audio_format, start_playback
                                    ))
                                else:
                                    audio_buffer = b""

                elif event == "mark":
                    mark_name = data.get("mark", {}).get("name")
                    logger.debug(f"[WS] Received mark: {mark_name}")

                elif event == "dtmf":
                    digit = data.get("dtmf", {}).get("digit")
                    logger.info(f"[WS] DTMF received: {digit}")

                elif event == "stop":
                    logger.info(f"[WS] Exotel stream stopped: {stream_sid}")
                    break

        except Exception as e:
            logger.error(f"[WS] Error in media stream session: {e}", exc_info=True)
        finally:
            logger.info(f"[WS] Closing session for call: {call_sid}")
            await cancel_task(playback_task, "MEDIA_OUT")
            await cancel_task(utterance_task, "PIPELINE")
            self.session_manager.end_session(call_sid)
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
    ):
        """Process recognized speech to AI response and play back in Exotel's stream format."""
        try:
            # 1. Native 8kHz telephony STT
            text = await self.voice_agent.speech_to_text(
                audio_bytes,
                is_mulaw=(audio_format != "pcm8"),
                sample_rate=8000,
            )
            if not text or not text.strip():
                logger.info("[STT] No clear words recognized.")
                return

            logger.info(f"🗣️ [CALLER]: \"{text}\"")

            # 2. LLM response with session history
            session = self.session_manager.get_session(call_sid) or {}
            history = session.get("conversation", [])
            ai_text = await self.voice_agent.generate_response(text, call_sid, history)
            self.session_manager.add_conversation_turn(call_sid, text, ai_text)
            logger.info(f"🤖 [AI AGENT]: \"{ai_text}\"")

            # 3. Native 8kHz telephony TTS
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
            import numpy as np
            arr = np.frombuffer(pcm_bytes, dtype=np.int16)
            if len(arr) == 0:
                return 0.0
            return float(np.sqrt(np.mean(arr.astype(np.float64)**2)))
