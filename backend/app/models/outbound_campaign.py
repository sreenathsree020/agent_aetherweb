import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from app.core.database import Base


class OutboundCampaign(Base):
    __tablename__ = "outbound_campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), index=True, nullable=False, default="default")
    name = Column(String(128), nullable=False)
    description = Column(String(256), nullable=True)
    target_numbers = Column(JSON, default=list)  # List of target dicts: {phone, name, custom_data}
    workflow_id = Column(String(36), nullable=True)
    status = Column(String(32), default="pending")  # 'pending', 'running', 'paused', 'completed'
    scheduled_at = Column(DateTime, nullable=True)
    total_count = Column(Integer, default=0)
    completed_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
