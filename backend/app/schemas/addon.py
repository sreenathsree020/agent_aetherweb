from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


class AddonConfigBase(BaseModel):
    addon_type: str = Field(..., description="'database', 'gmail', or 'whatsapp'")
    name: str = Field(..., description="Display name for addon instance")
    enabled: bool = True
    config: Dict[str, Any] = Field(default_factory=dict, description="Addon configuration properties")


class AddonConfigCreate(AddonConfigBase):
    pass


class AddonConfigUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class AddonConfigResponse(BaseModel):
    id: str
    tenant_id: str
    addon_type: str
    name: str
    enabled: bool
    config_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestDatabasePayload(BaseModel):
    engine: str = Field("postgresql", description="'postgresql' or 'mysql'")
    host: str = Field(..., description="Database host")
    port: int = Field(5432, description="Database port")
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Read-only user")
    password: Optional[str] = Field(None, description="Password")
    query_template: str = Field(
        "SELECT id, status FROM orders WHERE phone = :caller_phone LIMIT 1",
        description="Parameterized read-only query template"
    )
    sample_phone: Optional[str] = Field("+10000000000", description="Sample phone to test query with")


class TestWhatsAppPayload(BaseModel):
    phone_number_id: str
    access_token: str
    recipient_phone: str
    message: str = "Test message from Voice Agent Addon platform."


class TestGmailPayload(BaseModel):
    access_token: Optional[str] = None
    query: str = "order"
