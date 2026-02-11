'use client';

import { Wind } from 'lucide-react';

interface BreathingFabProps {
  onClick: () => void;
}

export function BreathingFab({ onClick }: BreathingFabProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Start breathing exercise"
      className="fixed z-30 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
      style={{
        bottom: 80,
        right: 20,
        width: 48,
        height: 48,
        background: 'var(--color-accent)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(91, 154, 139, 0.3)',
      }}
    >
      <Wind size={20} />
    </button>
  );
}
