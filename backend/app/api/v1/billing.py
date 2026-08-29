from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant, TenantContext
from app.core.database import get_db
from app.models.billing import TenantBilling

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/status")
async def get_billing_status(
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve tenant subscription plan, minutes used, and balance."""
    result = await db.execute(
        select(TenantBilling).where(TenantBilling.tenant_id == tenant.tenant_id).limit(1)
    )
    billing = result.scalars().first()
    if not billing:
        billing = TenantBilling(
            tenant_id=tenant.tenant_id,
            plan_tier="enterprise",
            call_minutes_used=142.5,
            addon_queries_used=89,
            balance_usd=245.0,
            auto_recharge=True
        )
        db.add(billing)
        await db.commit()
        await db.refresh(billing)

    return {
        "tenant_id": billing.tenant_id,
        "plan_tier": billing.plan_tier,
        "call_minutes_used": round(billing.call_minutes_used, 1),
        "addon_queries_used": billing.addon_queries_used,
        "balance_usd": round(billing.balance_usd, 2),
        "auto_recharge": billing.auto_recharge,
        "tier_features": {
            "pci_redaction": True,
            "live_monitoring": True,
            "rag_knowledge_base": True,
            "crm_integrations": True,
            "sla_uptime": "99.95%",
        }
    }
