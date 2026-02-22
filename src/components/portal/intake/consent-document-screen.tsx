'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { CONSENT_DOCUMENTS } from '@/lib/data/intake-content';

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
}

interface ConsentDocumentScreenProps {
  item: IntakePacketItem;
  packetId: string;
  onComplete: () => void;
}

export function ConsentDocumentScreen({ item, packetId, onComplete }: ConsentDocumentScreenProps) {
  const doc = CONSENT_DOCUMENTS.find((d) => d.key === item.item_key);
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [showFullText, setShowFullText] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = agreed && signatureName.trim().length >= 2;

  const handleSign = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Start the item if needed
      await fetch(`/api/portal/intake/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packetId }),
      });

      // Complete the consent item
      const res = await fetch(`/api/portal/intake/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'consent',
          signatureName: signatureName.trim(),
          packetId,
        }),
      });

      if (!res.ok) throw new Error('Failed to sign');
      onComplete();
    } catch (e) {
      console.error('Failed to sign consent:', e);
      setSubmitting(false);
    }
  }, [canSubmit, item.id, packetId, signatureName, onComplete]);

  if (!doc) return null;

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-md">
        {/* Title */}
        <h2
          className="text-title-2 font-semibold mb-6"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {doc.title}
        </h2>

        {/* Summary Points */}
        <div className="space-y-3 mb-6">
          {doc.summaryPoints.map((point, i) => (
            <div key={i} className="flex gap-3">
              <span
                className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--color-accent)' }}
              />
              <p className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Expandable Full Text */}
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-4 py-3 mb-6 transition-colors"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <span className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Read Full Document
          </span>
          {showFullText ? (
            <ChevronUp size={18} style={{ color: 'var(--color-text-tertiary)' }} />
          ) : (
            <ChevronDown size={18} style={{ color: 'var(--color-text-tertiary)' }} />
          )}
        </button>

        <AnimatePresence>
          {showFullText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div
                className="rounded-[var(--radius-md)] p-4 whitespace-pre-line text-caption"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                {doc.fullText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded accent-[var(--color-accent)]"
          />
          <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
            I have read and agree to the above
          </span>
        </label>

        {/* Signature Field */}
        <div className="mb-6">
          <label className="text-caption font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
            Type your full name as electronic signature
          </label>
          <input
            type="text"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-[var(--radius-md)] px-4 py-3 text-callout transition-colors focus:outline-none"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontStyle: signatureName ? 'italic' : 'normal',
            }}
          />
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSign}
          disabled={!canSubmit || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-callout font-medium transition-opacity disabled:opacity-40"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
          }}
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
