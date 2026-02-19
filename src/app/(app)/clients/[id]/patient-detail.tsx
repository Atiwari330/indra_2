'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Stethoscope,
  Pill,
  FileText,
  CalendarDays,
  ClipboardList,
  Target,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { AIInputBar } from '@/components/ai/ai-input-bar';
import { WorkflowButtons } from '@/components/ai/workflow-buttons';
import { NoteDetail } from '@/components/notes/note-detail';
import { URDetail } from '@/components/notes/ur-detail';
import { TreatmentPlanDetail } from '@/components/notes/treatment-plan-detail';
import type { EvidenceItem } from '@/lib/types/ai-agent';
import { formatDate, computeAge, formatName } from '@/lib/format';
import { staggerContainer, cardItem, smooth } from '@/lib/animations';

interface PatientDetailProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    dob: string;
    status: 'active' | 'inactive' | 'discharged';
    email: string | null;
    phone: string | null;
    gender: string | null;
  };
  hasIntakeNote: boolean;
  latestTranscriptionSessionId: string | null;
  diagnoses: {
    id: string;
    icd10_code: string;
    description: string;
    status: string;
    is_primary: boolean;
  }[];
  medications: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    status: string;
  }[];
  recentNotes: {
    id: string;
    note_type: string;
    content: unknown;
    status: string;
    created_at: string;
    signed_at: string | null;
  }[];
  upcomingAppointments: {
    id: string;
    start_time: string;
    end_time: string;
    appointment_type: string | null;
    status: string;
  }[];
  recentURs: {
    id: string;
    review_type: string;
    status: string;
    sessions_requested: number | null;
    created_at: string;
  }[];
  treatmentPlan: {
    id: string;
    version: number;
    status: string;
    diagnosis_codes: string[];
    goals: Array<{ goal: string; target_date?: string }>;
    review_date: string;
    signed_at: string | null;
    created_at: string;
  } | null;
}

