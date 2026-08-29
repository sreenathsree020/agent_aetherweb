import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../../stores/useWorkflowStore';
import { DatabaseConfigForm } from './DatabaseConfigForm';
import { GmailConfigForm } from './GmailConfigForm';
import { WhatsAppConfigForm } from './WhatsAppConfigForm';

export const NodeConfigDrawer: React.FC = () => {
  const { nodes, selectedNodeId, isDrawerOpen, closeDrawer, removeNode } = useWorkflowStore();

  if (!isDrawerOpen || !selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;
  const nodeData = (node.data || {}) as Record<string, any>;

  const handleDeleteNode = () => {
    removeNode(selectedNodeId);
    closeDrawer();
  };

  const renderForm = () => {
    switch (nodeData.addonType) {
      case 'database':
        return <DatabaseConfigForm nodeId={node.id} initialData={nodeData} />;
      case 'gmail':
        return <GmailConfigForm nodeId={node.id} initialData={nodeData} />;
      case 'whatsapp':
        return <WhatsAppConfigForm nodeId={node.id} initialData={nodeData} />;
      default:
        return (
          <div className="text-xs text-[var(--text-muted)] space-y-2">
            <p>This is the Inbound Audio Trigger node for Exotel Telephony and Browser WebSockets.</p>
            <p>Parameters are provided automatically by incoming calls (CallSid, Caller phone, Recipient).</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl z-50 flex flex-col transition-all duration-200 font-sans text-[var(--text-main)]">
      {/* Drawer Header */}
      <div className="p-4 bg-[var(--bg-input)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">
            Node Configuration
          </span>
          <h3 className="text-sm font-bold text-[var(--text-main)]">{String(nodeData.label || 'Node')}</h3>
        </div>
        <div className="flex items-center gap-1">
          {nodeData.addonType !== 'trigger' && (
            <button
              onClick={handleDeleteNode}
              className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-panel)] transition"
              title="Delete Node"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={closeDrawer}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition"
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Drawer Body Form */}
      <div className="flex-1 overflow-y-auto p-5 bg-[var(--bg-surface)]">
        {renderForm()}
      </div>
    </div>
  );
};
