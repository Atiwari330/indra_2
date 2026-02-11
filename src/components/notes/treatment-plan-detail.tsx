'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { slideOver, backdropFade } from '@/lib/animations';

interface TreatmentPlanData {
  id: string;
  status: string;
  version: number;
  diagnosis_codes: string[];
  goals: Array<{ goal: string; target_date?: string }>;
  objectives: Array<{ objective: string; frequency?: string }>;
  interventions: Array<{ intervention: string; frequency?: string }>;
  review_date: string;
  signed_at: string | null;
  created_at: string;
}

interface TreatmentPlanDetailProps {
  planId: string | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: {
    bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
    color: 'var(--color-success)',
  },
  draft: {
    bg: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-secondary)',
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-footnote font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function TreatmentPlanDetail({ planId, onClose }: TreatmentPlanDetailProps) {
  const [plan, setPlan] = useState<TreatmentPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/treatment-plans/${planId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load treatment plan');
        return res.json();
      })
      .then((data) => setPlan(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [planId]);

  const isOpen = planId !== null;
  const statusStyle = STATUS_STYLES[plan?.status ?? ''] ?? STATUS_STYLES.draft;

  const formattedDate = plan
    ? new Date(plan.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';

  const formattedSignedAt = plan?.signed_at
    ? new Date(plan.signed_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 z-50 flex flex-col glass"
            style={{
              top: 'var(--topbar-height)',
              width: 520,
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
              className="px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-separator)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
                    Treatment Plan
                  </h2>
                  {plan && (
                    <span
                      className="rounded-full px-2 py-0.5 text-caption font-medium"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {plan.status}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  aria-label="Close panel"
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>
              {plan && (
                <p className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                  Version {plan.version} &middot; {formattedDate}
                  {plan.review_date && <> &middot; Review {plan.review_date}</>}
                  {plan.signed_at && <> &middot; Signed {formattedSignedAt}</>}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={24}
                    className="animate-spin"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                </div>
              )}

              {error && (
                <p className="text-callout" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              {plan && !loading && (
                <div className="space-y-6">
                  {/* Review date callout */}
                  {plan.review_date && (
                    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2"
                      style={{ background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)' }}>
                      <span className="text-caption font-medium" style={{ color: 'var(--color-warning)' }}>
                        Next review
                      </span>
                      <span className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {plan.review_date}
                      </span>
                    </div>
                  )}

                  {/* Diagnoses */}
                  {plan.diagnosis_codes && plan.diagnosis_codes.length > 0 && (
                    <Section title="Diagnoses">
                      <div className="flex flex-wrap gap-1.5">
                        {plan.diagnosis_codes.map((code, i) => (
                          <span key={i} className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-semibold"
                            style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)' }}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Goals */}
                  {plan.goals && plan.goals.length > 0 && (
                    <Section title="Goals">
                      <div className="space-y-2">
                        {plan.goals.map((g, i) => (
                          <div key={i} className="rounded-[var(--radius-sm)] px-3 py-2.5"
                            style={{ background: 'var(--color-bg-secondary)' }}>
                            <div className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-caption font-semibold"
                                style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)' }}>
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-callout leading-snug" style={{ color: 'var(--color-text-primary)' }}>{g.goal}</p>
                                {g.target_date && <p className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Target: {g.target_date}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Objectives */}
                  {plan.objectives && plan.objectives.length > 0 && (
                    <Section title="Objectives">
                      <div className="space-y-2">
                        {plan.objectives.map((o, i) => (
                          <div key={i}>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{o.objective}</p>
                            {o.frequency && (
                              <span className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-caption"
                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                {o.frequency}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Interventions */}
                  {plan.interventions && plan.interventions.length > 0 && (
                    <Section title="Interventions">
                      <div className="space-y-2">
                        {plan.interventions.map((iv, i) => (
                          <div key={i}>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{iv.intervention}</p>
                            {iv.frequency && (
                              <span className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-caption"
                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                {iv.frequency}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
