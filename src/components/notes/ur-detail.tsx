'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, ClipboardCheck } from 'lucide-react';
import { slideOver, backdropFade } from '@/lib/animations';

interface URData {
  id: string;
  review_type: string;
  status: string;
  sessions_authorized: number | null;
  sessions_used: number | null;
  sessions_requested: number | null;
  created_at: string;
  approved_at: string | null;
  generated_content: Record<string, unknown>;
}

interface URDetailProps {
  urId: string | null;
  onClose: () => void;
  onApproved?: (urId: string) => void;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending_review: {
    bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
    color: 'var(--color-warning)',
  },
  approved: {
    bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
    color: 'var(--color-success)',
  },
  submitted: {
    bg: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
    color: 'var(--color-accent)',
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

export function URDetail({ urId, onClose, onApproved }: URDetailProps) {
  const [ur, setUR] = useState<URData | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!urId) {
      setUR(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/utilization-reviews/${urId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load utilization review');
        return res.json();
      })
      .then((data) => setUR(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [urId]);

  const handleApprove = useCallback(async () => {
    if (!ur) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/utilization-reviews/${ur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve review');
      const updated = await res.json();
      setUR({ ...ur, status: updated.status, approved_at: updated.approved_at });
      onApproved?.(ur.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setApproving(false);
    }
  }, [ur, onApproved]);

  const isOpen = urId !== null;
  const content = ur?.generated_content ?? {};
  const statusStyle = STATUS_STYLES[ur?.status ?? ''] ?? STATUS_STYLES.draft;

  // Extract sections from generated_content
  const demographics = content.patient_demographics as {
    name?: string; date_of_birth?: string; gender?: string;
  } | undefined;
  const authSummary = content.authorization_summary as {
    payer_name?: string; member_id?: string; group_number?: string;
    authorization_number?: string; sessions_authorized?: number;
    sessions_used?: number; sessions_remaining?: number;
  } | null;
  const diagnoses = content.diagnoses as Array<{
    icd10_code: string; description: string; is_primary?: boolean;
    current_status_summary: string;
  }> | undefined;
  const treatment = content.treatment_summary as {
    treatment_start_date?: string; modality?: string; session_frequency?: string;
    session_duration_minutes?: number; interventions_used?: string[];
    total_sessions_completed?: number; summary_narrative?: string;
  } | undefined;
  const scores = content.assessment_score_trends as Array<{
    measure_type: string; scores: Array<{ date?: string; score: number }>;
    trend: string; clinical_interpretation: string;
  }> | undefined;
  const goals = content.goal_progress as Array<{
    goal: string; status: string; evidence: string; target_date?: string;
  }> | undefined;
  const risk = content.risk_assessment_summary as {
    current_risk_level?: string; risk_factors?: string[];
    protective_factors?: string[]; safety_plan_status?: string;
  } | undefined;
  const necessity = content.medical_necessity as {
    justification?: string; functional_limitations?: string[];
    consequences_without_treatment?: string; clinical_rationale_for_frequency?: string;
  } | undefined;
  const recommendation = content.continued_treatment_recommendation as {
    sessions_requested?: number; recommended_frequency?: string;
    treatment_goals_for_next_period?: string[]; expected_outcomes?: string;
    estimated_discharge_criteria?: string;
  } | undefined;

  const formattedDate = ur
    ? new Date(ur.created_at).toLocaleDateString('en-US', {
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
                    Utilization Review
                  </h2>
                  {ur && (
                    <span
                      className="rounded-full px-2 py-0.5 text-caption font-medium"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {ur.status.replace(/_/g, ' ')}
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
              {ur && (
                <p className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                  {ur.review_type.replace(/_/g, ' ')} &middot; {formattedDate}
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

              {ur && !loading && (
                <div className="space-y-6">
                  {/* 1. Patient Demographics */}
                  {demographics && (
                    <Section title="Patient Demographics">
                      <div className="space-y-1">
                        {demographics.name && <Row label="Name" value={demographics.name} />}
                        {demographics.date_of_birth && <Row label="DOB" value={demographics.date_of_birth} />}
                        {demographics.gender && <Row label="Gender" value={demographics.gender} />}
                      </div>
                    </Section>
                  )}

                  {/* 2. Authorization Summary */}
                  {authSummary && (
                    <Section title="Authorization Summary">
                      <div className="space-y-1">
                        {authSummary.payer_name && <Row label="Payer" value={authSummary.payer_name} />}
                        {authSummary.member_id && <Row label="Member ID" value={authSummary.member_id} />}
                        {authSummary.group_number && <Row label="Group #" value={authSummary.group_number} />}
                        {authSummary.authorization_number && <Row label="Auth #" value={authSummary.authorization_number} />}
                        {authSummary.sessions_authorized != null && (
                          <Row label="Sessions" value={`${authSummary.sessions_used ?? 0} used / ${authSummary.sessions_authorized} authorized (${authSummary.sessions_remaining ?? 0} remaining)`} />
                        )}
                      </div>
                    </Section>
                  )}

                  {/* 3. Diagnoses */}
                  {diagnoses && diagnoses.length > 0 && (
                    <Section title="Diagnoses">
                      <div className="space-y-2">
                        {diagnoses.map((d, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2">
                              <span className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-semibold"
                                style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)' }}>
                                {d.icd10_code}
                              </span>
                              <span className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {d.description}
                              </span>
                              {d.is_primary && (
                                <span className="rounded-full px-1.5 py-0.5 text-caption" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                                  primary
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                              {d.current_status_summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* 4. Treatment Summary */}
                  {treatment && (
                    <Section title="Treatment Summary">
                      <div className="space-y-1">
                        {treatment.treatment_start_date && <Row label="Start Date" value={treatment.treatment_start_date} />}
                        {treatment.modality && <Row label="Modality" value={treatment.modality} />}
                        {treatment.session_frequency && <Row label="Frequency" value={treatment.session_frequency} />}
                        {treatment.session_duration_minutes != null && <Row label="Duration" value={`${treatment.session_duration_minutes} min`} />}
                        {treatment.total_sessions_completed != null && <Row label="Sessions Completed" value={String(treatment.total_sessions_completed)} />}
                        {treatment.interventions_used && treatment.interventions_used.length > 0 && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Interventions</p>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                              {treatment.interventions_used.join(', ')}
                            </p>
                          </div>
                        )}
                        {treatment.summary_narrative && (
                          <div className="mt-2">
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Narrative</p>
                            <p className="mt-0.5 text-callout" style={{ color: 'var(--color-text-primary)' }}>
                              {treatment.summary_narrative}
                            </p>
                          </div>
                        )}
                      </div>
                    </Section>
                  )}

                  {/* 5. Assessment Score Trends */}
                  {scores && scores.length > 0 && (
                    <Section title="Assessment Score Trends">
                      <div className="space-y-3">
                        {scores.map((s, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2">
                              <span className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {s.measure_type}
                              </span>
                              <span className="rounded-full px-1.5 py-0.5 text-caption font-medium" style={{
                                background: s.trend === 'improving' ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : s.trend === 'worsening' ? 'color-mix(in srgb, var(--color-error) 12%, transparent)' : 'var(--color-bg-tertiary)',
                                color: s.trend === 'improving' ? 'var(--color-success)' : s.trend === 'worsening' ? 'var(--color-error)' : 'var(--color-text-secondary)',
                              }}>{s.trend}</span>
                            </div>
                            <p className="mt-0.5 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                              Scores: {s.scores.map(sc => sc.score).join(' \u2192 ')}
                            </p>
                            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                              {s.clinical_interpretation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* 6. Treatment Goal Progress */}
                  {goals && goals.length > 0 && (
                    <Section title="Treatment Goal Progress">
                      <div className="space-y-2">
                        {goals.map((g, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full px-1.5 py-0.5 text-caption font-medium" style={{
                                background: g.status === 'MET' ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : g.status === 'APPROACHING' ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-tertiary)',
                                color: g.status === 'MET' ? 'var(--color-success)' : g.status === 'APPROACHING' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                              }}>{g.status}</span>
                              <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{g.goal}</span>
                            </div>
                            <p className="mt-0.5 text-caption" style={{ color: 'var(--color-text-secondary)' }}>{g.evidence}</p>
                            {g.target_date && (
                              <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Target: {g.target_date}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* 7. Risk Assessment */}
                  {risk && (
                    <Section title="Risk Assessment">
                      <div className="space-y-1">
                        {risk.current_risk_level && (
                          <div className="flex items-center gap-2">
                            <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Risk Level</span>
                            <span className="rounded-full px-1.5 py-0.5 text-caption font-medium" style={{
                              background: risk.current_risk_level === 'none' || risk.current_risk_level === 'low' ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : risk.current_risk_level === 'moderate' ? 'color-mix(in srgb, var(--color-warning) 12%, transparent)' : 'color-mix(in srgb, var(--color-error) 12%, transparent)',
                              color: risk.current_risk_level === 'none' || risk.current_risk_level === 'low' ? 'var(--color-success)' : risk.current_risk_level === 'moderate' ? 'var(--color-warning)' : 'var(--color-error)',
                            }}>{risk.current_risk_level}</span>
                          </div>
                        )}
                        {risk.risk_factors && risk.risk_factors.length > 0 && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Risk Factors</p>
                            <ul className="list-disc pl-4">
                              {risk.risk_factors.map((f, i) => (
                                <li key={i} className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {risk.protective_factors && risk.protective_factors.length > 0 && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Protective Factors</p>
                            <ul className="list-disc pl-4">
                              {risk.protective_factors.map((f, i) => (
                                <li key={i} className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {risk.safety_plan_status && <Row label="Safety Plan" value={risk.safety_plan_status} />}
                      </div>
                    </Section>
                  )}

                  {/* 8. Medical Necessity */}
                  {necessity && (
                    <Section title="Medical Necessity">
                      <div className="space-y-2">
                        {necessity.justification && (
                          <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                            {necessity.justification}
                          </p>
                        )}
                        {necessity.functional_limitations && necessity.functional_limitations.length > 0 && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Functional Limitations</p>
                            <ul className="list-disc pl-4">
                              {necessity.functional_limitations.map((l, i) => (
                                <li key={i} className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{l}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {necessity.consequences_without_treatment && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Consequences Without Treatment</p>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{necessity.consequences_without_treatment}</p>
                          </div>
                        )}
                        {necessity.clinical_rationale_for_frequency && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Rationale for Frequency</p>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{necessity.clinical_rationale_for_frequency}</p>
                          </div>
                        )}
                      </div>
                    </Section>
                  )}

                  {/* 9. Continued Treatment Recommendation */}
                  {recommendation && (
                    <Section title="Continued Treatment Recommendation">
                      <div className="space-y-1">
                        {recommendation.sessions_requested != null && <Row label="Sessions Requested" value={String(recommendation.sessions_requested)} />}
                        {recommendation.recommended_frequency && <Row label="Frequency" value={recommendation.recommended_frequency} />}
                        {recommendation.treatment_goals_for_next_period && recommendation.treatment_goals_for_next_period.length > 0 && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Goals for Next Period</p>
                            <ul className="list-disc pl-4">
                              {recommendation.treatment_goals_for_next_period.map((g, i) => (
                                <li key={i} className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {recommendation.expected_outcomes && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Expected Outcomes</p>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{recommendation.expected_outcomes}</p>
                          </div>
                        )}
                        {recommendation.estimated_discharge_criteria && (
                          <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Discharge Criteria</p>
                            <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{recommendation.estimated_discharge_criteria}</p>
                          </div>
                        )}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {ur && !loading && (
              <div
                className="px-6 py-4"
                style={{ borderTop: '1px solid var(--color-separator)' }}
              >
                {ur.status === 'draft' || ur.status === 'pending_review' ? (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-callout font-medium text-white transition-opacity"
                    style={{
                      background: 'var(--color-accent)',
                      opacity: approving ? 0.7 : 1,
                    }}
                  >
                    {approving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ClipboardCheck size={16} strokeWidth={1.8} />
                    )}
                    {approving ? 'Approving...' : 'Approve Review'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    <Check size={14} style={{ color: 'var(--color-success)' }} />
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      Approved
                      {ur.approved_at && (
                        <> &middot; {new Date(ur.approved_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Simple key-value row
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-caption flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}
