import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from app.core.database import Base


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), index=True, nullable=False, default="default")
    document_name = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    embedding = Column(JSON, nullable=True)  # JSON or Vector(1536) for embeddings
    created_at = Column(DateTime, default=datetime.utcnow)
