import React, { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AddonNode } from './nodes/AddonNode';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { NodeConfigDrawer } from './panels/NodeConfigDrawer';

const nodeTypes: any = {
  addonNode: AddonNode,
};

export const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    loadWorkflow,
  } = useWorkflowStore();

  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="relative w-full h-full bg-[var(--bg-app)] transition-colors duration-150">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
      >
        <Background
          color={isDark ? '#27272a' : '#cbd5e1'}
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls showInteractive={true} />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.addonType === 'database') return isDark ? '#71717a' : '#94a3b8';
            if (n.data?.addonType === 'gmail') return isDark ? '#a1a1aa' : '#64748b';
            if (n.data?.addonType === 'whatsapp') return '#10b981';
            return isDark ? '#ffffff' : '#0f172a';
          }}
          className={
            isDark
              ? '!bg-zinc-950 !border-zinc-800'
              : '!bg-white !border-slate-300 shadow-md'
          }
          maskColor={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(248, 250, 252, 0.85)'}
        />
      </ReactFlow>

      {/* Slide-over configuration drawer */}
      <NodeConfigDrawer />
    </div>
  );
};
