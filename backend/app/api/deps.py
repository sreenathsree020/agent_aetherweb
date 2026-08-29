from fastapi import Header, Request


class TenantContext:
    def __init__(self, tenant_id: str = "default", name: str = "Demo Organization"):
        self.tenant_id = tenant_id
        self.name = name


async def get_current_tenant(
    x_tenant_id: str = Header(default="default", alias="X-Tenant-ID")
) -> TenantContext:
    """Resolve active tenant context from HTTP header or session."""
    return TenantContext(tenant_id=x_tenant_id)
