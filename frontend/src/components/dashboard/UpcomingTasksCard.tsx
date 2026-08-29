import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
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
    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/60">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Follow-up Queue
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            {localTasks.filter((t) => !t.completed).length} pending actions
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1"
        >
          <Plus size={11} />
          <span>Add</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
        {localTasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between group hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 px-2 py-1.5 rounded-lg transition"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
              <button
                type="button"
                onClick={() => toggleTask(t.id)}
                className="shrink-0 focus:outline-none"
                title={t.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.completed ? (
                  <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500 text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 transition" />
                )}
              </button>

              <span
                className={`text-xs truncate ${
                  t.completed
                    ? 'text-zinc-400 line-through'
                    : 'text-zinc-800 dark:text-zinc-200 font-medium'
                }`}
              >
                {t.title}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-zinc-400">
                {t.due}
              </span>
              <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                {t.assignee_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">New Action Item</h4>
            <form onSubmit={handleCreateTask} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-zinc-500">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Follow-up order status query"
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-500">Timeline</label>
                <input
                  type="text"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  placeholder="e.g. Due tomorrow"
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium text-zinc-50 dark:text-zinc-900"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
