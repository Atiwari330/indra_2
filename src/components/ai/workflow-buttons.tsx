'use client';

import { motion } from 'motion/react';
import { ClipboardPlus, Target, FileText } from 'lucide-react';
import { useAgentContext } from './agent-provider';
import { smooth } from '@/lib/animations';
import type { EvidenceItem, SubmitIntentOptions } from '@/lib/types/ai-agent';

interface WorkflowButton {
  key: string;
  label: string;
  icon: typeof FileText;
  intent: string;
  options?: SubmitIntentOptions;
}

interface WorkflowButtonsProps {
  patientId: string;
  hasIntakeNote: boolean;
  hasTreatmentPlan: boolean;
  latestTranscriptionSessionId: string | null;
  evidence?: EvidenceItem[];
}

export function WorkflowButtons({
  patientId,
  hasIntakeNote,
  hasTreatmentPlan,
  latestTranscriptionSessionId,
  evidence,
}: WorkflowButtonsProps) {
  const { submitIntent } = useAgentContext();

  const buttons: WorkflowButton[] = [];

  if (!hasIntakeNote) {
    buttons.push({
      key: 'intake',
      label: 'Generate Intake Assessment',
      icon: ClipboardPlus,
      intent: 'Generate an intake assessment from the session transcript',
      options: {
        ...(latestTranscriptionSessionId ? { transcriptionSessionId: latestTranscriptionSessionId } : {}),
        evidence,
      },
    });
  }

  if (hasIntakeNote && !hasTreatmentPlan) {
    buttons.push({
      key: 'treatment_plan',
      label: 'Generate Treatment Plan',
      icon: Target,
      intent: 'Generate a treatment plan based on the intake assessment',
      options: { evidence },
    });
  }

  if (hasTreatmentPlan) {
    buttons.push({
      key: 'progress_note',
      label: 'Generate Progress Note',
      icon: FileText,
      intent: 'Generate a progress note from the session transcript',
      options: {
        ...(latestTranscriptionSessionId ? { transcriptionSessionId: latestTranscriptionSessionId } : {}),
        evidence,
      },
    });
  }

  if (buttons.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {buttons.map((btn, i) => {
        const Icon = btn.icon;
        return (
          <motion.button
            key={btn.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smooth, delay: i * 0.06 }}
            onClick={() => submitIntent(btn.intent, patientId, btn.options)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-footnote font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-card))',
              border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
              color: 'var(--color-accent)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Icon size={15} strokeWidth={1.8} />
            {btn.label}
          </motion.button>
        );
      })}
    </div>
  );
}
