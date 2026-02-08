'use client';

import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatName, computeAge } from '@/lib/format';
import { snappy } from '@/lib/animations';

interface ClientCardProps {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  status: 'active' | 'inactive' | 'discharged';
}

export function ClientCard({ id, firstName, lastName, dob, status }: ClientCardProps) {
  const age = computeAge(dob);
  const shortId = id.slice(0, 8);

  return (
    <motion.div
      className="group cursor-pointer rounded-[var(--radius-lg)] p-6"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={snappy}
    >
      <div className="flex items-center gap-3">
        <Avatar firstName={firstName} lastName={lastName} />
        <div className="min-w-0 flex-1">
          <p className="text-headline truncate" style={{ color: 'var(--color-text-primary)' }}>
            {formatName(firstName, lastName)}
          </p>
          <p className="text-footnote mt-0.5">
            {formatDate(dob)} &middot; {age} yrs
          </p>
        </div>
        <ChevronRight
          size={16}
          strokeWidth={1.8}
          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
      </div>

      <div
        className="my-4"
        style={{ height: 1, background: 'var(--color-separator)' }}
      />

      <div className="flex items-center justify-between">
        <StatusBadge status={status} />
        <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          {shortId}...
        </span>
      </div>
    </motion.div>
  );
}
