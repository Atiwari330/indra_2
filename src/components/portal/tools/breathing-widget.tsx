'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import {
  BREATHE_IN_MS,
  BREATHE_HOLD_MS,
  BREATHE_OUT_MS,
  breatheOverlay,
  prefersReducedMotion,
} from '@/lib/portal-animations';

type Phase = 'in' | 'hold' | 'out';

const PHASE_LABELS: Record<Phase, string> = {
  in: 'Breathe in...',
  hold: 'Hold...',
  out: 'Breathe out...',
};

const PHASE_DURATIONS: Record<Phase, number> = {
  in: BREATHE_IN_MS,
  hold: BREATHE_HOLD_MS,
  out: BREATHE_OUT_MS,
};

const PHASE_ORDER: Phase[] = ['in', 'hold', 'out'];

interface BreathingWidgetProps {
  onClose: () => void;
}

export function BreathingWidget({ onClose }: BreathingWidgetProps) {
  const [phase, setPhase] = useState<Phase>('in');
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    setIsReducedMotion(prefersReducedMotion());
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((current) => {
      const idx = PHASE_ORDER.indexOf(current);
      return PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(advancePhase, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase, advancePhase]);

  const circleScale = isReducedMotion ? 1 : (phase === 'in' || phase === 'hold' ? 1.4 : 1);
  const animDuration = isReducedMotion ? 0 : PHASE_DURATIONS[phase] / 1000;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'var(--color-bg-primary)' }}
        variants={breatheOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <button
          onClick={onClose}
          aria-label="Close breathing exercise"
          className="absolute top-4 right-4 p-2 rounded-full transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <X size={24} />
        </button>

        <motion.div
          className="rounded-full"
          style={{
            width: 160,
            height: 160,
            background: `radial-gradient(circle, var(--color-accent), transparent)`,
            opacity: 0.4,
          }}
          animate={{ scale: circleScale }}
          transition={{ duration: animDuration, ease: 'easeInOut' }}
        />

        <p
          className="mt-10 text-title-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {PHASE_LABELS[phase]}
        </p>

        <p
          className="mt-2 text-callout"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {phase === 'in' && '4 seconds'}
          {phase === 'hold' && '7 seconds'}
          {phase === 'out' && '8 seconds'}
        </p>

        <button
          onClick={onClose}
          className="mt-12 px-6 py-2 rounded-full text-callout font-medium transition-colors"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
          }}
        >
          Done
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
