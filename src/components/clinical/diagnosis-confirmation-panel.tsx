'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { slideOver, backdropFade } from '@/lib/animations';
import { ICD10Selector } from './icd10-selector';
import type { ICD10Code } from '@/lib/data/icd10-mental-health';

interface PendingDiagnosis {
  id: string;
  icd10_code: string;
  description: string;
  status: string;
  is_primary: boolean;
}

interface DiagnosisEntry {
  icd10_code: string;
  description: string;
  is_primary: boolean;
  enabled: boolean;
}

interface DiagnosisConfirmationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  pendingDiagnoses: PendingDiagnosis[];
  onConfirmed: () => void;
}

export function DiagnosisConfirmationPanel({
  isOpen,
  onClose,
  patientId,
  pendingDiagnoses,
  onConfirmed,
}: DiagnosisConfirmationPanelProps) {
  const [entries, setEntries] = useState<DiagnosisEntry[]>(() =>
    pendingDiagnoses.map((d) => ({
      icd10_code: d.icd10_code,
      description: d.description,
      is_primary: d.is_primary,
      enabled: true,
    }))
  );
  const [showSelector, setShowSelector] = useState(false);
  const [changingIndex, setChangingIndex] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

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

    setConfirming(true);
    try {
      await fetch(`/api/patients/${patientId}/diagnoses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnoses: toConfirm, status: 'active' }),
      });
      onConfirmed();
    } catch {
      // Error handling — could add error state if desired
    } finally {
      setConfirming(false);
    }
  }, [entries, patientId, onConfirmed]);

  const excludeCodes = entries.map((e) => e.icd10_code);

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
                <h2 className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
                  Review Suggested Diagnoses
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 transition-colors hover:bg-[var(--color-bg-tertiary)]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>
              <p className="mt-1 text-callout" style={{ color: 'var(--color-text-secondary)' }}>
                Confirm which diagnoses should be formally assigned to the patient&apos;s chart.
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
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
                        background: entry.enabled ? 'var(--color-bg-card)' : 'var(--color-bg-secondary)',
                        border: `1px solid ${
                          entry.enabled && entry.is_primary
                            ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))'
                            : 'var(--color-border)'
                        }`,
                        opacity: entry.enabled ? 1 : 0.5,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggle(index)}
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] transition-colors"
                          style={{
                            background: entry.enabled ? 'var(--color-accent)' : 'transparent',
                            border: entry.enabled ? 'none' : '1.5px solid var(--color-text-tertiary)',
                          }}
                        >
                          {entry.enabled && <Check size={12} strokeWidth={3} className="text-white" />}
                        </button>

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
                                color: entry.is_primary ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                              }}
                            >
                              {entry.is_primary ? 'Primary' : 'Secondary'}
                            </span>
                          </div>
                          <p className="mt-1 text-callout" style={{ color: 'var(--color-text-primary)' }}>
                            {entry.description}
                          </p>

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

                        <button
                          onClick={() => handleRemove(index)}
                          className="mt-0.5 rounded-full p-1 transition-colors hover:bg-[var(--color-bg-tertiary)]"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>

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

            {/* Footer */}
            <div
              className="px-6 py-4"
              style={{ borderTop: '1px solid var(--color-separator)' }}
            >
              <button
                onClick={handleConfirm}
                disabled={enabledCount === 0 || confirming}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-3 text-callout font-medium text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}
              >
                {confirming ? (
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                ) : (
                  <>
                    Confirm {enabledCount} {enabledCount === 1 ? 'Diagnosis' : 'Diagnoses'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
