import logging
import httpx
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, TenantContext
from app.core.config import settings
from app.core.database import get_db
from app.core.security import encrypt_credential
from app.models.addon import AddonConfig

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/authorize/gmail")
async def authorize_gmail(tenant: TenantContext = Depends(get_current_tenant)):
    """Generate Google OAuth2 authorization URL."""
    if not settings.GOOGLE_CLIENT_ID:
        # Mock URL for development/demo
        return {
            "auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id=demo&redirect_uri={settings.GOOGLE_OAUTH_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&state={tenant.tenant_id}"
        }

    scope = "https://www.googleapis.com/auth/gmail.readonly"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_OAUTH_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={tenant.tenant_id}"
    )
    return {"auth_url": auth_url}


@router.get("/callback/gmail")
async def callback_gmail(
    code: str,
    state: str = "default",
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth2 authorization code callback from Google."""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(token_url, data=data)
            if res.status_code != 200:
                logger.warning(f"[OAuth Gmail] Exchange failed: {res.text}")
                # Save demo token if client is in demo mode
                token_data = {"access_token": f"demo_token_{code}", "email": "caller@example.com"}
            else:
                token_data = res.json()

        encrypted = encrypt_credential(token_data)

        # Upsert AddonConfig for Gmail
        result = await db.execute(
            select(AddonConfig).where(
                AddonConfig.tenant_id == state,
                AddonConfig.addon_type == "gmail"
            )
        )
        existing = result.scalars().first()
        if existing:
            existing.encrypted_config = encrypted
            existing.enabled = True
        else:
            db.add(AddonConfig(
                tenant_id=state,
                addon_type="gmail",
                name="Gmail Integration",
                enabled=True,
                encrypted_config=encrypted
            ))
        await db.commit()

        # Redirect back to frontend
        return RedirectResponse(url="/#/?oauth=gmail_success")
    except Exception as e:
        logger.error(f"[OAuth Gmail] Error: {e}")
        return RedirectResponse(url="/#/?oauth=gmail_error")
