'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { AgentRun } from '@/lib/types/ai-agent';
import { useAgentContext } from './agent-provider';
import { smooth } from '@/lib/animations';

interface PhaseClarificationProps {
  run: AgentRun;
}

export function PhaseClarification({ run }: PhaseClarificationProps) {
  const { respondToClarification } = useAgentContext();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allAnswered = run.clarifications.every(
    (c) => answers[c.id] || c.answer
  );

  function selectOption(clarificationId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [clarificationId]: value }));
  }

  function handleContinue() {
    if (!allAnswered) return;
    respondToClarification(answers);
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="mb-8 flex items-center gap-2.5">
          <Sparkles
            size={18}
            strokeWidth={1.8}
            style={{ color: 'var(--color-accent)' }}
          />
          <h2 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
            Indra has a question
          </h2>
        </div>

        {/* Questions — no bordered cards */}
        <div className="space-y-8">
          {run.clarifications.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smooth, delay: i * 0.1 }}
            >
              <p className="text-callout mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {c.question}
              </p>

              {c.options && (
                <div className="flex flex-wrap gap-2">
                  {c.options.map((opt) => {
                    const isSelected = (answers[c.id] || c.answer) === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectOption(c.id, opt)}
                        className="rounded-full px-3.5 py-1.5 text-footnote transition-all"
                        style={{
                          background: isSelected
                            ? 'var(--color-accent)'
                            : 'var(--color-bg-tertiary)',
                          color: isSelected ? '#fff' : 'var(--color-text-primary)',
                          border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {!c.options && (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={answers[c.id] || ''}
                  onChange={(e) => selectOption(c.id, e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] bg-transparent px-3 py-2 text-callout outline-none"
                  style={{
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Continue button — centered, constrained */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!allAnswered}
            className="w-full rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-all"
            style={{
              maxWidth: 320,
              background: allAnswered ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
              color: allAnswered ? '#fff' : 'var(--color-text-tertiary)',
              opacity: allAnswered ? 1 : 0.6,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
