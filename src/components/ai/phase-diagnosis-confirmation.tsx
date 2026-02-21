'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import type { AgentRun, SuggestedDiagnosis } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';
import { ICD10Selector } from '@/components/clinical/icd10-selector';
import type { ICD10Code } from '@/lib/data/icd10-mental-health';

interface PhaseDiagnosisConfirmationProps {
  run: AgentRun;
}

interface DiagnosisEntry extends SuggestedDiagnosis {
  enabled: boolean;
}

export function PhaseDiagnosisConfirmation({ run }: PhaseDiagnosisConfirmationProps) {
  const { confirmDiagnoses, deferDiagnoses } = useAgentContext();

  const [entries, setEntries] = useState<DiagnosisEntry[]>(() =>
    (run.suggestedDiagnoses ?? []).map((d) => ({ ...d, enabled: true }))
  );
  const [showSelector, setShowSelector] = useState(false);
  const [changingIndex, setChangingIndex] = useState<number | null>(null);

  const enabledCount = entries.filter((e) => e.enabled).length;

  const handleToggle = useCallback((index: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, enabled: !e.enabled } : e))
    );
  }, []);

  const handleRemove = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSetPrimary = useCallback((index: number) => {
    setEntries((prev) =>
      prev.map((e, i) => ({ ...e, is_primary: i === index }))
    );
  }, []);

  const handleAdd = useCallback((code: ICD10Code) => {
    setEntries((prev) => [
      ...prev,
      {
        icd10_code: code.code,
        description: code.description,
        is_primary: prev.length === 0,
        enabled: true,
      },
    ]);
    setShowSelector(false);
  }, []);

  const handleChange = useCallback((index: number, code: ICD10Code) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === index
          ? { ...e, icd10_code: code.code, description: code.description }
          : e
      )
    );
    setChangingIndex(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    const toConfirm = entries
      .filter((e) => e.enabled)
      .map(({ icd10_code, description, is_primary }) => ({ icd10_code, description, is_primary }));
    await confirmDiagnoses(toConfirm);
  }, [entries, confirmDiagnoses]);

  const excludeCodes = entries.map((e) => e.icd10_code);

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--color-success)' }}
            >
              <Check size={16} strokeWidth={3} className="text-white" />
            </div>
            <div>
              <h3 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
                Your intake assessment has been saved.
              </h3>
              <p className="mt-1.5 text-callout" style={{ color: 'var(--color-text-secondary)' }}>
                Based on your clinical formulation, the following diagnoses are suggested for the
                patient&apos;s chart. Review and confirm which codes should be formally assigned.
              </p>
            </div>
          </div>

          {/* Diagnosis list */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={`${entry.icd10_code}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="rounded-[var(--radius-lg)] p-4"
                  style={{
                    background: entry.enabled
                      ? 'var(--color-bg-card)'
                      : 'var(--color-bg-secondary)',
                    border: `1px solid ${
                      entry.enabled
                        ? entry.is_primary
                          ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))'
                          : 'var(--color-border)'
                        : 'var(--color-border)'
                    }`,
                    opacity: entry.enabled ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(index)}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] transition-colors"
                      style={{
                        background: entry.enabled
                          ? 'var(--color-accent)'
                          : 'transparent',
                        border: entry.enabled
                          ? 'none'
                          : '1.5px solid var(--color-text-tertiary)',
                      }}
                    >
                      {entry.enabled && <Check size={12} strokeWidth={3} className="text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-block rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-mono font-medium"
                          style={{
                            background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {entry.icd10_code}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-caption font-medium"
                          style={{
                            background: entry.is_primary
                              ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                              : 'var(--color-bg-tertiary)',
                            color: entry.is_primary
                              ? 'var(--color-accent)'
                              : 'var(--color-text-tertiary)',
                          }}
                        >
                          {entry.is_primary ? 'Primary' : 'Secondary'}
                        </span>
                      </div>
                      <p className="mt-1 text-callout" style={{ color: 'var(--color-text-primary)' }}>
                        {entry.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-2 flex items-center gap-3">
                        {!entry.is_primary && entry.enabled && (
                          <button
                            onClick={() => handleSetPrimary(index)}
                            className="text-caption transition-colors hover:underline"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            Set as Primary
                          </button>
                        )}
                        <button
                          onClick={() => setChangingIndex(changingIndex === index ? null : index)}
                          className="text-caption transition-colors hover:underline"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Change
                          <ChevronDown
                            size={10}
                            strokeWidth={2}
                            className="ml-0.5 inline"
                            style={{
                              transform: changingIndex === index ? 'rotate(180deg)' : undefined,
                              transition: 'transform 0.2s',
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(index)}
                      className="mt-0.5 rounded-full p-1 transition-colors hover:bg-[var(--color-bg-tertiary)]"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Inline ICD-10 selector for "Change" */}
                  {changingIndex === index && (
                    <div className="mt-3">
                      <ICD10Selector
                        onSelect={(code) => handleChange(index, code)}
                        onClose={() => setChangingIndex(null)}
                        excludeCodes={excludeCodes.filter((c) => c !== entry.icd10_code)}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add Diagnosis */}
          {showSelector ? (
            <div className="mt-3">
              <ICD10Selector
                onSelect={handleAdd}
                onClose={() => setShowSelector(false)}
                excludeCodes={excludeCodes}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowSelector(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-lg)] py-3 text-callout font-medium transition-colors"
              style={{
                border: '1px dashed var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Plus size={14} strokeWidth={2} />
              Add Diagnosis
            </button>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div
        className="px-8 py-4"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-primary)',
        }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={deferDiagnoses}
            className="text-callout transition-colors hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Review Later
          </button>
          <button
            onClick={handleConfirm}
            disabled={enabledCount === 0}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-callout font-medium text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-accent)' }}
          >
            Confirm {enabledCount} {enabledCount === 1 ? 'Diagnosis' : 'Diagnoses'}
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
