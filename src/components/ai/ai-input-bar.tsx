'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAgentContext } from './agent-provider';

interface AIInputBarProps {
  patientName: string;
  patientId: string;
}

export function AIInputBar({ patientName, patientId }: AIInputBarProps) {
  const { submitIntent } = useAgentContext();
  const [input, setInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    submitIntent(trimmed, patientId);
    setInput('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-subtle sticky bottom-0 flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <Sparkles
        size={18}
        strokeWidth={1.8}
        style={{ color: 'var(--color-accent)', flexShrink: 0 }}
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Ask Indra about ${patientName}...`}
        className="flex-1 bg-transparent text-callout outline-none"
        style={{ color: 'var(--color-text-primary)' }}
      />
      <kbd
        className="hidden sm:inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption"
        style={{
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-tertiary)',
          border: '1px solid var(--color-border)',
        }}
      >
        Enter
      </kbd>
    </form>
  );
}
