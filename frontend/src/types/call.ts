export interface CallTurn {
  timestamp: string;
  customer?: string;
  agent?: string;
}

export interface ToolCallEvent {
  timestamp: string;
  tool: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

export interface CallRecord {
  id: string;
  call_sid: string;
  caller: string;
  recipient: string;
  status: 'active' | 'completed' | 'failed';
  duration_seconds: number;
  turns_count: number;
  transcript: CallTurn[];
  tools_used: ToolCallEvent[];
  created_at: string;
}

export interface CallStats {
  total_calls: number;
  active_calls: number;
  avg_duration_seconds: number;
  total_addon_queries: number;
}

export interface TaskItem {
  id: string;
  title: string;
  due: string;
  completed: boolean;
  assignee_name: string;
  assignee_avatar: string;
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'lead' | 'proposal' | 'call';
  title: string;
  author: string;
  time_ago: string;
  icon_color: 'blue' | 'green' | 'rose' | 'purple';
}

export interface ChartPoint {
  label: string;
  value: number;
  formatted: string;
  calls: number;
}

export interface FunnelStats {
  new_leads: number;
  contacted: number;
  qualified: number;
  proposal: number;
  won: number;
}

export interface DashboardOverview {
  user_name: string;
  workspace_name: string;
  total_revenue_formatted: string;
  total_revenue_growth: string;
  active_projects_count: number;
  new_projects_count: number;
  tasks_progress_pct: number;
  leads_this_month: number;
  new_leads_count: number;
  chart_period: string;
  chart_points: ChartPoint[];
  funnel: FunnelStats;
  upcoming_tasks: TaskItem[];
  recent_activities: ActivityItem[];
  recent_calls: CallRecord[];
  stats: CallStats;
}
