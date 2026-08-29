import React, { useState } from 'react';
import { Plus, Bell, ChevronDown, Mic, CheckSquare, Layers, Radio } from 'lucide-react';

interface Props {
  userName?: string;
  workspaceName?: string;
  onStartCall?: () => void;
  onAddTask?: () => void;
  onOpenWorkflow?: () => void;
}

export const DashboardHeader: React.FC<Props> = ({
  userName = 'Riya',
  workspaceName = 'Apex Media',
  onStartCall,
  onAddTask,
  onOpenWorkflow,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {getGreeting()}, {userName}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telephony
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {workspaceName} • Voice Assistant &amp; Workflow Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* + Add New Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 text-xs font-medium transition shadow-xs"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Action</span>
            <ChevronDown size={12} className={`opacity-70 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onStartCall?.();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                >
                  <Mic size={14} className="text-emerald-500" />
                  <div>
                    <span className="block font-medium">Start Voice Call</span>
                    <span className="text-[10px] text-zinc-400">Live AI audio stream</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onAddTask?.();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                >
                  <CheckSquare size={14} className="text-blue-500" />
                  <div>
                    <span className="block font-medium">Create Task</span>
                    <span className="text-[10px] text-zinc-400">Follow-up item</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenWorkflow?.();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                >
                  <Layers size={14} className="text-purple-500" />
                  <div>
                    <span className="block font-medium">Workflow Canvas</span>
                    <span className="text-[10px] text-zinc-400">Connect addons</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-semibold text-[11px] flex items-center justify-center">
            {userName.charAt(0)}
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">{userName}</span>
        </div>
      </div>
    </div>
  );
};
