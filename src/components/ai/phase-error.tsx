'use client';

import { AlertTriangle } from 'lucide-react';
import type { AgentRun } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';

interface PhaseErrorProps {
  run: AgentRun;
}

export function PhaseError({ run }: PhaseErrorProps) {
  const { dismiss, submitIntent } = useAgentContext();

  function handleRetry() {
    if (run.inputText) {
      submitIntent(run.inputText, run.patientId);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: `color-mix(in srgb, var(--color-error) 12%, transparent)`,
        }}
      >
        <AlertTriangle size={32} strokeWidth={1.8} style={{ color: 'var(--color-error)' }} />
      </div>

      <h3
        className="text-title-2 mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Something went wrong
      </h3>

      <p
        className="mb-8 max-w-sm text-center text-callout"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {run.error || 'An unexpected error occurred. Please try again.'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={dismiss}
          className="rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          Dismiss
        </button>
        {run.inputText && (
          <button
            onClick={handleRetry}
            className="rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
