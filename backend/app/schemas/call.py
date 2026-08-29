from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class CallRecordResponse(BaseModel):
    id: str
    tenant_id: str
    call_sid: str
    caller: str
    recipient: str
    status: str
    duration_seconds: float
    turns_count: int
    transcript: List[Dict[str, Any]]
    tools_used: List[Dict[str, Any]]
    created_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CallStatsResponse(BaseModel):
    total_calls: int
    active_calls: int
    avg_duration_seconds: float
    total_addon_queries: int


class TaskItem(BaseModel):
    id: str
    title: str
    due: str
    completed: bool = False
    assignee_name: str
    assignee_avatar: str


class ActivityItem(BaseModel):
    id: str
    type: str  # 'project', 'lead', 'proposal', 'call'
    title: str
    author: str
    time_ago: str
    icon_color: str  # 'blue', 'green', 'rose', 'purple'


class ChartPoint(BaseModel):
    label: str
    value: float
    formatted: str
    calls: int


class FunnelStats(BaseModel):
    new_leads: int
    contacted: int
    qualified: int
    proposal: int
    won: int


class DashboardOverviewResponse(BaseModel):
    user_name: str = "Riya"
    workspace_name: str = "Apex Media"
    total_revenue_formatted: str
    total_revenue_growth: str
    active_projects_count: int
    new_projects_count: int
    tasks_progress_pct: int
    leads_this_month: int
    new_leads_count: int
    chart_period: str
    chart_points: List[ChartPoint]
    funnel: FunnelStats
    upcoming_tasks: List[TaskItem]
    recent_activities: List[ActivityItem]
    recent_calls: List[CallRecordResponse]
    stats: CallStatsResponse
