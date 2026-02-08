'use client';

import { motion } from 'motion/react';
import { Loader2, Check } from 'lucide-react';
import type { AgentRun } from '@/lib/types/ai-agent';
import { checkmarkPop, smooth } from '@/lib/animations';

interface PhaseProcessingProps {
  run: AgentRun;
}

export function PhaseProcessing({ run }: PhaseProcessingProps) {
  return (
    <div>
      {/* User input */}
      <div
        className="mb-6 rounded-[var(--radius-md)] px-4 py-3"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          Your request
        </p>
        <p className="mt-1 text-callout" style={{ color: 'var(--color-text-primary)' }}>
          &ldquo;{run.inputText}&rdquo;
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {run.steps.map((step, i) => (
          <motion.div
            key={step.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...smooth, delay: i * 0.05 }}
          >
            {/* Icon */}
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
              {step.status === 'active' && (
                <Loader2
                  size={18}
                  strokeWidth={2}
                  className="animate-spin"
                  style={{ color: 'var(--color-accent)' }}
                />
              )}
              {step.status === 'completed' && (
                <motion.div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: 'var(--color-success)' }}
                  variants={checkmarkPop}
                  initial="hidden"
                  animate="visible"
                >
                  <Check size={12} strokeWidth={3} className="text-white" />
                </motion.div>
              )}
              {step.status === 'pending' && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: 'var(--color-text-tertiary)', opacity: 0.4 }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-callout"
              style={{
                color:
                  step.status === 'pending'
                    ? 'var(--color-text-tertiary)'
                    : 'var(--color-text-primary)',
              }}
            >
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Working indicator */}
      {run.status === 'running' && (
        <motion.p
          className="mt-6 text-caption"
          style={{ color: 'var(--color-accent)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Indra is working...
        </motion.p>
      )}

      {run.status === 'committing' && (
        <motion.div className="mt-6 flex items-center gap-2">
          <Loader2
            size={14}
            strokeWidth={2}
            className="animate-spin"
            style={{ color: 'var(--color-accent)' }}
          />
          <span className="text-caption" style={{ color: 'var(--color-accent)' }}>
            Saving changes...
          </span>
        </motion.div>
      )}
    </div>
  );
}
