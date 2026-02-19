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

export function IntakeNoteContent({ content, compact = false }: IntakeNoteContentProps) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {SECTIONS.map(({ key, label }) => {
        const text = content[key];
        if (!text) return null;
        return (
          <div key={key}>
            <h4
              className="text-footnote font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {label}
            </h4>
            <p
              className={`mt-1 ${compact ? 'text-caption' : 'text-callout'} leading-relaxed`}
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
