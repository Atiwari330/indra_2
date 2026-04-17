'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, ChevronDown, Building, User, FileText } from 'lucide-react';
import type { DraftClaimInput, ProfessionalClaim } from '@/lib/types/stedi';
import { smooth } from '@/lib/animations';

interface ClaimPreviewProps {
  draft: DraftClaimInput;
  assembled: ProfessionalClaim;
}

export function ClaimPreview({ draft, assembled }: ClaimPreviewProps) {
  const [showJson, setShowJson] = useState(false);
  const totalCharge = draft.serviceLines.reduce((sum, l) => sum + l.charge * l.units, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="space-y-3"
    >
      {/* Parties row */}
      <div className="grid grid-cols-2 gap-3">
        <Card icon={<Building size={14} strokeWidth={1.8} />} title="Billing Provider">
          <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
            {assembled.billing.organizationName}
          </p>
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            NPI {assembled.billing.npi} · TIN {assembled.billing.employerId}
          </p>
        </Card>
        <Card icon={<User size={14} strokeWidth={1.8} />} title="Subscriber">
          <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
            {draft.subscriber.firstName} {draft.subscriber.lastName}
          </p>
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            Member {draft.subscriber.memberId} · {draft.payer.name}
          </p>
        </Card>
      </div>

      {/* Diagnoses */}
      <Card icon={<FileText size={14} strokeWidth={1.8} />} title="Diagnoses">
        <div className="flex flex-wrap gap-1.5">
          {draft.diagnoses.map((dx, i) => (
            <span
              key={dx.icd10}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-caption"
              style={{
                background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                color: 'var(--color-accent)',
              }}
              title={dx.description}
            >
              <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>{' '}
              {dx.icd10} — {dx.description}
            </span>
          ))}
        </div>
      </Card>

      {/* Service lines */}
      <Card icon={<FileText size={14} strokeWidth={1.8} />} title="Service Lines">
        <div className="overflow-hidden rounded-[var(--radius-sm)]" style={{ border: '1px solid var(--color-separator)' }}>
          <table className="w-full text-caption">
            <thead style={{ background: 'var(--color-bg-tertiary)' }}>
              <tr>
                <Th>Date</Th>
                <Th>POS</Th>
                <Th>CPT</Th>
                <Th>DX Ptr</Th>
                <Th align="right">Charge</Th>
                <Th align="right">Units</Th>
              </tr>
            </thead>
            <tbody>
              {draft.serviceLines.map((line, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: i > 0 ? '1px solid var(--color-separator)' : undefined,
                  }}
                >
                  <Td>{draft.dateOfService}</Td>
                  <Td>{draft.placeOfServiceCode}</Td>
                  <Td>
                    <span
                      className="font-semibold"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {line.cptCode}
                    </span>
                    {line.modifiers && line.modifiers.length > 0 ? (
                      <span
                        className="ml-1"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {line.modifiers.join(' ')}
                      </span>
                    ) : null}
                    <div
                      className="text-caption"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {line.description}
                    </div>
                  </Td>
                  <Td>
                    {line.diagnosisPointers.map((p) => String.fromCharCode(64 + p)).join('')}
                  </Td>
                  <Td align="right">${line.charge.toFixed(2)}</Td>
                  <Td align="right">{line.units}</Td>
                </tr>
              ))}
              <tr
                style={{
                  borderTop: '1px solid var(--color-separator)',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <Td colSpan={4}>
                  <span className="font-semibold">Total</span>
                </Td>
                <Td align="right">
                  <span
                    className="font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    ${totalCharge.toFixed(2)}
                  </span>
                </Td>
                <Td />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Raw JSON toggle */}
      <button
        onClick={() => setShowJson((v) => !v)}
        className="flex items-center gap-1.5 text-caption transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <Code size={12} strokeWidth={2} />
        <span>{showJson ? 'Hide' : 'View'} claim JSON</span>
        <motion.span animate={{ rotate: showJson ? 180 : 0 }} style={{ display: 'flex' }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence>
        {showJson && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={smooth}
            className="overflow-auto rounded-[var(--radius-sm)] p-3 text-caption"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              maxHeight: 320,
            }}
          >
            {JSON.stringify(assembled, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] p-3"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span style={{ color: 'var(--color-text-tertiary)' }}>{icon}</span>
        <span
          className="text-caption font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}
        >
          {title}
        </span>
      </div>
      {children}
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
      className="px-3 py-2 text-caption font-semibold uppercase tracking-wider"
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
  colSpan,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  colSpan?: number;
}) {
  return (
    <td
      className="px-3 py-2"
      colSpan={colSpan}
      style={{
        color: 'var(--color-text-primary)',
        textAlign: align ?? 'left',
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  );
}
