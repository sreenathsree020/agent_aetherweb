import React from 'react';
import { GlassCard } from './GlassCard';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}) => {
  return (
    <GlassCard variant="interactive" className="p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide uppercase">{title}</span>
        <div className="p-2 bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-subtle)]">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-[var(--text-main)] tracking-tight font-sans">{value}</div>
        
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`flex items-center gap-1 font-semibold ${
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-[var(--text-muted)] text-[11px]">{subtitle}</span>}
        </div>
      </div>
    </GlassCard>
  );
};
