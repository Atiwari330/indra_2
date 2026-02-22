'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ConsentDocumentScreen } from './consent-document-screen';
import { IntakeQuestionnaireFlow } from './intake-questionnaire-flow';
import { IntakeCompletion } from './intake-completion';

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  sort_order: number;
  responses: Record<string, unknown> | null;
}

interface IntakePacket {
  id: string;
  status: string;
  items: IntakePacketItem[];
}

interface IntakeFlowProps {
  packet: IntakePacket;
  onClose: () => void;
}

type FlowPhase = 'items' | 'complete';

export function IntakeFlow({ packet, onClose }: IntakeFlowProps) {
  // Find the first incomplete item to start from
  const sortedItems = [...packet.items].sort((a, b) => a.sort_order - b.sort_order);
  const firstIncompleteIndex = sortedItems.findIndex((i) => i.status !== 'completed');
  const startIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;

  const [currentItemIndex, setCurrentItemIndex] = useState(startIndex);
  const [phase, setPhase] = useState<FlowPhase>('items');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentItem = sortedItems[currentItemIndex];
  const totalItems = sortedItems.length;
  const completedSoFar = sortedItems.filter((i, idx) => i.status === 'completed' || idx < currentItemIndex).length;

  const progress = ((completedSoFar + (currentItem?.status === 'completed' ? 0 : 0)) / totalItems) * 100;

  const handleItemComplete = useCallback(() => {
    // Mark local status to avoid re-showing
    sortedItems[currentItemIndex].status = 'completed';

    // Advance to next item or complete
    if (currentItemIndex + 1 < totalItems) {
      setDirection(1);
      setCurrentItemIndex((i) => i + 1);
    } else {
      setPhase('complete');
    }
  }, [currentItemIndex, totalItems, sortedItems]);

  const handleExit = useCallback(() => {
    if (phase === 'complete') {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  }, [phase, onClose]);

  const handleSaveAndExit = useCallback(() => {
    onClose();
  }, [onClose]);

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

        {phase === 'items' && (
          <span className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
            {currentItemIndex + 1} of {totalItems}
          </span>
        )}

        <div style={{ width: 32 }} />

        {/* Progress bar */}
        {phase === 'items' && (
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
      <div className="flex-1 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'items' && currentItem && (
            <motion.div
              key={`item-${currentItem.id}`}
              className="flex-1 flex flex-col"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {currentItem.item_type === 'consent_document' ? (
                <ConsentDocumentScreen
                  item={currentItem}
                  packetId={packet.id}
                  onComplete={handleItemComplete}
                />
              ) : (
                <IntakeQuestionnaireFlow
                  item={currentItem}
                  packetId={packet.id}
                  onComplete={handleItemComplete}
                />
              )}
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div
              key="complete"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <IntakeCompletion onHome={onClose} />
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
                You can come back anytime to finish your intake paperwork.
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
