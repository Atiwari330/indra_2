'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { INTAKE_QUESTIONNAIRE_SECTIONS, type QuestionnaireSection, type QuestionnaireField } from '@/lib/data/intake-content';
import { SafetyInterstitial } from '../assessments/safety-interstitial';

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  responses: Record<string, unknown> | null;
}

interface IntakeQuestionnaireFlowProps {
  item: IntakePacketItem;
  packetId: string;
  onComplete: () => void;
}

type Phase = 'intro' | 'sections' | 'safety' | 'submitting';

export function IntakeQuestionnaireFlow({ item, packetId, onComplete }: IntakeQuestionnaireFlowProps) {
  const sections = INTAKE_QUESTIONNAIRE_SECTIONS;

  // Restore saved responses
  const savedResponses = (item.responses ?? {}) as Record<string, Record<string, unknown>>;

  // Find first incomplete section
  const firstIncompleteSection = sections.findIndex((s) => !savedResponses[s.key]);
  const startSection = firstIncompleteSection >= 0 ? firstIncompleteSection : 0;
  const skipIntro = startSection > 0;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(startSection);
  const [allResponses, setAllResponses] = useState<Record<string, Record<string, unknown>>>(savedResponses);
  const [sectionValues, setSectionValues] = useState<Record<string, unknown>>(savedResponses[sections[startSection]?.key] ?? {});
  const [phase, setPhase] = useState<Phase>(skipIntro ? 'sections' : 'intro');
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentSection = sections[currentSectionIndex];

  // Auto-start the item
  useEffect(() => {
    if (item.status === 'pending') {
      fetch(`/api/portal/intake/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packetId }),
      }).catch(console.error);
    }
  }, [item.id, item.status, packetId]);

  const saveProgress = useCallback(async (responses: Record<string, Record<string, unknown>>) => {
    try {
      await fetch(`/api/portal/intake/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [item.id]);

  const handleSectionComplete = useCallback(async () => {
    // Save this section's responses
    const updatedResponses = {
      ...allResponses,
      [currentSection.key]: sectionValues,
    };
    setAllResponses(updatedResponses);

    // Save progress
    await saveProgress(updatedResponses);

    // Check for safety screen trigger
    if (currentSection.isSafetyScreen) {
      const hasSafetyTrigger = Object.entries(sectionValues).some(
        ([, v]) => v === 'yes'
      );
      if (hasSafetyTrigger) {
        setPhase('safety');
        return;
      }
    }

    advanceToNextSection(updatedResponses);
  }, [allResponses, currentSection, sectionValues, saveProgress]);

  const advanceToNextSection = useCallback(async (updatedResponses: Record<string, Record<string, unknown>>) => {
    if (currentSectionIndex + 1 < sections.length) {
      const nextIndex = currentSectionIndex + 1;
      setDirection(1);
      setCurrentSectionIndex(nextIndex);
      setSectionValues(updatedResponses[sections[nextIndex].key] ?? {});
    } else {
      // Submit the questionnaire
      setPhase('submitting');
      try {
        await fetch(`/api/portal/intake/${item.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'questionnaire',
            responses: updatedResponses,
            packetId,
          }),
        });
        onComplete();
      } catch (e) {
        console.error('Failed to submit questionnaire:', e);
        setPhase('sections');
      }
    }
  }, [currentSectionIndex, sections, item.id, packetId, onComplete]);

  const handleSafetyContinue = useCallback(() => {
    setPhase('sections');
    const updatedResponses = {
      ...allResponses,
      [currentSection.key]: sectionValues,
    };
    advanceToNextSection(updatedResponses);
  }, [allResponses, currentSection, sectionValues, advanceToNextSection]);

  const handleBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      const prevIndex = currentSectionIndex - 1;
      setDirection(-1);
      setCurrentSectionIndex(prevIndex);
      setSectionValues(allResponses[sections[prevIndex].key] ?? {});
    }
  }, [currentSectionIndex, allResponses, sections]);

  const updateField = useCallback((key: string, value: unknown) => {
    setSectionValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isSectionValid = useCallback((section: QuestionnaireSection, values: Record<string, unknown>) => {
    return section.fields
      .filter((f) => f.required && (!f.conditionalOn || values[f.conditionalOn] === 'yes'))
      .every((f) => {
        const val = values[f.key];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      });
  }, []);

  if (phase === 'intro') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          className="text-center max-w-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2
            className="text-title-2 font-semibold mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Now let&apos;s learn a bit about you.
          </h2>
          <p
            className="text-callout mb-8"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            This short questionnaire helps your therapist prepare for your first session. It takes about 5 minutes.
          </p>
          <button
            onClick={() => setPhase('sections')}
            className="px-8 py-3 rounded-full text-callout font-medium transition-opacity hover:opacity-90"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
            }}
          >
            Get Started
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'safety') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <SafetyInterstitial onContinue={handleSafetyContinue} />
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-6 overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={`section-${currentSectionIndex}`}
          className="w-full max-w-md"
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Section Header */}
          <p className="text-caption font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Section {currentSectionIndex + 1} of {sections.length}
          </p>
          <h2
            className="text-title-2 font-semibold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {currentSection.title}
          </h2>
          <p className="text-callout mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {currentSection.description}
          </p>

          {/* Fields */}
          <div className="space-y-5">
            {currentSection.fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={sectionValues[field.key]}
                sectionValues={sectionValues}
                onChange={(val) => updateField(field.key, val)}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pb-6">
            {currentSectionIndex > 0 ? (
              <button
                onClick={handleBack}
                className="text-callout font-medium transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                &larr; Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleSectionComplete}
              disabled={!isSectionValid(currentSection, sectionValues)}
              className="px-6 py-2.5 rounded-full text-callout font-medium transition-opacity disabled:opacity-40"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
              }}
            >
              {currentSectionIndex + 1 < sections.length ? 'Next' : 'Submit'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Field Renderer ──────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  sectionValues,
  onChange,
}: {
  field: QuestionnaireField;
  value: unknown;
  sectionValues: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  // Check conditional visibility
  if (field.conditionalOn && sectionValues[field.conditionalOn] !== 'yes') {
    return null;
  }

  return (
    <div>
      <label className="text-callout font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
        {field.label}
      </label>

      {field.type === 'textarea' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full rounded-[var(--radius-md)] px-4 py-3 text-callout resize-none transition-colors focus:outline-none"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      )}

      {field.type === 'conditional_text' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full rounded-[var(--radius-md)] px-4 py-3 text-callout resize-none transition-colors focus:outline-none"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      )}

      {field.type === 'select' && (
        <div className="space-y-2">
          {field.options?.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-left transition-all"
                style={{
                  background: isSelected
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'var(--color-bg-secondary)',
                  border: isSelected
                    ? '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: isSelected ? 'none' : '2px solid var(--color-border-strong)',
                    background: isSelected ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'scale' && (
        <div className="space-y-2">
          <div className="flex justify-between text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>{field.scaleMinLabel}</span>
            <span>{field.scaleMaxLabel}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: (field.scaleMax ?? 5) - (field.scaleMin ?? 1) + 1 }, (_, i) => {
              const val = (field.scaleMin ?? 1) + i;
              const isSelected = value === val;
              return (
                <button
                  key={val}
                  onClick={() => onChange(val)}
                  className="flex-1 flex items-center justify-center rounded-[var(--radius-md)] py-3 text-callout font-medium transition-all"
                  style={{
                    background: isSelected
                      ? 'var(--color-accent)'
                      : 'var(--color-bg-secondary)',
                    border: isSelected
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    color: isSelected ? '#fff' : 'var(--color-text-primary)',
                  }}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {field.type === 'multi_select' && (
        <div className="space-y-2">
          {field.options?.map((opt) => {
            const selected = Array.isArray(value) ? value as string[] : [];
            const isChecked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  const current = Array.isArray(value) ? (value as string[]) : [];
                  if (isChecked) {
                    onChange(current.filter((v) => v !== opt.value));
                  } else {
                    onChange([...current, opt.value]);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-left transition-all"
                style={{
                  background: isChecked
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'var(--color-bg-secondary)',
                  border: isChecked
                    ? '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div
                  className="h-4 w-4 rounded flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: isChecked ? 'none' : '2px solid var(--color-border-strong)',
                    background: isChecked ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'yes_no' && (
        <div className="flex gap-3">
          {(['yes', 'no'] as const).map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className="flex-1 rounded-[var(--radius-md)] px-4 py-3 text-callout font-medium transition-all"
                style={{
                  background: isSelected
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'var(--color-bg-secondary)',
                  border: isSelected
                    ? '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                    : '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {opt === 'yes' ? 'Yes' : 'No'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
