'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck, Code, ChevronDown } from 'lucide-react';
import type { EligibilityResponse } from '@/lib/types/stedi';
import { smooth } from '@/lib/animations';

interface EligibilityCardProps {
  response: EligibilityResponse;
}

function formatMoney(n: number | undefined): string {
  if (n == null) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function EligibilityCard({ response }: EligibilityCardProps) {
  const [showJson, setShowJson] = useState(false);
  const s = response.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="space-y-3"
    >
      {/* Header card */}
      <div
        className="rounded-[var(--radius-md)] p-4"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 8%, transparent), transparent 70%)',
          border: '1px solid color-mix(in srgb, var(--color-success) 28%, transparent)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ background: 'var(--color-success)' }}
            >
              <ShieldCheck size={16} strokeWidth={2} />
            </div>
            <div>
              <p
                className="text-callout font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Coverage verified with {response.payer.name}
              </p>
              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                {s.planName} · Member {response.subscriber.memberId}
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-caption font-medium"
            style={{
              background: s.inNetwork
                ? 'color-mix(in srgb, var(--color-success) 14%, transparent)'
                : 'color-mix(in srgb, var(--color-warning) 14%, transparent)',
              color: s.inNetwork ? 'var(--color-success)' : 'var(--color-warning)',
            }}
          >
            {s.inNetwork ? 'In network' : 'Out of network'}
          </span>
        </div>

        {/* Stats grid */}
        <div
          className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"
          style={{ borderTop: '1px solid var(--color-separator)', paddingTop: 12 }}
        >
          <Stat label="Copay" value={formatMoney(s.copayAmount)} />
          <Stat
            label="Deductible"
            value={formatMoney(s.deductibleRemaining)}
            sub={`of ${formatMoney(s.deductibleAmount)} remaining`}
          />
          <Stat
            label="Out-of-pocket"
            value={formatMoney(s.outOfPocketRemaining)}
            sub={`of ${formatMoney(s.outOfPocketMax)} remaining`}
          />
          <Stat label="Coinsurance" value={`${s.coinsurancePercent ?? 0}%`} />
        </div>

        {/* Checks */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CheckChip label="Mental health covered" active={s.mentalHealthCovered} />
          <CheckChip
            label="Prior auth required"
            active={s.priorAuthRequired}
            neutral={!s.priorAuthRequired}
          />
          {s.sessionsAuthorized != null && (
            <span
              className="text-caption"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {s.sessionsAuthorized - (s.sessionsUsed ?? 0)} of{' '}
              {s.sessionsAuthorized} sessions remaining
            </span>
          )}
        </div>
      </div>

      {/* Raw JSON toggle */}
      <button
        onClick={() => setShowJson((v) => !v)}
        className="flex items-center gap-1.5 text-caption transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <Code size={12} strokeWidth={2} />
        <span>{showJson ? 'Hide' : 'View'} raw response</span>
        <motion.span animate={{ rotate: showJson ? 180 : 0 }} style={{ display: 'flex' }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence>
        {showJson && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={smooth}
            className="overflow-auto rounded-[var(--radius-sm)] p-3 text-caption"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              maxHeight: 280,
            }}
          >
            {JSON.stringify(response, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p
        className="text-caption uppercase tracking-wider"
        style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-headline font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function CheckChip({
  label,
  active,
  neutral,
}: {
  label: string;
  active: boolean;
  neutral?: boolean;
}) {
  const color = neutral
    ? 'var(--color-text-tertiary)'
    : active
    ? 'var(--color-success)'
    : 'var(--color-text-tertiary)';
  return (
    <span className="flex items-center gap-1 text-caption" style={{ color }}>
      <Check size={11} strokeWidth={2.4} />
      {label}
    </span>
  );
}
