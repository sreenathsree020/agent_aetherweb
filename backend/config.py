import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class Config:
    # Speech Providers & Selection ('deepgram' or 'azure')
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY") or os.getenv("DEEPGRAM_KEY") or os.getenv("DEEPGRAM", "")
    DEEPGRAM_STT_MODEL = os.getenv("DEEPGRAM_STT_MODEL", "nova-2")
    DEEPGRAM_STT_LANGUAGE = os.getenv("DEEPGRAM_STT_LANGUAGE", "en")
    DEEPGRAM_TTS_MODEL = os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en")

    # STT and TTS provider resolution (defaults to deepgram if key present, else azure)
    STT_PROVIDER = os.getenv("STT_PROVIDER", "deepgram" if DEEPGRAM_API_KEY and not DEEPGRAM_API_KEY.startswith("your_") else "azure").lower()
    TTS_PROVIDER = os.getenv("TTS_PROVIDER", "deepgram" if DEEPGRAM_API_KEY and not DEEPGRAM_API_KEY.startswith("your_") else "azure").lower()

    # Azure Speech
    AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")
    AZURE_SPEECH_ENDPOINT = os.getenv("AZURE_SPEECH_ENDPOINT", "").rstrip("/")
    AZURE_STT_LANGUAGE = os.getenv("AZURE_STT_LANGUAGE", "en-US")
    AZURE_TTS_VOICE = os.getenv("AZURE_TTS_VOICE", "en-US-JennyNeural")

    # LLM (OpenRouter / OpenAI)
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY", "")
    _raw_endpoint = os.getenv("OPENROUTER_ENDPOINT_URL", "https://openrouter.ai/api/v1")
    # Normalize base URL if endpoint contains /chat/completions
    OPENROUTER_BASE_URL = _raw_endpoint.replace("/chat/completions", "").rstrip("/")
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL") or os.getenv("OPENAI_MODEL", "openrouter/free")
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", 150))
    TEMPERATURE = float(os.getenv("TEMPERATURE", 0.7))

    # Redis / Valkey
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    SESSION_TIMEOUT = int(os.getenv("SESSION_TIMEOUT", 3600))

    # Exotel
    EXOTEL_ACCOUNT_SID = os.getenv("EXOTEL_ACCOUNT_SID", "")
    EXOTEL_API_KEY = os.getenv("EXOTEL_API_KEY", "")
    EXOTEL_API_TOKEN = os.getenv("EXOTEL_API_TOKEN", "")
    EXOTEL_SUBDOMAIN = os.getenv("EXOTEL_SUBDOMAIN", "")
    EXOTEL_PHONE_NUMBER = os.getenv("EXOTEL_PHONE_NUMBER", "")
    EXOTEL_USE_STREAM = os.getenv("EXOTEL_USE_STREAM", "false").lower() == "true"

    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    KOYEB_APP_URL = os.getenv("KOYEB_APP_URL", "localhost:8000")

    # System Prompt
    SYSTEM_PROMPT = os.getenv(
        "SYSTEM_PROMPT",
        """You are a helpful and concise customer support agent speaking to a caller on the phone.
Rules:
1. Keep answers short, clear, and natural (1 to 2 sentences max).
2. Speak directly to the customer as if on a phone call.
3. Do NOT output internal reasoning, chain-of-thought, or markdown formatting."""
    )

    @classmethod
    def validate(cls):
        missing = []
        has_speech = (
            bool(cls.DEEPGRAM_API_KEY and not cls.DEEPGRAM_API_KEY.startswith("your_"))
            or bool(cls.AZURE_SPEECH_KEY and not cls.AZURE_SPEECH_KEY.startswith("your_"))
        )
        if not has_speech:
            missing.append("DEEPGRAM_API_KEY (or AZURE_SPEECH_KEY)")

        if not cls.OPENROUTER_API_KEY or cls.OPENROUTER_API_KEY.startswith("your_"):
            missing.append("OPENROUTER_API_KEY")

        if missing:
            logger.warning(f"Note: Some environment variables are not configured or use placeholders: {missing}")
        return True
