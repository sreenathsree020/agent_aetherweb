import axios from 'axios';
import { WorkflowGraph } from '../types/workflow';
import { CallRecord, CallStats, DashboardOverview } from '../types/call';

const apiHost = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const baseURL = apiHost ? `${apiHost}/api/v1` : '/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'default',
  },
});

export const addonService = {
  getWorkflow: async (): Promise<WorkflowGraph> => {
    const res = await api.get('/workflows');
    return res.data;
  },

  saveWorkflow: async (graph: WorkflowGraph): Promise<WorkflowGraph> => {
    const res = await api.post('/workflows', graph);
    return res.data;
  },

  listAddons: async () => {
    const res = await api.get('/addons');
    return res.data;
  },

  saveAddon: async (addonType: string, name: string, config: Record<string, any>) => {
    const res = await api.post('/addons', {
      addon_type: addonType,
      name,
      enabled: true,
      config,
    });
    return res.data;
  },

  testDatabase: async (data: any) => {
    const res = await api.post('/addons/database/test', data);
    return res.data;
  },

  testWhatsApp: async (data: any) => {
    const res = await api.post('/addons/whatsapp/test', data);
    return res.data;
  },

  testGmail: async (data: any) => {
    const res = await api.post('/addons/gmail/test', data);
    return res.data;
  },

  getCalls: async (): Promise<CallRecord[]> => {
    const res = await api.get('/calls');
    return res.data;
  },

  getCallStats: async (): Promise<CallStats> => {
    const res = await api.get('/calls/stats');
    return res.data;
  },

  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const res = await api.get('/calls/dashboard');
    return res.data;
  },

  getAnalyticsSummary: async () => {
    const res = await api.get('/analytics/summary');
    return res.data;
  },

  indexKnowledge: async (documentName: string, content: string) => {
    const res = await api.post('/knowledge/index', { document_name: documentName, content });
    return res.data;
  },

  searchKnowledge: async (query: string, topK: number = 3) => {
    const res = await api.post('/knowledge/search', { query, top_k: topK });
    return res.data;
  },

  getCampaigns: async () => {
    const res = await api.get('/campaigns');
    return res.data;
  },

  createCampaign: async (payload: any) => {
    const res = await api.post('/campaigns', payload);
    return res.data;
  },

  getBillingStatus: async () => {
    const res = await api.get('/billing/status');
    return res.data;
  },

  toggleTask: async (taskId: string) => {
    const res = await api.post('/calls/task/toggle', { task_id: taskId });
    return res.data;
  },

  createTask: async (title: string, due: string = 'Due soon') => {
    const res = await api.post('/calls/task', { title, due });
    return res.data;
  },

  saveLiveCall: async (payload: any) => {
    const res = await api.post('/calls/record', payload);
    return res.data;
  },

  getHealth: async () => {
    const res = await axios.get('/health');
    return res.data;
  },
};
