'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Stethoscope,
  Pill,
  FileText,
  CalendarDays,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { AIInputBar } from '@/components/ai/ai-input-bar';
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
    status: string;
    created_at: string;
  }[];
  upcomingAppointments: {
    id: string;
    start_time: string;
    end_time: string;
    appointment_type: string | null;
    status: string;
  }[];
}

export function PatientDetail({
  patient,
  diagnoses,
  medications,
  recentNotes,
  upcomingAppointments,
}: PatientDetailProps) {
  const age = computeAge(patient.dob);
  const fullName = formatName(patient.first_name, patient.last_name);

  return (
    <div className="pb-24">
      {/* Back link */}
      <Link
        href="/clients"
        className="mb-6 inline-flex items-center gap-1.5 text-callout transition-colors"
        style={{ color: 'var(--color-accent)' }}
      >
        <ArrowLeft size={16} strokeWidth={1.8} />
        Clients
      </Link>

      {/* Header */}
      <motion.div
        className="mb-8 flex items-center gap-5"
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

      {/* Info cards grid */}
      <motion.div
        className="grid gap-5 sm:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
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
            isEmpty={recentNotes.length === 0}
          >
            <div className="space-y-2">
              {recentNotes.map((n) => (
                <div key={n.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                      {n.note_type} note
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
                </div>
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
        <AIInputBar patientName={patient.first_name} patientId={patient.id} />
      </div>
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
  return (
    <div
      className="rounded-[var(--radius-lg)] p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
        <h3 className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
      </div>

      {isEmpty ? (
        <p className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>
          {emptyText}
        </p>
      ) : (
        children
      )}
    </div>
  );
}
