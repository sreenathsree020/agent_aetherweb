import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON
from app.core.database import Base


class CallRecord(Base):
    __tablename__ = "call_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), index=True, nullable=False, default="default")
    call_sid = Column(String(128), index=True, nullable=False)
    direction = Column(String(16), default="inbound")  # 'inbound' | 'outbound'
    caller = Column(String(64), default="unknown")
    recipient = Column(String(64), default="unknown")
    status = Column(String(32), default="active")  # 'active', 'completed', 'failed', 'transferred'
    duration_seconds = Column(Float, default=0.0)
    turns_count = Column(Integer, default=0)

    # Telemetry and Latency Breakdown (ms)
    latency_profile = Column(JSON, default=dict)  # {"stt_ms": 184, "llm_ttft_ms": 312, "tts_ms": 128, "total_ms": 624}

    # AI Conversation Intelligence
    primary_intent = Column(String(64), nullable=True, default="general_inquiry")
    extracted_entities = Column(JSON, default=dict)
    sentiment_score = Column(Float, default=0.0)  # -1.0 to +1.0
    sentiment_label = Column(String(16), default="neutral")  # 'positive' | 'neutral' | 'negative'

    # Compliance & Recording
    recording_url = Column(String(512), nullable=True)
    pci_sanitized = Column(Boolean, default=False)

    transcript = Column(JSON, default=list)  # list of turns {timestamp, customer, agent}
    tools_used = Column(JSON, default=list)  # list of tool calls executed
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
