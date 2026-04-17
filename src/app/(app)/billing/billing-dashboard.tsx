'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Receipt, ShieldCheck, DollarSign, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { getStediService } from '@/services/stedi.service';
import type { EligibilityResponse } from '@/lib/types/stedi';
import {
  listDemoClaims,
  subscribeDemoClaims,
  type StoredDemoClaim,
} from '@/lib/mock/demo-claims-store';
import { staggerContainer, cardItem, smooth } from '@/lib/animations';
import { EligibilityCard } from '@/components/billing/eligibility-card';
import { ClaimsTable } from './claims-table';
import { ClaimDetailDrawer } from './claim-detail-drawer';

interface PatientLite {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string | null;
  status: string;
}

interface BillingDashboardProps {
  patients: PatientLite[];
}

function useDemoClaims(): StoredDemoClaim[] {
  const [claims, setClaims] = useState<StoredDemoClaim[]>([]);
  useEffect(() => {
    const refresh = () => setClaims(listDemoClaims());
    refresh();
    return subscribeDemoClaims(refresh);
  }, []);
  return claims;
}

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function BillingDashboard({ patients }: BillingDashboardProps) {
  const claims = useDemoClaims();
  const [selectedClaim, setSelectedClaim] = useState<StoredDemoClaim | null>(null);

  // Metrics
  const metrics = useMemo(() => {
    const submittedToday = claims.filter((c) => isToday(c.submittedAt)).length;
    const accepted = claims.filter((c) => c.status === 'accepted').length;
    const pending = claims.filter((c) => c.status === 'submitted').length;
    const totalCharged = claims.reduce((sum, c) => sum + c.totalCharge, 0);
    return { submittedToday, accepted, pending, totalCharged };
  }, [claims]);

  // Eligibility widget
  const [eligibilityPatientId, setEligibilityPatientId] = useState<string>(
    patients[0]?.id ?? '',
  );
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResponse | null>(
    null,
  );
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const runEligibility = async () => {
    const patient = patients.find((p) => p.id === eligibilityPatientId);
    if (!patient) return;
    setCheckingEligibility(true);
    setEligibilityResult(null);
    const response = await getStediService().checkEligibility(patient.id, {
      subscriber: {
        memberId: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.dob.replace(/-/g, ''),
      },
      provider: {
        organizationName: 'Indra Behavioral Health',
        npi: '1234567893',
      },
    });
    setEligibilityResult(response);
    setCheckingEligibility(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-title-1" style={{ color: 'var(--color-text-primary)' }}>
            Billing
          </h1>
          <span
            className="rounded-full px-2 py-0.5 text-caption font-medium"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            Demo
          </span>
        </div>
        <p className="mt-1 text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>
          Eligibility verification and professional claims submission.
        </p>
      </div>

      {/* Metrics strip */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <MetricCard
          variants={cardItem}
          icon={<Receipt size={16} strokeWidth={1.8} />}
          label="Submitted today"
          value={metrics.submittedToday.toString()}
        />
        <MetricCard
          variants={cardItem}
          icon={<CheckCircle2 size={16} strokeWidth={1.8} />}
          label="Accepted"
          value={metrics.accepted.toString()}
          accent="success"
        />
        <MetricCard
          variants={cardItem}
          icon={<Clock size={16} strokeWidth={1.8} />}
          label="Awaiting payer"
          value={metrics.pending.toString()}
        />
        <MetricCard
          variants={cardItem}
          icon={<DollarSign size={16} strokeWidth={1.8} />}
          label="Total charged"
          value={`$${metrics.totalCharged.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </motion.div>

      {/* Eligibility widget */}
      <section>
        <h2
          className="mb-3 text-footnote font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Check Eligibility
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smooth}
          className="rounded-[var(--radius-lg)] p-5"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label
                className="mb-1.5 block text-caption"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Patient
              </label>
              <select
                value={eligibilityPatientId}
                onChange={(e) => setEligibilityPatientId(e.target.value)}
                className="w-full rounded-[var(--radius-md)] px-3 py-2 text-callout"
                style={{
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={runEligibility}
              disabled={checkingEligibility || !eligibilityPatientId}
              className="flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-callout font-medium text-white transition-opacity"
              style={{
                background: 'var(--color-accent)',
                opacity: checkingEligibility ? 0.7 : 1,
              }}
            >
              {checkingEligibility ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} strokeWidth={1.8} />
              )}
              {checkingEligibility ? 'Checking…' : 'Check Eligibility'}
            </button>
          </div>

          {eligibilityResult && (
            <div className="mt-4">
              <EligibilityCard response={eligibilityResult} />
            </div>
          )}
        </motion.div>
      </section>

      {/* Claims table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-footnote font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Claims
          </h2>
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            Powered by Stedi
          </p>
        </div>
        <ClaimsTable onRowClick={setSelectedClaim} />
      </section>

      <ClaimDetailDrawer
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
  variants,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'success' | 'accent';
  variants?: Parameters<typeof motion.div>[0]['variants'];
}) {
  const color = accent === 'success' ? 'var(--color-success)' : 'var(--color-accent)';
  return (
    <motion.div
      variants={variants}
      className="rounded-[var(--radius-lg)] p-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span
          className="text-caption uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}
        >
          {label}
        </span>
      </div>
      <p
        className="mt-2 text-title-2 font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </p>
    </motion.div>
  );
}
