import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { useCallStore } from '../stores/useCallStore';
import {
  Phone,
  Search,
  Filter,
  MessageSquare,
  Bot,
  User,
  Eye,
  X,
} from 'lucide-react';
import { CallRecord } from '../types/call';

export const CallHistory: React.FC = () => {
  const { calls, fetchCallsAndStats } = useCallStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    fetchCallsAndStats();
  }, [fetchCallsAndStats]);

  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      c.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Telephony Call History</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Search, filter, and inspect full bi-directional audio transcripts and addon executions.
          </p>
        </div>

        <button
          onClick={() => fetchCallsAndStats()}
          className="px-3.5 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-main)] transition"
        >
          Refresh Logs
        </button>
      </div>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by phone number or Call SID..."
            className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Filter size={13} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-strong)]"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>
      </GlassCard>

      {/* Call Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Caller Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Turns</th>
                <th className="py-3 px-4">Addons Executed</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-main)]">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    <Phone size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
                    <p>No call logs found matching your query.</p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-input)] transition group">
                    <td className="py-3 px-4 font-mono font-medium flex items-center gap-2">
                      <div className="w-6 h-6 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-main)] flex items-center justify-center">
                        <Phone size={11} className="text-emerald-500" />
                      </div>
                      <span>{c.caller}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{c.duration_seconds}s</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{c.turns_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tools_used && c.tools_used.length > 0 ? (
                          c.tools_used.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 font-mono text-[9px] bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-subtle)]"
                            >
                              {t.tool}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--text-muted)] text-[11px]">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] text-[11px] font-mono">{c.created_at}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCall(c)}
                        className="p-1 px-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-subtle)] transition inline-flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Eye size={12} />
                        <span>Transcript</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Full Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-input)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] flex items-center justify-center">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-main)]">Call Transcript: {selectedCall.caller}</h3>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Duration: {selectedCall.duration_seconds}s &middot; SID: {selectedCall.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCall(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Transcript Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs bg-[var(--bg-surface)]">
              {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                selectedCall.transcript.map((turn: any, i: number) => (
                  <div key={i} className="space-y-2">
                    {turn.customer && (
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        <div className="w-6 h-6 bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                          <User size={13} />
                        </div>
                        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-3 text-[var(--text-main)]">
                          <p>{turn.customer}</p>
                          <span className="text-[10px] text-[var(--text-muted)] block text-right mt-1 font-mono">
                            {turn.timestamp}
                          </span>
                        </div>
                      </div>
                    )}

                    {turn.agent && (
                      <div className="flex items-start gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                        <div className="w-6 h-6 bg-[var(--text-main)] text-[var(--bg-app)] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Bot size={13} />
                        </div>
                        <div className="bg-[var(--bg-panel)] border border-[var(--border-strong)] p-3 text-[var(--text-main)]">
                          <p>{turn.agent}</p>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-1 font-mono">
                            {turn.timestamp}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[var(--text-muted)]">
                  No dialog turns recorded for this session.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-input)] flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-3.5 py-1.5 bg-[var(--text-main)] text-[var(--bg-app)] text-xs font-semibold hover:opacity-90 transition"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
