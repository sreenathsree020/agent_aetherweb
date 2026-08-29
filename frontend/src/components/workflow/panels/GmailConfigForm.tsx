import React, { useState } from 'react';
import { Mail, Key, ExternalLink, CheckCircle2, Play } from 'lucide-react';
import { addonService } from '../../../services/api';
import { useWorkflowStore } from '../../../stores/useWorkflowStore';

interface Props {
  nodeId: string;
  initialData: any;
}

export const GmailConfigForm: React.FC<Props> = ({ nodeId, initialData }) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const closeDrawer = useWorkflowStore((s) => s.closeDrawer);

  const existing = initialData.config || {};
  const [token, setToken] = useState(existing.access_token || '');
  const [filterQuery, setFilterQuery] = useState(existing.filter_query || 'order OR invoice OR tracking');
  const [testQuery, setTestQuery] = useState('order');
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const handleOAuthConnect = () => {
    // In production, redirects to /api/v1/oauth/authorize/gmail
    window.open('/api/v1/oauth/authorize/gmail', '_blank');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestOutput(null);
    try {
      const res = await addonService.testGmail({ access_token: token, query: testQuery });
      setTestOutput(JSON.stringify(res.result, null, 2));
    } catch (e: any) {
      setTestOutput(`Error: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const config = { access_token: token, filter_query: filterQuery };
    try {
      await addonService.saveAddon('gmail', initialData.label || 'Gmail Integration', config);
    } catch (e) {
      console.warn('Saved locally', e);
    }
    updateNodeData(nodeId, {
      status: token ? 'connected' : 'unconfigured',
      configSummary: `Search: ${filterQuery}`,
      config,
    });
    closeDrawer();
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold">
          <Mail size={16} />
          <span>Google OAuth 2.0 (Read-Only)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Enables the voice agent to search past caller emails for order confirmations and tracking numbers.
        </p>
        <button
          type="button"
          onClick={handleOAuthConnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition"
        >
          <ExternalLink size={13} />
          <span>Connect Google Account</span>
        </button>
      </div>

      <div>
        <label className="text-slate-400 font-medium">Or Paste Existing Access / Service Token</label>
        <div className="relative mt-1">
          <Key size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ya29.a0AfH6SMB..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 font-medium">Default In-Call Search Filter</label>
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
        <span className="text-[11px] font-semibold text-slate-300">Test Search Sandbox</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Search query (e.g. invoice)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium disabled:opacity-50"
          >
            <Play size={12} />
            <span>{testing ? 'Testing...' : 'Test'}</span>
          </button>
        </div>
        {testOutput && (
          <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto">
            {testOutput}
          </pre>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={closeDrawer}
          className="w-1/2 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="w-1/2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20"
        >
          Save Addon
        </button>
      </div>
    </div>
  );
};
