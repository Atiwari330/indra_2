'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import { slideOver, backdropFade } from '@/lib/animations';
import { QUESTION_BANKS } from '@/lib/data/assessment-questions';
import { formatDate } from '@/lib/format';

interface AssessmentRequest {
  id: string;
  measure_type: string;
  status: string;
  total_score: number | null;
  severity: string | null;
  requested_at: string;
  completed_at: string | null;
  responses: Array<{ question_index: number; answer_value: number }> | null;
}

interface AssessmentResultsPanelProps {
  request: AssessmentRequest | null;
  onClose: () => void;
  onReassess: () => void;
}

function severityColor(severity: string | null): string {
  switch (severity?.toLowerCase()) {
    case 'minimal': return 'var(--color-success)';
    case 'mild': return '#34C759';
    case 'moderate': return 'var(--color-warning)';
    case 'moderately severe': return '#FF9500';
    case 'severe': return 'var(--color-error)';
    default: return 'var(--color-text-secondary)';
  }
}

export function AssessmentResultsPanel({ request, onClose, onReassess }: AssessmentResultsPanelProps) {
  const isOpen = request !== null && request.status === 'completed';
  const bank = request ? QUESTION_BANKS[request.measure_type] : null;
  const maxScore = bank ? bank.questions.length * 3 : 27;

  return (
    <AnimatePresence>
      {isOpen && request && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[400]"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[401] flex flex-col"
            style={{
              width: 520,
              background: 'var(--color-bg-primary)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
            }}
            variants={slideOver}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div>
                <h2 className="text-title-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {request.measure_type} Results
                </h2>
                {request.completed_at && (
                  <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                    Completed {formatDate(request.completed_at.split('T')[0])}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Score + Arc Gauge */}
              <div className="mb-6 flex flex-col items-center">
                <ArcGauge
                  score={request.total_score ?? 0}
                  maxScore={maxScore}
                  severity={request.severity}
                />
                <div className="mt-3 text-center">
                  <p className="text-large-title font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {request.total_score}
                  </p>
                  <p
                    className="text-callout font-medium"
                    style={{ color: severityColor(request.severity) }}
                  >
                    {request.severity}
                  </p>
                </div>
              </div>

              {/* Response Breakdown */}
              {bank && request.responses && (
                <div className="space-y-3">
                  <h3 className="text-footnote font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                    Response Breakdown
                  </h3>
                  {bank.questions.map((q, i) => {
                    const response = request.responses!.find((r) => r.question_index === i);
                    const answerValue = response?.answer_value ?? 0;
                    const answerLabel = bank.answerOptions.find((o) => o.value === answerValue)?.label ?? '';
                    return (
                      <div
                        key={i}
                        className="rounded-[var(--radius-md)] p-3"
                        style={{ background: 'var(--color-bg-secondary)' }}
                      >
                        <p className="text-caption mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                          Q{i + 1}. {q}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                            {answerLabel}
                          </p>
                          <span
                            className="text-callout font-semibold"
                            style={{ color: answerValue === 0 ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
                          >
                            {answerValue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={onReassess}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <RotateCcw size={16} strokeWidth={1.8} />
                Reassess
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Arc Gauge ─────────────────────────────────────────────────

function ArcGauge({
  score,
  maxScore,
  severity,
}: {
  score: number;
  maxScore: number;
  severity: string | null;
}) {
  const radius = 60;
  const strokeWidth = 8;
  const circumference = Math.PI * radius; // half circle
  const pct = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - pct);
  const color = severityColor(severity);

  return (
    <svg width={160} height={90} viewBox="0 0 160 90">
      {/* Background arc */}
      <path
        d="M 10 80 A 60 60 0 0 1 150 80"
        fill="none"
        stroke="var(--color-bg-tertiary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <motion.path
        d="M 10 80 A 60 60 0 0 1 150 80"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}
