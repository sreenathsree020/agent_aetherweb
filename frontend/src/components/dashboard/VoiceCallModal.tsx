import React from 'react';
import { X, Mic, MicOff, Bot, Activity, Radio, Sparkles } from 'lucide-react';
import { CallTranscriptViewer } from './CallTranscriptViewer';
import { useCallStore } from '../../stores/useCallStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isCallLive, isAiSpeaking } = useCallStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Voice Agent Live Assistant</span>
                {isCallLive && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE SESSION
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Connected to Deepgram STT, OpenRouter LLM, and Dynamic Addon Tools.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Live Transcript Viewer */}
        <div className="p-4 flex-1 overflow-y-auto">
          <CallTranscriptViewer />
        </div>
      </div>
    </div>
  );
};
