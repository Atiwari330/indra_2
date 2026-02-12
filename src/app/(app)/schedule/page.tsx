'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Mic,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';
import { TranscriptionPanel } from '@/components/transcription/transcription-panel';
import { useTranscription } from '@/lib/hooks/use-transcription';
import { cardItem, staggerContainer } from '@/lib/animations';

interface Appointment {
  id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  appointment_type: string | null;
  status: string;
  notes: string | null;
  meeting_link: string | null;
  patients: { first_name: string; last_name: string } | null;
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startingId, setStartingId] = useState<string | null>(null);
  const transcription = useTranscription();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        providerId: 'c0000000-0000-0000-0000-000000000001', // dev mode
        start: date,
        end: date,
      });
      const res = await fetch(`/api/schedule?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('[Schedule] Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStartScribe = async (appt: Appointment) => {
    if (!appt.patients) return;

    setStartingId(appt.id);
    const patientName = `${appt.patients.first_name} ${appt.patients.last_name}`;
    await transcription.startSession(appt.patient_id, patientName, appt.id);
    setStartingId(null);
  };

  const handleStopScribe = async () => {
    await transcription.stopSession();
    // Refresh appointments in case status changed
    fetchAppointments();
  };

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (isToday) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={formatDateLabel(date)}
        toolbar={
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeDate(-1)}
              className="rounded-[var(--radius-sm)] p-1.5 transition-colors hover:bg-[var(--color-bg-tertiary)]"
            >
              <ChevronLeft size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="rounded-[var(--radius-sm)] px-3 py-1 text-footnote font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
            >
              Today
            </button>
            <button
              onClick={() => changeDate(1)}
              className="rounded-[var(--radius-sm)] p-1.5 transition-colors hover:bg-[var(--color-bg-tertiary)]"
            >
              <ChevronRight size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Calendar
            size={48}
            strokeWidth={1.2}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
          <p className="mt-4 text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>
            No appointments scheduled for {formatDateLabel(date).toLowerCase()}.
          </p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {appointments.map((appt) => {
            const patientName = appt.patients
              ? `${appt.patients.first_name} ${appt.patients.last_name}`
              : 'Unknown';
            const isScribing =
              transcription.isActive && transcription.sessionId && transcription.patientId === appt.patient_id;
            const isStarting = startingId === appt.id;

            return (
              <motion.div key={appt.id} variants={cardItem}>
                <GlassPanel className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Left: time + patient info */}
                    <div className="flex items-center gap-4">
                      <div className="text-center" style={{ minWidth: 56 }}>
                        <p
                          className="text-callout font-semibold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {formatTime(appt.start_time)}
                        </p>
                        <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                          {formatTime(appt.end_time)}
                        </p>
                      </div>

                      <div
                        className="h-10 w-px"
                        style={{ background: 'var(--color-separator)' }}
                      />

                      <div>
                        <p
                          className="text-callout font-medium"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {patientName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {appt.appointment_type && (
                            <span
                              className="text-caption"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {appt.appointment_type}
                            </span>
                          )}
                          {appt.meeting_link && (
                            <span className="flex items-center gap-1 text-caption"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              <Video size={10} />
                              Telehealth
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                      {appt.meeting_link && (
                        <a
                          href={appt.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-caption font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          <ExternalLink size={12} />
                          Join
                        </a>
                      )}

                      <button
                        onClick={() => handleStartScribe(appt)}
                        disabled={transcription.isActive || isStarting}
                        className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-caption font-medium text-white transition-colors disabled:opacity-40"
                        style={{
                          background: isScribing ? 'var(--color-error)' : 'var(--color-accent)',
                        }}
                      >
                        {isStarting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Mic size={12} />
                        )}
                        {isScribing ? 'Scribing...' : 'Start Scribe'}
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Transcription error toast */}
      {transcription.error && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-[var(--radius-md)] px-4 py-3 text-footnote"
          style={{
            background: 'color-mix(in srgb, var(--color-error) 12%, var(--color-bg-secondary))',
            border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
            color: 'var(--color-error)',
          }}
        >
          {transcription.error}
        </div>
      )}

      {/* Transcription panel */}
      <AnimatePresence>
        {transcription.isActive && transcription.sessionId && transcription.patientName && transcription.patientId && (
          <TranscriptionPanel
            sessionId={transcription.sessionId}
            patientName={transcription.patientName}
            patientId={transcription.patientId}
            awaitingCapture={transcription.awaitingCapture}
            onStop={handleStopScribe}
            onClose={transcription.closePanel}
          />
        )}
      </AnimatePresence>
    </>
  );
}
