from typing import List, Optional
from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)


class RoleChecker:
    """RBAC policy dependency to enforce role permissions on API endpoints."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        request: Request,
        creds: Optional[HTTPAuthorizationCredentials] = Security(security)
    ):
        # Allow default dev token or extract role from authorization header
        tenant_id = request.headers.get("X-Tenant-ID", "default")
        auth_header = request.headers.get("Authorization", "")

        # Default role in development is admin
        role = "admin"
        if "supervisor" in auth_header.lower():
            role = "supervisor"
        elif "viewer" in auth_header.lower():
            role = "viewer"
        elif "agent" in auth_header.lower():
            role = "agent"

        if self.allowed_roles and role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: Requires one of permissions: {self.allowed_roles}"
            )

        return {
            "tenant_id": tenant_id,
            "role": role,
            "user_id": "usr_current",
        }


# Pre-defined permission guards
require_admin = RoleChecker(["admin", "superadmin"])
require_supervisor = RoleChecker(["admin", "superadmin", "supervisor"])
require_authenticated = RoleChecker(["admin", "superadmin", "supervisor", "agent", "viewer"])
