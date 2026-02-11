'use client';

interface SOAPData {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

interface SOAPNoteContentProps {
  content: SOAPData;
  compact?: boolean;
}

const SECTIONS: { key: keyof SOAPData; label: string }[] = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
];

export function SOAPNoteContent({ content, compact = false }: SOAPNoteContentProps) {
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
