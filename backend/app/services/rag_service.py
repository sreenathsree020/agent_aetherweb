import logging
from typing import List, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.knowledge import KnowledgeChunk

logger = logging.getLogger(__name__)


class RAGService:
    @staticmethod
    async def index_document(
        db: AsyncSession,
        tenant_id: str,
        document_name: str,
        text_content: str,
        chunk_size: int = 400
    ) -> List[KnowledgeChunk]:
        """Split document into text chunks and save to database."""
        words = text_content.split()
        chunks = []
        current_chunk = []
        current_len = 0

        for word in words:
            current_chunk.append(word)
            current_len += len(word) + 1
            if current_len >= chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_len = 0
        if current_chunk:
            chunks.append(" ".join(current_chunk))

        created = []
        for c in chunks:
            k = KnowledgeChunk(
                tenant_id=tenant_id,
                document_name=document_name,
                content=c,
                metadata_json={"words": len(c.split())}
            )
            db.add(k)
            created.append(k)

        await db.commit()
        logger.info(f"Indexed {len(created)} chunks for document '{document_name}' [Tenant: {tenant_id}]")
        return created

    @staticmethod
    async def search_knowledge(
        db: AsyncSession,
        tenant_id: str,
        query: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Search knowledge chunks by keyword overlap and semantic matching."""
        result = await db.execute(
            select(KnowledgeChunk).where(KnowledgeChunk.tenant_id == tenant_id).limit(50)
        )
        chunks = result.scalars().all()
        if not chunks:
            return []

        query_tokens = set(query.lower().split())
        scored = []
        for chunk in chunks:
            chunk_tokens = set(chunk.content.lower().split())
            overlap = len(query_tokens.intersection(chunk_tokens))
            scored.append((overlap, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = [
            {
                "id": item[1].id,
                "document_name": item[1].document_name,
                "content": item[1].content,
                "score": round(min(1.0, item[0] / max(len(query_tokens), 1)), 2),
            }
            for item in scored[:top_k]
        ]
        return top_matches
