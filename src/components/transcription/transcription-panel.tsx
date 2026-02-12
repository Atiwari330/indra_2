'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, FileText, Clock } from 'lucide-react';
import { useAgentContext } from '@/components/ai/agent-provider';
import { smooth } from '@/lib/animations';

interface TranscriptSegment {
  speaker: 'clinician' | 'patient';
  text: string;
  is_final: boolean;
  timestamp: string;
}

interface TranscriptionPanelProps {
  sessionId: string;
  patientName: string;
  patientId: string;
  awaitingCapture?: boolean;
  onStop: () => void;
  onClose: () => void;
}

export function TranscriptionPanel({
  sessionId,
  patientName,
  patientId,
  awaitingCapture,
  onStop,
  onClose,
}: TranscriptionPanelProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimSegment, setInterimSegment] = useState<TranscriptSegment | null>(null);
  const [connected, setConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const { submitIntent } = useAgentContext();

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // SSE connection
  useEffect(() => {
    console.log(`[TranscriptionPanel] Connecting SSE for session ${sessionId}`);

    const eventSource = new EventSource(`/api/transcription/${sessionId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          setConnected(true);
          console.log(`[TranscriptionPanel] SSE connected for session ${sessionId}`);
          return;
        }

        if (data.type === 'session_ended') {
          console.log('[TranscriptionPanel] Session ended');
          setConnected(false);
          return;
        }

        if (data.type === 'segment') {
          const segment: TranscriptSegment = {
            speaker: data.speaker,
            text: data.text,
            is_final: data.is_final,
            timestamp: data.timestamp,
          };

          if (segment.is_final) {
            setSegments((prev) => [...prev, segment]);
            setInterimSegment(null);
            console.log(`[TranscriptionPanel] Segment: ${segment.speaker} - "${segment.text.slice(0, 60)}..."`);
          } else {
            setInterimSegment(segment);
          }
        }
      } catch (err) {
        console.error('[TranscriptionPanel] Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('[TranscriptionPanel] SSE connection error');
      setConnected(false);
    };

    return () => {
      console.log('[TranscriptionPanel] Closing SSE connection');
      eventSource.close();
    };
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, interimSegment]);

  const handleGenerateNote = useCallback(() => {
    console.log(`[TranscriptionPanel] Generate note for session ${sessionId}`);
    submitIntent(
      'Generate a progress note from the session transcript',
      patientId,
      { transcriptionSessionId: sessionId }
    );
  }, [sessionId, patientId, submitIntent]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={smooth}
      className="fixed right-0 top-[var(--topbar-height)] z-50 flex h-[calc(100vh-var(--topbar-height))] w-[380px] flex-col"
      style={{
        background: 'var(--glass-bg)',
        borderLeft: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-separator)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mic
              size={18}
              style={{ color: connected ? 'var(--color-error)' : 'var(--color-text-tertiary)' }}
            />
            {connected && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                style={{
                  background: 'var(--color-error)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
          <div>
            <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {patientName}
            </p>
            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              <Clock size={10} className="mr-1 inline" />
              {formatTime(elapsed)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-[var(--radius-sm)] p-1.5 transition-colors hover:bg-[var(--color-bg-tertiary)]"
        >
          <X size={16} style={{ color: 'var(--color-text-tertiary)' }} />
        </button>
      </div>

      {/* Transcript body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {segments.length === 0 && !interimSegment && (
          <div className="flex flex-col items-center justify-center py-12">
            <Mic size={32} style={{ color: awaitingCapture ? 'var(--color-warning, #f59e0b)' : 'var(--color-text-tertiary)' }} />
            <p className="mt-3 text-footnote text-center" style={{ color: awaitingCapture ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>
              {awaitingCapture
                ? 'Click the Indra Scribe extension icon in your toolbar to start audio capture.'
                : 'Listening for audio...'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {segments.map((seg, i) => (
            <SegmentBubble key={i} segment={seg} />
          ))}
          {interimSegment && <SegmentBubble segment={interimSegment} interim />}
        </div>
      </div>

      {/* Controls */}
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ borderTop: '1px solid var(--color-separator)' }}
      >
        <button
          onClick={onStop}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
          style={{
            background: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
            color: 'var(--color-error)',
          }}
        >
          <MicOff size={16} />
          Stop Recording
        </button>
        <button
          onClick={handleGenerateNote}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium text-white transition-colors"
          style={{ background: 'var(--color-accent)' }}
        >
          <FileText size={16} />
          Generate Note
        </button>
      </div>
    </motion.div>
  );
}

function SegmentBubble({ segment, interim }: { segment: TranscriptSegment; interim?: boolean }) {
  const isClinician = segment.speaker === 'clinician';

  return (
    <div className={`flex ${isClinician ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[85%] rounded-[var(--radius-md)] px-3.5 py-2"
        style={{
          background: isClinician
            ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
            : 'var(--color-bg-tertiary)',
          opacity: interim ? 0.6 : 1,
        }}
      >
        <p
          className="mb-0.5 text-caption font-medium"
          style={{
            color: isClinician ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          {isClinician ? 'You' : 'Patient'}
        </p>
        <p
          className="text-footnote"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {segment.text}
        </p>
      </div>
    </div>
  );
}
