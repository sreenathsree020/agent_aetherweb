from typing import List, Dict, Any
from app.addons.base import AbstractAddon, AddonToolDefinition


class CalendarAddon(AbstractAddon):
    addon_type = "calendar"
    display_name = "Calendar Booking (Google Calendar & Cal.com)"

    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        return [
            AddonToolDefinition(
                name="check_availability",
                description="Check available appointment slots for a specialist or sales manager.",
                parameters={
                    "type": "object",
                    "properties": {
                        "date": {"type": "string", "description": "Date to check (YYYY-MM-DD or 'tomorrow')"}
                    },
                    "required": ["date"]
                }
            ),
            AddonToolDefinition(
                name="book_appointment",
                description="Book a confirmed calendar meeting slot for the caller.",
                parameters={
                    "type": "object",
                    "properties": {
                        "date": {"type": "string", "description": "Date of meeting"},
                        "time": {"type": "string", "description": "Time slot (e.g., '14:00' or '2:00 PM')"},
                        "attendee_name": {"type": "string", "description": "Caller name"},
                        "topic": {"type": "string", "description": "Meeting topic"}
                    },
                    "required": ["date", "time", "attendee_name"]
                }
            )
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name == "check_availability":
            return {
                "status": "available",
                "date": arguments.get("date"),
                "available_slots": ["10:00 AM", "02:30 PM", "04:00 PM"],
            }
        elif tool_name == "book_appointment":
            return {
                "status": "confirmed",
                "booking_id": "CAL-7712",
                "date": arguments.get("date"),
                "time": arguments.get("time"),
                "attendee": arguments.get("attendee_name"),
                "meeting_link": "https://meet.google.com/xyz-voice-agent",
                "calendar_invite_sent": True,
            }
        return {"error": f"Unknown tool {tool_name}"}