export function PatientDetail({
  patient,
  hasIntakeNote,
  latestTranscriptionSessionId,
  diagnoses,
  medications,
  recentNotes,
  upcomingAppointments,
  recentURs,
  treatmentPlan,
}: PatientDetailProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedURId, setSelectedURId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [notes, setNotes] = useState(recentNotes);
  const pendingViewNoteRef = useRef(false);
  const pendingViewURRef = useRef(false);
  const pendingViewPlanRef = useRef(false);

  useEffect(() => {
    setNotes(recentNotes);
  }, [recentNotes]);

  // Listen for "View in Chart" event from phase-success
  useEffect(() => {
    const handler = () => {
      pendingViewNoteRef.current = true;
    };
    window.addEventListener('indra:view-note', handler);
    return () => window.removeEventListener('indra:view-note', handler);
  }, []);

  // Listen for "View UR" event from phase-success
  useEffect(() => {
    const handler = () => {
      pendingViewURRef.current = true;
    };
    window.addEventListener('indra:view-ur', handler);
    return () => window.removeEventListener('indra:view-ur', handler);
  }, []);

  // Listen for "View Treatment Plan" event from phase-success
  useEffect(() => {
    const handler = () => {
      pendingViewPlanRef.current = true;
    };
    window.addEventListener('indra:view-treatment-plan', handler);
    return () => window.removeEventListener('indra:view-treatment-plan', handler);
  }, []);

  // When recentNotes updates and a view-note is pending, auto-open the newest note
  useEffect(() => {
    if (pendingViewNoteRef.current && recentNotes.length > 0) {
      pendingViewNoteRef.current = false;
      setSelectedNoteId(recentNotes[0].id);
    }
  }, [recentNotes]);

  // When recentURs updates and a view-ur is pending, auto-open the newest UR
  useEffect(() => {
    if (pendingViewURRef.current && recentURs.length > 0) {
      pendingViewURRef.current = false;
      setSelectedURId(recentURs[0].id);
    }
  }, [recentURs]);

  // When treatmentPlan updates and a view-plan is pending, auto-open it
  useEffect(() => {
    if (pendingViewPlanRef.current && treatmentPlan) {
      pendingViewPlanRef.current = false;
      setSelectedPlanId(treatmentPlan.id);
    }
  }, [treatmentPlan]);

  const handleNoteSigned = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, status: 'signed', signed_at: new Date().toISOString() } : n
      )
    );
  }, []);

  const evidence = useMemo<EvidenceItem[]>(() => {
    const items: EvidenceItem[] = [];
    if (diagnoses.length > 0) {
      items.push({ id: 'dx', label: `${diagnoses.length} diagnos${diagnoses.length === 1 ? 'is' : 'es'}`, category: 'diagnosis' });
    }
    if (medications.length > 0) {
      items.push({ id: 'meds', label: `${medications.length} medication${medications.length === 1 ? '' : 's'}`, category: 'medication' });
    }
    if (treatmentPlan) {
      items.push({ id: 'txplan', label: `Treatment Plan v${treatmentPlan.version}`, category: 'treatment_plan' });
    }
    if (recentNotes.length > 0) {
      items.push({ id: 'notes', label: `Last note ${formatDate(recentNotes[0].created_at.split('T')[0])}`, category: 'note' });
    }
    if (latestTranscriptionSessionId) {
      items.push({ id: 'transcript', label: 'Session transcript', category: 'transcript' });
    }
    return items;
  }, [diagnoses, medications, treatmentPlan, recentNotes, latestTranscriptionSessionId]);

  const age = computeAge(patient.dob);
  const fullName = formatName(patient.first_name, patient.last_name);

  return (
    <div className="pb-24">
      {/* Back link */}
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-caption transition-colors hover:opacity-80"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} />
        Clients
      </Link>

      {/* Header */}
      <motion.div
        className="mb-6 flex items-center gap-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={smooth}
      >
        <Avatar firstName={patient.first_name} lastName={patient.last_name} size={64} />
        <div>
          <h1 className="text-title-1" style={{ color: 'var(--color-text-primary)' }}>
            {fullName}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-footnote">
              {formatDate(patient.dob)} &middot; {age} yrs
              {patient.gender ? ` \u00B7 ${patient.gender}` : ''}
            </span>
            <StatusBadge status={patient.status} />
          </div>
          {(patient.email || patient.phone) && (
            <p className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              {[patient.email, patient.phone].filter(Boolean).join(' \u00B7 ')}
            </p>
          )}
        </div>
      </motion.div>

      {/* Workflow Buttons */}
      <WorkflowButtons
        patientId={patient.id}
        hasIntakeNote={hasIntakeNote}
        hasTreatmentPlan={!!treatmentPlan}
        latestTranscriptionSessionId={latestTranscriptionSessionId}
        evidence={evidence}
      />

      {/* Info cards grid */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Treatment Plan */}
        <motion.div variants={cardItem}>
          <InfoCard
            icon={<Target size={18} strokeWidth={1.8} />}
            title="Treatment Plan"
            emptyText="No active treatment plan"
            isEmpty={!treatmentPlan}
          >
            {treatmentPlan && (
              <button
                onClick={() => setSelectedPlanId(treatmentPlan.id)}
                className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
              >
                <div>
                  <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                    v{treatmentPlan.version} &middot; {treatmentPlan.goals.length} {treatmentPlan.goals.length === 1 ? 'goal' : 'goals'}
                  </p>
                  <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                    Review: {treatmentPlan.review_date}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-caption"
                  style={{
                    background: treatmentPlan.status === 'active'
                      ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                      : 'var(--color-bg-tertiary)',
                    color: treatmentPlan.status === 'active'
                      ? 'var(--color-success)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {treatmentPlan.status}
                </span>
              </button>
            )}
          </InfoCard>
        </motion.div>

        {/* Diagnoses */}
        <motion.div variants={cardItem}>
          <InfoCard
            icon={<Stethoscope size={18} strokeWidth={1.8} />}
            title="Diagnoses"
            emptyText="No active diagnoses"
            isEmpty={diagnoses.length === 0}
          >
            <div className="space-y-2">
              {diagnoses.map((d) => (
                <div key={d.id} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      background: d.is_primary
                        ? 'var(--color-accent)'
                        : 'var(--color-text-tertiary)',
                    }}
                  />
                  <div>
                    <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                      {d.description}
                    </p>
                    <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                      {d.icd10_code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        </motion.div>

        {/* Medications */}
        <motion.div variants={cardItem}>
          <InfoCard
            icon={<Pill size={18} strokeWidth={1.8} />}
            title="Medications"
            emptyText="No active medications"
            isEmpty={medications.length === 0}
          >
            <div className="space-y-2">
              {medications.map((m) => (
                <div key={m.id}>
                  <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                    {m.name} {m.dosage}
                  </p>
                  <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                    {m.frequency}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>
        </motion.div>

        {/* Recent Notes */}
        <motion.div variants={cardItem}>
          <InfoCard
            icon={<FileText size={18} strokeWidth={1.8} />}
            title="Recent Notes"
            emptyText="No notes yet"
            isEmpty={notes.length === 0}
          >
            <div className="space-y-2">
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNoteId(n.id)}
                  className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                >
                  <div>
                    <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                      {n.note_type === 'intake' ? 'Intake Assessment' : `${n.note_type} note`}
                    </p>
                    <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatDate(n.created_at.split('T')[0])}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-caption"
                    style={{
                      background: n.status === 'signed'
                        ? `color-mix(in srgb, var(--color-success) 12%, transparent)`
                        : 'var(--color-bg-tertiary)',
                      color: n.status === 'signed'
                        ? 'var(--color-success)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {n.status}
                  </span>
                </button>
              ))}
            </div>
          </InfoCard>
        </motion.div>

        {/* Utilization Reviews */}
        <motion.div variants={cardItem}>
          <InfoCard
            icon={<ClipboardList size={18} strokeWidth={1.8} />}
            title="Utilization Reviews"
            emptyText="No utilization reviews"
            isEmpty={recentURs.length === 0}
          >
            <div className="space-y-2">
              {recentURs.map((ur) => (
                <button
                  key={ur.id}
                  onClick={() => setSelectedURId(ur.id)}
                  className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                >
                  <div>
                    <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                      {ur.review_type.replace(/_/g, ' ')} review
                    </p>
                    <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatDate(ur.created_at.split('T')[0])}
                      {ur.sessions_requested != null && ` · ${ur.sessions_requested} sessions requested`}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-caption"
                    style={{
                      background: ur.status === 'approved'
                        ? `color-mix(in srgb, var(--color-success) 12%, transparent)`
                        : ur.status === 'submitted'
                        ? `color-mix(in srgb, var(--color-accent) 10%, transparent)`
                        : 'var(--color-bg-tertiary)',
                      color: ur.status === 'approved'
                        ? 'var(--color-success)'
                        : ur.status === 'submitted'
                        ? 'var(--color-accent)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {ur.status.replace(/_/g, ' ')}
                  </span>
                </button>
              ))}
            </div>
          </InfoCard>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div variants={cardItem}>
          <InfoCard
            icon={<CalendarDays size={18} strokeWidth={1.8} />}
            title="Upcoming Appointments"
            emptyText="No upcoming appointments"
            isEmpty={upcomingAppointments.length === 0}
          >
            <div className="space-y-2">
              {upcomingAppointments.map((a) => {
                const date = new Date(a.start_time);
                return (
                  <div key={a.id}>
                    <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' at '}
                      {date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {a.appointment_type && (
                      <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                        {a.appointment_type.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </InfoCard>
        </motion.div>
      </motion.div>

      {/* AI Input Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-30 mx-auto px-8 lg:px-10" style={{ maxWidth: 720 }}>
        <AIInputBar patientName={patient.first_name} patientId={patient.id} evidence={evidence} />
      </div>

      {/* Note Viewer */}
      <NoteDetail
        noteId={selectedNoteId}
        onClose={() => setSelectedNoteId(null)}
        onSigned={handleNoteSigned}
      />

      {/* UR Viewer */}
      <URDetail
        urId={selectedURId}
        onClose={() => setSelectedURId(null)}
      />

      {/* Treatment Plan Viewer */}
      <TreatmentPlanDetail
        planId={selectedPlanId}
        onClose={() => setSelectedPlanId(null)}
      />
    </div>
  );
}

// ── Reusable info card ──────────────────────────────────────────

function InfoCard({
  icon,
  title,
  emptyText,
  isEmpty,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  emptyText: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  if (isEmpty) {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-3"
        style={{ border: '1px dashed var(--color-border)' }}>
        <span style={{ color: 'var(--color-text-tertiary)' }}>{icon}</span>
        <span className="text-callout" style={{ color: 'var(--color-text-tertiary)' }}>{title}</span>
        <span className="text-caption ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>{emptyText}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] p-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
        <h3 className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
