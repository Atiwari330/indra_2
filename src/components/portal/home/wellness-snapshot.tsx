'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { portalCardItem } from '@/lib/portal-animations';

interface WellnessScore {
  id: string;
  measure: string;
  score: number;
  severity: string | null;
  date: string;
}

export function WellnessSnapshot() {
  const [scores, setScores] = useState<WellnessScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/wellness')
      .then((res) => res.json())
      .then((data) => {
        setScores(data.scores ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || scores.length === 0) return null;

  // Show the first (most recent) score
  const primary = scores[0];

  return (
    <motion.div variants={portalCardItem} initial="hidden" animate="show">
      <GlassPanel className="p-5 mb-5">
        <p className="text-overline mb-3">Wellness Snapshot</p>
        <div className="flex items-center gap-4">
          <ScoreArc score={primary.score} maxScore={27} />
          <div>
            <p className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
              {primary.measure}
            </p>
            {primary.severity && (
              <p className="text-callout" style={{ color: 'var(--color-accent)' }}>
                {primary.severity}
              </p>
            )}
            <p className="text-footnote mt-0.5">
              {new Date(primary.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

function ScoreArc({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = Math.min(score / maxScore, 1);
  const radius = 28;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference * (1 - pct);

  return (
    <svg width={64} height={40} viewBox="0 0 64 40" className="flex-shrink-0">
      {/* Background arc */}
      <path
        d="M 4 36 A 28 28 0 0 1 60 36"
        fill="none"
        stroke="var(--color-bg-tertiary)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d="M 4 36 A 28 28 0 0 1 60 36"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />
      {/* Score label */}
      <text
        x={32}
        y={34}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--color-text-primary)"
      >
        {score}
      </text>
    </svg>
  );
}
