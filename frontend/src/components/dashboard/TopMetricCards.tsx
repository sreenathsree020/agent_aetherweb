import React from 'react';
import { IndianRupee, Calendar, CheckCircle2, User, ArrowUp } from 'lucide-react';
import { DashboardOverview } from '../../types/call';

interface Props {
  data?: DashboardOverview | null;
}

export const TopMetricCards: React.FC<Props> = ({ data }) => {
  const cards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: data?.total_revenue_formatted || '₹5.62L',
      trend: `↑ ${data?.total_revenue_growth || '18.6%'} vs last month`,
      trendColor: 'text-emerald-600 dark:text-emerald-400',
      icon: IndianRupee,
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
    },
    {
      id: 'projects',
      title: 'Active Projects',
      value: data?.active_projects_count ?? 12,
      trend: `↑ ${data?.new_projects_count ?? 2} new projects`,
      trendColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Calendar,
      iconBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/20',
    },
    {
      id: 'tasks',
      title: 'Tasks Progress',
      value: `${data?.tasks_progress_pct ?? 62}%`,
      trend: '↑ On track',
      trendColor: 'text-amber-600 dark:text-amber-400',
      icon: CheckCircle2,
      iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
    },
    {
      id: 'leads',
      title: 'Leads This Month',
      value: data?.leads_this_month ?? 28,
      trend: `↑ ${data?.new_leads_count ?? 6} new leads`,
      trendColor: 'text-emerald-600 dark:text-emerald-400',
      icon: User,
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${c.iconBg}">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${c.iconBg}`}>
                  <Icon size={20} strokeWidth={2.4} />
                </div>
              </div>
              <div className="text-right flex-1 pl-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block tracking-tight">
                  {c.title}
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 block tracking-tight">
                  {c.value}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold">
              <span className={c.trendColor}>{c.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
