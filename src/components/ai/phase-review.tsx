'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { AgentRun, ProposedAction } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';
import { ActionCard, BillingContent, URContent, TreatmentPlanContent } from './action-card';
import { EvidenceChips } from './evidence-chips';
import { Markdown } from '@/components/ui/markdown';
import { SOAPNoteContent } from '@/components/notes/soap-note-content';
import { IntakeNoteContent } from '@/components/notes/intake-note-content';
import { smooth } from '@/lib/animations';

interface PhaseReviewProps {
  run: AgentRun;
}

/** Renders the full document preview for a selected action */
function ActionPreview({ action }: { action: ProposedAction }) {
  if (action.actionType === 'note' && action.payload?.content) {
    const noteType = action.payload.note_type as string | undefined;
    return noteType === 'intake' ? (
      <IntakeNoteContent
        content={action.payload.content as Record<string, string>}
        compact={false}
      />
    ) : (
      <SOAPNoteContent
        content={action.payload.content as Record<string, string>}
        compact={false}
      />
    );
  }

  if (action.actionType === 'treatment_plan' && action.payload) {
    return <TreatmentPlanContent payload={action.payload as Record<string, unknown>} />;
  }

  if (action.actionType === 'utilization_review' && action.payload?.content) {
    return <URContent content={action.payload.content as Record<string, unknown>} />;
  }

  if (action.actionType === 'billing' && action.payload) {
    return <BillingContent payload={action.payload as Record<string, unknown>} />;
  }

  // Fallback: JSON preview
  return (
    <pre
      className="rounded-[var(--radius-sm)] p-4 text-caption"
      style={{
        background: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-secondary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {JSON.stringify(action.payload, null, 2)}
    </pre>
  );
}

export function PhaseReview({ run }: PhaseReviewProps) {
  const { commitActions, dismiss } = useAgentContext();

  // Auto-select the primary note action, or first action
  const primaryIndex = run.proposedActions.findIndex(
    (a) => a.actionType === 'note'
  );
  const defaultId = run.proposedActions[primaryIndex >= 0 ? primaryIndex : 0]?.id;
  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(defaultId);

  const selectedAction = run.proposedActions.find((a) => a.id === selectedActionId);

  return (
    <div className="flex h-full flex-col">
      {/* Two-column layout (collapses below 900px) */}
      <div className="flex flex-1 gap-0 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left column — summary, actions, approve/reject */}
        <div
          className="flex flex-col overflow-y-auto border-r min-[900px]:w-96 min-[900px]:flex-shrink-0 max-[899px]:w-full"
          style={{ borderColor: 'var(--color-separator)' }}
        >
          <div className="flex-1 space-y-4 px-6 py-5">
            {/* Summary */}
            {run.summary && (
              <div className="text-callout">
                <Markdown text={run.summary} />
              </div>
            )}

            {/* Evidence chips */}
            <EvidenceChips items={run.evidence} />

            {/* Action cards */}
            <div className="space-y-2">
              {run.proposedActions.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...smooth, delay: i * 0.08 }}
                >
                  <ActionCard
                    action={action}
                    onSelect={() => setSelectedActionId(action.id)}
                    isSelected={action.id === selectedActionId}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sticky footer — approve/reject */}
          <div
            className="flex items-center gap-3 px-6 py-4"
            style={{
              borderTop: '1px solid var(--color-separator)',
              background: 'var(--color-bg-primary)',
            }}
          >
            <button
              onClick={dismiss}
              className="flex-1 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Reject
            </button>
            <button
              onClick={commitActions}
              className="flex-1 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
              }}
            >
              Approve &amp; Save
            </button>
          </div>
        </div>

        {/* Right column — document preview (hidden below 900px) */}
        <div className="hidden min-[900px]:flex flex-1 flex-col overflow-y-auto">
          {selectedAction ? (
            <div className="mx-auto w-full max-w-3xl px-8 py-6">
              {/* Note type badge */}
              <p className="text-overline mb-1">
                {selectedAction.actionType.replace('_', ' ')}
              </p>
              <p
                className="text-title-2 mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {selectedAction.description}
              </p>
              <div
                className="mb-6"
                style={{
                  borderBottom: '1px solid var(--color-separator)',
                  paddingBottom: 'var(--space-4)',
                }}
              />

              {/* Full document content */}
              <ActionPreview action={selectedAction} />

              {/* Token usage */}
              {run.tokenUsage && (
                <p
                  className="mt-8 text-caption"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Tokens: {run.tokenUsage.input.toLocaleString()} in /{' '}
                  {run.tokenUsage.output.toLocaleString()} out
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-callout" style={{ color: 'var(--color-text-tertiary)' }}>
                Select an action to preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
