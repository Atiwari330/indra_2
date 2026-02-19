'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { smooth, checkmarkPop, phaseTransition } from '@/lib/animations';

export interface TrackerStep {
  key: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  subtitle?: string;
  cta?: { label: string; action: () => void };
  isManualToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

interface ClinicalProgressTrackerProps {
  steps: TrackerStep[];
  allComplete: boolean;
  patientFirstName: string;
}

export function ClinicalProgressTracker({
  steps,
  allComplete,
  patientFirstName,
}: ClinicalProgressTrackerProps) {
  const [expanded, setExpanded] = useState(!allComplete);

  return (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        {!expanded ? (
          <CompactBar
            key="compact"
            steps={steps}
            patientFirstName={patientFirstName}
            onExpand={() => setExpanded(true)}
          />
        ) : (
          <ExpandedStepper
            key="expanded"
            steps={steps}
            allComplete={allComplete}
            onCollapse={allComplete ? () => setExpanded(false) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Compact Bar ────────────────────────────────────────────────

function CompactBar({
  steps,
  patientFirstName,
  onExpand,
}: {
  steps: TrackerStep[];
  patientFirstName: string;
  onExpand: () => void;
}) {
  return (
    <motion.div
      variants={phaseTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-1.5">
        {steps.map((step) => (
          <motion.div
            key={step.key}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: 'var(--color-success)' }}
            variants={checkmarkPop}
            initial="hidden"
            animate="visible"
          >
            <Check size={11} strokeWidth={2.5} color="white" />
          </motion.div>
        ))}
      </div>
      <span className="text-footnote font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {patientFirstName}&apos;s clinical workflow is complete
      </span>
      <button
        onClick={onExpand}
        className="ml-auto flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <ChevronDown size={14} strokeWidth={2} />
      </button>
    </motion.div>
  );
}

// ── Expanded Stepper ───────────────────────────────────────────

function ExpandedStepper({
  steps,
  allComplete,
  onCollapse,
}: {
  steps: TrackerStep[];
  allComplete: boolean;
  onCollapse?: () => void;
}) {
  return (
    <motion.div
      variants={phaseTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="rounded-[var(--radius-lg)] px-5 py-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-footnote font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Clinical Progress
        </h3>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <ChevronUp size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="relative">
        {steps.map((step, i) => (
          <StepRow key={step.key} step={step} isLast={i === steps.length - 1} index={i} allComplete={allComplete} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Step Row ───────────────────────────────────────────────────

function StepRow({
  step,
  isLast,
  index,
  allComplete,
}: {
  step: TrackerStep;
  isLast: boolean;
  index: number;
  allComplete: boolean;
}) {
  const isComplete = step.status === 'complete';
  const isCurrent = step.status === 'current';
  const isUpcoming = step.status === 'upcoming';

  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smooth, delay: index * 0.04 }}
    >
      {/* Connector column */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        {isComplete ? (
          <motion.div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--color-success)' }}
            variants={checkmarkPop}
            initial={allComplete ? 'visible' : 'hidden'}
            animate="visible"
          >
            <Check size={13} strokeWidth={2.5} color="white" />
          </motion.div>
        ) : isCurrent ? (
          <div
            className="tracker-pulse-ring flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              border: '2px solid var(--color-accent)',
              background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-card))',
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: 'var(--color-accent)' }}
            />
          </div>
        ) : (
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              border: '1.5px solid var(--color-border-strong)',
            }}
          />
        )}

        {/* Connecting line */}
        {!isLast && (
          <div
            className="my-1 w-px flex-1"
            style={{
              minHeight: 16,
              background: isComplete
                ? 'var(--color-success)'
                : 'var(--color-border-strong)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
        <div className="flex items-center gap-2">
          <span
            className={`text-callout ${isCurrent ? 'font-semibold' : 'font-normal'}`}
            style={{
              color: isUpcoming
                ? 'var(--color-text-tertiary)'
                : 'var(--color-text-primary)',
            }}
          >
            {step.label}
          </span>
        </div>

        {step.subtitle && (
          <p className="mt-0.5 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            {step.subtitle}
          </p>
        )}

        {/* Manual toggle (consent step) */}
        {step.isManualToggle && isCurrent && (
          <div className="mt-2">
            <ToggleSwitch
              value={step.toggleValue ?? false}
              onChange={(v) => step.onToggle?.(v)}
              label="Mark as complete"
            />
          </div>
        )}

        {/* CTA button */}
        {step.cta && isCurrent && !step.isManualToggle && (
          <motion.button
            onClick={step.cta.action}
            className="mt-2 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-caption font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-card))',
              border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
              color: 'var(--color-accent)',
              boxShadow: 'var(--shadow-sm)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {step.cta.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Toggle Switch ──────────────────────────────────────────────

function ToggleSwitch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2"
    >
      <div
        className="relative h-5 w-9 rounded-full transition-colors duration-200"
        style={{
          background: value ? 'var(--color-success)' : 'var(--color-bg-tertiary)',
        }}
      >
        <motion.div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
          animate={{ left: value ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <span className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </button>
  );
}
