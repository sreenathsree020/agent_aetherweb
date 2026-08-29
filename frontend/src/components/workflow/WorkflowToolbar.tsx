import React from 'react';
import { Save, RefreshCw, Layers } from 'lucide-react';
import { useWorkflowStore } from '../../stores/useWorkflowStore';

export const WorkflowToolbar: React.FC = () => {
  const { nodes, saveWorkflow, isSaving, lastSavedAt } = useWorkflowStore();

  return (
    <div className="h-10 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between z-20 shrink-0 font-sans transition-colors duration-150">
      {/* Workflow Canvas Info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-medium">
          <Layers size={13} className="text-[var(--text-muted)]" />
          <span>Workflow Canvas</span>
          <span className="text-[10px] text-[var(--text-faint)] font-mono">({nodes.length} nodes)</span>
        </div>
        <span className="text-[10px] text-[var(--text-faint)] hidden sm:inline">
          · Click <span className="text-[var(--text-main)] font-semibold">+</span> on any card to add and connect addons
        </span>
      </div>

      {/* Deploy Actions */}
      <div className="flex items-center gap-3">
        {lastSavedAt && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline">
            Saved: {lastSavedAt}
          </span>
        )}

        <button
          onClick={saveWorkflow}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-app)] text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
          <span>{isSaving ? 'Saving...' : 'Deploy'}</span>
        </button>
      </div>
    </div>
  );
};
