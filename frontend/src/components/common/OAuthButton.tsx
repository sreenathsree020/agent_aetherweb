import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface OAuthButtonProps {
  provider: 'google' | 'meta' | 'github';
  isConnected?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  isConnected = false,
  isLoading = false,
  onClick,
  className = '',
}) => {
  const getProviderDetails = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google Gmail Account',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          ),
          color: 'hover:border-red-500/40 hover:shadow-red-500/10',
        };
      case 'meta':
        return {
          name: 'WhatsApp Business API',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.149-.556-1.748-.742-2.883-2.527-2.97-2.643-.088-.116-.713-.948-.713-1.808 0-.86.449-1.282.609-1.456.16-.174.349-.218.465-.218.116 0 .233.001.334.006.107.005.251-.041.392.298.145.349.494 1.205.538 1.292.044.087.073.189.015.305-.058.116-.087.189-.174.291-.087.102-.183.228-.261.305-.088.087-.18.182-.077.359.102.174.455.751.977 1.216.671.597 1.238.782 1.413.869.175.087.277.073.379-.044.102-.116.436-.508.553-.682.117-.174.233-.145.393-.087.16.058 1.018.48 1.193.567.175.087.291.131.334.204.043.073.043.421-.101.826z"/>
            </svg>
          ),
          color: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
        };
      default:
        return {
          name: 'OAuth Provider',
          icon: null,
          color: '',
        };
    }
  };

  const details = getProviderDetails();

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full py-2.5 px-4 rounded-xl border backdrop-blur-md flex items-center justify-between text-xs font-semibold transition-all duration-200 ${
        isConnected
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-glow-emerald'
          : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 ' + details.color
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-slate-300">{details.icon}</span>
        <span>{details.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-indigo-400" />
        ) : isConnected ? (
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
            <CheckCircle2 size={14} />
            Connected
          </span>
        ) : (
          <span className="text-[11px] text-indigo-400 hover:underline">Connect &rarr;</span>
        )}
      </div>
    </button>
  );
};
