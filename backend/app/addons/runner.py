import logging
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.addon import AddonConfig
from app.core.security import decrypt_credential
from app.addons.base import AbstractAddon
from app.addons.database.addon import DatabaseAddon
from app.addons.gmail.addon import GmailAddon
from app.addons.whatsapp.addon import WhatsAppAddon

logger = logging.getLogger(__name__)

ADDON_CLASS_MAP = {
    "database": DatabaseAddon,
    "gmail": GmailAddon,
    "whatsapp": WhatsAppAddon
}


class AddonRunner:
    """Manages active tenant addons, formats OpenAI tool schemas, and executes tools."""

    def __init__(self):
        # Cache of initialized addons per tenant: {tenant_id: [AbstractAddon, ...]}
        self._tenant_addons_cache: Dict[str, List[AbstractAddon]] = {}
        # Tool name to addon instance mapping: {(tenant_id, tool_name): AbstractAddon}
        self._tool_dispatch_map: Dict[tuple, AbstractAddon] = {}

    async def load_tenant_addons(self, tenant_id: str = "default", force_refresh: bool = False) -> List[AbstractAddon]:
        if not force_refresh and tenant_id in self._tenant_addons_cache:
            return self._tenant_addons_cache[tenant_id]

        from app.core.database import init_db
        await init_db()

        addons: List[AbstractAddon] = []
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(AddonConfig).where(
                        AddonConfig.tenant_id == tenant_id,
                        AddonConfig.enabled == True
                    )
                )
                configs = result.scalars().all()

                for cfg in configs:
                    addon_cls = ADDON_CLASS_MAP.get(cfg.addon_type)
                    if not addon_cls:
                        continue
                    decrypted_cfg = decrypt_credential(cfg.encrypted_config)
                    if isinstance(decrypted_cfg, dict):
                        addon_inst = addon_cls(tenant_id=tenant_id, config=decrypted_cfg)
                        await addon_inst.initialize()
                        addons.append(addon_inst)

                        # Register tool dispatch
                        for tool in addon_inst.get_tool_definitions():
                            self._tool_dispatch_map[(tenant_id, tool.name)] = addon_inst

            # If no DB addons configured yet, initialize default in-memory sandbox addons
            if not addons:
                addons = self._create_default_sandbox_addons(tenant_id)

            self._tenant_addons_cache[tenant_id] = addons
        except Exception as e:
            logger.error(f"[AddonRunner] Failed loading addons for tenant {tenant_id}: {e}")
            addons = self._create_default_sandbox_addons(tenant_id)
            self._tenant_addons_cache[tenant_id] = addons

        return addons

    def _create_default_sandbox_addons(self, tenant_id: str) -> List[AbstractAddon]:
        addons = [
            DatabaseAddon(tenant_id, {
                "engine": "sqlite",
                "database": "voice_agent.db",
                "query_template": "SELECT id, caller, status FROM call_records WHERE caller = :caller_phone LIMIT 1"
            }),
            WhatsAppAddon(tenant_id, {}),
            GmailAddon(tenant_id, {})
        ]
        for a in addons:
            for tool in a.get_tool_definitions():
                self._tool_dispatch_map[(tenant_id, tool.name)] = a
        return addons

    async def get_openai_tools_for_tenant(self, tenant_id: str = "default") -> List[Dict[str, Any]]:
        """Return array of tools in standard OpenAI format."""
        addons = await self.load_tenant_addons(tenant_id)
        tools = []
        for addon in addons:
            for defn in addon.get_tool_definitions():
                tools.append({
                    "type": "function",
                    "function": {
                        "name": defn.name,
                        "description": defn.description,
                        "parameters": defn.parameters
                    }
                })
        return tools

    async def execute_tool(
        self,
        tenant_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Dispatch tool call to appropriate addon."""
        addon = self._tool_dispatch_map.get((tenant_id, tool_name))
        if not addon:
            # Refresh if newly added
            await self.load_tenant_addons(tenant_id, force_refresh=True)
            addon = self._tool_dispatch_map.get((tenant_id, tool_name))

        if not addon:
            logger.warning(f"[AddonRunner] No addon registered for tool: {tool_name}")
            return {"error": f"Tool '{tool_name}' not available for tenant {tenant_id}"}

        try:
            logger.info(f"[AddonRunner] Executing '{tool_name}' for tenant '{tenant_id}'...")
            result = await addon.execute_tool(tool_name, arguments, context)
            return result
        except Exception as e:
            logger.error(f"[AddonRunner] Error executing '{tool_name}': {e}", exc_info=True)
            return {"error": str(e)}

    def invalidate_tenant(self, tenant_id: str):
        self._tenant_addons_cache.pop(tenant_id, None)
        # Clear tool mappings for tenant
        keys_to_del = [k for k in self._tool_dispatch_map if k[0] == tenant_id]
        for k in keys_to_del:
            self._tool_dispatch_map.pop(k, None)
