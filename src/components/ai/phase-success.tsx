'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { AgentRun } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';
import { checkmarkPop } from '@/lib/animations';

interface PhaseSuccessProps {
  run: AgentRun;
}

export function PhaseSuccess({ run }: PhaseSuccessProps) {
  const { dismiss } = useAgentContext();

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(dismiss, 3000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated checkmark */}
      <motion.div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'var(--color-success)' }}
        variants={checkmarkPop}
        initial="hidden"
        animate="visible"
      >
        <Check size={32} strokeWidth={3} className="text-white" />
      </motion.div>

      <h3
        className="text-title-2 mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Changes saved successfully
      </h3>

      {run.summary && (
        <p
          className="mb-8 max-w-sm text-center text-callout"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {run.summary}
        </p>
      )}

      <button
        onClick={dismiss}
        className="rounded-[var(--radius-md)] px-6 py-2.5 text-callout font-medium transition-colors"
        style={{
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        Done
      </button>
    </div>
  );
}
