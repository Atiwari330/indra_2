import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, toolbar }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-title-1" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-footnote">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {toolbar && (
        <div
          className="mt-5 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {toolbar}
        </div>
      )}
    </div>
  );
}
