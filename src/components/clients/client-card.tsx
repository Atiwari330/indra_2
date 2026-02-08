'use client';

import { motion } from 'motion/react';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatName } from '@/lib/format';
import { snappy } from '@/lib/animations';

interface ClientCardProps {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  status: 'active' | 'inactive' | 'discharged';
}

export function ClientCard({ firstName, lastName, dob, status }: ClientCardProps) {
  return (
    <motion.div
      className="glass cursor-pointer rounded-[var(--radius-lg)] p-5"
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
            DOB: {formatDate(dob)}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <StatusBadge status={status} />
      </div>
    </motion.div>
  );
}
