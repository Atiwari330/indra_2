'use client';

import { Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface PortalHeaderProps {
  firstName: string;
  lastName: string;
}

export function PortalHeader({ firstName, lastName }: PortalHeaderProps) {
  const displayName = firstName;

  return (
    <header
      className="glass-topbar fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14"
    >
      <span
        className="text-callout font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Hi, {displayName}
      </span>

      <div className="flex items-center gap-3">
        <Avatar firstName={firstName} lastName={lastName} size={32} />
        <button
          aria-label="Settings"
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 32,
            height: 32,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
