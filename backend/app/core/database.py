from typing import AsyncGenerator
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

_db_initialized = False


async def init_db():
    """Create tables if they do not exist and apply non-destructive column migrations."""
    global _db_initialized
    # Import all models so Base.metadata is populated
    from app.models.addon import AddonConfig, WorkflowGraph
    from app.models.call_record import CallRecord
    from app.models.knowledge import KnowledgeChunk
    from app.models.outbound_campaign import OutboundCampaign
    from app.models.billing import TenantBilling

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Non-destructive column additions for SQLite if upgrading existing database
        if settings.DATABASE_URL.startswith("sqlite"):
            new_columns = [
                ("direction", "TEXT DEFAULT 'inbound'"),
                ("latency_profile", "JSON DEFAULT '{}'"),
                ("primary_intent", "TEXT DEFAULT 'general_inquiry'"),
                ("extracted_entities", "JSON DEFAULT '{}'"),
                ("sentiment_score", "FLOAT DEFAULT 0.0"),
                ("sentiment_label", "TEXT DEFAULT 'neutral'"),
                ("recording_url", "TEXT"),
                ("pci_sanitized", "BOOLEAN DEFAULT 0"),
            ]
            for col_name, col_type in new_columns:
                try:
                    await conn.execute(text(f"ALTER TABLE call_records ADD COLUMN {col_name} {col_type};"))
                except Exception:
                    pass  # Column already exists

    _db_initialized = True
    logger.info("Database tables & schemas verified / initialized.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    global _db_initialized
    if not _db_initialized:
        await init_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
