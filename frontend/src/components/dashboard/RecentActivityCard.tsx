import React from 'react';
import { PhoneCall, Layers, CheckCircle2, User, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActivityItem } from '../../types/call';

interface Props {
  activities?: ActivityItem[];
}

export const RecentActivityCard: React.FC<Props> = ({ activities = [] }) => {
  const getDot = (type: string, color: string) => {
    let dotColor = 'bg-blue-500';
    if (type === 'lead' || color === 'green') dotColor = 'bg-emerald-500';
    else if (type === 'proposal' || color === 'rose') dotColor = 'bg-rose-500';
    else if (type === 'call' || color === 'purple') dotColor = 'bg-purple-500';

    return <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />;
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
    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/60">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Live Stream &amp; Activity
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            Real-time audit log
          </span>
        </div>
        <Link
          to="/calls"
          className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline flex items-center gap-1 font-mono"
        >
          <span>All calls</span>
          <ArrowUpRight size={11} />
        </Link>
      </div>

      {/* Activity List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
        {items.map((act) => (
          <div key={act.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition">
            {getDot(act.type, act.icon_color)}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {act.title}
              </h4>
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                {act.author} • {act.time_ago}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
