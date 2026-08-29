import os
import logging
import asyncio
import time
import audioop
import io
import wave
import json
import re
from typing import Optional, List, Dict, Any
import azure.cognitiveservices.speech as speechsdk
import httpx
from openai import AsyncOpenAI

from app.core.config import settings
from app.addons.runner import AddonRunner

logger = logging.getLogger(__name__)


class VoiceAgent:
    def __init__(self, addon_runner: Optional[AddonRunner] = None):
        self.stt_provider = settings.STT_PROVIDER
        self.tts_provider = settings.TTS_PROVIDER

        self.deepgram_key = settings.DEEPGRAM_API_KEY
        self.speech_key = settings.AZURE_SPEECH_KEY
        self.speech_region = settings.AZURE_SPEECH_REGION
        self.system_prompt = settings.SYSTEM_PROMPT

        self.has_deepgram = bool(self.deepgram_key and not self.deepgram_key.startswith("your_"))
        self.has_azure = bool(self.speech_key and not self.speech_key.startswith("your_"))

        self._http_client: Optional[httpx.AsyncClient] = None
        self.addon_runner = addon_runner or AddonRunner()

        logger.info(
            f"Speech Providers: STT='{self.stt_provider}', TTS='{self.tts_provider}' "
            f"(Deepgram={self.has_deepgram}, Azure={self.has_azure})"
        )

        # OpenRouter / OpenAI client initialization
        self.llm_client = None
        if settings.OPENROUTER_API_KEY and not settings.OPENROUTER_API_KEY.startswith("your_"):
            self.llm_client = AsyncOpenAI(
                base_url=settings.OPENROUTER_BASE_URL,
                api_key=settings.OPENROUTER_API_KEY,
                default_headers={
                    "HTTP-Referer": f"http://{settings.HOST}:{settings.PORT}",
                    "X-Title": "VoiceAgent-Exotel"
                }
            )
            logger.info(f"OpenRouter initialized with model: {settings.OPENROUTER_MODEL} at {settings.OPENROUTER_BASE_URL}")

        # Azure Speech configurations
        self.speech_config_mulaw = None
        self.speech_config_pcm8 = None
        self.speech_config_pcm = None

        if self.has_azure:
            try:
                # 1. Telephony: 8kHz μ-law
                self.speech_config_mulaw = speechsdk.SpeechConfig(
                    subscription=self.speech_key,
                    region=self.speech_region
                )
                self.speech_config_mulaw.speech_recognition_language = settings.AZURE_STT_LANGUAGE
                self.speech_config_mulaw.speech_synthesis_voice_name = settings.AZURE_TTS_VOICE
                self.speech_config_mulaw.set_speech_synthesis_output_format(
                    speechsdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw
                )

                # 2. Telephony: 8kHz PCM
                self.speech_config_pcm8 = speechsdk.SpeechConfig(
                    subscription=self.speech_key,
                    region=self.speech_region
                )
                self.speech_config_pcm8.speech_recognition_language = settings.AZURE_STT_LANGUAGE
                self.speech_config_pcm8.speech_synthesis_voice_name = settings.AZURE_TTS_VOICE
                self.speech_config_pcm8.set_speech_synthesis_output_format(
                    speechsdk.SpeechSynthesisOutputFormat.Raw8Khz16BitMonoPcm
                )

                # 3. Browser: 16kHz PCM
                self.speech_config_pcm = speechsdk.SpeechConfig(
                    subscription=self.speech_key,
                    region=self.speech_region
                )
                self.speech_config_pcm.speech_recognition_language = settings.AZURE_STT_LANGUAGE
                self.speech_config_pcm.speech_synthesis_voice_name = settings.AZURE_TTS_VOICE
                self.speech_config_pcm.set_speech_synthesis_output_format(
                    speechsdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm
                )

                logger.info(f"Azure Speech initialized: region={self.speech_region}, voice={settings.AZURE_TTS_VOICE}")
            except Exception as e:
                logger.error(f"Error configuring Azure Speech SDK: {e}")

    @property
    def http_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=15.0)
        return self._http_client

    async def close(self):
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    # ----------------------- Speech-to-Text (STT) -----------------------
    async def speech_to_text(self, audio_bytes: bytes, is_mulaw: bool = True, sample_rate: int = 16000) -> Optional[str]:
        if not audio_bytes:
            return None

        if self.stt_provider == "deepgram" and self.has_deepgram:
            text = await self._deepgram_stt(audio_bytes, is_mulaw, sample_rate)
            if text:
                return text
            if self.has_azure:
                logger.info("[STT] Deepgram returned no transcript; trying Azure fallback...")
                return await self._azure_stt(audio_bytes, is_mulaw, sample_rate)
            return None

        if self.stt_provider == "azure" and self.has_azure:
            text = await self._azure_stt(audio_bytes, is_mulaw, sample_rate)
            if text:
                return text
            if self.has_deepgram:
                logger.info("[STT] Azure returned no transcript; trying Deepgram fallback...")
                return await self._deepgram_stt(audio_bytes, is_mulaw, sample_rate)
            return None

        if self.has_deepgram:
            return await self._deepgram_stt(audio_bytes, is_mulaw, sample_rate)
        elif self.has_azure:
            return await self._azure_stt(audio_bytes, is_mulaw, sample_rate)

        return None

    async def _deepgram_stt(self, audio_bytes: bytes, is_mulaw: bool = True, sample_rate: int = 16000) -> Optional[str]:
        t0 = time.time()
        url = "https://api.deepgram.com/v1/listen"
        params = {
            "model": settings.DEEPGRAM_STT_MODEL,
            "language": settings.DEEPGRAM_STT_LANGUAGE,
            "smart_format": "true",
            "punctuate": "true",
            "channels": "1",
        }
        if is_mulaw:
            params["encoding"] = "mulaw"
            params["sample_rate"] = "8000"
        else:
            params["encoding"] = "linear16"
            params["sample_rate"] = str(sample_rate)

        headers = {
            "Authorization": f"Token {self.deepgram_key}",
            "Content-Type": "audio/raw",
        }

        try:
            response = await self.http_client.post(url, params=params, headers=headers, content=audio_bytes)
            elapsed = (time.time() - t0) * 1000
            if response.status_code != 200:
                logger.warning(f"[STT-Deepgram] Failed ({response.status_code}, {elapsed:.0f}ms)")
                return None

            payload = response.json()
            channels = payload.get("results", {}).get("channels", [])
            if channels and channels[0].get("alternatives"):
                transcript = channels[0]["alternatives"][0].get("transcript", "").strip()
                if transcript:
                    logger.info(f"[STT-Deepgram] Recognized ({elapsed:.0f}ms): \"{transcript}\"")
                    return transcript
            return None
        except Exception as e:
            logger.error(f"[STT-Deepgram] Error: {e}")
            return None

    async def _azure_stt(self, audio_bytes: bytes, is_mulaw: bool = True, sample_rate: int = 16000) -> Optional[str]:
        t0 = time.time()
        try:
            wav_audio = self._wav_16khz_pcm(audio_bytes, is_mulaw, sample_rate)
            endpoint = self._stt_endpoint()
            response = await self.http_client.post(
                endpoint,
                params={"language": settings.AZURE_STT_LANGUAGE, "format": "simple"},
                headers={
                    "Ocp-Apim-Subscription-Key": self.speech_key,
                    "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
                    "Accept": "application/json",
                },
                content=wav_audio,
            )
            elapsed = (time.time() - t0) * 1000
            if response.status_code >= 400:
                return None

            payload = response.json()
            if payload.get("RecognitionStatus") == "Success" and payload.get("DisplayText"):
                text = payload["DisplayText"]
                logger.info(f"[STT-Azure] Recognized ({elapsed:.0f}ms): \"{text}\"")
                return text
            return None
        except Exception as e:
            logger.error(f"[STT-Azure] Error: {e}")
            return None

    def _stt_endpoint(self) -> str:
        if settings.AZURE_SPEECH_ENDPOINT:
            return f"{settings.AZURE_SPEECH_ENDPOINT}/stt/speech/recognition/conversation/cognitiveservices/v1"
        return f"https://{self.speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"

    def _wav_16khz_pcm(self, audio_bytes: bytes, is_mulaw: bool, sample_rate: int = 16000) -> bytes:
        if is_mulaw:
            pcm_8k = audioop.ulaw2lin(audio_bytes, 2)
            pcm_16k, _ = audioop.ratecv(pcm_8k, 2, 1, 8000, 16000, None)
        elif sample_rate != 16000:
            pcm_16k, _ = audioop.ratecv(audio_bytes, 2, 1, sample_rate, 16000, None)
        else:
            pcm_16k = audio_bytes

        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(16000)
            wav_file.writeframes(pcm_16k)
        return wav_buffer.getvalue()

    # ----------------------- Text-to-Speech (TTS) -----------------------
    async def text_to_speech(self, text: str, format_type: str = "mulaw") -> bytes:
        if not text or not text.strip():
            return b""

        if self.tts_provider == "deepgram" and self.has_deepgram:
            audio = await self._deepgram_tts(text, format_type)
            if audio:
                return audio
            if self.has_azure:
                return await self._azure_tts(text, format_type)
            return b""

        if self.tts_provider == "azure" and self.has_azure:
            audio = await self._azure_tts(text, format_type)
            if audio:
                return audio
            if self.has_deepgram:
                return await self._deepgram_tts(text, format_type)
            return b""

        if self.has_deepgram:
            return await self._deepgram_tts(text, format_type)
        elif self.has_azure:
            return await self._azure_tts(text, format_type)

        return b""

    async def _deepgram_tts(self, text: str, format_type: str = "mulaw") -> bytes:
        url = "https://api.deepgram.com/v1/speak"
        if format_type == "mulaw":
            params = {"model": settings.DEEPGRAM_TTS_MODEL, "encoding": "mulaw", "sample_rate": "8000", "container": "none"}
        elif format_type == "pcm8":
            params = {"model": settings.DEEPGRAM_TTS_MODEL, "encoding": "linear16", "sample_rate": "8000", "container": "none"}
        else:
            params = {"model": settings.DEEPGRAM_TTS_MODEL, "encoding": "linear16", "sample_rate": "16000", "container": "none"}

        headers = {"Authorization": f"Token {self.deepgram_key}", "Content-Type": "application/json"}
        try:
            response = await self.http_client.post(url, params=params, headers=headers, json={"text": text})
            if response.status_code == 200:
                return response.content
            return b""
        except Exception:
            return b""

    async def _azure_tts(self, text: str, format_type: str = "mulaw") -> bytes:
        config = self.speech_config_mulaw if format_type == "mulaw" else (
            self.speech_config_pcm8 if format_type == "pcm8" else self.speech_config_pcm
        )
        if not config:
            return b""
        try:
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=config, audio_config=None)
            result = await asyncio.to_thread(synthesizer.speak_text_async(text).get)
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                return result.audio_data
            return b""
        except Exception:
            return b""

    # ----------------------- LLM with Dynamic Addon Tools -----------------------
    async def generate_response(
        self,
        user_input: str,
        session_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        tenant_id: str = "default",
        call_context: Optional[Dict[str, Any]] = None,
        on_tool_called: Optional[Any] = None
    ) -> str:
        """Generate AI response with multi-turn conversation and dynamic addon tool calling."""
        if not self.llm_client:
            return "Thank you for calling. Our automated assistant is currently unavailable."

        t0 = time.time()
        context = call_context or {}

        # 1. Fetch active addon tools for tenant
        tools = await self.addon_runner.get_openai_tools_for_tenant(tenant_id)

        messages: List[Dict[str, Any]] = [{"role": "system", "content": self.system_prompt}]

        if conversation_history:
            for turn in conversation_history[-6:]:
                if turn.get("customer"):
                    messages.append({"role": "user", "content": turn["customer"]})
                if turn.get("agent"):
                    messages.append({"role": "assistant", "content": turn["agent"]})

        messages.append({"role": "user", "content": user_input})

        try:
            create_params: Dict[str, Any] = {
                "model": settings.OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": settings.MAX_TOKENS,
                "temperature": settings.TEMPERATURE,
            }
            if tools:
                create_params["tools"] = tools
                create_params["tool_choice"] = "auto"

            response = await self.llm_client.chat.completions.create(**create_params)
            choice = response.choices[0]

            # 2. Check if LLM requested tool execution
            if choice.message.tool_calls:
                for tool_call in choice.message.tool_calls:
                    fn_name = tool_call.function.name
                    fn_args = {}
                    try:
                        fn_args = json.loads(tool_call.function.arguments)
                    except Exception:
                        pass

                    logger.info(f"🛠️ [LLM TOOL CALL] {fn_name} args={fn_args}")
                    tool_result = await self.addon_runner.execute_tool(
                        tenant_id=tenant_id,
                        tool_name=fn_name,
                        arguments=fn_args,
                        context=context
                    )

                    if on_tool_called:
                        try:
                            on_tool_called(fn_name, fn_args, tool_result)
                        except Exception:
                            pass

                    # Append tool call and result to message history
                    messages.append({
                        "role": "assistant",
                        "tool_calls": [{
                            "id": tool_call.id,
                            "type": "function",
                            "function": {
                                "name": fn_name,
                                "arguments": tool_call.function.arguments
                            }
                        }]
                    })
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(tool_result)
                    })

                # Secondary pass: generate answer using tool data
                second_response = await self.llm_client.chat.completions.create(
                    model=settings.OPENROUTER_MODEL,
                    messages=messages,
                    max_tokens=settings.MAX_TOKENS,
                    temperature=settings.TEMPERATURE
                )
                raw_reply = second_response.choices[0].message.content or ""
            else:
                raw_reply = choice.message.content or ""

            # Strip internal chain-of-thought (<think>...</think>)
            reply = re.sub(r"<think>.*?</think>", "", raw_reply, flags=re.DOTALL).strip()
            if not reply:
                reply = raw_reply

            elapsed = (time.time() - t0) * 1000
            logger.info(f"[LLM] Response ({elapsed:.0f}ms): \"{reply[:80]}...\"")
            return reply
        except Exception as e:
            logger.error(f"[LLM] Error: {e}", exc_info=True)
            return "I apologize, I'm experiencing a brief issue retrieving that information. How else may I assist you?"

    async def generate_greeting(self) -> str:
        return "Hello! Thank you for calling our AI support line. How can I assist you today?"
