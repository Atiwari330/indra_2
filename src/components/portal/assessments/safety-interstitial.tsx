'use client';

import { motion } from 'motion/react';
import { Phone, MessageSquare } from 'lucide-react';

interface SafetyInterstitialProps {
  onContinue: () => void;
}

export function SafetyInterstitial({ onContinue }: SafetyInterstitialProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center px-6 py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="rounded-full flex items-center justify-center mb-5"
        style={{
          width: 56,
          height: 56,
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
        }}
      >
        <Phone size={24} style={{ color: 'var(--color-accent)' }} />
      </div>

      <h2
        className="text-title-2 font-semibold text-center mb-3"
        style={{ color: 'var(--color-text-primary)' }}
      >
        We want to make sure you&apos;re safe.
      </h2>

      <p
        className="text-callout text-center mb-6 max-w-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        If you&apos;re having thoughts of hurting yourself, please reach out. Help is available 24/7.
      </p>

      <div className="w-full max-w-sm space-y-3 mb-6">
        <a
          href="tel:988"
          className="flex items-center gap-3 rounded-[var(--radius-md)] p-4 transition-colors"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Phone size={18} style={{ color: 'var(--color-accent)' }} />
          <div>
            <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
              988 Suicide &amp; Crisis Lifeline
            </p>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              Call or text 988
            </p>
          </div>
        </a>

        <a
          href="sms:741741&body=HELLO"
          className="flex items-center gap-3 rounded-[var(--radius-md)] p-4 transition-colors"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <MessageSquare size={18} style={{ color: 'var(--color-accent)' }} />
          <div>
            <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Crisis Text Line
            </p>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              Text HOME to 741741
            </p>
          </div>
        </a>
      </div>

      <p
        className="text-caption text-center mb-6 max-w-xs"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Your responses will be shared with your therapist, who will follow up with you.
      </p>

      <button
        onClick={onContinue}
        className="px-8 py-2.5 rounded-full text-callout font-medium transition-opacity hover:opacity-90"
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
        }}
      >
        Continue
      </button>
    </motion.div>
  );
}
