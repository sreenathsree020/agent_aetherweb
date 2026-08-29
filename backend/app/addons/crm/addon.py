from typing import List, Dict, Any
from app.addons.base import AbstractAddon, AddonToolDefinition


class CRMAddon(AbstractAddon):
    addon_type = "crm"
    display_name = "CRM Connector (HubSpot & Salesforce)"

    async def initialize(self) -> bool:
        return True

    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        return [
            AddonToolDefinition(
                name="get_crm_customer",
                description="Look up customer tier, account manager, and open deals from CRM using caller phone number.",
                parameters={
                    "type": "object",
                    "properties": {
                        "phone": {"type": "string", "description": "Customer phone number"}
                    },
                    "required": ["phone"]
                }
            ),
            AddonToolDefinition(
                name="update_crm_deal_stage",
                description="Update the sales deal stage in CRM for the customer.",
                parameters={
                    "type": "object",
                    "properties": {
                        "deal_name": {"type": "string", "description": "Name of the deal"},
                        "stage": {"type": "string", "enum": ["Contacted", "Qualified", "Proposal Sent", "Closed Won"]}
                    },
                    "required": ["deal_name", "stage"]
                }
            )
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name == "get_crm_customer":
            return {
                "status": "success",
                "customer_name": "Riya Sharma",
                "company": "Apex Media",
                "account_tier": "VIP Enterprise",
                "account_manager": "Amit Patel",
                "open_deals": ["Q3 AI Campaign Expansion - ₹5.62L"],
            }
        elif tool_name == "update_crm_deal_stage":
            return {
                "status": "updated",
                "deal_name": arguments.get("deal_name"),
                "new_stage": arguments.get("stage"),
                "updated_at": "Just now",
            }
        return {"error": f"Unknown tool {tool_name}"}
