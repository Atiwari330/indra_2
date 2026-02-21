'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { modalPop, backdropFade, bouncy } from '@/lib/animations';

interface SendAssessmentPopoverProps {
  patientId: string;
  patientFirstName: string;
  onClose: () => void;
  onSent: () => void;
}

export function SendAssessmentPopover({
  patientId,
  patientFirstName,
  onClose,
  onSent,
}: SendAssessmentPopoverProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggleMeasure = (mt: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mt)) next.delete(mt);
      else next.add(mt);
      return next;
    });
  };

  const handleSend = useCallback(async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measureTypes: Array.from(selected) }),
      });
      if (!res.ok) throw new Error('Failed to send');
      const names = Array.from(selected).join(' & ');
      setSuccess(`${names} sent to ${patientFirstName}'s portal`);
      onSent();
      setTimeout(() => onClose(), 1500);
    } catch {
      setSending(false);
    }
  }, [selected, patientId, patientFirstName, onSent, onClose]);

  return (
    <>
      {/* Invisible backdrop */}
      <motion.div
        className="fixed inset-0 z-[300]"
        variants={backdropFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      />

      <div ref={ref} className="absolute right-0 top-full z-[301] mt-2" style={{ width: 260 }}>
        <motion.div
          className="rounded-[var(--radius-lg)] p-4"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            backdropFilter: 'blur(20px)',
          }}
          variants={modalPop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 py-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={bouncy}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)' }}
                >
                  <Check size={20} style={{ color: 'var(--color-success)' }} />
                </motion.div>
                <p className="text-caption text-center" style={{ color: 'var(--color-success)' }}>
                  {success}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form">
                <p
                  className="text-callout font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Send Assessment
                </p>

                <div className="space-y-2 mb-4">
                  {[
                    { id: 'PHQ-9', label: 'PHQ-9 (Depression)' },
                    { id: 'GAD-7', label: 'GAD-7 (Anxiety)' },
                  ].map((mt) => (
                    <label
                      key={mt.id}
                      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 cursor-pointer transition-colors hover:bg-[var(--color-bg-tertiary)]"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(mt.id)}
                        onChange={() => toggleMeasure(mt.id)}
                        className="h-4 w-4 rounded accent-[var(--color-accent)]"
                      />
                      <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                        {mt.label}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleSend}
                  disabled={selected.size === 0 || sending}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-callout font-medium transition-opacity disabled:opacity-40"
                  style={{
                    background: 'var(--color-accent)',
                    color: '#fff',
                  }}
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Send to Patient Portal'
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
