import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { addonService } from '../../../services/api';
import { useWorkflowStore } from '../../../stores/useWorkflowStore';

interface Props {
  nodeId: string;
  initialData: any;
}

export const DatabaseConfigForm: React.FC<Props> = ({ nodeId, initialData }) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const closeDrawer = useWorkflowStore((s) => s.closeDrawer);

  const existing = initialData.config || {};
  const [engine, setEngine] = useState(existing.engine || 'postgresql');
  const [host, setHost] = useState(existing.host || 'localhost');
  const [port, setPort] = useState(existing.port || (engine === 'mysql' ? '3306' : '5432'));
  const [database, setDatabase] = useState(existing.database || 'ecommerce_db');
  const [username, setUsername] = useState(existing.username || 'readonly_voice');
  const [password, setPassword] = useState(existing.password || '');
  const [queryTemplate, setQueryTemplate] = useState(
    existing.query_template ||
      'SELECT id, status, total, tracking_code FROM orders WHERE phone = :caller_phone LIMIT 1'
  );
  const [samplePhone, setSamplePhone] = useState('+1-800-DEMO-CALLER');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await addonService.testDatabase({
        engine,
        host,
        port: parseInt(port) || 5432,
        database,
        username,
        password,
        query_template: queryTemplate,
        sample_phone: samplePhone,
      });
      setTestResult({ success: true, data: res.result });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.response?.data?.detail || err.message || 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const config = {
      engine,
      host,
      port: parseInt(port) || 5432,
      database,
      username,
      password,
      query_template: queryTemplate,
    };

    // Save to backend addon storage (AES-256 encrypted)
    try {
      await addonService.saveAddon('database', initialData.label || 'Order Database', config);
    } catch (e) {
      console.warn('Saved locally in workflow graph', e);
    }

    // Update React Flow Node
    updateNodeData(nodeId, {
      status: 'connected',
      configSummary: queryTemplate,
      config,
    });
    closeDrawer();
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
        <Shield size={16} className="shrink-0" />
        <span>Read-Only transactions enforced. Mutation queries (INSERT/UPDATE/DELETE) are strictly blocked.</span>
      </div>

      <div>
        <label className="text-slate-400 font-medium">Database Engine</label>
        <select
          value={engine}
          onChange={(e) => {
            setEngine(e.target.value);
            setPort(e.target.value === 'mysql' ? '3306' : '5432');
          }}
          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="postgresql">PostgreSQL (Read-Only)</option>
          <option value="mysql">MySQL (Read-Only)</option>
          <option value="sqlite">SQLite Sandbox (Local voice_agent.db)</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-slate-400 font-medium">Host</label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="db.example.com"
          />
        </div>
        <div>
          <label className="text-slate-400 font-medium">Port</label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 font-medium">Database Name</label>
        <input
          type="text"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          placeholder="production_orders"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-slate-400 font-medium">Read-Only Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="readonly_user"
          />
        </div>
        <div>
          <label className="text-slate-400 font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 font-medium">In-Call Parameterized Query</label>
        <textarea
          rows={3}
          value={queryTemplate}
          onChange={(e) => setQueryTemplate(e.target.value)}
          className="w-full mt-1 font-mono text-[11px] bg-slate-900 border border-slate-800 rounded-lg p-2 text-indigo-300 focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[10px] text-slate-500 mt-0.5">
          Available parameters: <code className="text-indigo-400">:caller_phone</code>,{' '}
          <code className="text-indigo-400">:order_id</code>, <code className="text-indigo-400">:caller_email</code>
        </p>
      </div>

      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
        <span className="text-[11px] font-semibold text-slate-300">Live Query Sandbox</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={samplePhone}
            onChange={(e) => setSamplePhone(e.target.value)}
            placeholder="Test Phone"
            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium disabled:opacity-50"
          >
            <Play size={12} />
            <span>{testing ? 'Running...' : 'Test'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-2 rounded text-[11px] font-mono ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}
          >
            {testResult.success ? (
              <div className="flex items-start gap-1.5">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(testResult.data, null, 2)}</pre>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{testResult.error}</span>
              </div>
            )}
          </div>
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
