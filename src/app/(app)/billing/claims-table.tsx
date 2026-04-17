'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Check, Clock, AlertCircle } from 'lucide-react';
import {
  listDemoClaims,
  subscribeDemoClaims,
  type StoredDemoClaim,
} from '@/lib/mock/demo-claims-store';
import { staggerContainer, cardItem } from '@/lib/animations';

interface ClaimsTableProps {
  onRowClick: (claim: StoredDemoClaim) => void;
}

function useDemoClaims(): StoredDemoClaim[] {
  const [claims, setClaims] = useState<StoredDemoClaim[]>([]);
  useEffect(() => {
    const refresh = () => setClaims(listDemoClaims());
    refresh();
    const unsub = subscribeDemoClaims(refresh);
    return unsub;
  }, []);
  return claims;
}

const STATUS_STYLES: Record<
  StoredDemoClaim['status'],
  { bg: string; color: string; icon: React.ReactNode; label: string }
> = {
  submitted: {
    bg: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
    color: 'var(--color-accent)',
    icon: <Clock size={10} strokeWidth={2.2} />,
    label: 'Awaiting payer',
  },
  accepted: {
    bg: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
    color: 'var(--color-success)',
    icon: <Check size={10} strokeWidth={2.6} />,
    label: 'Accepted',
  },
  rejected: {
    bg: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
    color: 'var(--color-error)',
    icon: <AlertCircle size={10} strokeWidth={2.2} />,
    label: 'Rejected',
  },
  pending: {
    bg: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-secondary)',
    icon: <Clock size={10} strokeWidth={2.2} />,
    label: 'Pending',
  },
};

export function ClaimsTable({ onRowClick }: ClaimsTableProps) {
  const claims = useDemoClaims();

  if (claims.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-10 text-center"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border)',
        }}
      >
        <FileText
          size={24}
          strokeWidth={1.6}
          style={{ color: 'var(--color-text-tertiary)', margin: '0 auto' }}
        />
        <p
          className="mt-2 text-callout"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          No claims submitted yet
        </p>
        <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          Sign a note and run the Bill Claim flow to see it here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)]"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <table className="w-full">
        <thead style={{ background: 'var(--color-bg-secondary)' }}>
          <tr>
            <Th>Date</Th>
            <Th>Patient</Th>
            <Th>CPT</Th>
            <Th>Diagnoses</Th>
            <Th>Payer</Th>
            <Th align="right">Charge</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="hidden" animate="show">
          {claims.map((claim) => {
            const statusStyle = STATUS_STYLES[claim.status];
            return (
              <motion.tr
                key={claim.id}
                variants={cardItem}
                onClick={() => onRowClick(claim)}
                className="cursor-pointer transition-colors"
                style={{
                  borderTop: '1px solid var(--color-separator)',
                }}
                whileHover={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <Td>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {new Date(claim.dateOfService).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </Td>
                <Td>
                  <span
                    className="text-callout"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {claim.patientName}
                  </span>
                </Td>
                <Td>
                  <span
                    className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-semibold"
                    style={{
                      background:
                        'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {claim.cptCode}
                  </span>
                </Td>
                <Td>
                  <span
                    className="text-caption"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {claim.icd10Codes.slice(0, 2).join(', ')}
                    {claim.icd10Codes.length > 2 && ` +${claim.icd10Codes.length - 2}`}
                  </span>
                </Td>
                <Td>
                  <span
                    className="text-caption"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {claim.payerName}
                  </span>
                </Td>
                <Td align="right">
                  <span
                    className="text-callout font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    ${claim.totalCharge.toFixed(2)}
                  </span>
                </Td>
                <Td>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {statusStyle.icon}
                    {statusStyle.label}
                  </span>
                </Td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className="px-4 py-3 text-caption font-semibold uppercase tracking-wider"
      style={{
        color: 'var(--color-text-tertiary)',
        fontSize: 10,
        textAlign: align ?? 'left',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className="px-4 py-3"
      style={{
        textAlign: align ?? 'left',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}
