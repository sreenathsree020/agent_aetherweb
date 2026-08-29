import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { addonService } from '../services/api';
import { AddonType } from '../types/workflow';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDrawerOpen: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSavedAt: string | null;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (nodeId: string | null) => void;
  closeDrawer: () => void;
  addNode: (type: AddonType, label: string) => void;
  addChildNode: (parentNodeId: string, type: AddonType, label: string) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  loadWorkflow: () => Promise<void>;
  saveWorkflow: () => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDrawerOpen: false,
  isSaving: false,
  isLoading: false,
  lastSavedAt: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: 1.5 } },
        state.edges
      ),
    })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, isDrawerOpen: !!nodeId }),
  closeDrawer: () => set({ selectedNodeId: null, isDrawerOpen: false }),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDrawerOpen: state.selectedNodeId === nodeId ? false : state.isDrawerOpen,
    })),

  addNode: (addonType, label) => {
    const id = `node-${addonType}-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'addonNode',
      position: { x: 300 + Math.random() * 80, y: 150 + Math.random() * 120 },
      data: {
        label,
        addonType,
        status: addonType === 'trigger' ? 'connected' : 'unconfigured',
        configSummary: addonType === 'trigger' ? 'Audio Webhook / Stream' : 'Click settings to configure.',
        config: {},
      },
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isDrawerOpen: true,
    }));
  },

  addChildNode: (parentNodeId, addonType, label) => {
    const state = get();
    const parent = state.nodes.find((n) => n.id === parentNodeId);
    const posX = parent ? parent.position.x + 230 : 350;
    const posY = parent ? parent.position.y + (Math.random() * 50 - 25) : 200;

    const newId = `node-${addonType}-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type: 'addonNode',
      position: { x: posX, y: posY },
      data: {
        label,
        addonType,
        status: 'unconfigured',
        configSummary: 'Click settings to configure.',
        config: {},
      },
    };

    const newEdge: Edge = {
      id: `edge-${parentNodeId}-${newId}`,
      source: parentNodeId,
      target: newId,
      animated: true,
      style: { stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: 1.5 },
    };

    set({
      nodes: [...state.nodes, newNode],
      edges: [...state.edges, newEdge],
      selectedNodeId: newId,
      isDrawerOpen: true,
    });
  },

  updateNodeData: (nodeId, partialData) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...partialData } } : n
      ),
    }));
  },

  loadWorkflow: async () => {
    set({ isLoading: true });
    try {
      const graph = await addonService.getWorkflow();
      set({
        nodes: graph.nodes || [],
        edges: graph.edges || [],
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to load workflow', e);
      set({ isLoading: false });
    }
  },

  saveWorkflow: async () => {
    const { nodes, edges } = get();
    set({ isSaving: true });
    try {
      await addonService.saveWorkflow({
        name: 'Voice Agent Addon Workflow',
        nodes,
        edges,
        is_active: true,
      });
      set({ isSaving: false, lastSavedAt: new Date().toLocaleTimeString() });
    } catch (e) {
      console.error('Failed to save workflow', e);
      set({ isSaving: false });
    }
  },
}));
