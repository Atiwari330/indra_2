'use client';

import { motion } from 'motion/react';
import { CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { bouncy, smooth } from '@/lib/animations';

interface SubmissionSuccessProps {
  claimNumber: string;
  payerName: string;
  totalCharge: number;
  submittedAt: string;
  onViewCms1500: () => void;
}

export function SubmissionSuccess({
  claimNumber,
  payerName,
  totalCharge,
  submittedAt,
  onViewCms1500,
}: SubmissionSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="rounded-[var(--radius-lg)] p-6"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 10%, transparent), transparent 70%)',
        border: '1px solid color-mix(in srgb, var(--color-success) 28%, transparent)',
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={bouncy}
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white"
        style={{ background: 'var(--color-success)' }}
      >
        <CheckCircle2 size={24} strokeWidth={2} />
      </motion.div>

      <h3
        className="text-title-3 font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Claim submitted to {payerName}
      </h3>
      <p className="mt-1 text-callout" style={{ color: 'var(--color-text-secondary)' }}>
        ${totalCharge.toFixed(2)} on the way · waiting for payer acknowledgment
      </p>

      <div
        className="mt-4 grid grid-cols-2 gap-3"
        style={{ borderTop: '1px solid var(--color-separator)', paddingTop: 14 }}
      >
        <div>
          <p
            className="text-caption uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}
          >
            Claim Number
          </p>
          <p
            className="mt-0.5 text-callout font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {claimNumber}
          </p>
        </div>
        <div>
          <p
            className="text-caption uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}
          >
            Submitted
          </p>
          <p
            className="mt-0.5 text-callout"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {new Date(submittedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <button
        onClick={onViewCms1500}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
        style={{
          background: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <FileText size={14} strokeWidth={1.8} />
        View CMS-1500
        <ExternalLink size={12} strokeWidth={1.8} />
      </button>
    </motion.div>
  );
}
