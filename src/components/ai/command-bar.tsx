'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAgentContext } from './agent-provider';
import { useCommandBarShortcut } from '@/lib/hooks/use-command-bar';
import { backdropFade, modalPop } from '@/lib/animations';

export function CommandBar() {
  const { isCommandBarOpen, openCommandBar, closeCommandBar, submitIntent } =
    useAgentContext();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useCommandBarShortcut(openCommandBar);

  // Auto-focus input when opened
  useEffect(() => {
    if (isCommandBarOpen) {
      setInput('');
      // Small delay so the modal renders first
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isCommandBarOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    submitIntent(trimmed);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      closeCommandBar();
    }
  }

  return (
    <AnimatePresence>
      {isCommandBarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeCommandBar}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center"
            style={{ paddingTop: '20vh' }}
            variants={modalPop}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="glass w-full rounded-[var(--radius-xl)] p-2"
              style={{
                maxWidth: 560,
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <form onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What would you like to do?"
                  className="w-full bg-transparent px-4 py-3 text-headline outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </form>

              <div
                className="mx-4 mb-3 mt-1 flex items-center justify-between"
              >
                <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                  Try &ldquo;Write a progress note for John Doe&rdquo; or &ldquo;Update medication for Jane&rdquo;
                </p>
                <kbd
                  className="inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-tertiary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Esc
                </kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
