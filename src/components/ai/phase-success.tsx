'use client';

import { motion } from 'motion/react';
import { Check, FileText } from 'lucide-react';
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

  const handleViewNote = () => {
    // Signal patient-detail to auto-open the newest note after refresh
    window.dispatchEvent(new CustomEvent('indra:view-note'));
    dismiss();
    router.refresh();
  };

  const handleDone = () => {
    dismiss();
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated checkmark */}
      <motion.div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'var(--color-success)' }}
        variants={checkmarkPop}
        initial="hidden"
        animate="visible"
      >
        <Check size={32} strokeWidth={3} className="text-white" />
      </motion.div>

      <h3
        className="text-title-2 mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Changes saved successfully
      </h3>

      {run.summary && (
        <div className="mb-8 max-w-sm text-center text-callout">
          <Markdown text={run.summary} />
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleViewNote}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-2.5 text-callout font-medium text-white transition-opacity"
          style={{ background: 'var(--color-accent)' }}
        >
          <FileText size={16} strokeWidth={1.8} />
          View in Chart
        </button>

        <button
          onClick={handleDone}
          className="rounded-[var(--radius-md)] px-6 py-2.5 text-callout font-medium transition-colors"
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
