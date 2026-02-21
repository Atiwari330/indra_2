'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { portalCardItem } from '@/lib/portal-animations';

interface PendingAssessment {
  id: string;
  measure_type: string;
  status: string;
  responses: Array<{ question_index: number; answer_value: number }> | null;
}

interface PendingAssessmentCardProps {
  onBegin: (assessments: PendingAssessment[]) => void;
}

// Map measure type to question count
const QUESTION_COUNTS: Record<string, number> = {
  'PHQ-9': 9,
  'GAD-7': 7,
};

export function PendingAssessmentCard({ onBegin }: PendingAssessmentCardProps) {
  const [assessments, setAssessments] = useState<PendingAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/assessments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAssessments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || assessments.length === 0) return null;

  // Check if there's an in-progress assessment to resume
  const inProgress = assessments.find((a) => a.status === 'in_progress');
  const completedCount = inProgress?.responses?.length ?? 0;
  const totalQuestions = inProgress ? (QUESTION_COUNTS[inProgress.measure_type] ?? 9) : 0;

  const isResume = inProgress && completedCount > 0;
  const count = assessments.length;

  return (
    <motion.div variants={portalCardItem} initial="hidden" animate="show">
      <GlassPanel
        className="p-5 mb-5 relative overflow-hidden"
        style={{
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent), 0 4px 24px color-mix(in srgb, var(--color-accent) 8%, transparent)',
        }}
      >
        {/* Subtle gradient border glow */}
        <div
          className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, transparent), color-mix(in srgb, #D4A574 6%, transparent))',
          }}
        />

        <div className="relative flex items-start gap-4">
          <div
            className="flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <HeartHandshake size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
              {isResume
                ? 'Continue your check-in'
                : count > 1
                ? `${count} check-ins from your therapist`
                : 'Your therapist would like you to complete a quick check-in'}
            </p>
            <p className="text-callout mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {isResume
                ? `${completedCount} of ${totalQuestions} completed`
                : 'About 2 minutes'}
            </p>
            <button
              onClick={() => onBegin(assessments)}
              className="mt-3 px-5 py-2 rounded-full text-callout font-medium transition-opacity hover:opacity-90"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
              }}
            >
              {isResume
                ? 'Continue \u2192'
                : count > 1
                ? 'Get Started'
                : 'Begin Check-in \u2192'}
            </button>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
