from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, TenantContext
from app.core.database import get_db
from app.models.addon import WorkflowGraph
from app.schemas.workflow import WorkflowGraphCreate, WorkflowGraphResponse

router = APIRouter(prefix="/workflows", tags=["workflows"])

DEFAULT_NODES = [
    {
        "id": "node-trigger-1",
        "type": "addonNode",
        "position": {"x": 60, "y": 200},
        "data": {
            "label": "Inbound Call Trigger",
            "addonType": "trigger",
            "status": "connected",
            "configSummary": "Exotel Telephony / Browser Microphone stream"
        }
    },
    {
        "id": "node-llm-1",
        "type": "addonNode",
        "position": {"x": 310, "y": 200},
        "data": {
            "label": "OpenRouter AI",
            "addonType": "llm",
            "status": "connected",
            "configSummary": "openrouter/free"
        }
    },
    {
        "id": "node-db-1",
        "type": "addonNode",
        "position": {"x": 580, "y": 120},
        "data": {
            "label": "Order Database",
            "addonType": "database",
            "status": "connected",
            "configSummary": "SELECT id, status, total FROM orders WHERE phone = :caller_phone"
        }
    },
    {
        "id": "node-wa-1",
        "type": "addonNode",
        "position": {"x": 580, "y": 290},
        "data": {
            "label": "WhatsApp Messenger",
            "addonType": "whatsapp",
            "status": "connected",
            "configSummary": "Send order tracking link and receipts directly to caller's WhatsApp"
        }
    }
]

DEFAULT_EDGES = [
    {"id": "e-trigger-llm", "source": "node-trigger-1", "target": "node-llm-1", "animated": True},
    {"id": "e-llm-db", "source": "node-llm-1", "target": "node-db-1", "animated": True},
    {"id": "e-llm-wa", "source": "node-llm-1", "target": "node-wa-1", "animated": True}
]


@router.get("", response_model=WorkflowGraphResponse)
async def get_workflow(
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Fetch the active workflow graph for the tenant."""
    result = await db.execute(
        select(WorkflowGraph).where(WorkflowGraph.tenant_id == tenant.tenant_id)
    )
    workflow = result.scalars().first()

    if not workflow:
        workflow = WorkflowGraph(
            tenant_id=tenant.tenant_id,
            name="Main Voice Addon Workflow",
            nodes=DEFAULT_NODES,
            edges=DEFAULT_EDGES,
            is_active=True
        )
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
    else:
        # Check if LLM node exists in existing workflow; if not, inject it cleanly
        node_types = [n.get("data", {}).get("addonType") for n in (workflow.nodes or [])]
        if "llm" not in node_types:
            workflow.nodes = DEFAULT_NODES
            workflow.edges = DEFAULT_EDGES
            await db.commit()
            await db.refresh(workflow)

    return workflow


@router.post("", response_model=WorkflowGraphResponse)
async def save_workflow(
    payload: WorkflowGraphCreate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Save or update workflow canvas nodes and edges."""
    result = await db.execute(
        select(WorkflowGraph).where(WorkflowGraph.tenant_id == tenant.tenant_id)
    )
    existing = result.scalars().first()

    if existing:
        existing.name = payload.name
        existing.nodes = payload.nodes
        existing.edges = payload.edges
        existing.is_active = payload.is_active
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        new_wf = WorkflowGraph(
            tenant_id=tenant.tenant_id,
            name=payload.name,
            nodes=payload.nodes,
            edges=payload.edges,
            is_active=payload.is_active
        )
        db.add(new_wf)
        await db.commit()
        await db.refresh(new_wf)
        return new_wf
