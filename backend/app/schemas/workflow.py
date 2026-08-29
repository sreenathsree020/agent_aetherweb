from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class WorkflowNode(BaseModel):
    id: str
    type: Optional[str] = "addonNode"
    position: Dict[str, float]
    data: Dict[str, Any]


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: Optional[bool] = True
    style: Optional[Dict[str, Any]] = None


class WorkflowGraphCreate(BaseModel):
    name: str = "Voice Agent Addon Workflow"
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    is_active: bool = True


class WorkflowGraphResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
