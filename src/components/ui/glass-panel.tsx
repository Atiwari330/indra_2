import type { HTMLAttributes, ReactNode } from 'react';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'subtle';
}

export function GlassPanel({ children, variant = 'default', className = '', ...props }: GlassPanelProps) {
  const glassClass = variant === 'subtle' ? 'glass-subtle' : 'glass';
  return (
    <div
      className={`${glassClass} rounded-[var(--radius-lg)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
