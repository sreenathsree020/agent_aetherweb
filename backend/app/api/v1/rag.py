from typing import List
from fastapi import APIRouter, Depends, Body, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_tenant, TenantContext
from app.core.database import get_db
from app.services.rag_service import RAGService

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/index")
async def index_knowledge_text(
    document_name: str = Body(...),
    content: str = Body(...),
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Index a knowledge base document or FAQ text for RAG retrieval."""
    chunks = await RAGService.index_document(db, tenant.tenant_id, document_name, content)
    return {
        "status": "indexed",
        "document_name": document_name,
        "chunks_count": len(chunks)
    }


@router.post("/search")
async def search_knowledge(
    query: str = Body(..., embed=True),
    top_k: int = Body(3, embed=True),
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Search knowledge base and return matching context chunks."""
    results = await RAGService.search_knowledge(db, tenant.tenant_id, query, top_k)
    return {"query": query, "matches": results}
