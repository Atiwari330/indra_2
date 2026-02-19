'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useAgentContext } from './agent-provider';
import { useSidebar } from '@/components/shell/sidebar-provider';
import { canvasBackdrop, phaseTransition } from '@/lib/animations';
import { PhaseProcessing } from './phase-processing';
import { PhaseClarification } from './phase-clarification';
import { PhaseReview } from './phase-review';
import { PhaseSuccess } from './phase-success';
import { PhaseError } from './phase-error';

const PHASE_LABELS: Record<string, string> = {
  processing: 'Working',
  clarification: 'Needs input',
  review: 'Review',
  success: 'Complete',
  error: 'Error',
};

export function AgentCanvas() {
  const { isSlideOverOpen, currentPhase, run, dismiss } = useAgentContext();
  const { expanded } = useSidebar();

  const canClose = currentPhase !== 'processing';
  const label = currentPhase ? PHASE_LABELS[currentPhase] : '';

  return (
    <AnimatePresence>
      {isSlideOverOpen && (
        <>
          {/* Backdrop — covers main content area only */}
          <motion.div
            className="fixed z-40"
            style={{
              top: 'var(--topbar-height)',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            variants={canvasBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={canClose ? dismiss : undefined}
          />

          {/* Canvas panel — fills main content area */}
          <motion.div
            className="fixed z-40 flex flex-col"
            style={{
              top: 'var(--topbar-height)',
              right: 0,
              bottom: 0,
              background: 'var(--color-bg-primary)',
            }}
            initial={{ left: expanded ? 260 : 72, opacity: 0, scale: 0.985, y: 12 }}
            animate={{ left: expanded ? 260 : 72, opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 12 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.1 }}
          >
            {/* Header — minimal floating bar */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{
                background: 'var(--glass-bg-topbar)',
                backdropFilter: 'blur(20px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  strokeWidth={1.8}
                  style={{ color: 'var(--color-accent)' }}
                />
                <span className="text-footnote" style={{ color: 'var(--color-text-secondary)' }}>
                  {label}
                </span>
              </div>
              <button
                onClick={dismiss}
                disabled={!canClose}
                className="rounded-full p-1.5 transition-colors"
                style={{
                  color: canClose ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                  opacity: canClose ? 1 : 0.4,
                }}
                aria-label="Close canvas"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentPhase === 'processing' && run && (
                  <motion.div
                    key="processing"
                    variants={phaseTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    <PhaseProcessing run={run} />
                  </motion.div>
                )}

                {currentPhase === 'clarification' && run && (
                  <motion.div
                    key="clarification"
                    variants={phaseTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    <PhaseClarification run={run} />
                  </motion.div>
                )}

                {currentPhase === 'review' && run && (
                  <motion.div
                    key="review"
                    variants={phaseTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    <PhaseReview run={run} />
                  </motion.div>
                )}

                {currentPhase === 'success' && run && (
                  <motion.div
                    key="success"
                    variants={phaseTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    <PhaseSuccess run={run} />
                  </motion.div>
                )}

                {currentPhase === 'error' && run && (
                  <motion.div
                    key="error"
                    variants={phaseTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    <PhaseError run={run} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
