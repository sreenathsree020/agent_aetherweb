import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from app.core.database import Base


class TenantBilling(Base):
    __tablename__ = "tenant_billing"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), unique=True, index=True, nullable=False, default="default")
    plan_tier = Column(String(32), default="enterprise")  # 'free', 'pro', 'enterprise'
    call_minutes_used = Column(Float, default=0.0)
    addon_queries_used = Column(Integer, default=0)
    balance_usd = Column(Float, default=150.0)
    auto_recharge = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
