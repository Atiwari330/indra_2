'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { portalCardItem } from '@/lib/portal-animations';

interface Appointment {
  id: string;
  start_time: string;
  appointment_type: string;
  provider: {
    first_name: string;
    last_name: string;
    credentials: string | null;
  } | null;
}

const FRIENDLY_TYPES: Record<string, string> = {
  therapy_individual: 'Individual Therapy',
  therapy_group: 'Group Therapy',
  therapy_family: 'Family Therapy',
  therapy_couples: 'Couples Therapy',
  psychiatric_evaluation: 'Evaluation',
  medication_management: 'Medication Check-in',
  intake: 'Initial Visit',
  crisis: 'Crisis Session',
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 14) return 'next week';
  return `in ${Math.ceil(diffDays / 7)} weeks`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function NextAppointment() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/appointments?limit=1')
      .then((res) => res.json())
      .then((data) => {
        setAppointment(data.appointments?.[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-5">
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <GlassPanel className="p-5 mb-5">
        <p className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
          No upcoming appointments scheduled
        </p>
      </GlassPanel>
    );
  }

  const provider = appointment.provider;
  const friendlyType = FRIENDLY_TYPES[appointment.appointment_type] ?? appointment.appointment_type;

  return (
    <motion.div variants={portalCardItem} initial="hidden" animate="show">
      <GlassPanel className="p-5 mb-5">
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: 'var(--color-nav-active-bg)',
              color: 'var(--color-accent)',
            }}
          >
            <Calendar size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-overline mb-1">Next Appointment</p>
            <p className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
              {friendlyType}
            </p>
            {provider && (
              <p className="text-callout mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {provider.first_name} {provider.last_name}{provider.credentials ? `, ${provider.credentials}` : ''}
              </p>
            )}
            <p className="text-callout mt-1" style={{ color: 'var(--color-accent)' }}>
              {formatTime(appointment.start_time)} &middot; {getRelativeTime(appointment.start_time)}
            </p>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
