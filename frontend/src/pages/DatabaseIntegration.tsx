import React, { useState } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { Database, Key, Server, Play, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { addonService } from '../services/api';

export const DatabaseIntegration: React.FC = () => {
  const [engine, setEngine] = useState('sqlite');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('voice_agent.db');
  const [username, setUsername] = useState('readonly_user');
  const [password, setPassword] = useState('vault_pass_921');
  const [showPassword, setShowPassword] = useState(false);
  const [queryTemplate, setQueryTemplate] = useState(
    "SELECT id, status, total, delivery_eta FROM orders WHERE phone = :caller_phone"
  );
  const [samplePhone, setSamplePhone] = useState('+1-800-DEMO-CALLER');
  const [testing, setTesting] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    try {
      const res = await addonService.testDatabase({
        engine,
        host,
        port: Number(port),
        database,
        username,
        password,
        query_template: queryTemplate,
        sample_phone: samplePhone,
      });
      setQueryResult(res.result || res);
    } catch (e: any) {
      setQueryResult({ error: e.message || 'Database connection error' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Database className="text-blue-400" />
          <span>Read-Only Database Addon</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect your PostgreSQL, MySQL, or SQLite database to inject caller records, customer tiers, and invoice statuses dynamically into LLM prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Form */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-glow-primary">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Database Credentials</h3>
                  <span className="text-[11px] text-slate-400">Read-Only SQL Pool</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                SQL Engine
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Database Engine</label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121424] border border-white/10 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="postgresql">PostgreSQL (asyncpg)</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="sqlite">SQLite (aiosqlite)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Host / Server</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Database Name / Path</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Query & Sandbox */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Play size={15} className="text-blue-400" />
                <span>Parameterized SQL Query &amp; Test Runner</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Injection</span>
            </div>

            <form onSubmit={handleTestConnection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  SQL Query Template (Read-Only)
                </label>
                <textarea
                  rows={4}
                  value={queryTemplate}
                  onChange={(e) => setQueryTemplate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Use bind parameters such as <code className="text-indigo-300 font-mono">:caller_phone</code> to prevent SQL injections.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Test Caller Phone Parameter
                </label>
                <input
                  type="text"
                  value={samplePhone}
                  onChange={(e) => setSamplePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-glow-primary hover:opacity-90 transition flex items-center gap-2"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                <span>Execute Query Test</span>
              </button>
            </form>

            {queryResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/15 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>Query Execution Result:</span>
                  <span className="font-mono text-emerald-400 text-[10px]">Success</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 p-2.5 rounded-lg bg-black/50 overflow-x-auto max-h-48">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
