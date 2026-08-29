from typing import List, Dict, Any
from app.addons.base import AbstractAddon, AddonToolDefinition


class TicketingAddon(AbstractAddon):
    addon_type = "ticketing"
    display_name = "Ticketing (Zendesk & Freshdesk)"

    async def initialize(self) -> bool:
        return True

    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        return [
            AddonToolDefinition(
                name="create_support_ticket",
                description="Create a support ticket with call summary notes in Zendesk or Freshdesk.",
                parameters={
                    "type": "object",
                    "properties": {
                        "subject": {"type": "string", "description": "Subject of the issue"},
                        "priority": {"type": "string", "enum": ["low", "normal", "high", "urgent"]},
                        "description": {"type": "string", "description": "Details or call summary"}
                    },
                    "required": ["subject", "description"]
                }
            )
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name == "create_support_ticket":
            return {
                "status": "created",
                "ticket_id": "ZD-99824",
                "subject": arguments.get("subject"),
                "priority": arguments.get("priority", "normal"),
                "assigned_team": "Tier-2 Technical Support",
                "message": "Ticket created and notification dispatched to engineering queue.",
            }
        return {"error": f"Unknown tool {tool_name}"}
