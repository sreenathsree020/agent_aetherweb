import os
import logging
import asyncio
import time
import audioop
import io
import wave
from typing import Optional, List, Dict
import azure.cognitiveservices.speech as speechsdk
import httpx
from openai import AsyncOpenAI

from config import Config

logger = logging.getLogger(__name__)


class VoiceAgent:
    def __init__(self):
        self.stt_provider = Config.STT_PROVIDER
        self.tts_provider = Config.TTS_PROVIDER

        self.deepgram_key = Config.DEEPGRAM_API_KEY
        self.speech_key = Config.AZURE_SPEECH_KEY
        self.speech_region = Config.AZURE_SPEECH_REGION
        self.system_prompt = Config.SYSTEM_PROMPT

        self.has_deepgram = bool(self.deepgram_key and not self.deepgram_key.startswith("your_"))
        self.has_azure = bool(self.speech_key and not self.speech_key.startswith("your_"))

        self._http_client: Optional[httpx.AsyncClient] = None

        logger.info(
            f"Speech Providers: STT='{self.stt_provider}', TTS='{self.tts_provider}' "
            f"(Deepgram={self.has_deepgram}, Azure={self.has_azure})"
        )

        # OpenRouter / OpenAI client initialization
        self.llm_client = None
        if Config.OPENROUTER_API_KEY and not Config.OPENROUTER_API_KEY.startswith("your_"):
            self.llm_client = AsyncOpenAI(
                base_url=Config.OPENROUTER_BASE_URL,
                api_key=Config.OPENROUTER_API_KEY,
                default_headers={
                    "HTTP-Referer": f"http://{Config.HOST}:{Config.PORT}",
                    "X-Title": "VoiceAgent-Exotel"
                }
            )
            logger.info(f"OpenRouter initialized with model: {Config.OPENROUTER_MODEL} at {Config.OPENROUTER_BASE_URL}")

        # Azure Speech configurations
        self.speech_config_mulaw = None
        self.speech_config_pcm8 = None
        self.speech_config_pcm = None

        if self.has_azure:
            try:
                # 1. Telephony Config: 8kHz μ-law (PCMU)
                self.speech_config_mulaw = speechsdk.SpeechConfig(
                    subscription=self.speech_key,
                    region=self.speech_region
                )
                self.speech_config_mulaw.speech_recognition_language = Config.AZURE_STT_LANGUAGE
                self.speech_config_mulaw.speech_synthesis_voice_name = Config.AZURE_TTS_VOICE
                self.speech_config_mulaw.set_speech_synthesis_output_format(
                    speechsdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw
                )

                # 2. Telephony Config: 8kHz PCM
                self.speech_config_pcm8 = speechsdk.SpeechConfig(
                    subscription=self.speech_key,
                    region=self.speech_region
                )
                self.speech_config_pcm8.speech_recognition_language = Config.AZURE_STT_LANGUAGE
                self.speech_config_pcm8.speech_synthesis_voice_name = Config.AZURE_TTS_VOICE
                self.speech_config_pcm8.set_speech_synthesis_output_format(
                    speechsdk.SpeechSynthesisOutputFormat.Raw8Khz16BitMonoPcm
                )

                # 3. Browser Config: 16kHz PCM
                self.speech_config_pcm = speechsdk.SpeechConfig(
                    subscription=self.speech_key,
                    region=self.speech_region
                )
                self.speech_config_pcm.speech_recognition_language = Config.AZURE_STT_LANGUAGE
                self.speech_config_pcm.speech_synthesis_voice_name = Config.AZURE_TTS_VOICE
                self.speech_config_pcm.set_speech_synthesis_output_format(
                    speechsdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm
                )

                logger.info(f"Azure Speech initialized: region={self.speech_region}, voice={Config.AZURE_TTS_VOICE}")
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
        """
        Convert audio to text using configured provider (Deepgram or Azure).
        If is_mulaw=True: audio is 8kHz 8-bit μ-law (Exotel telephony).
        If is_mulaw=False: audio is linear PCM at sample_rate (e.g., 8kHz or 16kHz).
        """
        if not audio_bytes:
            logger.debug("[STT] Empty audio buffer.")
            return None

        # Deepgram primary / configured
        if self.stt_provider == "deepgram" and self.has_deepgram:
            text = await self._deepgram_stt(audio_bytes, is_mulaw, sample_rate)
            if text:
                return text
            if self.has_azure:
                logger.info("[STT] Deepgram returned no transcript; trying Azure fallback...")
                return await self._azure_stt(audio_bytes, is_mulaw, sample_rate)
            return None

        # Azure primary
        if self.stt_provider == "azure" and self.has_azure:
            text = await self._azure_stt(audio_bytes, is_mulaw, sample_rate)
            if text:
                return text
            if self.has_deepgram:
                logger.info("[STT] Azure returned no transcript; trying Deepgram fallback...")
                return await self._deepgram_stt(audio_bytes, is_mulaw, sample_rate)
            return None

        # Auto fallback if provider not explicitly matched
        if self.has_deepgram:
            return await self._deepgram_stt(audio_bytes, is_mulaw, sample_rate)
        elif self.has_azure:
            return await self._azure_stt(audio_bytes, is_mulaw, sample_rate)

        logger.warning("[STT] No speech-to-text provider configured (neither Deepgram nor Azure).")
        return None

    async def _deepgram_stt(self, audio_bytes: bytes, is_mulaw: bool = True, sample_rate: int = 16000) -> Optional[str]:
        """Convert audio to text using Deepgram REST API (Nova-2)."""
        t0 = time.time()
        input_format = "MULAW_8K" if is_mulaw else f"PCM_{sample_rate // 1000}K"
        logger.info(f"[STT-Deepgram] Processing audio buffer ({len(audio_bytes)} bytes, format={input_format})...")

        url = "https://api.deepgram.com/v1/listen"
        params = {
            "model": Config.DEEPGRAM_STT_MODEL,
            "language": Config.DEEPGRAM_STT_LANGUAGE,
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
                logger.warning(f"[STT-Deepgram] Failed ({response.status_code}, {elapsed:.0f}ms): {response.text[:300]}")
                return None

            payload = response.json()
            channels = payload.get("results", {}).get("channels", [])
            if channels and channels[0].get("alternatives"):
                transcript = channels[0]["alternatives"][0].get("transcript", "").strip()
                if transcript:
                    logger.info(f"[STT-Deepgram] Recognized text ({elapsed:.0f}ms): \"{transcript}\"")
                    return transcript

            logger.debug(f"[STT-Deepgram] No speech recognized ({elapsed:.0f}ms)")
            return None
        except Exception as e:
            logger.error(f"[STT-Deepgram] Error during recognition: {e}", exc_info=True)
            return None

    async def _azure_stt(self, audio_bytes: bytes, is_mulaw: bool = True, sample_rate: int = 16000) -> Optional[str]:
        """Convert audio to text using Azure STT REST API."""
        t0 = time.time()
        input_format = "MULAW_8K" if is_mulaw else f"PCM_{sample_rate // 1000}K"
        logger.info(f"[STT-Azure] Processing audio buffer ({len(audio_bytes)} bytes, format={input_format})...")
        try:
            wav_audio = self._wav_16khz_pcm(audio_bytes, is_mulaw, sample_rate)
            endpoint = self._stt_endpoint()

            response = await self.http_client.post(
                endpoint,
                params={"language": Config.AZURE_STT_LANGUAGE, "format": "simple"},
                headers={
                    "Ocp-Apim-Subscription-Key": self.speech_key,
                    "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
                    "Accept": "application/json",
                },
                content=wav_audio,
            )

            elapsed = (time.time() - t0) * 1000

            if response.status_code == 401:
                logger.warning("[STT-Azure] Auth failed (401). Check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.")
                return None
            if response.status_code >= 400:
                logger.warning(f"[STT-Azure] Failed ({response.status_code}, {elapsed:.0f}ms): {response.text[:300]}")
                return None

            payload = response.json()
            if payload.get("RecognitionStatus") == "Success" and payload.get("DisplayText"):
                text = payload["DisplayText"]
                logger.info(f"[STT-Azure] Recognized text ({elapsed:.0f}ms): \"{text}\"")
                return text

            status = payload.get("RecognitionStatus")
            if status in ("NoMatch", "InitialSilenceTimeout", "BabbleTimeout"):
                logger.debug(f"[STT-Azure] No speech recognized ({elapsed:.0f}ms): {status}")
                return None

            logger.warning(f"[STT-Azure] Recognition failed ({elapsed:.0f}ms): {payload}")
            return None
        except Exception as e:
            logger.error(f"[STT-Azure] Error during recognition: {e}", exc_info=True)
            return None

    def _stt_endpoint(self) -> str:
        if Config.AZURE_SPEECH_ENDPOINT:
            return f"{Config.AZURE_SPEECH_ENDPOINT}/stt/speech/recognition/conversation/cognitiveservices/v1"
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
        """
        Convert text to audio using configured provider (Deepgram Aura or Azure).
        format_type='mulaw': Raw 8kHz 8-bit μ-law for Exotel telephony.
        format_type='pcm8': Raw 8kHz 16-bit PCM for Exotel streams that request 128kbps.
        format_type='pcm': Raw 16kHz 16-bit PCM for Browser testing.
        """
        if not text or not text.strip():
            return b""

        # Deepgram primary / configured
        if self.tts_provider == "deepgram" and self.has_deepgram:
            audio = await self._deepgram_tts(text, format_type)
            if audio:
                return audio
            if self.has_azure:
                logger.info("[TTS] Deepgram synthesis failed; trying Azure fallback...")
                return await self._azure_tts(text, format_type)
            return b""

        # Azure primary
        if self.tts_provider == "azure" and self.has_azure:
            audio = await self._azure_tts(text, format_type)
            if audio:
                return audio
            if self.has_deepgram:
                logger.info("[TTS] Azure synthesis failed; trying Deepgram fallback...")
                return await self._deepgram_tts(text, format_type)
            return b""

        # Auto fallback
        if self.has_deepgram:
            return await self._deepgram_tts(text, format_type)
        elif self.has_azure:
            return await self._azure_tts(text, format_type)

        logger.warning("[TTS] No text-to-speech provider configured (neither Deepgram nor Azure).")
        return b""

    async def _deepgram_tts(self, text: str, format_type: str = "mulaw") -> bytes:
        """Convert text to audio using Deepgram Aura TTS API."""
        t0 = time.time()
        logger.info(f"[TTS-Deepgram] Synthesizing ({format_type}): \"{text[:80]}{'...' if len(text) > 80 else ''}\"")

        url = "https://api.deepgram.com/v1/speak"
        if format_type == "mulaw":
            params = {
                "model": Config.DEEPGRAM_TTS_MODEL,
                "encoding": "mulaw",
                "sample_rate": "8000",
                "container": "none",
            }
        elif format_type == "pcm8":
            params = {
                "model": Config.DEEPGRAM_TTS_MODEL,
                "encoding": "linear16",
                "sample_rate": "8000",
                "container": "none",
            }
        else:  # "pcm" (16kHz PCM for browser)
            params = {
                "model": Config.DEEPGRAM_TTS_MODEL,
                "encoding": "linear16",
                "sample_rate": "16000",
                "container": "none",
            }

        headers = {
            "Authorization": f"Token {self.deepgram_key}",
            "Content-Type": "application/json",
        }

        try:
            response = await self.http_client.post(url, params=params, headers=headers, json={"text": text})
            elapsed = (time.time() - t0) * 1000

            if response.status_code != 200:
                logger.error(f"[TTS-Deepgram] Synthesis failed ({response.status_code}, {elapsed:.0f}ms): {response.text[:300]}")
                return b""

            audio_data = response.content
            logger.info(f"[TTS-Deepgram] Synthesized {len(audio_data)} bytes {format_type} ({elapsed:.0f}ms)")
            return audio_data
        except Exception as e:
            logger.error(f"[TTS-Deepgram] Error during synthesis: {e}", exc_info=True)
            return b""

    async def _azure_tts(self, text: str, format_type: str = "mulaw") -> bytes:
        """Convert text to audio using Azure TTS."""
        if format_type == "mulaw":
            config = self.speech_config_mulaw
        elif format_type == "pcm8":
            config = self.speech_config_pcm8
        else:
            config = self.speech_config_pcm

        if not config:
            logger.warning("[TTS-Azure] Azure Speech Config not initialized.")
            return b""

        t0 = time.time()
        logger.info(f"[TTS-Azure] Synthesizing ({format_type}): \"{text[:80]}{'...' if len(text) > 80 else ''}\"")
        try:
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=config, audio_config=None)
            result = await asyncio.to_thread(synthesizer.speak_text_async(text).get)
            elapsed = (time.time() - t0) * 1000

            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"[TTS-Azure] Synthesized {len(result.audio_data)} bytes {format_type} ({elapsed:.0f}ms)")
                return result.audio_data
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation_details = speechsdk.CancellationDetails(result)
                logger.error(f"[TTS-Azure] Canceled: reason={cancellation_details.reason}, error_details={cancellation_details.error_details}")
                return b""
            else:
                logger.error(f"[TTS-Azure] Synthesis failed ({elapsed:.0f}ms): {result.reason}")
                return b""
        except Exception as e:
            logger.error(f"[TTS-Azure] Error during synthesis: {e}", exc_info=True)
            return b""

    # ----------------------- LLM Response Generation -----------------------

    async def generate_response(
        self,
        user_input: str,
        session_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Generate AI response using OpenRouter / OpenAI with multi-turn conversation context."""
        if not self.llm_client:
            logger.warning("[LLM] OpenRouter client not initialized.")
            return "Thank you for calling. Our automated assistant is currently unavailable."

        t0 = time.time()
        messages = [{"role": "system", "content": self.system_prompt}]

        if conversation_history:
            for turn in conversation_history[-6:]:
                if turn.get("customer"):
                    messages.append({"role": "user", "content": turn["customer"]})
                if turn.get("agent"):
                    messages.append({"role": "assistant", "content": turn["agent"]})

        messages.append({"role": "user", "content": user_input})
        logger.info(f"[LLM] Calling model {Config.OPENROUTER_MODEL} (messages={len(messages)})...")

        try:
            response = await self.llm_client.chat.completions.create(
                model=Config.OPENROUTER_MODEL,
                messages=messages,
                max_tokens=Config.MAX_TOKENS,
                temperature=Config.TEMPERATURE
            )
            raw_reply = response.choices[0].message.content.strip()
            # Strip internal chain-of-thought (<think>...</think>) tags from reasoning models
            import re
            reply = re.sub(r"<think>.*?</think>", "", raw_reply, flags=re.DOTALL).strip()
            if not reply:
                reply = raw_reply

            elapsed = (time.time() - t0) * 1000
            logger.info(f"[LLM] Response ({elapsed:.0f}ms): \"{reply[:100]}{'...' if len(reply) > 100 else ''}\"")
            return reply
        except Exception as e:
            logger.error(f"[LLM] OpenRouter error: {e}", exc_info=True)
            return "I apologize, I'm having a brief issue retrieving that information. How else may I assist you?"

    async def generate_greeting(self) -> str:
        return "Hello! Thank you for calling our AI support line. How can I assist you today?"
