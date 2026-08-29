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
      label: 'New Leads',
      count: stats?.new_leads ?? 32,
      widthPct: 100,
      textColor: 'text-blue-700 dark:text-blue-300',
      pillBg: 'bg-blue-100/90 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100',
    },
    {
      label: 'Contacted',
      count: stats?.contacted ?? 18,
      widthPct: 65,
      textColor: 'text-purple-700 dark:text-purple-300',
      pillBg: 'bg-purple-100/90 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100',
    },
    {
      label: 'Qualified',
      count: stats?.qualified ?? 11,
      widthPct: 45,
      textColor: 'text-amber-700 dark:text-amber-300',
      pillBg: 'bg-amber-100/90 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100',
    },
    {
      label: 'Proposal',
      count: stats?.proposal ?? 7,
      widthPct: 32,
      textColor: 'text-rose-700 dark:text-rose-300',
      pillBg: 'bg-rose-100/90 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100',
    },
    {
      label: 'Won',
      count: stats?.won ?? 4,
      widthPct: 22,
      textColor: 'text-emerald-700 dark:text-emerald-300',
      pillBg: 'bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100',
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      {/* Header with Title and Dropdown */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Sales Funnel
        </h3>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
          >
            <span>{period}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left font-medium transition ${
                      period === p
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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

      {/* Funnel Stage Rows with Pastel Pills */}
      <div className="space-y-3 flex-1 flex flex-col justify-around py-1">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-3">
            {/* Stage Label */}
            <span className={`w-24 text-xs font-semibold ${stage.textColor} shrink-0`}>
              {stage.label}
            </span>

            {/* Pastel Rounded Pill Bar */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl h-8 flex items-center p-0.5">
              <div
                className={`h-full rounded-lg ${stage.pillBg} flex items-center justify-end px-3 transition-all duration-500 ease-out font-bold text-xs shadow-xs`}
                style={{ width: `${stage.widthPct}%` }}
              >
                <span>{stage.count < 10 ? `0${stage.count}` : stage.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
