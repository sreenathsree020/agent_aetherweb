import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON
from app.core.database import Base


class AddonConfig(Base):
    __tablename__ = "addon_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), index=True, nullable=False, default="default")
    addon_type = Column(String(32), nullable=False)  # 'database', 'gmail', 'whatsapp'
    name = Column(String(128), nullable=False)
    enabled = Column(Boolean, default=True)
    encrypted_config = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowGraph(Base):
    __tablename__ = "workflow_graphs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), index=True, nullable=False, default="default")
    name = Column(String(128), default="Main Voice Addon Workflow")
    nodes = Column(JSON, nullable=False, default=list)
    edges = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
