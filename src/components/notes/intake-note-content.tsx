'use client';

interface IntakeData {
  chief_complaint?: string;
  history_of_present_illness?: string;
  psychiatric_history?: string;
  social_history?: string;
  family_history?: string;
  mental_status_exam?: string;
  risk_assessment_narrative?: string;
  diagnosis_formulation?: string;
  treatment_recommendations?: string;
}

interface IntakeNoteContentProps {
  content: IntakeData;
  compact?: boolean;
}

const SECTIONS: { key: keyof IntakeData; label: string }[] = [
  { key: 'chief_complaint', label: 'Chief Complaint' },
  { key: 'history_of_present_illness', label: 'History of Present Illness' },
  { key: 'psychiatric_history', label: 'Psychiatric History' },
  { key: 'social_history', label: 'Social History' },
  { key: 'family_history', label: 'Family History' },
  { key: 'mental_status_exam', label: 'Mental Status Exam' },
  { key: 'risk_assessment_narrative', label: 'Risk Assessment' },
  { key: 'diagnosis_formulation', label: 'Diagnosis & Formulation' },
  { key: 'treatment_recommendations', label: 'Treatment Recommendations' },
];

/** Known MSE field labels to split on */
const MSE_LABELS = [
  'Appearance/Behavior',
  'Appearance',
  'Behavior',
  'Speech',
  'Mood',
  'Affect',
  'Thought Process',
  'Thought Content',
  'Perceptions',
  'Cognition',
  'Insight',
  'Judgment',
  'Orientation',
];

/**
 * Attempts to parse MSE text like "Appearance/Behavior: ... Speech: ... Mood: ..."
 * into an array of { label, value } pairs. Returns null if it doesn't match the pattern.
 */
function parseMSEBullets(text: string): { label: string; value: string }[] | null {
  // Build a regex that splits on known labels followed by a colon
  const pattern = new RegExp(
    `(${MSE_LABELS.map((l) => l.replace('/', '\\/')).join('|')}):\\s*`,
    'g'
  );

  const parts: { label: string; value: string }[] = [];
  let lastIndex = 0;
  let lastLabel: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Capture text before this match as the value for the previous label
    if (lastLabel !== null) {
      const value = text.slice(lastIndex, match.index).trim().replace(/\.$/, '');
      if (value) parts.push({ label: lastLabel, value });
    }
    lastLabel = match[1];
    lastIndex = pattern.lastIndex;
  }

  // Capture the final segment
  if (lastLabel !== null) {
    const value = text.slice(lastIndex).trim().replace(/\.$/, '');
    if (value) parts.push({ label: lastLabel, value });
  }

  return parts.length >= 2 ? parts : null;
}

export function IntakeNoteContent({ content, compact = false }: IntakeNoteContentProps) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-7'}>
      {SECTIONS.map(({ key, label }) => {
        const text = content[key];
        if (!text) return null;

        // Try to render MSE as bulleted list
        if (key === 'mental_status_exam') {
          const bullets = parseMSEBullets(text);
          if (bullets) {
            return (
              <div key={key}>
                <h4
                  className={compact ? 'text-footnote font-medium' : 'text-callout font-semibold'}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {label}
                </h4>
                <ul className={`mt-2 space-y-1.5 ${compact ? '' : 'pl-1'}`}>
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: 'var(--color-text-tertiary)' }}
                      />
                      <span className={compact ? 'text-caption' : 'text-body'} style={{ color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
                        <span className="font-medium">{b.label}:</span> {b.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
        }

        return (
          <div key={key}>
            <h4
              className={compact ? 'text-footnote font-medium' : 'text-callout font-semibold'}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {label}
            </h4>
            <p
              className={`mt-1.5 ${compact ? 'text-caption' : 'text-body'} leading-relaxed`}
              style={{ color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}
            >
              {text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
