import asyncio
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.addon import AddonConfig
from app.core.security import decrypt_credential
from app.addons.base import AbstractAddon
from app.addons.store_tools import StoreToolsAddon
from app.addons.database.addon import DatabaseAddon
from app.addons.gmail.addon import GmailAddon
from app.addons.whatsapp.addon import WhatsAppAddon
from app.addons.crm.addon import CRMAddon
from app.addons.ticketing.addon import TicketingAddon
from app.addons.calendar.addon import CalendarAddon

logger = logging.getLogger(__name__)

ADDON_CLASS_MAP = {
    "store_tools": StoreToolsAddon,
    "database": DatabaseAddon,
    "gmail": GmailAddon,
    "whatsapp": WhatsAppAddon,
    "crm": CRMAddon,
    "ticketing": TicketingAddon,
    "calendar": CalendarAddon,
}


class AddonRunner:
    """Manages active tenant addons, formats OpenAI tool schemas, and executes tools."""

    def __init__(self):
        self._tenant_addons_cache: Dict[str, List[AbstractAddon]] = {}
        self._tool_dispatch_map: Dict[tuple, AbstractAddon] = {}

    async def load_tenant_addons(self, tenant_id: str = "default", force_refresh: bool = False) -> List[AbstractAddon]:
        if not force_refresh and tenant_id in self._tenant_addons_cache:
            return self._tenant_addons_cache[tenant_id]

        from app.core.database import init_db
        await init_db()

        addons: List[AbstractAddon] = []
        try:
            # 1. Always attach first-class StoreToolsAddon for real store data lookups
            store_tools = StoreToolsAddon(tenant_id=tenant_id)
            await store_tools.initialize()
            addons.append(store_tools)
            for tool in store_tools.get_tool_definitions():
                self._tool_dispatch_map[(tenant_id, tool.name)] = store_tools

            # 2. Query configured dynamic addons from database
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

                        for tool in addon_inst.get_tool_definitions():
                            self._tool_dispatch_map[(tenant_id, tool.name)] = addon_inst

            self._tenant_addons_cache[tenant_id] = addons
        except Exception as e:
            logger.error(f"[AddonRunner] Failed loading addons for tenant {tenant_id}: {e}")
            # Fallback to store tools
            fallback = StoreToolsAddon(tenant_id=tenant_id)
            await fallback.initialize()
            for tool in fallback.get_tool_definitions():
                self._tool_dispatch_map[(tenant_id, tool.name)] = fallback
            addons = [fallback]
            self._tenant_addons_cache[tenant_id] = addons

        return addons

    async def get_openai_tools_for_tenant(self, tenant_id: str = "default") -> List[Dict[str, Any]]:
        """Return array of tools in standard OpenAI format."""
        addons = await self.load_tenant_addons(tenant_id)
        tools = []
        seen_names = set()
        for addon in addons:
            for defn in addon.get_tool_definitions():
                if defn.name in seen_names:
                    continue
                seen_names.add(defn.name)
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
            await self.load_tenant_addons(tenant_id, force_refresh=True)
            addon = self._tool_dispatch_map.get((tenant_id, tool_name))

        if not addon:
            logger.warning(f"[AddonRunner] No addon registered for tool: {tool_name}")
            return {"error": f"Tool '{tool_name}' not available for tenant {tenant_id}"}

        try:
            logger.info("[AddonRunner] Executing '%s'", tool_name)
            result = await asyncio.wait_for(addon.execute_tool(tool_name, arguments, context), timeout=4.0)
            return result
        except asyncio.TimeoutError:
            logger.error("[AddonRunner] Timeout executing '%s'", tool_name)
            return {"error": "Lookup timed out"}
        except Exception:
            logger.error("[AddonRunner] Error executing '%s'", tool_name, exc_info=True)
            return {"error": "Tool failed"}

    def invalidate_tenant(self, tenant_id: str):
        self._tenant_addons_cache.pop(tenant_id, None)
        keys_to_del = [k for k in self._tool_dispatch_map if k[0] == tenant_id]
        for k in keys_to_del:
            self._tool_dispatch_map.pop(k, None)
