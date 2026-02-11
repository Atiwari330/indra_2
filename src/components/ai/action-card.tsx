'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Pill, CalendarPlus, Receipt, Stethoscope, ClipboardList, Target, ChevronDown, AlertTriangle } from 'lucide-react';
import type { ProposedAction } from '@/lib/types/ai-agent';
import { smooth } from '@/lib/animations';
import { SOAPNoteContent } from '@/components/notes/soap-note-content';

const ACTION_ICONS: Record<string, typeof FileText> = {
  encounter: Stethoscope,
  note: FileText,
  medication: Pill,
  appointment: CalendarPlus,
  billing: Receipt,
  utilization_review: ClipboardList,
  treatment_plan: Target,
};

const ACTION_LABELS: Record<string, string> = {
  encounter: 'Encounter',
  note: 'Note',
  medication: 'Medication',
  appointment: 'Appointment',
  billing: 'Billing',
  utilization_review: 'Utilization Review',
  treatment_plan: 'Treatment Plan',
};

interface ActionCardProps {
  action: ProposedAction;
}

function BillingContent({ payload }: { payload: Record<string, unknown> }) {
  const cptCode = payload.cpt_code as string | undefined;
  const description = payload.description as string | undefined;
  const diagnosisCodes = payload.diagnosis_codes as string[] | undefined;
  const units = payload.units as number | undefined;

  return (
    <div className="space-y-2">
      {cptCode && (
        <div className="flex items-center gap-2">
          <span
            className="rounded-[var(--radius-sm)] px-2 py-1 text-callout font-semibold"
            style={{
              background: `color-mix(in srgb, var(--color-accent) 10%, transparent)`,
              color: 'var(--color-accent)',
            }}
          >
            {cptCode}
          </span>
          {units != null && (
            <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              {units} {units === 1 ? 'unit' : 'units'}
            </span>
          )}
        </div>
      )}
      {description && (
        <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
          {description}
        </p>
      )}
      {diagnosisCodes && diagnosisCodes.length > 0 && (
        <div>
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            Diagnosis codes
          </p>
          <p className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
            {diagnosisCodes.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

function URContent({ content }: { content: Record<string, unknown> }) {
  const diagnoses = content.diagnoses as Array<{
    icd10_code: string; description: string; current_status_summary: string;
  }> | undefined;
  const treatment = content.treatment_summary as {
    modality?: string; session_frequency?: string; total_sessions_completed?: number; summary_narrative?: string;
  } | undefined;
  const scores = content.assessment_score_trends as Array<{
    measure_type: string; scores: Array<{ score: number }>; trend: string;
  }> | undefined;
  const goals = content.goal_progress as Array<{
    goal: string; status: string; evidence: string;
  }> | undefined;
  const necessity = content.medical_necessity as {
    justification?: string; functional_limitations?: string[]; consequences_without_treatment?: string;
  } | undefined;
  const recommendation = content.continued_treatment_recommendation as {
    sessions_requested?: number; recommended_frequency?: string;
    treatment_goals_for_next_period?: string[];
  } | undefined;

  return (
    <div className="space-y-3">
      {diagnoses && diagnoses.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>DIAGNOSES</p>
          <div className="mt-1 space-y-1">
            {diagnoses.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)' }}>
                  {d.icd10_code}
                </span>
                <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{d.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {treatment && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>TREATMENT SUMMARY</p>
          <div className="mt-1 space-y-0.5">
            {treatment.modality && <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{treatment.modality}</p>}
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              {[treatment.session_frequency, treatment.total_sessions_completed != null ? `${treatment.total_sessions_completed} sessions` : null].filter(Boolean).join(' · ')}
            </p>
            {treatment.summary_narrative && <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{treatment.summary_narrative}</p>}
          </div>
        </div>
      )}
      {scores && scores.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>SCORE TRENDS</p>
          <div className="mt-1 space-y-1">
            {scores.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{s.measure_type}</span>
                <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  {s.scores.map(sc => sc.score).join(' → ')}
                </span>
                <span className="rounded-full px-1.5 py-0.5 text-caption font-medium" style={{
                  background: s.trend === 'improving' ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : s.trend === 'worsening' ? 'color-mix(in srgb, var(--color-error) 12%, transparent)' : 'var(--color-bg-tertiary)',
                  color: s.trend === 'improving' ? 'var(--color-success)' : s.trend === 'worsening' ? 'var(--color-error)' : 'var(--color-text-secondary)',
                }}>{s.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {goals && goals.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>GOAL PROGRESS</p>
          <div className="mt-1 space-y-1.5">
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
              </div>
            ))}
          </div>
        </div>
      )}
      {necessity && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>MEDICAL NECESSITY</p>
          {necessity.justification && <p className="mt-1 text-callout" style={{ color: 'var(--color-text-primary)' }}>{necessity.justification}</p>}
          {necessity.functional_limitations && necessity.functional_limitations.length > 0 && (
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {necessity.functional_limitations.map((l, i) => (
                <li key={i} className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {recommendation && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>RECOMMENDATION</p>
          <p className="mt-1 text-callout" style={{ color: 'var(--color-text-primary)' }}>
            {recommendation.sessions_requested} sessions · {recommendation.recommended_frequency}
          </p>
          {recommendation.treatment_goals_for_next_period && recommendation.treatment_goals_for_next_period.length > 0 && (
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {recommendation.treatment_goals_for_next_period.map((g, i) => (
                <li key={i} className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{g}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TreatmentPlanContent({ payload }: { payload: Record<string, unknown> }) {
  const diagnosisCodes = payload.diagnosis_codes as string[] | undefined;
  const goals = payload.goals as Array<{ goal: string; target_date?: string }> | undefined;
  const objectives = payload.objectives as Array<{ objective: string; frequency?: string }> | undefined;
  const interventions = payload.interventions as Array<{ intervention: string; frequency?: string }> | undefined;
  const reviewDate = payload.review_date as string | undefined;

  return (
    <div className="space-y-3">
      {diagnosisCodes && diagnosisCodes.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>DIAGNOSES</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {diagnosisCodes.map((code, i) => (
              <span key={i} className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-semibold"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)' }}>
                {code}
              </span>
            ))}
          </div>
        </div>
      )}
      {goals && goals.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>GOALS</p>
          <div className="mt-1 space-y-1.5">
            {goals.map((g, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--color-accent)' }} />
                <div>
                  <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{g.goal}</p>
                  {g.target_date && <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Target: {g.target_date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {objectives && objectives.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>OBJECTIVES</p>
          <div className="mt-1 space-y-1">
            {objectives.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{o.objective}</span>
                {o.frequency && (
                  <span className="rounded-full px-1.5 py-0.5 text-caption" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                    {o.frequency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {interventions && interventions.length > 0 && (
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>INTERVENTIONS</p>
          <div className="mt-1 space-y-1">
            {interventions.map((iv, i) => (
              <div key={i}>
                <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{iv.intervention}</p>
                {iv.frequency && <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>{iv.frequency}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {reviewDate && (
        <div className="flex items-baseline gap-2">
          <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>Review Date</span>
          <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>{reviewDate}</span>
        </div>
      )}
    </div>
  );
}

export function ActionCard({ action }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTION_ICONS[action.actionType] || FileText;
  const label = ACTION_LABELS[action.actionType] || action.actionType;

  return (
    <div
      className="rounded-[var(--radius-md)] p-4"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
          style={{
            background: `color-mix(in srgb, var(--color-accent) 10%, transparent)`,
          }}
        >
          <Icon size={16} strokeWidth={1.8} style={{ color: 'var(--color-accent)' }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-caption font-medium"
              style={{
                background: `color-mix(in srgb, var(--color-accent) 10%, transparent)`,
                color: 'var(--color-accent)',
              }}
            >
              {label}
            </span>
          </div>
          <p className="mt-1.5 text-callout" style={{ color: 'var(--color-text-primary)' }}>
            {action.description}
          </p>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-caption transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <ChevronDown size={12} />
            </motion.span>
            {expanded ? 'Hide details' : 'Show details'}
          </button>

          {/* Expandable detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={smooth}
                className="overflow-hidden"
              >
                {action.actionType === 'treatment_plan' && action.payload ? (
                  <div
                    className="mt-2 rounded-[var(--radius-sm)] p-3"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    <TreatmentPlanContent payload={action.payload as Record<string, unknown>} />
                  </div>
                ) : action.actionType === 'utilization_review' && action.payload?.content ? (
                  <div
                    className="mt-2 rounded-[var(--radius-sm)] p-3"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    <URContent content={action.payload.content as Record<string, unknown>} />
                  </div>
                ) : action.actionType === 'note' && action.payload?.content ? (
                  <div
                    className="mt-2 rounded-[var(--radius-sm)] p-3"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    <SOAPNoteContent
                      content={action.payload.content as Record<string, string>}
                      compact
                    />
                  </div>
                ) : action.actionType === 'billing' && action.payload ? (
                  <div
                    className="mt-2 rounded-[var(--radius-sm)] p-3"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    <BillingContent payload={action.payload as Record<string, unknown>} />
                  </div>
                ) : (
                  <pre
                    className="mt-2 rounded-[var(--radius-sm)] p-3 text-caption"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {JSON.stringify(action.payload, null, 2)}
                  </pre>
                )}

                {action.assumptions && action.assumptions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {action.assumptions.map((a, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertTriangle
                          size={12}
                          strokeWidth={1.8}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: 'var(--color-warning)' }}
                        />
                        <span
                          className="text-caption"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {a}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
