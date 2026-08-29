import React from 'react';
import { Activity, Radio } from 'lucide-react';

interface Props {
  isLive: boolean;
  isAiSpeaking?: boolean;
}

export const WebSocketIndicator: React.FC<Props> = ({ isLive, isAiSpeaking }) => {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-xs font-medium backdrop-blur-sm">
      {isLive ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            {isAiSpeaking ? (
              <>
                <Radio size={13} className="animate-pulse text-indigo-400" />
                <span className="text-indigo-300 font-semibold">AI Speaking</span>
              </>
            ) : (
              <>
                <Activity size={13} />
                <span>Call Active</span>
              </>
            )}
          </span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-slate-500"></span>
          <span className="text-slate-400">Idle</span>
        </>
      )}
    </div>
  );
};
