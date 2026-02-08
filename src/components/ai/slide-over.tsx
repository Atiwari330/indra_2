'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAgentContext } from './agent-provider';
import { slideOver, backdropFade, phaseTransition } from '@/lib/animations';
import { PhaseProcessing } from './phase-processing';
import { PhaseClarification } from './phase-clarification';
import { PhaseReview } from './phase-review';
import { PhaseSuccess } from './phase-success';
import { PhaseError } from './phase-error';

const PHASE_TITLES: Record<string, string> = {
  processing: 'Processing',
  clarification: 'Clarification needed',
  review: 'Review changes',
  success: 'Complete',
  error: 'Something went wrong',
};

export function SlideOver() {
  const { isSlideOverOpen, currentPhase, run, dismiss } = useAgentContext();

  const canClose = currentPhase !== 'processing';
  const title = currentPhase ? PHASE_TITLES[currentPhase] : '';

  return (
    <AnimatePresence>
      {isSlideOverOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={canClose ? dismiss : undefined}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 z-40 flex flex-col glass"
            style={{
              top: 'var(--topbar-height)',
              width: 480,
              height: 'calc(100vh - var(--topbar-height))',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
            }}
            variants={slideOver}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-separator)' }}
            >
              <h2 className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </h2>
              <button
                onClick={dismiss}
                disabled={!canClose}
                className="rounded-full p-1.5 transition-colors"
                style={{
                  color: canClose ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                  opacity: canClose ? 1 : 0.4,
                }}
                aria-label="Close panel"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {currentPhase === 'processing' && run && (
                  <motion.div
                    key="processing"
                    variants={phaseTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
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
