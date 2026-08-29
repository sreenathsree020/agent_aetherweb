import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, TenantContext
from app.core.database import get_db
from app.core.security import encrypt_credential, decrypt_credential
from app.models.addon import AddonConfig
from app.schemas.addon import (
    AddonConfigCreate,
    AddonConfigResponse,
    TestDatabasePayload,
    TestWhatsAppPayload,
    TestGmailPayload
)
from app.addons.database.addon import DatabaseAddon
from app.addons.whatsapp.addon import WhatsAppAddon
from app.addons.gmail.addon import GmailAddon

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/addons", tags=["addons"])


@router.get("", response_model=List[AddonConfigResponse])
async def list_addons(
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all addons configured for the active tenant."""
    result = await db.execute(
        select(AddonConfig).where(AddonConfig.tenant_id == tenant.tenant_id)
    )
    records = result.scalars().all()
    out = []
    for r in records:
        decrypted = decrypt_credential(r.encrypted_config)
        summary = ""
        if r.addon_type == "database" and isinstance(decrypted, dict):
            summary = f"{decrypted.get('engine', 'sql')}://{decrypted.get('host', '')}/{decrypted.get('database', '')}"
        elif r.addon_type == "gmail":
            summary = "Gmail OAuth Connected" if decrypted.get("access_token") else "OAuth Pending"
        elif r.addon_type == "whatsapp":
            summary = f"Phone ID: {decrypted.get('phone_number_id', 'Not Set')}"

        out.append(AddonConfigResponse(
            id=r.id,
            tenant_id=r.tenant_id,
            addon_type=r.addon_type,
            name=r.name,
            enabled=r.enabled,
            config_summary=summary,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return out


@router.post("", response_model=AddonConfigResponse)
async def create_or_update_addon(
    payload: AddonConfigCreate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Create or update an addon configuration with AES-256-GCM encryption."""
    encrypted = encrypt_credential(payload.config)

    # Check if exists by name/type
    result = await db.execute(
        select(AddonConfig).where(
            AddonConfig.tenant_id == tenant.tenant_id,
            AddonConfig.addon_type == payload.addon_type,
            AddonConfig.name == payload.name
        )
    )
    existing = result.scalars().first()

    if existing:
        existing.encrypted_config = encrypted
        existing.enabled = payload.enabled
        await db.commit()
        await db.refresh(existing)
        target = existing
    else:
        new_addon = AddonConfig(
            tenant_id=tenant.tenant_id,
            addon_type=payload.addon_type,
            name=payload.name,
            enabled=payload.enabled,
            encrypted_config=encrypted
        )
        db.add(new_addon)
        await db.commit()
        await db.refresh(new_addon)
        target = new_addon

    return AddonConfigResponse(
        id=target.id,
        tenant_id=target.tenant_id,
        addon_type=target.addon_type,
        name=target.name,
        enabled=target.enabled,
        config_summary="Saved and encrypted successfully",
        created_at=target.created_at,
        updated_at=target.updated_at
    )


@router.delete("/{addon_id}")
async def delete_addon(
    addon_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Delete an addon configuration."""
    await db.execute(
        delete(AddonConfig).where(
            AddonConfig.id == addon_id,
            AddonConfig.tenant_id == tenant.tenant_id
        )
    )
    await db.commit()
    return {"status": "deleted", "id": addon_id}


@router.post("/database/test")
async def test_database(payload: TestDatabasePayload):
    """Test read-only database connection and sample query execution."""
    config = payload.model_dump()
    addon = DatabaseAddon(tenant_id="test", config=config)
    try:
        ok = await addon.initialize()
        if not ok:
            raise HTTPException(status_code=400, detail="Database connection could not be established.")

        sample_res = await addon.execute_tool(
            tool_name="query_customer_database",
            arguments={"caller_phone": payload.sample_phone, "order_id": "TEST_ORD_1"},
            context={"caller_phone": payload.sample_phone}
        )
        await addon.close()
        return {"success": True, "result": sample_res}
    except Exception as e:
        logger.error(f"[TestDB] Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/whatsapp/test")
async def test_whatsapp(payload: TestWhatsAppPayload):
    """Send a test WhatsApp message."""
    addon = WhatsAppAddon(tenant_id="test", config=payload.model_dump())
    res = await addon.execute_tool(
        tool_name="send_whatsapp_message",
        arguments={
            "recipient_phone": payload.recipient_phone,
            "message_text": payload.message
        },
        context={}
    )
    return {"success": True, "result": res}


@router.post("/gmail/test")
async def test_gmail(payload: TestGmailPayload):
    """Test Gmail search."""
    addon = GmailAddon(tenant_id="test", config=payload.model_dump())
    res = await addon.execute_tool(
        tool_name="search_customer_emails",
        arguments={"query": payload.query},
        context={}
    )
    return {"success": True, "result": res}
