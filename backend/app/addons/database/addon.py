import logging
import re
from typing import Dict, Any, List, Optional
import sqlalchemy
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from app.addons.base import AbstractAddon, AddonToolDefinition

logger = logging.getLogger(__name__)

DISALLOWED_SQL_PATTERNS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b",
    re.IGNORECASE
)


class DatabaseAddon(AbstractAddon):
    """Read-only database connector for real-time customer and order lookups."""

    def __init__(self, tenant_id: str, config: Dict[str, Any]):
        super().__init__(tenant_id, config)
        self.engine: Optional[AsyncEngine] = None
        self.query_template: str = config.get(
            "query_template",
            "SELECT id, status, total FROM orders WHERE phone = :caller_phone LIMIT 1"
        )

    async def initialize(self) -> bool:
        engine_type = self.config.get("engine", "postgresql").lower()
        user = self.config.get("username", "")
        password = self.config.get("password", "")
        host = self.config.get("host", "localhost")
        port = self.config.get("port", 5432)
        database = self.config.get("database", "")

        if engine_type == "postgresql":
            url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}"
            connect_args = {"command_timeout": 2.0}
        elif engine_type == "mysql":
            url = f"mysql+aiomysql://{user}:{password}@{host}:{port}/{database}"
            connect_args = {"connect_timeout": 2}
        elif engine_type == "sqlite":
            url = f"sqlite+aiosqlite:///{database}"
            connect_args = {"check_same_thread": False}
        else:
            raise ValueError(f"Unsupported database engine '{engine_type}'")

        try:
            self.engine = create_async_engine(
                url,
                pool_size=2,
                max_overflow=0,
                pool_timeout=1.5,
                connect_args=connect_args
            )
            return True
        except Exception as e:
            logger.error(f"[DatabaseAddon] Initialization failed: {e}")
            self.engine = None
            return False

    def get_tool_definitions(self) -> List[AddonToolDefinition]:
        return [
            AddonToolDefinition(
                name="query_customer_database",
                description="Look up customer profile, order status, tracking info, or payment records in the database.",
                parameters={
                    "type": "object",
                    "properties": {
                        "caller_phone": {
                            "type": "string",
                            "description": "Customer phone number (e.g. +1234567890)"
                        },
                        "order_id": {
                            "type": "string",
                            "description": "Order number or transaction ID if mentioned by caller"
                        }
                    }
                }
            )
        ]

    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        if tool_name != "query_customer_database":
            return {"error": f"Unknown tool '{tool_name}' for DatabaseAddon"}

        if not self.engine:
            # Re-initialize on demand
            ok = await self.initialize()
            if not ok:
                return {"status": "error", "message": "Database connection is not configured or offline."}

        query = self.query_template.strip()
        if DISALLOWED_SQL_PATTERNS.search(query):
            logger.warning(f"[DatabaseAddon] Query rejected for safety: {query}")
            return {"status": "error", "message": "Disallowed SQL mutation command rejected."}

        # Resolve parameter bindings
        caller_phone = arguments.get("caller_phone") or context.get("caller") or context.get("caller_phone") or ""
        order_id = arguments.get("order_id", "")
        caller_email = context.get("caller_email", "")

        params = {
            "caller_phone": caller_phone,
            "order_id": order_id,
            "caller_email": caller_email
        }

        try:
            async with self.engine.connect() as conn:
                # Set read only transaction if postgres
                if "postgresql" in str(self.engine.url):
                    try:
                        await conn.execute(sqlalchemy.text("SET TRANSACTION READ ONLY"))
                    except Exception:
                        pass

                stmt = sqlalchemy.text(query)
                result = await conn.execute(stmt, params)
                row = result.mappings().first()
                if row:
                    data = dict(row)
                    logger.info(f"[DatabaseAddon] Query returned record: {data}")
                    return {"status": "found", "data": data}
                return {"status": "not_found", "message": "No matching record found in the database."}
        except Exception as e:
            logger.error(f"[DatabaseAddon] Query execution failed: {e}")
            return {"status": "error", "message": f"Query execution failed: {str(e)}"}

    async def close(self) -> None:
        if self.engine:
            await self.engine.dispose()
