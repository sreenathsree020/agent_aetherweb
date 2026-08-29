import React from 'react';
import { PhoneCall, Activity, Database, Clock } from 'lucide-react';
import { CallStats } from '../../types/call';

interface Props {
  stats: CallStats | null;
}

export const MetricCards: React.FC<Props> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Handled Calls',
      value: stats?.total_calls ?? 0,
      icon: PhoneCall,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      title: 'Active Sessions',
      value: stats?.active_calls ?? 0,
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Addon Queries Run',
      value: stats?.total_addon_queries ?? 0,
      icon: Database,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      title: 'Avg Call Duration',
      value: `${stats?.avg_duration_seconds ?? 0}s`,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className={`p-4 rounded-xl bg-slate-900/70 border ${c.border} backdrop-blur-md flex items-center justify-between shadow-lg`}
          >
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">{c.title}</span>
              <span className="text-xl font-bold text-slate-100 mt-1 block tracking-tight">{c.value}</span>
            </div>
            <div className={`p-2.5 rounded-lg ${c.bg} ${c.color}`}>
              <Icon size={18} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
