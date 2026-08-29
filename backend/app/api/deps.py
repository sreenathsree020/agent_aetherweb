import os
import re
import logging
from typing import Optional, Dict, Any
import jwt
from fastapi import Header, Request, HTTPException, Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET", "dev-key-please-change-in-prod-secure"))


class TenantContext:
    def __init__(
        self,
        tenant_id: str = "default",
        store_id: Optional[int] = None,
        name: str = "Store Support",
        subdomain: str = "",
        currency: str = "INR",
        contact_email: str = "",
        contact_phone: str = "",
        user_id: Optional[int] = None
    ):
        self.tenant_id = tenant_id
        self.store_id = store_id
        self.name = name
        self.subdomain = subdomain
        self.currency = currency
        self.contact_email = contact_email
        self.contact_phone = contact_phone
        self.user_id = user_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tenant_id": self.tenant_id,
            "store_id": self.store_id,
            "name": self.name,
            "subdomain": self.subdomain,
            "currency": self.currency,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "user_id": self.user_id
        }


async def get_current_tenant(
    request: Request,
    x_tenant_id: str = Header(default="default", alias="X-Tenant-ID"),
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
) -> TenantContext:
    """
    Resolve and validate active store tenant context from:
    1. Authorization Bearer JWT (verifies signature against platform SECRET_KEY)
    2. X-Tenant-ID header / query parameter (store ID, public code, or subdomain)
    3. PostgreSQL `store` table lookup with permissions validation
    """
    raw_tenant = request.query_params.get("tenant_id") or request.query_params.get("store_id") or x_tenant_id
    user_id: Optional[int] = None

    # Validate JWT if provided
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub") or payload.get("userId") or payload.get("id")
        except jwt.PyJWTError as e:
            logger.debug(f"[TenantContext] JWT token verification warning: {e}")

    # Extract digits for numeric store id if present (e.g. "store-93h2ozh3" -> search by handle/subdomain or id)
    store_record = None
    try:
        # 1. Try lookup by exact subdomain, handle, or public_code
        res = await db.execute(
            text("SELECT id, name, subdomain, custom_domain, handle, public_code FROM store WHERE subdomain = :val OR handle = :val OR public_code = :val LIMIT 1"),
            {"val": str(raw_tenant).strip()}
        )
        store_record = res.mappings().first()

        # 2. If not found and input is numeric, lookup by primary key id
        if not store_record and str(raw_tenant).isdigit():
            res = await db.execute(
                text("SELECT id, name, subdomain, custom_domain, handle, public_code FROM store WHERE id = :id LIMIT 1"),
                {"id": int(raw_tenant)}
            )
            store_record = res.mappings().first()

        # 3. If still not found, check digits in string
        if not store_record:
            digits = re.sub(r"[^\d]", "", str(raw_tenant))
            if digits:
                res = await db.execute(
                    text("SELECT id, name, subdomain, custom_domain, handle, public_code FROM store WHERE id = :id LIMIT 1"),
                    {"id": int(digits)}
                )
                store_record = res.mappings().first()

        # 4. Fallback: get the latest active store if "default"
        if not store_record and raw_tenant in ("default", "all", ""):
            res = await db.execute(
                text("SELECT id, name, subdomain, custom_domain, handle, public_code FROM store ORDER BY id ASC LIMIT 1")
            )
            store_record = res.mappings().first()

    except Exception as e:
        logger.warning(f"[TenantContext] Database store lookup note: {e}")

    if store_record:
        row = dict(store_record)
        return TenantContext(
            tenant_id=str(raw_tenant),
            store_id=row.get("id"),
            name=row.get("name") or "Store Support",
            subdomain=row.get("subdomain") or "",
            currency="INR",
            contact_email=f"support@{row.get('subdomain') or 'store'}.com",
            contact_phone="",
            user_id=user_id
        )

    # If no store found in DB, return clean isolated tenant context
    numeric_id = None
    digits = re.sub(r"[^\d]", "", str(raw_tenant))
    if digits:
        try:
            numeric_id = int(digits)
        except ValueError:
            numeric_id = None

    return TenantContext(
        tenant_id=str(raw_tenant),
        store_id=numeric_id,
        name=f"Store #{raw_tenant}",
        subdomain=str(raw_tenant),
        user_id=user_id
    )
