'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, FileText, ClipboardList } from 'lucide-react';
import { modalPop, backdropFade, bouncy } from '@/lib/animations';

interface SendIntakePopoverProps {
  patientId: string;
  patientFirstName: string;
  onClose: () => void;
  onSent: () => void;
}

const INTAKE_ITEMS = [
  { icon: FileText, label: 'Informed Consent to Treatment' },
  { icon: FileText, label: 'HIPAA Notice of Privacy Practices' },
  { icon: FileText, label: 'Practice Policies & Financial Agreement' },
  { icon: ClipboardList, label: 'Client History Intake Form' },
];

export function SendIntakePopover({
  patientId,
  patientFirstName,
  onClose,
  onSent,
}: SendIntakePopoverProps) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
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

  const handleSend = useCallback(async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/intake-packet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to send');
      setSuccess(true);
      onSent();
      setTimeout(() => onClose(), 1500);
    } catch {
      setSending(false);
    }
  }, [patientId, onSent, onClose]);

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

      <div ref={ref} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[301]" style={{ width: 300 }}>
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
                  Intake paperwork sent to {patientFirstName}&apos;s portal
                </p>
              </motion.div>
            ) : (
              <motion.div key="form">
                <p
                  className="text-callout font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Send Intake Paperwork
                </p>

                <div className="space-y-1.5 mb-4">
                  {INTAKE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5"
                      >
                        <Icon size={14} strokeWidth={1.8} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                        <span className="text-caption" style={{ color: 'var(--color-text-primary)' }}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending}
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
