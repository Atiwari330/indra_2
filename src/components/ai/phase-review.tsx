'use client';

import { motion } from 'motion/react';
import type { AgentRun } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';
import { ActionCard } from './action-card';
import { smooth } from '@/lib/animations';

interface PhaseReviewProps {
  run: AgentRun;
}

export function PhaseReview({ run }: PhaseReviewProps) {
  const { commitActions, dismiss } = useAgentContext();

  return (
    <div className="flex h-full flex-col">
      {/* Summary */}
      {run.summary && (
        <p className="mb-5 text-callout" style={{ color: 'var(--color-text-secondary)' }}>
          {run.summary}
        </p>
      )}

      {/* Action cards */}
      <div className="flex-1 space-y-3">
        {run.proposedActions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smooth, delay: i * 0.08 }}
          >
            <ActionCard action={action} />
          </motion.div>
        ))}
      </div>

      {/* Token count */}
      {run.tokenUsage && (
        <p className="mt-4 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          Tokens: {run.tokenUsage.input.toLocaleString()} in / {run.tokenUsage.output.toLocaleString()} out
        </p>
      )}

      {/* Actions */}
      <div
        className="mt-4 flex items-center gap-3 pt-4"
        style={{ borderTop: '1px solid var(--color-separator)' }}
      >
        <button
          onClick={dismiss}
          className="flex-1 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          Reject
        </button>
        <button
          onClick={commitActions}
          className="flex-1 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
          }}
        >
          Approve &amp; Save
        </button>
      </div>
    </div>
  );
}
