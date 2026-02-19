'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Undo2, Loader2 } from 'lucide-react';

interface NoteEditBarProps {
  actionId: string;
  isEditing: boolean;
  hasHistory: boolean;
  editError: string | null;
  onEdit: (actionId: string, instruction: string) => void;
  onUndo: (actionId: string) => void;
}

export function NoteEditBar({
  actionId,
  isEditing,
  hasHistory,
  editError,
  onEdit,
  onUndo,
}: NoteEditBarProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isEditing) return;
    onEdit(actionId, trimmed);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Undo button */}
        {hasHistory && !isEditing && (
          <button
            onClick={() => onUndo(actionId)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-tertiary)',
            }}
            title="Undo last edit"
          >
            <Undo2 size={14} strokeWidth={2} />
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEditing}
          placeholder="Describe changes to this note..."
          className="flex-1 bg-transparent text-callout outline-none"
          style={{
            color: 'var(--color-text-primary)',
            opacity: isEditing ? 0.5 : 1,
          }}
        />

        {/* Submit / Loading */}
        {isEditing ? (
          <Loader2
            size={16}
            strokeWidth={2}
            className="flex-shrink-0 animate-spin"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        ) : input.trim() ? (
          <button
            onClick={handleSubmit}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-opacity"
            style={{ background: 'var(--color-accent)' }}
          >
            <ArrowUp size={14} strokeWidth={2.5} className="text-white" />
          </button>
        ) : null}
      </div>

      {/* Error message */}
      {editError && (
        <p className="text-caption" style={{ color: 'var(--color-error, #ef4444)' }}>
          {editError}
        </p>
      )}
    </div>
  );
}
