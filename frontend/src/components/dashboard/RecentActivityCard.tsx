import React from 'react';
import { Calendar, User, FileText, PhoneCall, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActivityItem } from '../../types/call';

interface Props {
  activities?: ActivityItem[];
}

export const RecentActivityCard: React.FC<Props> = ({ activities = [] }) => {
  const getIcon = (type: string, color: string) => {
    let Icon = Calendar;
    let bg = 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';

    if (type === 'lead' || color === 'green') {
      Icon = User;
      bg = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    } else if (type === 'proposal' || color === 'rose') {
      Icon = FileText;
      bg = 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    } else if (type === 'call' || color === 'purple') {
      Icon = PhoneCall;
      bg = 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
    }

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${bg}`}>
        <Icon size={14} />
      </div>
    );
  };

  const items = activities.length > 0 ? activities : [
    {
      id: '1',
      type: 'project' as const,
      title: 'Website redesign project updated',
      author: 'Amit',
      time_ago: '2m ago',
      icon_color: 'blue' as const,
    },
    {
      id: '2',
      type: 'lead' as const,
      title: 'New lead added: Brightwave Solutions',
      author: 'Riya',
      time_ago: '15m ago',
      icon_color: 'green' as const,
    },
    {
      id: '3',
      type: 'proposal' as const,
      title: 'Proposal sent to Acme Corp',
      author: 'Neha',
      time_ago: '1h ago',
      icon_color: 'rose' as const,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Recent Activity
        </h3>
        <Link
          to="/calls"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
        >
          <span>View all</span>
        </Link>
      </div>

      {/* Activity List */}
      <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5">
        {items.map((act) => (
          <div key={act.id} className="flex items-center gap-3.5 p-1 rounded-xl hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
            {getIcon(act.type, act.icon_color)}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {act.title}
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                By {act.author} • {act.time_ago}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
