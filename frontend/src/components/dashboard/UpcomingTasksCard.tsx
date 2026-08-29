import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, Check, Calendar } from 'lucide-react';
import { TaskItem } from '../../types/call';
import { addonService } from '../../services/api';

interface Props {
  tasks?: TaskItem[];
  onTaskToggled?: () => void;
}

export const UpcomingTasksCard: React.FC<Props> = ({ tasks = [], onTaskToggled }) => {
  const [localTasks, setLocalTasks] = useState<TaskItem[]>(tasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('Due tomorrow');

  React.useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const toggleTask = async (id: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    try {
      await addonService.toggleTask(id);
      onTaskToggled?.();
    } catch (e) {
      console.warn('Toggled locally', e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await addonService.createTask(newTitle.trim(), newDue);
      if (res.task) {
        setLocalTasks((prev) => [res.task, ...prev]);
      }
      setNewTitle('');
      setShowAddModal(false);
      onTaskToggled?.();
    } catch (e) {
      console.error('Error creating task', e);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Upcoming Tasks
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Add</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5">
        {localTasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 p-1.5 rounded-xl transition"
          >
            {/* Left: Checkbox Icon + Task Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
              <button
                type="button"
                onClick={() => toggleTask(t.id)}
                className="shrink-0 text-emerald-500 hover:scale-110 transition-transform focus:outline-none"
                title={t.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.completed ? (
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Check size={11} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-400 flex items-center justify-center transition" />
                )}
              </button>

              <span
                className={`text-xs font-medium truncate ${
                  t.completed
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {t.title}
              </span>
            </div>

            {/* Right: Due Date + User Avatar */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {t.due}
              </span>
              <img
                src={t.assignee_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces'}
                alt={t.assignee_name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                title={t.assignee_name}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create Follow-up Task</h4>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Task Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Confirm quote with Acme Corp"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Due Timeline</label>
                <input
                  type="text"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  placeholder="e.g. Due in 3h or Due tomorrow"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
