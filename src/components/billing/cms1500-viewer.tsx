'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';
import { backdropFade, modalPop } from '@/lib/animations';

interface Cms1500ViewerProps {
  html: string | null;
  onClose: () => void;
  filename?: string;
}

export function Cms1500Viewer({ html, onClose, filename = 'cms1500.html' }: Cms1500ViewerProps) {
  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {html && (
        <>
          <motion.div
            className="fixed inset-0 z-[120]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[121] flex flex-col overflow-hidden glass"
            style={{
              width: 'min(900px, 92vw)',
              height: 'min(85vh, 900px)',
              borderRadius: 'var(--radius-lg)',
              transform: 'translate(-50%, -50%)',
              boxShadow: 'var(--shadow-xl)',
            }}
            variants={modalPop}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid var(--color-separator)' }}
            >
              <div>
                <p className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  CMS-1500 · Health Insurance Claim Form
                </p>
                <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                  Generated from the submitted 837P claim
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-caption transition-colors"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <Download size={12} strokeWidth={2} />
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>
            <iframe
              title="CMS-1500 preview"
              srcDoc={html}
              className="flex-1"
              style={{ border: 'none', background: '#f6f6f6' }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
