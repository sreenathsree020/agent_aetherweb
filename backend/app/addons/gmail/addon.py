import logging
from typing import Dict, Any, List, Optional
import httpx
from app.addons.base import AbstractAddon, AddonToolDefinition

logger = logging.getLogger(__name__)


class GmailAddon(AbstractAddon):
    """Search caller emails and extract context (e.g., invoices, tickets)."""

    def __init__(self, tenant_id: str, config: Dict[str, Any]):
        super().__init__(tenant_id, config)
        self.access_token = config.get("access_token") or config.get("token")
        self.email_address = config.get("email_address", "me")

    async def initialize(self) -> bool:
        return bool(self.access_token)

    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        return [
            AddonToolDefinition(
                name="search_customer_emails",
                description="Search recent emails from or related to the customer for receipts, order confirmations, or tracking updates.",
                parameters={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Keywords to search for (e.g., 'order', 'tracking', 'invoice', or an ID)"
                        }
                    },
                    "required": ["query"]
                }
            )
        ]

    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        if tool_name != "search_customer_emails":
            return {"error": f"Unknown tool '{tool_name}' for GmailAddon"}

        if not self.access_token:
            return {"status": "unauthenticated", "message": "Gmail OAuth is not connected."}

        query = arguments.get("query", "")
        caller_email = context.get("caller_email")
        search_query = f"from:{caller_email} {query}" if caller_email else query

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                    headers=headers,
                    params={"q": search_query, "maxResults": 2}
                )
                if res.status_code == 401:
                    return {"status": "auth_expired", "message": "Gmail access token expired. Needs re-auth."}
                if res.status_code != 200:
                    return {"status": "error", "message": f"Gmail API returned {res.status_code}"}

                messages = res.json().get("messages", [])
                if not messages:
                    return {"status": "not_found", "message": f"No recent emails found matching '{query}'."}

                first_id = messages[0]["id"]
                detail_res = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{first_id}",
                    headers=headers,
                    params={"format": "snippet"}
                )
                snippet = detail_res.json().get("snippet", "")
                logger.info(f"[GmailAddon] Found message snippet: {snippet[:80]}...")
                return {
                    "status": "found",
                    "query": query,
                    "snippet": snippet
                }
        except Exception as e:
            logger.error(f"[GmailAddon] Error during Gmail search: {e}")
            return {"status": "error", "message": "Could not retrieve email records."}
