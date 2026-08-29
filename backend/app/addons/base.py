from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class AddonToolDefinition(BaseModel):
    name: str = Field(..., description="Tool/Function name (snake_case)")
    description: str = Field(..., description="Description for LLM when to call this tool")
    parameters: Dict[str, Any] = Field(..., description="JSON Schema for arguments")


class AbstractAddon(ABC):
    """Abstract base class for all in-call addons."""

    def __init__(self, tenant_id: str, config: Dict[str, Any]):
        self.tenant_id = tenant_id
        self.config = config

    @abstractmethod
    async def initialize(self) -> bool:
        """Validate credentials or initialize client connection pools."""
        pass

    @abstractmethod
    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        """Return OpenAI-compatible function calling schemas."""
        pass

    @abstractmethod
    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute the tool function during a live voice call."""
        pass

    async def prefetch_context(self, caller_id: str) -> Optional[Dict[str, Any]]:
        """Optional hook executed when a call connects to prime context."""
        return None

    async def close(self) -> None:
        """Cleanup connection pools or resources."""
        pass
