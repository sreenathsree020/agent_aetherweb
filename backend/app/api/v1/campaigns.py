from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant, TenantContext
from app.core.database import get_db
from app.models.outbound_campaign import OutboundCampaign

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("")
async def list_campaigns(
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List scheduled and active outbound calling campaigns."""
    result = await db.execute(
        select(OutboundCampaign)
        .where(OutboundCampaign.tenant_id == tenant.tenant_id)
        .order_by(desc(OutboundCampaign.created_at))
    )
    return result.scalars().all()


@router.post("")
async def create_campaign(
    name: str = Body(...),
    description: str = Body(""),
    target_numbers: List[Dict[str, Any]] = Body(default_factory=list),
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create and queue a new outbound dialing campaign."""
    campaign = OutboundCampaign(
        tenant_id=tenant.tenant_id,
        name=name,
        description=description,
        target_numbers=target_numbers,
        status="pending",
        total_count=len(target_numbers),
        completed_count=0,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign
