import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'interactive' | 'glow';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  let variantClass = 'glass-panel';
  if (variant === 'subtle') variantClass = 'glass-panel-subtle';
  if (variant === 'interactive') variantClass = 'glass-panel glass-interactive';
  if (variant === 'glow') variantClass = 'glass-panel';

  return (
    <div
      className={`transition-all duration-150 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
