import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from app.core.database import Base


class CallRecord(Base):
    __tablename__ = "call_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), index=True, nullable=False, default="default")
    call_sid = Column(String(128), index=True, nullable=False)
    caller = Column(String(64), default="unknown")
    recipient = Column(String(64), default="unknown")
    status = Column(String(32), default="active")  # 'active', 'completed', 'failed'
    duration_seconds = Column(Float, default=0.0)
    turns_count = Column(Integer, default=0)
    transcript = Column(JSON, default=list)  # list of turns {timestamp, customer, agent}
    tools_used = Column(JSON, default=list)  # list of tool calls executed
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
