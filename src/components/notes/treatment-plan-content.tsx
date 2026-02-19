'use client';

interface TreatmentPlanPayload {
  diagnosis_codes?: string[];
  goals?: Array<{ goal: string; target_date?: string }>;
  objectives?: Array<{ objective: string; frequency?: string }>;
  interventions?: Array<{ intervention: string; frequency?: string }>;
  review_date?: string;
}

interface TreatmentPlanNoteContentProps {
  payload: TreatmentPlanPayload;
  compact?: boolean;
}

function Section({
  title,
  compact,
  children,
}: {
  title: string;
  compact: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        className={compact ? 'text-footnote font-medium' : 'text-callout font-semibold'}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {title}
      </h4>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function TreatmentPlanNoteContent({
  payload,
  compact = false,
}: TreatmentPlanNoteContentProps) {
  const { diagnosis_codes, goals, objectives, interventions, review_date } = payload;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-7'}>
      {/* Review Date callout */}
      {review_date && (
        <div
          className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2"
          style={{
            background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
          }}
        >
          <span
            className="text-caption font-medium"
            style={{ color: 'var(--color-warning)' }}
          >
            Next review
          </span>
          <span
            className={compact ? 'text-callout font-medium' : 'text-body font-medium'}
            style={{ color: 'var(--color-text-primary)' }}
          >
            {review_date}
          </span>
        </div>
      )}

      {/* Diagnoses */}
      {diagnosis_codes && diagnosis_codes.length > 0 && (
        <Section title="Diagnoses" compact={compact}>
          <div className="flex flex-wrap gap-1.5">
            {diagnosis_codes.map((code, i) => (
              <span
                key={i}
                className="rounded-[var(--radius-sm)] px-2 py-0.5 text-caption font-semibold"
                style={{
                  background:
                    'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                  color: 'var(--color-accent)',
                }}
              >
                {code}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Goals */}
      {goals && goals.length > 0 && (
        <Section title="Goals" compact={compact}>
          <div className="space-y-2">
            {goals.map((g, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-sm)] px-3 py-2.5"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-caption font-semibold"
                    style={{
                      background:
                        'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p
                      className={compact ? 'text-callout leading-snug' : 'text-body leading-snug'}
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {g.goal}
                    </p>
                    {g.target_date && (
                      <p
                        className="mt-1 text-caption"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        Target: {g.target_date}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Objectives */}
      {objectives && objectives.length > 0 && (
        <Section title="Objectives" compact={compact}>
          <div className="space-y-2">
            {objectives.map((o, i) => (
              <div key={i}>
                <p
                  className={compact ? 'text-callout' : 'text-body'}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {o.objective}
                </p>
                {o.frequency && (
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-caption"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {o.frequency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Interventions */}
      {interventions && interventions.length > 0 && (
        <Section title="Interventions" compact={compact}>
          <div className="space-y-2">
            {interventions.map((iv, i) => (
              <div key={i}>
                <p
                  className={compact ? 'text-callout' : 'text-body'}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {iv.intervention}
                </p>
                {iv.frequency && (
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-caption"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {iv.frequency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
