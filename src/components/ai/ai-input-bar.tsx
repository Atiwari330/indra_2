'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { useAgentContext } from './agent-provider';

interface AIInputBarProps {
  patientName: string;
  patientId: string;
}

const MAX_HEIGHT = 160; // ~6 lines

export function AIInputBar({ patientName, patientId }: AIInputBarProps) {
  const { submitIntent } = useAgentContext();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [input]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    submitIntent(trimmed, patientId);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="glass-subtle sticky bottom-0 flex items-end gap-3 rounded-[var(--radius-lg)] px-4 py-3"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <Sparkles
        size={18}
        strokeWidth={1.8}
        className="mb-1.5"
        style={{ color: 'var(--color-accent)', flexShrink: 0 }}
      />
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Ask Indra about ${patientName}...`}
        rows={1}
        className="flex-1 resize-none bg-transparent text-callout outline-none"
        style={{
          color: 'var(--color-text-primary)',
          maxHeight: MAX_HEIGHT,
        }}
      />
      {input.trim() && (
        <button
          type="submit"
          className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-opacity"
          style={{ background: 'var(--color-accent)' }}
        >
          <ArrowUp size={16} strokeWidth={2.5} className="text-white" />
        </button>
      )}
    </form>
  );
}
