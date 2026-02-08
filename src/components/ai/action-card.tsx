'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Pill, CalendarPlus, Receipt, Stethoscope, ChevronDown, AlertTriangle } from 'lucide-react';
import type { ProposedAction } from '@/lib/types/ai-agent';
import { smooth } from '@/lib/animations';

const ACTION_ICONS: Record<string, typeof FileText> = {
  encounter: Stethoscope,
  note: FileText,
  medication: Pill,
  appointment: CalendarPlus,
  billing: Receipt,
};

const ACTION_LABELS: Record<string, string> = {
  encounter: 'Encounter',
  note: 'Note',
  medication: 'Medication',
  appointment: 'Appointment',
  billing: 'Billing',
};

interface ActionCardProps {
  action: ProposedAction;
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
