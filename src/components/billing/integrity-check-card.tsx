'use client';

import { Check, X, AlertTriangle, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import type { IntegrityResult, IntegrityStatus } from '@/services/claim-integrity.service';
import { smooth } from '@/lib/animations';

interface IntegrityCheckCardProps {
  result: IntegrityResult;
}

const STATUS_COLOR: Record<IntegrityStatus, string> = {
  passed: 'var(--color-success)',
  warning: 'var(--color-warning)',
  failed: 'var(--color-error)',
};

function StatusIcon({ status }: { status: IntegrityStatus }) {
  if (status === 'passed') return <Check size={14} strokeWidth={2.4} />;
  if (status === 'warning') return <AlertTriangle size={12} strokeWidth={2.2} />;
  return <X size={14} strokeWidth={2.4} />;
}

export function IntegrityCheckCard({ result }: IntegrityCheckCardProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {result.checks.map((check, i) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...smooth, delay: i * 0.08 }}
            className="flex items-start gap-3 rounded-[var(--radius-md)] p-3"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: STATUS_COLOR[check.status] }}
            >
              <StatusIcon status={check.status} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-callout font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {check.label}
              </p>
              {check.detail && (
                <p
                  className="mt-0.5 text-caption"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {check.detail}
                </p>
              )}
              {check.evidence && (
                <div
                  className="mt-1.5 flex items-start gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    borderLeft: `2px solid ${STATUS_COLOR[check.status]}`,
                  }}
                >
                  <Quote
                    size={10}
                    strokeWidth={2}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                  <span
                    className="text-caption italic"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {check.evidence}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {result.medicalNecessityQuote && result.passed && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smooth, delay: result.checks.length * 0.08 }}
          className="rounded-[var(--radius-md)] p-3"
          style={{
            background: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-success) 24%, transparent)',
          }}
        >
          <p
            className="text-caption font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-success)' }}
          >
            Medical Necessity Documented
          </p>
          <p
            className="mt-1 text-caption italic"
            style={{ color: 'var(--color-text-primary)' }}
          >
            &ldquo;{result.medicalNecessityQuote}&rdquo;
          </p>
        </motion.div>
      )}
    </div>
  );
}
