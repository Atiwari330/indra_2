'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ExternalLink, Check, Clock, AlertCircle } from 'lucide-react';
import type { StoredDemoClaim } from '@/lib/mock/demo-claims-store';
import { slideOver, backdropFade, smooth } from '@/lib/animations';
import { Cms1500Viewer } from '@/components/billing/cms1500-viewer';

interface ClaimDetailDrawerProps {
  claim: StoredDemoClaim | null;
  onClose: () => void;
}

export function ClaimDetailDrawer({ claim, onClose }: ClaimDetailDrawerProps) {
  const [showCms, setShowCms] = useState(false);

  return (
    <>
      <AnimatePresence>
        {claim && (
          <>
            <motion.div
              className="fixed inset-0 z-[100]"
              style={{ background: 'rgba(0,0,0,0.2)' }}
              variants={backdropFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onClose}
            />
            <motion.div
              className="fixed right-0 z-[101] flex flex-col glass"
              style={{
                top: 'var(--topbar-height)',
                width: 560,
                maxWidth: '100vw',
                height: 'calc(100vh - var(--topbar-height))',
                borderLeft: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
              }}
              variants={slideOver}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div
                className="flex items-start justify-between gap-3 px-6 py-4"
                style={{ borderBottom: '1px solid var(--color-separator)' }}
              >
                <div>
                  <p
                    className="text-headline font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {claim.patientName}
                  </p>
                  <p
                    className="mt-0.5 text-caption"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {claim.payerName} · {claim.cptCode} · ${claim.totalCharge.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Summary */}
                <Section title="Claim Summary">
                  <Row label="Claim #" value={claim.claimControlNumber} mono />
                  <Row
                    label="Date of service"
                    value={new Date(claim.dateOfService).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  />
                  <Row label="Place of service" value={claim.placeOfService === '11' ? 'Office (11)' : claim.placeOfService} />
                  <Row
                    label="CPT"
                    value={`${claim.cptCode} — ${claim.cptDescription}`}
                  />
                  <Row label="Diagnoses" value={claim.icd10Codes.join(', ')} />
                  <Row
                    label="Charge"
                    value={`$${claim.totalCharge.toFixed(2)}`}
                  />
                  <Row
                    label="Submitted"
                    value={new Date(claim.submittedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  />
                </Section>

                {/* Timeline */}
                <Section title="Timeline">
                  <div className="space-y-0">
                    <TimelineItem
                      status="complete"
                      title="Submitted to clearinghouse"
                      description={`Control # ${claim.claimControlNumber}`}
                      time={claim.submittedAt}
                    />
                    {claim.status === 'accepted' && claim.acknowledgment ? (
                      <TimelineItem
                        status="complete"
                        title={`Accepted by ${claim.acknowledgment.payer.name}`}
                        description={claim.acknowledgment.claimStatus.statusDescription}
                        time={claim.acknowledgment.acknowledgedAt}
                      />
                    ) : claim.status === 'rejected' && claim.acknowledgment ? (
                      <TimelineItem
                        status="failed"
                        title={`Rejected by ${claim.acknowledgment.payer.name}`}
                        description={claim.acknowledgment.claimStatus.statusDescription}
                        time={claim.acknowledgment.acknowledgedAt}
                      />
                    ) : (
                      <TimelineItem
                        status="pending"
                        title="Waiting for payer acknowledgment"
                        description="Expected within the next few seconds in demo mode"
                      />
                    )}
                  </div>
                </Section>

                {/* Actions */}
                <button
                  onClick={() => setShowCms(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-callout font-medium transition-colors"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <FileText size={14} strokeWidth={1.8} />
                  View CMS-1500
                  <ExternalLink size={12} strokeWidth={1.8} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Cms1500Viewer
        html={showCms && claim ? claim.cms1500Html : null}
        onClose={() => setShowCms(false)}
        filename={claim ? `cms1500-${claim.patientName.replace(/\s+/g, '-')}.html` : 'cms1500.html'}
      />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="mb-2 text-caption font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}
      >
        {title}
      </p>
      <div
        className="rounded-[var(--radius-md)] p-4"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      <span
        className="text-caption text-right"
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: mono ? 'var(--font-mono, monospace)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  status,
  title,
  description,
  time,
}: {
  status: 'complete' | 'pending' | 'failed';
  title: string;
  description: string;
  time?: string;
}) {
  const color =
    status === 'complete'
      ? 'var(--color-success)'
      : status === 'failed'
      ? 'var(--color-error)'
      : 'var(--color-accent)';
  const icon =
    status === 'complete' ? (
      <Check size={10} strokeWidth={2.6} />
    ) : status === 'failed' ? (
      <AlertCircle size={10} strokeWidth={2.2} />
    ) : (
      <Clock size={10} strokeWidth={2.2} />
    );
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="flex items-start gap-3 py-2"
    >
      <div
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-callout font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </p>
        <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
        {time && (
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            {new Date(time).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
