import os
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

DEFAULT_STORE_QUERY = """
SELECT 
    o.id AS order_id, 
    o.total_price, 
    o.status AS order_status, 
    o.mobile AS customer_mobile, 
    o.shipping_address, 
    o.city, 
    o.pincode, 
    o.created_at AS order_date,
    p.method AS payment_method, 
    p.status AS payment_status, 
    p.amount AS payment_amount, 
    p.transaction_id,
    s.tracking_number, 
    s.carrier, 
    s.status AS shipment_status
FROM "order" o
LEFT JOIN payment p ON p.order_id = o.id
LEFT JOIN shipment s ON s.order_id = o.id
WHERE o.store_id = :store_id
  AND (
      o.mobile = :caller_phone 
      OR REPLACE(REPLACE(o.mobile, ' ', ''), '-', '') = :clean_phone
      OR CAST(o.id AS TEXT) = :order_id
  )
ORDER BY o.created_at DESC
LIMIT 1
"""


class DatabaseAddon(AbstractAddon):
    """Read-only database connector for real-time customer, order, payment, and store lookups."""

    def __init__(self, tenant_id: str, config: Dict[str, Any]):
        super().__init__(tenant_id, config)
        self.engine: Optional[AsyncEngine] = None
        raw_q = str(config.get("query_template") or DEFAULT_STORE_QUERY).strip()
        if DISALLOWED_SQL_PATTERNS.search(raw_q) or ";" in raw_q.rstrip(";"):
            raw_q = DEFAULT_STORE_QUERY.strip()
        self.query_template: str = raw_q or DEFAULT_STORE_QUERY.strip()

    async def initialize(self) -> bool:
        engine_type = self.config.get("engine", "postgresql").lower()
        user = self.config.get("username", "")
        password = self.config.get("password", "")
        host = self.config.get("host", "")
        port = self.config.get("port", 5432)
        database = self.config.get("database", "")
        
        # If no explicit host or if host is localhost/default, check environment DATABASE_URL
        env_db_url = os.getenv("DATABASE_URL", "")
        
        if host and host not in ("localhost", "127.0.0.1", "default", "auto") and user:
            if engine_type == "postgresql":
                url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}?ssl=require"
                connect_args = {"command_timeout": 3.0}
            elif engine_type == "mysql":
                url = f"mysql+aiomysql://{user}:{password}@{host}:{port}/{database}"
                connect_args = {"connect_timeout": 3}
            elif engine_type == "sqlite":
                url = f"sqlite+aiosqlite:///{database}"
                connect_args = {"check_same_thread": False}
            else:
                raise ValueError(f"Unsupported database engine '{engine_type}'")
        elif env_db_url:
            # Normalize postgres URL for asyncpg
            clean_url = env_db_url.replace("postgres://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
            # Remove sslmode query if present and pass as connect_args for asyncpg
            if "?" in clean_url:
                clean_url = clean_url.split("?")[0]
            url = clean_url
            connect_args = {"command_timeout": 3.0}
        else:
            url = "sqlite+aiosqlite:///voice_agent.db"
            connect_args = {"check_same_thread": False}

        try:
            self.engine = create_async_engine(
                url,
                pool_size=2,
                max_overflow=0,
                pool_timeout=2.0,
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
                description="Look up customer orders, tracking shipment details, payment status, transaction IDs, or store records in the database.",
                parameters={
                    "type": "object",
                    "properties": {
                        "caller_phone": {
                            "type": "string",
                            "description": "Customer phone number (e.g. +919876543210 or 9876543210)"
                        },
                        "order_id": {
                            "type": "string",
                            "description": "Order number or ID if mentioned by customer"
                        },
                        "inquiry_type": {
                            "type": "string",
                            "enum": ["order_status", "payment_status", "tracking_info", "store_policy", "customer_profile"],
                            "description": "The category of information requested by the caller"
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
            ok = await self.initialize()
            if not ok:
                return {"status": "error", "message": "Database connection is offline."}

        query = self.query_template.strip()
        if DISALLOWED_SQL_PATTERNS.search(query) or ";" in query.rstrip(";"):
            logger.warning("[DatabaseAddon] Query rejected for safety")
            return {"status": "error", "message": "Disallowed SQL mutation command rejected."}
        if ":store_id" not in query:
            query = DEFAULT_STORE_QUERY.strip()

        caller_phone = str(arguments.get("caller_phone") or context.get("caller") or context.get("caller_phone") or "").strip()
        clean_phone = re.sub(r"[^\d+]", "", caller_phone)
        order_id = str(arguments.get("order_id") or "").strip()
        caller_email = str(context.get("caller_email") or "").strip()

        store_id_raw = self.config.get("store_id") or context.get("store_id") or self.tenant_id
        store_id: Optional[int] = None
        if store_id_raw is not None:
            digits = re.sub(r"[^\d]", "", str(store_id_raw))
            if digits:
                try:
                    store_id = int(digits)
                except ValueError:
                    store_id = None
        if store_id is None:
            return {"status": "error", "message": "Store context is required."}

        params = {
            "caller_phone": caller_phone,
            "clean_phone": clean_phone,
            "order_id": order_id,
            "caller_email": caller_email,
            "store_id": store_id
        }

        try:
            async with self.engine.connect() as conn:
                if "postgresql" in str(self.engine.url):
                    try:
                        await conn.execute(sqlalchemy.text("SET TRANSACTION READ ONLY"))
                    except Exception:
                        pass

                stmt = sqlalchemy.text(query)
                result = await conn.execute(stmt, params)
                row = result.mappings().first()
                if row:
                    data = {k: (str(v) if not isinstance(v, (int, float, bool, type(None))) else v) for k, v in dict(row).items()}
                    return {"status": "found", "data": data}
                
                # If not found with exact phone, try fallback search with last 10 digits
                if len(clean_phone) > 10:
                    short_phone = clean_phone[-10:]
                    fallback_params = {**params, "caller_phone": short_phone, "clean_phone": short_phone}
                    result = await conn.execute(stmt, fallback_params)
                    fallback_row = result.mappings().first()
                    if fallback_row:
                        data = {k: (str(v) if not isinstance(v, (int, float, bool, type(None))) else v) for k, v in dict(fallback_row).items()}
                        return {"status": "found", "data": data}

                return {
                    "status": "not_found",
                    "message": "No matching order was found for this store."
                }
        except Exception as e:
            logger.error(f"[DatabaseAddon] Query execution failed: {e}")
            return {"status": "error", "message": "Lookup is temporarily unavailable."}

    async def close(self) -> None:
        if self.engine:
            await self.engine.dispose()
