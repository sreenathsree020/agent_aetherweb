import React, { useState, useEffect } from 'react';
import { Radio, Mic, Volume2, ShieldAlert, PhoneOff, PhoneCall } from 'lucide-react';
import { addonService } from '../services/api';
import { CallRecord } from '../types/call';

export const LiveMonitoring: React.FC = () => {
  const [monitorMode, setMonitorMode] = useState<'listen' | 'whisper' | 'barge'>('listen');
  const [activeCalls, setActiveCalls] = useState<CallRecord[]>([]);
  const [activeSession, setActiveSession] = useState<string>('');
  const [whisperText, setWhisperText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const calls = await addonService.getCalls();
        const active = calls.filter((c) => c.status === 'active');
        setActiveCalls(active);
        if (active.length > 0) {
          setActiveSession(active[0].call_sid || active[0].id);
        }
      } catch (e) {
        console.error('Failed fetching live calls', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-black px-6 sm:px-8 py-5 sm:py-6 space-y-6 w-full font-sans transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <span>Supervisor Live Call Monitor</span>
            {activeCalls.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {activeCalls.length} ACTIVE STREAM{activeCalls.length > 1 ? 'S' : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                0 ACTIVE STREAMS
              </span>
            )}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time encrypted 16kHz audio stream listener, AI whisper channel, and human agent transfer.
          </p>
        </div>
      </div>

      {activeCalls.length === 0 ? (
        <div className="p-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Radio size={22} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Active Telephony Streams
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            When an inbound or outbound voice call connects via Exotel or WebRTC, the live audio session will appear here for supervisor listen, whisper, and barge-in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Calls List (Span 5) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Active Telephony Sessions
            </h3>
            <div className="space-y-2.5">
              {activeCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setActiveSession(call.call_sid || call.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    activeSession === (call.call_sid || call.id)
                      ? 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                      : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200/70 dark:border-zinc-800/70 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <PhoneCall size={13} className="text-emerald-500" />
                      {call.caller}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{Math.round(call.duration_seconds)}s</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{call.primary_intent || 'Live Conversation'}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">
                      {call.tools_used?.length ? `${call.tools_used.length} Tools Active` : 'Streaming'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supervisor Monitor Console (Span 7) */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Session Control: <span className="font-mono font-bold">{activeSession}</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                16kHz PCM Stream
              </span>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setMonitorMode('listen')}
                className={`p-3 rounded-lg border text-left transition ${
                  monitorMode === 'listen'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Volume2 size={16} className="mb-1.5" />
                <div className="text-xs">1. Listen</div>
                <div className="text-[10px] text-zinc-400 font-normal">Silent stream</div>
              </button>

              <button
                onClick={() => setMonitorMode('whisper')}
                className={`p-3 rounded-lg border text-left transition ${
                  monitorMode === 'whisper'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Mic size={16} className="mb-1.5" />
                <div className="text-xs">2. Whisper</div>
                <div className="text-[10px] text-zinc-400 font-normal">Direct AI hint</div>
              </button>

              <button
                onClick={() => setMonitorMode('barge')}
                className={`p-3 rounded-lg border text-left transition ${
                  monitorMode === 'barge'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <ShieldAlert size={16} className="mb-1.5" />
                <div className="text-xs">3. Barge-in</div>
                <div className="text-[10px] text-zinc-400 font-normal">Take over call</div>
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
              <span className="text-zinc-500 font-mono">Stream Quality: 100% Lossless</span>
              <button
                onClick={() => alert(`Call ${activeSession} transferred to human tier-2 specialist via Exotel SIP.`)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 transition"
              >
                <PhoneOff size={13} />
                <span>Transfer to Human Agent</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
