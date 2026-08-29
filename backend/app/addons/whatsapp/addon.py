import logging
from typing import Dict, Any, List
import httpx
from app.addons.base import AbstractAddon, AddonToolDefinition
from app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppAddon(AbstractAddon):
    """Send WhatsApp messages and notifications via Meta WhatsApp Business Cloud API."""

    def __init__(self, tenant_id: str, config: Dict[str, Any]):
        super().__init__(tenant_id, config)
        self.phone_number_id = config.get("phone_number_id") or settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = config.get("access_token") or settings.WHATSAPP_SYSTEM_ACCESS_TOKEN
        self.api_endpoint = config.get("api_endpoint") or settings.WHATSAPP_API_ENDPOINT

    async def initialize(self) -> bool:
        return bool(self.phone_number_id and self.access_token)

    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        return [
            AddonToolDefinition(
                name="send_whatsapp_message",
                description="Send a text message or confirmation link directly to the customer's WhatsApp during or after the call.",
                parameters={
                    "type": "object",
                    "properties": {
                        "recipient_phone": {
                            "type": "string",
                            "description": "Customer phone number with country code (e.g. +14155552671)"
                        },
                        "message_text": {
                            "type": "string",
                            "description": "Text message content to deliver to caller via WhatsApp"
                        }
                    },
                    "required": ["recipient_phone", "message_text"]
                }
            )
        ]

    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        if tool_name != "send_whatsapp_message":
            return {"error": f"Unknown tool '{tool_name}' for WhatsAppAddon"}

        recipient = (
            arguments.get("recipient_phone")
            or context.get("caller")
            or context.get("caller_phone")
            or ""
        )
        message_text = arguments.get("message_text", "")

        # Clean recipient phone number (remove + or whitespace for Meta API)
        clean_recipient = recipient.replace("+", "").replace(" ", "").replace("-", "")

        if not self.access_token or not self.phone_number_id:
            logger.info(f"[WhatsAppAddon (Simulated)] Message to {clean_recipient}: {message_text}")
            return {
                "status": "simulated",
                "message": f"WhatsApp notification simulated for {clean_recipient} (Meta credentials not configured)."
            }

        url = f"{self.api_endpoint.rstrip('/')}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_recipient,
            "type": "text",
            "text": {"body": message_text}
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in (200, 201):
                    logger.info(f"[WhatsAppAddon] Message delivered to {clean_recipient}")
                    return {"status": "sent", "recipient": clean_recipient}
                else:
                    logger.warning(f"[WhatsAppAddon] Meta API error ({res.status_code}): {res.text}")
                    return {"status": "failed", "detail": res.text}
        except Exception as e:
            logger.error(f"[WhatsAppAddon] Error delivering message: {e}")
            return {"status": "error", "message": "Failed to deliver WhatsApp message."}
