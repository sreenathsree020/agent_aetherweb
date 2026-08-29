import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FunnelStats } from '../../types/call';

interface Props {
  stats?: FunnelStats | null;
}

export const SalesFunnelCard: React.FC<Props> = ({ stats }) => {
  const [period, setPeriod] = useState('This Month');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const periods = ['This Week', 'This Month', 'Last Month', 'This Quarter'];

  const stages = [
    {
      label: 'Inbound Calls',
      count: stats?.new_leads ?? 32,
      pct: '100%',
      widthPct: 100,
      barBg: 'bg-blue-500',
    },
    {
      label: 'Engaged',
      count: stats?.contacted ?? 18,
      pct: '56%',
      widthPct: 56,
      barBg: 'bg-purple-500',
    },
    {
      label: 'Addon Enriched',
      count: stats?.qualified ?? 11,
      pct: '34%',
      widthPct: 34,
      barBg: 'bg-amber-500',
    },
    {
      label: 'Action Executed',
      count: stats?.proposal ?? 7,
      pct: '22%',
      widthPct: 22,
      barBg: 'bg-rose-500',
    },
    {
      label: 'Completed',
      count: stats?.won ?? 4,
      pct: '12%',
      widthPct: 12,
      barBg: 'bg-emerald-500',
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Conversion Funnel
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            {stats?.won ?? 4} resolved • {stats?.new_leads ?? 32} total sessions
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <span>{period}</span>
            <ChevronDown size={11} className={`opacity-60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 w-28 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md py-1 z-50">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 text-xs text-left font-mono transition ${
                      period === p
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Funnel Stage Rows */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-around py-1">
        {stages.map((stage) => (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-zinc-700 dark:text-zinc-300 text-[11px]">{stage.label}</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{stage.count}</span>
                <span className="text-zinc-400 text-[10px]">({stage.pct})</span>
              </div>
            </div>

            {/* Sleek Minimal Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800/70 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${stage.barBg} transition-all duration-300`}
                style={{ width: `${stage.widthPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
