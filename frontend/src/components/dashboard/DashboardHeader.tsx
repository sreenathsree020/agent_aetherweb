import React, { useState } from 'react';
import { Plus, Bell, ChevronDown, Mic, CheckSquare, Layers, Sparkles } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <span>{getGreeting()}, {userName}!</span>
          <span className="inline-block animate-wave text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
          Here's what's happening with <span className="font-medium text-slate-700 dark:text-slate-300">{workspaceName}</span>
        </p>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* + Add New Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add New</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onStartCall?.();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Mic size={14} />
                  </div>
                  <div>
                    <span className="block font-semibold">Start Voice Assistant Call</span>
                    <span className="text-[10px] text-slate-400">Live AI audio session</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onAddTask?.();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CheckSquare size={14} />
                  </div>
                  <div>
                    <span className="block font-semibold">Create Follow-up Task</span>
                    <span className="text-[10px] text-slate-400">Assign action item</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenWorkflow?.();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
                >
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Layers size={14} />
                  </div>
                  <div>
                    <span className="block font-semibold">Connect Addon Workflow</span>
                    <span className="text-[10px] text-slate-400">Database, WhatsApp, Gmail</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
        </button>

        {/* User Avatar Pill */}
        <div className="flex items-center gap-1.5 pl-1 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
            R
          </div>
          <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </div>
      </div>
    </div>
  );
};
