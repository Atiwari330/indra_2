'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, FileSignature, Loader2 } from 'lucide-react';
import { slideOver, backdropFade } from '@/lib/animations';
import { SOAPNoteContent } from './soap-note-content';

interface NoteData {
  id: string;
  note_type: string;
  content: Record<string, string>;
  status: string;
  created_at: string;
  signed_at: string | null;
  signed_by: string | null;
}

interface NoteDetailProps {
  noteId: string | null;
  onClose: () => void;
  onSigned?: (noteId: string) => void;
}

export function NoteDetail({ noteId, onClose, onSigned }: NoteDetailProps) {
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noteId) {
      setNote(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/notes/${noteId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load note');
        return res.json();
      })
      .then((data) => setNote(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [noteId]);

  const handleSign = useCallback(async () => {
    if (!note) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/notes/${note.id}/sign`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sign note');
      const signed = await res.json();
      setNote({ ...note, status: signed.status, signed_at: signed.signed_at, signed_by: signed.signed_by });
      onSigned?.(note.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign failed');
    } finally {
      setSigning(false);
    }
  }, [note, onSigned]);

  const isOpen = noteId !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            variants={backdropFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 z-50 flex flex-col glass"
            style={{
              top: 'var(--topbar-height)',
              width: 520,
              height: 'calc(100vh - var(--topbar-height))',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
            }}
            variants={slideOver}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-separator)' }}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
                  {note?.note_type ?? 'SOAP'} Note
                </h2>
                {note && (
                  <span
                    className="rounded-full px-2 py-0.5 text-caption font-medium"
                    style={{
                      background: note.status === 'signed'
                        ? `color-mix(in srgb, var(--color-success) 12%, transparent)`
                        : `color-mix(in srgb, var(--color-warning) 12%, transparent)`,
                      color: note.status === 'signed'
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
                    }}
                  >
                    {note.status}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Close panel"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={24}
                    className="animate-spin"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                </div>
              )}

              {error && (
                <p className="text-callout" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              {note && !loading && (
                <>
                  {/* Date */}
                  <p
                    className="mb-6 text-caption"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {new Date(note.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  {/* SOAP content */}
                  <SOAPNoteContent content={note.content} />
                </>
              )}
            </div>

            {/* Footer */}
            {note && !loading && (
              <div
                className="px-6 py-4"
                style={{ borderTop: '1px solid var(--color-separator)' }}
              >
                {note.status === 'draft' ? (
                  <button
                    onClick={handleSign}
                    disabled={signing}
                    className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-callout font-medium text-white transition-opacity"
                    style={{
                      background: 'var(--color-accent)',
                      opacity: signing ? 0.7 : 1,
                    }}
                  >
                    {signing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <FileSignature size={16} strokeWidth={1.8} />
                    )}
                    {signing ? 'Signing...' : 'Sign Note'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: 'var(--color-success)' }}
                    >
                      <Check size={14} strokeWidth={3} className="text-white" />
                    </div>
                    <span className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
                      Signed
                      {note.signed_at && (
                        <> &middot; {new Date(note.signed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
