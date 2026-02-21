'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { QUESTION_BANKS, type QuestionBank } from '@/lib/data/assessment-questions';
import { SafetyInterstitial } from './safety-interstitial';
import { AssessmentCompletion } from './assessment-completion';

interface AssessmentItem {
  id: string;
  measure_type: string;
  status: string;
  responses: Array<{ question_index: number; answer_value: number }> | null;
}

interface AssessmentFlowProps {
  assessments: AssessmentItem[];
  onClose: () => void;
}

type FlowPhase = 'questions' | 'safety' | 'complete';

export function AssessmentFlow({ assessments, onClose }: AssessmentFlowProps) {
  // Derive initial state from props (resume support)
  const firstAssessment = assessments[0];
  const savedResponses = firstAssessment?.responses;
  const initialResponses = savedResponses && savedResponses.length > 0 ? savedResponses : [];
  const initialQuestionIndex = initialResponses.length;

  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [responses, setResponses] = useState<Array<{ question_index: number; answer_value: number }>>(initialResponses);
  const [phase, setPhase] = useState<FlowPhase>('questions');
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentAssessment = assessments[currentAssessmentIndex];
  const bank: QuestionBank | undefined = currentAssessment
    ? QUESTION_BANKS[currentAssessment.measure_type]
    : undefined;
  const totalQuestions = bank?.questions.length ?? 0;

  // Auto-start assessment on mount
  useEffect(() => {
    if (currentAssessment && currentAssessment.status === 'pending') {
      fetch(`/api/portal/assessments/${currentAssessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: [] }),
      }).catch(console.error);
    }
  }, [currentAssessment]);

  const doSubmit = useCallback(async (finalResponses: Array<{ question_index: number; answer_value: number }>) => {
    if (!currentAssessment) return;
    try {
      await fetch(`/api/portal/assessments/${currentAssessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: finalResponses }),
      });
    } catch (e) {
      console.error('Failed to submit assessment:', e);
    }
    setPhase('complete');
  }, [currentAssessment]);

  const handleAnswer = useCallback((value: number) => {
    setSelectedValue(value);

    // Clear any pending timer
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);

    dwellTimerRef.current = setTimeout(() => {
      const newResponses = [
        ...responses.filter((r) => r.question_index !== currentQuestionIndex),
        { question_index: currentQuestionIndex, answer_value: value },
      ];
      setResponses(newResponses);
      setSelectedValue(null);
      setDirection(1);

      // Save progress
      if (currentAssessment) {
        fetch(`/api/portal/assessments/${currentAssessment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses: newResponses }),
        }).catch(console.error);
      }

      // Check if this was the sensitive question with non-zero answer
      if (bank?.sensitiveQuestionIndex === currentQuestionIndex && value > 0) {
        setPhase('safety');
        return;
      }

      // Advance or complete
      if (currentQuestionIndex + 1 >= totalQuestions) {
        doSubmit(newResponses);
      } else {
        setCurrentQuestionIndex((i) => i + 1);
      }
    }, 500);
  }, [responses, currentQuestionIndex, currentAssessment, bank, totalQuestions, doSubmit]);

  const handleBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setSelectedValue(null);
      setCurrentQuestionIndex((i) => i - 1);
    }
  }, [currentQuestionIndex]);

  const handleSafetyClose = useCallback(() => {
    setPhase('questions');
    // Advance past the sensitive question
    if (currentQuestionIndex + 1 >= totalQuestions) {
      doSubmit(responses);
    } else {
      setDirection(1);
      setCurrentQuestionIndex((i) => i + 1);
    }
  }, [currentQuestionIndex, totalQuestions, responses, doSubmit]);

  const handleNextAssessment = useCallback(() => {
    if (currentAssessmentIndex + 1 < assessments.length) {
      setCurrentAssessmentIndex((i) => i + 1);
      setCurrentQuestionIndex(0);
      setResponses([]);
      setPhase('questions');
      setSelectedValue(null);
      setDirection(1);
    }
  }, [currentAssessmentIndex, assessments.length]);

  const handleExit = useCallback(() => {
    if (phase === 'complete' || currentQuestionIndex === 0) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  }, [phase, currentQuestionIndex, onClose]);

  const handleSaveAndExit = useCallback(() => {
    // Progress was already saved via PATCH on each answer
    onClose();
  }, [onClose]);

  if (!bank) return null;

  const progress = (currentQuestionIndex / totalQuestions) * 100;
  const currentQuestion = bank.questions[currentQuestionIndex];
  const existingAnswer = responses.find((r) => r.question_index === currentQuestionIndex);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--color-bg-primary)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Bar */}
      <div className="relative flex items-center justify-between px-4 py-3">
        <button
          onClick={handleExit}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {phase === 'questions' && (
          <span className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
            {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        )}

        <div style={{ width: 32 }} /> {/* Spacer for balance */}

        {/* Progress bar */}
        {phase === 'questions' && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 3, background: 'var(--color-bg-tertiary)' }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'var(--color-accent)',
                borderRadius: 2,
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'questions' && (
            <motion.div
              key={`q-${currentQuestionIndex}`}
              className="w-full max-w-md"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Preamble */}
              <p
                className="text-callout mb-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {bank.preamble}
              </p>

              {/* Question */}
              <h2
                className="text-title-2 font-semibold mb-8"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {currentQuestion}
              </h2>

              {/* Answer options */}
              <div className="space-y-3">
                {bank.answerOptions.map((option) => {
                  const isSelected = selectedValue === option.value || (!selectedValue && existingAnswer?.answer_value === option.value);
                  const isFaded = selectedValue !== null && selectedValue !== option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-5 py-4 text-left transition-all"
                      style={{
                        background: isSelected
                          ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                          : 'var(--color-bg-secondary)',
                        border: isSelected
                          ? '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                          : '1px solid var(--color-border)',
                        opacity: isFaded ? 0.4 : 1,
                        minHeight: 56,
                      }}
                      animate={{ opacity: isFaded ? 0.4 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isSelected && (
                        <motion.div
                          className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            background: 'var(--color-accent)',
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                      <span
                        className="text-callout font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {option.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Back button */}
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="mt-6 text-caption font-medium transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  &larr; Previous question
                </button>
              )}
            </motion.div>
          )}

          {phase === 'safety' && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SafetyInterstitial onContinue={handleSafetyClose} />
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AssessmentCompletion
                hasNext={currentAssessmentIndex + 1 < assessments.length}
                onNext={handleNextAssessment}
                onHome={onClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exit confirmation overlay */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-[var(--radius-lg)] p-6 w-full max-w-sm"
              style={{
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <p className="text-headline font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Your progress will be saved.
              </p>
              <p className="text-callout mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                You can come back anytime to finish your check-in.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] text-callout font-medium"
                  style={{
                    background: 'var(--color-accent)',
                    color: '#fff',
                  }}
                >
                  Continue
                </button>
                <button
                  onClick={handleSaveAndExit}
                  className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] text-callout font-medium"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Save &amp; Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
