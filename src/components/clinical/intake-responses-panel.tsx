'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { slideOver, backdropFade } from '@/lib/animations';
import { INTAKE_QUESTIONNAIRE_SECTIONS, CONSENT_DOCUMENTS } from '@/lib/data/intake-content';
import { formatDate } from '@/lib/format';

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  signature_name: string | null;
  signed_at: string | null;
  completed_at: string | null;
  responses: Record<string, unknown> | null;
}

interface IntakeResponsesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: IntakePacketItem[];
  patientFirstName: string;
}

export function IntakeResponsesPanel({ isOpen, onClose, items, patientFirstName }: IntakeResponsesPanelProps) {
  const questionnaireItem = items.find((i) => i.item_type === 'intake_questionnaire');
  const consentItems = items.filter((i) => i.item_type === 'consent_document');
  const responses = (questionnaireItem?.responses ?? {}) as Record<string, Record<string, unknown>>;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[400]"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[401] flex flex-col"
            style={{
              width: 560,
              background: 'var(--color-bg-primary)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
            }}
            variants={slideOver}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div>
                <h2 className="text-title-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {patientFirstName}&apos;s Intake Paperwork
                </h2>
                <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                  {items.filter((i) => i.status === 'completed').length} of {items.length} items completed
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Consent Documents Summary */}
              {consentItems.length > 0 && (
                <div>
                  <h3 className="text-footnote font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                    Consent Documents
                  </h3>
                  <div className="space-y-2">
                    {consentItems.map((item) => {
                      const doc = CONSENT_DOCUMENTS.find((d) => d.key === item.item_key);
                      return (
                        <div
                          key={item.id}
                          className="rounded-[var(--radius-md)] p-3"
                          style={{ background: 'var(--color-bg-secondary)' }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {doc?.title ?? item.item_label}
                            </p>
                            {item.status === 'completed' ? (
                              <span className="text-caption" style={{ color: 'var(--color-success)' }}>Signed</span>
                            ) : (
                              <span className="text-caption" style={{ color: 'var(--color-warning)' }}>Pending</span>
                            )}
                          </div>
                          {item.signed_at && (
                            <p className="text-caption mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                              {item.signature_name} &middot; {formatDate(item.signed_at.split('T')[0])}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Questionnaire Responses */}
              {questionnaireItem?.status === 'completed' && (
                <div>
                  <h3 className="text-footnote font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                    Client History Responses
                  </h3>
                  <div className="space-y-4">
                    {INTAKE_QUESTIONNAIRE_SECTIONS.map((section) => {
                      const sectionResponses = responses[section.key] as Record<string, unknown> | undefined;
                      if (!sectionResponses) return null;

                      return (
                        <div key={section.key}>
                          <p className="text-callout font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            {section.title}
                          </p>
                          <div className="space-y-2">
                            {section.fields.map((field) => {
                              const value = sectionResponses[field.key];
                              if (value === undefined || value === null || value === '') return null;

                              // Skip conditional fields where parent is 'no'
                              if (field.conditionalOn && sectionResponses[field.conditionalOn] !== 'yes') {
                                return null;
                              }

                              return (
                                <div
                                  key={field.key}
                                  className="rounded-[var(--radius-md)] p-3"
                                  style={{ background: 'var(--color-bg-secondary)' }}
                                >
                                  <p className="text-caption mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    {field.label}
                                  </p>
                                  <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                                    {formatFieldValue(field, value)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatFieldValue(field: { type: string; options?: { label: string; value: string }[]; scaleMinLabel?: string; scaleMaxLabel?: string }, value: unknown): string {
  if (field.type === 'yes_no') {
    return value === 'yes' ? 'Yes' : 'No';
  }
  if (field.type === 'multi_select' && Array.isArray(value)) {
    const labels = value.map((v) => {
      const opt = field.options?.find((o) => o.value === v);
      return opt?.label ?? v;
    });
    return labels.join(', ');
  }
  if (field.type === 'select') {
    const opt = field.options?.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  if (field.type === 'scale') {
    return `${value} of 5${field.scaleMinLabel && field.scaleMaxLabel ? ` (${field.scaleMinLabel} to ${field.scaleMaxLabel})` : ''}`;
  }
  return String(value);
}
