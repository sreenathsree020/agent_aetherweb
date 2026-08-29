import React, { useState } from 'react';
import { Mic, MicOff, Send, Bot, User, Wrench, Radio, Volume2 } from 'lucide-react';
import { useCallStore } from '../../stores/useCallStore';

export const CallTranscriptViewer: React.FC = () => {
  const {
    isCallLive,
    isAiSpeaking,
    isMicActive,
    micVolume,
    liveTranscript,
    liveToolCalls,
    startBrowserCall,
    endBrowserCall,
    sendTextMessage,
  } = useCallStore();

  const [inputMsg, setInputMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    if (!isCallLive) {
      startBrowserCall().then(() => {
        setTimeout(() => sendTextMessage(inputMsg), 400);
      });
    } else {
      sendTextMessage(inputMsg);
    }
    setInputMsg('');
  };

  return (
    <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col h-[520px] shadow-sm overflow-hidden font-sans">
      {/* Viewer Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-input)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-[var(--text-main)]">Interactive Call &amp; Addon Test Console</h3>
        </div>

        <div className="flex items-center gap-3">
          {isCallLive && (
            <div className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] px-2.5 py-1">
              <Volume2 size={13} className={isMicActive ? "text-emerald-500" : "text-[var(--text-muted)]"} />
              <div className="w-14 h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${micVolume}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{isMicActive ? "Mic Live" : "Connecting..."}</span>
            </div>
          )}

          {isCallLive ? (
            <button
              onClick={endBrowserCall}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 text-xs font-semibold transition"
            >
              <MicOff size={13} />
              <span>End Call</span>
            </button>
          ) : (
            <button
              onClick={startBrowserCall}
              className="flex items-center gap-1.5 px-3 py-1 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-app)] text-xs font-semibold transition shadow-sm"
            >
              <Mic size={13} />
              <span>Start Voice Call</span>
            </button>
          )}
        </div>
      </div>

      {/* Transcript & Tool Call Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans bg-[var(--bg-surface)]">
        {liveTranscript.length === 0 && liveToolCalls.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-xs space-y-2">
            <Bot size={26} className="text-[var(--text-muted)]" />
            <p>Click "Start Voice Call" or send a test message below.</p>
            <p className="text-[11px] text-[var(--text-faint)]">
              Try: <span className="text-[var(--text-main)] font-mono">"Can you check my order status?"</span>
            </p>
          </div>
        ) : (
          <>
            {liveTranscript.map((turn, i) => (
              <div key={i} className="space-y-1 text-xs">
                {turn.customer && (
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="w-6 h-6 bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                      <User size={13} />
                    </div>
                    <div className="bg-[var(--bg-panel)] text-[var(--text-main)] p-2.5 border border-[var(--border-subtle)]">
                      <p>{turn.customer}</p>
                      <span className="text-[10px] text-[var(--text-muted)] block text-right mt-1 font-mono">{turn.timestamp}</span>
                    </div>
                  </div>
                )}

                {turn.agent && (
                  <div className="flex items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-6 h-6 bg-[var(--text-main)] text-[var(--bg-app)] flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-sm">
                      <Bot size={13} />
                    </div>
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-strong)] text-[var(--text-main)] p-2.5">
                      <p>{turn.agent}</p>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-1 font-mono">{turn.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Live Tool Execution Display */}
            {liveToolCalls.map((tool, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] space-y-1 my-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-main)]">
                    <Wrench size={13} className="text-[var(--text-muted)]" />
                    <span>Addon Tool Executed: {tool.tool}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{tool.timestamp}</span>
                </div>
                <div className="bg-[var(--bg-panel)] p-1.5 border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-main)] overflow-x-auto">
                  <span className="text-[var(--text-muted)]">Args:</span> {JSON.stringify(tool.arguments)}
                  <br />
                  <span className="text-emerald-500">Result:</span> {JSON.stringify(tool.result)}
                </div>
              </div>
            ))}

            {isAiSpeaking && (
              <div className="flex items-center gap-2 text-[var(--text-main)] text-xs font-medium py-1 animate-pulse">
                <Radio size={13} className="text-emerald-500" />
                <span>Voice Agent Synthesizing Audio Chunks...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Text Test Input */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-input)] flex gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Type customer message to trigger addon lookup..."
          className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-[var(--text-main)] text-[var(--bg-app)] hover:opacity-90 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <Send size={13} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
