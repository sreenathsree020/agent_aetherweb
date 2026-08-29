import React from 'react';
import { IndianRupee, Layers, CheckCircle2, Users } from 'lucide-react';
import { DashboardOverview } from '../../types/call';

interface Props {
  data?: DashboardOverview | null;
}

export const TopMetricCards: React.FC<Props> = ({ data }) => {
  const cards = [
    {
      id: 'revenue',
      title: 'Total Handled Revenue',
      value: data?.total_revenue_formatted || '₹5.62L',
      trend: `+${data?.total_revenue_growth || '18.6%'}`,
      trendLabel: 'vs last month',
      trendPositive: true,
      icon: IndianRupee,
      iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/40 dark:border-emerald-800/40',
    },
    {
      id: 'projects',
      title: 'Active Workflows',
      value: data?.active_projects_count ?? 12,
      trend: `+${data?.new_projects_count ?? 2}`,
      trendLabel: 'new',
      trendPositive: true,
      icon: Layers,
      iconColor: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200/40 dark:border-purple-800/40',
    },
    {
      id: 'tasks',
      title: 'Call Success Rate',
      value: `${data?.tasks_progress_pct ?? 62}%`,
      trend: 'Optimal',
      trendLabel: 'accuracy',
      trendPositive: true,
      icon: CheckCircle2,
      iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/40 dark:border-amber-800/40',
    },
    {
      id: 'leads',
      title: 'Monthly Callers',
      value: data?.leads_this_month ?? 28,
      trend: `+${data?.new_leads_count ?? 6}`,
      trendLabel: 'this week',
      trendPositive: true,
      icon: Users,
      iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200/40 dark:border-blue-800/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {c.title}
              </span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${c.iconColor}`}>
                <Icon size={14} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                {c.value}
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  {c.trend}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                  {c.trendLabel}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
