import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class Settings:
    # Project & Environment
    PROJECT_NAME: str = "AI Voice Agent SaaS Platform"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-dev-secret-key-change-in-production-64chars")
    ENCRYPTION_MASTER_KEY: str = os.getenv("ENCRYPTION_MASTER_KEY", "uYw7Zc2M5bQ3vX8nK1rL9pT0eW4yA6dF8gH2jK4mN7s=")

    # Database & Cache
    @staticmethod
    def _parse_db_url() -> str:
        raw = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./voice_agent.db")
        if raw.startswith("postgres://"):
            raw = raw.replace("postgres://", "postgresql+asyncpg://", 1)
        elif raw.startswith("postgresql://") and not raw.startswith("postgresql+asyncpg://"):
            raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "sslmode=require" in raw:
            raw = raw.replace("sslmode=require", "ssl=require")
        return raw

    DATABASE_URL: str = _parse_db_url()
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    SESSION_TIMEOUT: int = int(os.getenv("SESSION_TIMEOUT", 3600))

    # Speech Providers & Selection ('deepgram' or 'azure')
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY") or os.getenv("DEEPGRAM_KEY") or os.getenv("DEEPGRAM", "")
    DEEPGRAM_STT_MODEL: str = os.getenv("DEEPGRAM_STT_MODEL", "nova-2")
    DEEPGRAM_STT_LANGUAGE: str = os.getenv("DEEPGRAM_STT_LANGUAGE", "en")
    DEEPGRAM_TTS_MODEL: str = os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en")

    STT_PROVIDER: str = os.getenv(
        "STT_PROVIDER",
        "deepgram" if DEEPGRAM_API_KEY and not DEEPGRAM_API_KEY.startswith("your_") else "azure"
    ).lower()
    TTS_PROVIDER: str = os.getenv(
        "TTS_PROVIDER",
        "deepgram" if DEEPGRAM_API_KEY and not DEEPGRAM_API_KEY.startswith("your_") else "azure"
    ).lower()

    # Azure Speech
    AZURE_SPEECH_KEY: str = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "eastus")
    AZURE_SPEECH_ENDPOINT: str = os.getenv("AZURE_SPEECH_ENDPOINT", "").rstrip("/")
    AZURE_STT_LANGUAGE: str = os.getenv("AZURE_STT_LANGUAGE", "en-US")
    AZURE_TTS_VOICE: str = os.getenv("AZURE_TTS_VOICE", "en-US-JennyNeural")

    # LLM (OpenRouter / OpenAI)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY", "")
    _raw_endpoint: str = os.getenv("OPENROUTER_ENDPOINT_URL", "https://openrouter.ai/api/v1")
    OPENROUTER_BASE_URL: str = _raw_endpoint.replace("/chat/completions", "").rstrip("/")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL") or os.getenv("OPENAI_MODEL", "openrouter/free")
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", 160))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", 0.7))

    # Exotel Telephony
    EXOTEL_ACCOUNT_SID: str = os.getenv("EXOTEL_ACCOUNT_SID", "")
    EXOTEL_API_KEY: str = os.getenv("EXOTEL_API_KEY", "")
    EXOTEL_API_TOKEN: str = os.getenv("EXOTEL_API_TOKEN", "")
    EXOTEL_SUBDOMAIN: str = os.getenv("EXOTEL_SUBDOMAIN", "")
    EXOTEL_PHONE_NUMBER: str = os.getenv("EXOTEL_PHONE_NUMBER", "")
    EXOTEL_USE_STREAM: bool = os.getenv("EXOTEL_USE_STREAM", "false").lower() == "true"

    # Addons: Google / Gmail
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_OAUTH_REDIRECT_URI: str = os.getenv(
        "GOOGLE_OAUTH_REDIRECT_URI",
        "http://localhost:8000/api/v1/oauth/callback/gmail"
    )

    # Addons: WhatsApp Business API
    WHATSAPP_API_ENDPOINT: str = os.getenv("WHATSAPP_API_ENDPOINT", "https://graph.facebook.com/v19.0")
    WHATSAPP_SYSTEM_ACCESS_TOKEN: str = os.getenv("WHATSAPP_SYSTEM_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    KOYEB_APP_URL: str = os.getenv("KOYEB_APP_URL", "localhost:8000")

    # System Prompt
    SYSTEM_PROMPT: str = os.getenv(
        "SYSTEM_PROMPT",
        """You are a helpful, professional, and concise customer support agent speaking on the phone.
Rules:
1. Keep answers short, clear, and natural (1 to 2 sentences max).
2. Speak directly to the customer as if on a phone call.
3. If relevant tool functions (such as querying order database or searching emails) are available, invoke them seamlessly to look up live facts.
4. Do NOT output internal reasoning, chain-of-thought, or markdown formatting."""
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


settings = Settings()
Config = settings  # For backward compatibility
