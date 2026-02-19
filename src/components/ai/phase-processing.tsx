'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Loader2, Check, Sparkles } from 'lucide-react';
import type { AgentRun, ProcessingStep } from '@/lib/types/ai-agent';
import { checkmarkPop, smooth, processingReveal } from '@/lib/animations';

interface PhaseProcessingProps {
  run: AgentRun;
}

/**
 * For synthetic steps (IDs starting with 'synth-'), we animate progress
 * locally with a timer to create the illusion of activity during the
 * 10-30s blocking backend call.
 */
function useSyntheticStepAnimation(steps: ProcessingStep[]): ProcessingStep[] {
  const isSynthetic = steps.length > 0 && steps[0].id.startsWith('synth-');
  const [cursor, setCursor] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSynthetic) {
      setCursor(0);
      return;
    }

    // Advance one step every ~2.5s, but don't advance past the last step
    intervalRef.current = setInterval(() => {
      setCursor((prev) => Math.min(prev + 1, steps.length - 1));
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSynthetic, steps.length]);

  if (!isSynthetic) return steps;

  return steps.map((step, i) => ({
    ...step,
    status: i < cursor ? 'completed' : i === cursor ? 'active' : 'pending',
  }));
}

export function PhaseProcessing({ run }: PhaseProcessingProps) {
  const animatedSteps = useSyntheticStepAnimation(run.steps);

  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center"
        style={{ maxWidth: 560, width: '100%' }}
        variants={processingReveal}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Request echo — glass pill */}
        <div
          className="glass-subtle mb-8 w-full rounded-[var(--radius-lg)] px-5 py-4"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles
              size={13}
              strokeWidth={1.8}
              style={{ color: 'var(--color-accent)' }}
            />
            <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              Your request
            </span>
          </div>
          <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
            &ldquo;{run.inputText}&rdquo;
          </p>
        </div>

        {/* Steps — left-aligned within centered container */}
        <div className="w-full space-y-4" style={{ maxWidth: 400 }}>
          {animatedSteps.map((step, i) => (
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

          {/* Working indicator — inside steps container so it aligns */}
          {run.status === 'running' && (
            <div className="flex items-center gap-2.5 pt-4">
              <motion.div
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--color-accent)' }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                Indra is working...
              </span>
            </div>
          )}

          {run.status === 'committing' && (
            <div className="flex items-center gap-2 pt-4">
              <Loader2
                size={14}
                strokeWidth={2}
                className="animate-spin"
                style={{ color: 'var(--color-accent)' }}
              />
              <span className="text-caption" style={{ color: 'var(--color-accent)' }}>
                Saving changes...
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
