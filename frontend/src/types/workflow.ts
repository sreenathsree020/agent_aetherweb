export type AddonType = 'trigger' | 'llm' | 'database' | 'gmail' | 'whatsapp';

export interface AddonNodeData {
  label: string;
  addonType: AddonType;
  status: 'connected' | 'unconfigured' | 'error';
  configSummary?: string;
  config?: Record<string, any>;
  [key: string]: any;
}

export interface WorkflowGraph {
  id?: string;
  name: string;
  nodes: any[];
  edges: any[];
  is_active: boolean;
}
