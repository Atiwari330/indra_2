'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface IntakeCompletionProps {
  onHome: () => void;
}

export function IntakeCompletion({ onHome }: IntakeCompletionProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Checkmark */}
      <motion.div
        className="flex items-center justify-center rounded-full mb-6"
        style={{
          width: 72,
          height: 72,
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: 0.2 }}
        >
          <Check size={32} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
        </motion.div>
      </motion.div>

      <motion.h2
        className="text-title-2 font-semibold text-center mb-2"
        style={{ color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        All done! Thank you for completing your intake paperwork.
      </motion.h2>

      <motion.div
        className="rounded-[var(--radius-lg)] p-5 mt-4 mb-8 max-w-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <p className="text-callout text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Your therapist will review your responses before your first session.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-3 w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        <button
          onClick={onHome}
          className="px-6 py-2.5 rounded-full text-callout font-medium transition-opacity hover:opacity-90"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
          }}
        >
          Return Home
        </button>
      </motion.div>
    </motion.div>
  );
}
