import base64
import os
import json
import logging
from typing import Any, Dict
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_master_key() -> bytes:
    key_str = settings.ENCRYPTION_MASTER_KEY
    try:
        raw = base64.b64decode(key_str)
        if len(raw) in (16, 24, 32):
            return raw
    except Exception:
        pass
    # Fallback to deterministic 32-byte key derived from settings.SECRET_KEY
    import hashlib
    return hashlib.sha256(settings.SECRET_KEY.encode()).digest()


def encrypt_credential(payload: Dict[str, Any] | str) -> str:
    """Encrypt a dictionary or string payload using AES-256-GCM."""
    try:
        raw_text = json.dumps(payload) if isinstance(payload, dict) else str(payload)
        key = _get_master_key()
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)  # 96-bit nonce for AES-GCM
        ciphertext = aesgcm.encrypt(nonce, raw_text.encode("utf-8"), None)
        # Store as nonce:ciphertext (both base64 encoded)
        combined = base64.b64encode(nonce).decode("utf-8") + ":" + base64.b64encode(ciphertext).decode("utf-8")
        return combined
    except Exception as e:
        logger.error(f"Error encrypting credential: {e}")
        # Safe fallback
        return ""


def decrypt_credential(encrypted_str: str) -> Any:
    """Decrypt a base64 nonce:ciphertext string back to original payload."""
    if not encrypted_str:
        return {}
    if ":" not in encrypted_str:
        # Might be unencrypted legacy string
        try:
            return json.loads(encrypted_str)
        except Exception:
            return encrypted_str

    try:
        nonce_b64, cipher_b64 = encrypted_str.split(":", 1)
        nonce = base64.b64decode(nonce_b64)
        ciphertext = base64.b64decode(cipher_b64)
        key = _get_master_key()
        aesgcm = AESGCM(key)
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        decrypted_str = decrypted_bytes.decode("utf-8")
        try:
            return json.loads(decrypted_str)
        except Exception:
            return decrypted_str
    except Exception as e:
        logger.error(f"Error decrypting credential: {e}")
        return {}
