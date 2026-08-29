import React from 'react';

interface LiveIndicatorProps {
  status?: 'connected' | 'disconnected' | 'streaming' | 'idle';
  label?: string;
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  status = 'connected',
  label,
  className = '',
}) => {
  const isGreen = status === 'connected' || status === 'streaming';
  const isPulse = status === 'streaming' || status === 'connected';

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
      isGreen 
        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' 
        : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
    } ${className}`}>
      <span className="relative flex h-2 w-2">
        {isPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isGreen ? 'bg-emerald-400' : 'bg-rose-400'
          }`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          isGreen ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />
      </span>
      {label && <span>{label}</span>}
    </div>
  );
};
