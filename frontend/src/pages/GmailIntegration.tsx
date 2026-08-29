import React, { useState } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { OAuthButton } from '../components/common/OAuthButton';
import { Mail, CheckCircle2, Search, Key, Shield, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { addonService } from '../services/api';

export const GmailIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('from:support subject:order');
  const [maxResults, setMaxResults] = useState(5);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  const handleOAuthConnect = async () => {
    setIsLoading(true);
    try {
      // In production, triggers Google OAuth code flow
      setTimeout(() => {
        setIsConnected(true);
        setIsLoading(false);
      }, 1200);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const handleTestSearch = async () => {
    setTesting(true);
    try {
      const res = await addonService.testGmail({
        search_query: searchQuery,
        max_results: Number(maxResults),
      });
      setTestResult(res.result || res);
    } catch (e: any) {
      setTestResult({ error: e.message || 'Failed executing Gmail search' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Mail className="text-rose-400" />
          <span>Gmail Addon Integration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect your Google Workspace or Gmail account to allow voice agents to search order emails and dispatch receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Connection Card */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-glow-primary">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">OAuth 2.0 Authorization</h3>
                  <span className="text-[11px] text-slate-400">Google Cloud Client ID required</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {isConnected ? 'Active & Linked' : 'Disconnected'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enables read-only email queries during inbound calls to lookup tracking numbers and verify customer order IDs.
            </p>

            <OAuthButton
              provider="google"
              isConnected={isConnected}
              isLoading={isLoading}
              onClick={handleOAuthConnect}
            />

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Shield size={13} className="text-[#00B894]" />
                <span>Security &amp; Token Encryption</span>
              </div>
              <p>
                Access &amp; refresh tokens are encrypted at rest via <strong>AES-256-GCM</strong> and never exposed in logs.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Right: Search Filter & Test Simulation */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search size={15} className="text-[#6C5CE7]" />
                <span>Search Filters &amp; Prompt Parameters</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Live Sandbox</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Query Template
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. from:orders@shop.com subject:{order_id}"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#6C5CE7]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Use standard Gmail search syntax with curly braces for dynamic variables.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Max Result Limit
                </label>
                <input
                  type="number"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-32 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTestSearch}
                  disabled={testing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white text-xs font-semibold shadow-glow-primary hover:opacity-90 transition flex items-center gap-2"
                >
                  {testing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>Test Search Execution</span>
                </button>
              </div>

              {testResult && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/15 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>Sandbox Test Output:</span>
                    <span className="font-mono text-emerald-400 text-[10px]">HTTP 200 OK</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 p-2.5 rounded-lg bg-black/50 overflow-x-auto max-h-48">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
