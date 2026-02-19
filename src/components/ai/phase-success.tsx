'use client';

import { motion } from 'motion/react';
import { Check, FileText, ClipboardList, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AgentRun } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';
import { Markdown } from '@/components/ui/markdown';
import { checkmarkPop } from '@/lib/animations';

interface PhaseSuccessProps {
  run: AgentRun;
}

export function PhaseSuccess({ run }: PhaseSuccessProps) {
  const { dismiss } = useAgentContext();
  const router = useRouter();

  const hasTreatmentPlan = run.proposedActions.some(a => a.actionType === 'treatment_plan');
  const hasUR = run.proposedActions.some(a => a.actionType === 'utilization_review');
  const hasNote = run.proposedActions.some(a => a.actionType === 'note');

  const handleViewDocument = () => {
    if (hasTreatmentPlan) {
      window.dispatchEvent(new CustomEvent('indra:view-treatment-plan'));
    } else if (hasUR) {
      window.dispatchEvent(new CustomEvent('indra:view-ur'));
    } else {
      window.dispatchEvent(new CustomEvent('indra:view-note'));
    }
    dismiss();
    router.refresh();
  };

  const handleDone = () => {
    dismiss();
    router.refresh();
  };

  const ViewIcon = hasTreatmentPlan ? Target : hasUR ? ClipboardList : FileText;
  const viewLabel = hasTreatmentPlan ? 'View Treatment Plan' : hasUR ? 'View Utilization Review' : 'View in Chart';

  return (
    <div className="flex h-full flex-col items-center justify-center py-12">
      {/* Animated checkmark */}
      <motion.div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'var(--color-success)' }}
        variants={checkmarkPop}
        initial="hidden"
        animate="visible"
      >
        <Check size={36} strokeWidth={3} className="text-white" />
      </motion.div>

      <h3
        className="text-title-1 mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Changes saved successfully
      </h3>

      {run.summary && (
        <div className="mb-8 max-w-sm text-center text-callout">
          <Markdown text={run.summary} />
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {(hasTreatmentPlan || hasUR || hasNote) && (
          <button
            onClick={handleViewDocument}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-callout font-medium text-white transition-opacity"
            style={{ background: 'var(--color-accent)' }}
          >
            <ViewIcon size={16} strokeWidth={1.8} />
            {viewLabel}
          </button>
        )}

        <button
          onClick={handleDone}
          className="rounded-[var(--radius-md)] px-6 py-3 text-callout font-medium transition-colors"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
