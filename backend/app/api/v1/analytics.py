from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant, TenantContext
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def get_analytics_summary(
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve end-to-end latency waterfall, sentiment distribution, and intent analysis."""
    summary = await AnalyticsService.get_tenant_analytics_summary(db, tenant.tenant_id)
    return summary
