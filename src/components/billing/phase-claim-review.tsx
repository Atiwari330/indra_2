'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  ShieldCheck,
  Stethoscope,
  FileText,
  Send,
  Check,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type {
  DraftClaimInput,
  EligibilityResponse,
  ProfessionalClaim,
  ClaimSubmissionResponse,
  ClaimAcknowledgment,
} from '@/lib/types/stedi';
import { getStediService } from '@/services/stedi.service';
import { assembleProfessionalClaim } from '@/lib/mock/stedi.service';
import { getScenario } from '@/lib/mock/stedi-fixtures';
import {
  runIntegrityCheck,
  type IntegrityResult,
} from '@/services/claim-integrity.service';
import { suggestCptCode } from '@/services/billing.service';
import { addDemoClaim, updateDemoClaim } from '@/lib/mock/demo-claims-store';
import { slideOver, backdropFade, smooth } from '@/lib/animations';
import { IntegrityCheckCard } from './integrity-check-card';
import { EligibilityCard } from './eligibility-card';
import { ClaimPreview } from './claim-preview';
import { SubmissionSuccess } from './submission-success';
import { Cms1500Viewer } from './cms1500-viewer';

type StepKey = 'integrity' | 'eligibility' | 'draft' | 'submit';
type StepStatus = 'pending' | 'running' | 'complete' | 'failed' | 'blocked';

interface StepMeta {
  key: StepKey;
  label: string;
  icon: typeof ShieldCheck;
}

const STEP_META: StepMeta[] = [
  { key: 'integrity', label: 'Clinical integrity', icon: Stethoscope },
  { key: 'eligibility', label: 'Eligibility', icon: ShieldCheck },
  { key: 'draft', label: 'Claim draft', icon: FileText },
  { key: 'submit', label: 'Bill Claim', icon: Send },
];

interface PatientLike {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string | null;
}

interface DiagnosisLike {
  icd10_code: string;
  description: string;
  is_primary?: boolean;
}

interface NoteLike {
  id: string;
  encounter_id: string | null;
  content: Record<string, string>;
  status: string;
  note_type: string;
}

interface PhaseClaimReviewProps {
  onClose: () => void;
  patient: PatientLike;
  diagnoses: DiagnosisLike[];
  note: NoteLike;
  providerCredentials?: string | null;
  encounterDurationMinutes?: number;
  encounterType?: string;
  dateOfService?: string;
}

function toGenderCode(g: string | null): 'M' | 'F' | 'U' {
  if (!g) return 'U';
  const first = g.trim().toLowerCase()[0];
  if (first === 'm') return 'M';
  if (first === 'f') return 'F';
  return 'U';
}

export function PhaseClaimReview({
  onClose,
  patient,
  diagnoses,
  note,
  providerCredentials = 'LCSW',
  encounterDurationMinutes = 53,
  encounterType = 'individual_therapy',
  dateOfService,
}: PhaseClaimReviewProps) {
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [draftInput, setDraftInput] = useState<DraftClaimInput | null>(null);
  const [assembledClaim, setAssembledClaim] = useState<ProfessionalClaim | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<ClaimSubmissionResponse | null>(null);
  const [showCms1500, setShowCms1500] = useState(false);

  const stedi = useMemo(() => getStediService(), []);
  const scenario = useMemo(() => getScenario(patient.id), [patient.id]);
  const dos = dateOfService ?? new Date().toISOString().slice(0, 10);

  const cptSuggestion = useMemo(
    () => suggestCptCode(encounterType, encounterDurationMinutes),
    [encounterType, encounterDurationMinutes],
  );

  const integrityFailed = integrityResult !== null && !integrityResult.passed;

  // Derived step statuses — a pure function of the primary state.
  const steps: Array<{ key: StepKey; label: string; icon: typeof ShieldCheck; status: StepStatus }> = useMemo(() => {
    const integrityStatus: StepStatus = integrityResult
      ? integrityResult.passed
        ? 'complete'
        : 'failed'
      : 'running';

    const eligibilityStatus: StepStatus = integrityFailed
      ? 'blocked'
      : !integrityResult
      ? 'pending'
      : eligibility
      ? 'complete'
      : 'running';

    const draftStatus: StepStatus = integrityFailed
      ? 'blocked'
      : !eligibility
      ? 'pending'
      : draftInput
      ? 'complete'
      : 'running';

    const submitStatus: StepStatus = integrityFailed
      ? 'blocked'
      : !draftInput
      ? 'pending'
      : submission
      ? 'complete'
      : submitting
      ? 'running'
      : 'pending';

    return [
      { ...STEP_META[0], status: integrityStatus },
      { ...STEP_META[1], status: eligibilityStatus },
      { ...STEP_META[2], status: draftStatus },
      { ...STEP_META[3], status: submitStatus },
    ];
  }, [integrityResult, integrityFailed, eligibility, draftInput, submission, submitting]);

  // ── Step 1: Clinical integrity (kick off on mount) ──
  // Sets state only inside a setTimeout callback, so the lint rule
  // that forbids synchronous setState in effect bodies is satisfied.
  // Strict-mode safe: guarded by `integrityResult` in deps, not a ref
  // (a ref guard would be clobbered by the cleanup between double-invokes).
  useEffect(() => {
    if (integrityResult) return;

    const handle = setTimeout(() => {
      const result = runIntegrityCheck({
        patientId: patient.id,
        noteStatus: note.status,
        noteContent: note.content,
        cptCode: cptSuggestion.code,
        diagnoses: diagnoses.map((d) => ({
          icd10: d.icd10_code,
          description: d.description,
        })),
        providerCredentials: providerCredentials ?? null,
      });
      setIntegrityResult(result);
    }, 1200);

    return () => clearTimeout(handle);
  }, [
    integrityResult,
    patient.id,
    note.status,
    note.content,
    cptSuggestion.code,
    diagnoses,
    providerCredentials,
  ]);

  // ── Step 2: Eligibility ──
  useEffect(() => {
    if (!integrityResult?.passed || eligibility) return;
    let cancelled = false;
    (async () => {
      const response = await stedi.checkEligibility(patient.id, {
        subscriber: {
          memberId: scenario.memberId,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dateOfBirth: patient.dob.replace(/-/g, ''),
        },
        provider: {
          organizationName: 'Indra Behavioral Health',
          npi: '1234567893',
        },
      });
      if (!cancelled) setEligibility(response);
    })();
    return () => {
      cancelled = true;
    };
  }, [integrityResult?.passed, eligibility, patient, scenario, stedi]);

  // ── Step 3: Draft claim ──
  useEffect(() => {
    if (!eligibility || draftInput) return;
    const handle = setTimeout(() => {
      const primaryDx = diagnoses.find((d) => d.is_primary) ?? diagnoses[0];
      const otherDx = diagnoses.filter((d) => d !== primaryDx).slice(0, 11);
      const sortedDx = primaryDx ? [primaryDx, ...otherDx] : otherDx;
      const charge =
        cptSuggestion.code === '90791' ? 220 : cptSuggestion.code === '90837' ? 175 : 140;

      const draft: DraftClaimInput = {
        encounterId: note.encounter_id ?? `enc_${note.id}`,
        patientId: patient.id,
        noteId: note.id,
        patientName: { first: patient.first_name, last: patient.last_name },
        patientDob: patient.dob,
        patientGender: toGenderCode(patient.gender),
        dateOfService: dos,
        placeOfServiceCode: '11',
        diagnoses: sortedDx.map((d) => ({
          icd10: d.icd10_code,
          description: d.description,
        })),
        serviceLines: [
          {
            cptCode: cptSuggestion.code,
            description: cptSuggestion.description,
            charge,
            units: 1,
            diagnosisPointers: [1],
          },
        ],
        payer: scenario.payer,
        subscriber: {
          memberId: scenario.memberId,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dateOfBirth: patient.dob,
          relationshipCode: '18',
        },
      };
      setDraftInput(draft);
      setAssembledClaim(assembleProfessionalClaim(draft));
    }, 900);
    return () => clearTimeout(handle);
  }, [
    eligibility,
    draftInput,
    diagnoses,
    patient,
    dos,
    cptSuggestion,
    note.encounter_id,
    note.id,
    scenario,
  ]);

  // ── Step 4: Submit (user-triggered) ──
  const handleSubmitClaim = useCallback(async () => {
    if (!assembledClaim || !draftInput) return;
    setSubmitting(true);

    const response = await stedi.submitProfessionalClaim(patient.id, assembledClaim);
    setSubmission(response);
    setSubmitting(false);

    const cms1500Html = stedi.generateCms1500Html(assembledClaim);
    const totalCharge = draftInput.serviceLines.reduce(
      (sum, l) => sum + l.charge * l.units,
      0,
    );
    const storedId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    addDemoClaim({
      id: storedId,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      payerName: draftInput.payer.name,
      cptCode: cptSuggestion.code,
      cptDescription: cptSuggestion.description,
      icd10Codes: draftInput.diagnoses.map((d) => d.icd10),
      totalCharge,
      dateOfService: dos,
      placeOfService: '11',
      status: 'submitted',
      submittedAt: response.submittedAt,
      claimControlNumber: response.claimReference.claimControlNumber,
      correlationId: response.claimReference.correlationId,
      cms1500Html,
      rawClaim: assembledClaim,
    });

    stedi.watchForAcknowledgment(
      patient.id,
      response.claimReference.claimControlNumber,
      response.claimReference.correlationId,
      totalCharge,
      (ack: ClaimAcknowledgment) => {
        updateDemoClaim(storedId, {
          status: ack.claimStatus.statusCategoryCode === 'A2' ? 'accepted' : 'rejected',
          acknowledgment: ack,
          acknowledgedAt: ack.acknowledgedAt,
        });
      },
    );
  }, [
    assembledClaim,
    draftInput,
    patient,
    cptSuggestion,
    dos,
    stedi,
  ]);

  const totalCharge = draftInput
    ? draftInput.serviceLines.reduce((sum, l) => sum + l.charge * l.units, 0)
    : 0;

  const submitStepRunning = steps[3].status === 'running';
  const draftReady = steps[2].status === 'complete';

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[110]"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
        variants={backdropFade}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      />
      <motion.div
        className="fixed right-0 z-[111] flex flex-col glass"
        style={{
          top: 'var(--topbar-height)',
          width: 720,
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
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-separator)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    background:
                      'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Sparkles size={12} strokeWidth={2.2} />
                </span>
                <h2
                  className="text-headline font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Ready to bill this visit
                </h2>
              </div>
              <p
                className="mt-1 text-caption"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {patient.first_name} {patient.last_name} ·{' '}
                {new Date(dos).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
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

          {/* Step tracker */}
          <div className="mt-4 flex items-center gap-2">
            {steps.map((step, i) => (
              <StepIndicator
                key={step.key}
                label={step.label}
                icon={step.icon}
                status={step.status}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SectionBlock
            title="Clinical integrity & medical necessity"
            description="Verifying the note supports a billable claim before it leaves Indra."
            visible
            running={steps[0].status === 'running'}
          >
            {integrityResult && <IntegrityCheckCard result={integrityResult} />}
            {integrityFailed && (
              <div
                className="mt-4 rounded-[var(--radius-md)] p-4"
                style={{
                  background:
                    'color-mix(in srgb, var(--color-error) 8%, transparent)',
                  border:
                    '1px solid color-mix(in srgb, var(--color-error) 28%, transparent)',
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={16}
                    strokeWidth={1.8}
                    style={{
                      color: 'var(--color-error)',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div>
                    <p
                      className="text-callout font-semibold"
                      style={{ color: 'var(--color-error)' }}
                    >
                      Claim blocked — fix before billing
                    </p>
                    <p
                      className="mt-1 text-caption"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Indra caught this before submission. Update the note to
                      address the failed checks above, then sign and re-run.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="Eligibility verification"
            description={`Confirming active coverage with ${scenario.payer.name}.`}
            visible={steps[1].status !== 'pending' && steps[1].status !== 'blocked'}
            running={steps[1].status === 'running'}
          >
            {eligibility && <EligibilityCard response={eligibility} />}
          </SectionBlock>

          <SectionBlock
            title="Claim draft"
            description="Assembled from the signed note, encounter, and verified coverage."
            visible={steps[2].status !== 'pending' && steps[2].status !== 'blocked'}
            running={steps[2].status === 'running'}
          >
            {draftInput && assembledClaim && (
              <ClaimPreview draft={draftInput} assembled={assembledClaim} />
            )}
          </SectionBlock>

          {submission && draftInput && (
            <SectionBlock
              title="Submitted"
              description="Waiting for the payer acknowledgment."
              visible
              running={false}
            >
              <SubmissionSuccess
                claimNumber={submission.claimReference.claimControlNumber}
                payerName={draftInput.payer.name}
                totalCharge={totalCharge}
                submittedAt={submission.submittedAt}
                onViewCms1500={() => setShowCms1500(true)}
              />
            </SectionBlock>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid var(--color-separator)' }}
        >
          {submission ? (
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-callout font-medium text-white"
              style={{ background: 'var(--color-accent)' }}
            >
              Done
            </button>
          ) : integrityFailed ? (
            <button
              onClick={onClose}
              className="w-full rounded-[var(--radius-md)] px-4 py-3 text-callout font-medium"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Return to note
            </button>
          ) : (
            <button
              onClick={handleSubmitClaim}
              disabled={!assembledClaim || submitStepRunning || !draftReady}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-callout font-semibold text-white transition-opacity"
              style={{
                background: 'var(--color-accent)',
                opacity:
                  !assembledClaim || submitStepRunning || !draftReady ? 0.55 : 1,
              }}
            >
              {submitStepRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send size={16} strokeWidth={1.8} />
                  Bill Claim
                  {draftInput && ` · $${totalCharge.toFixed(2)}`}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      <Cms1500Viewer
        html={
          showCms1500 && assembledClaim
            ? stedi.generateCms1500Html(assembledClaim)
            : null
        }
        onClose={() => setShowCms1500(false)}
        filename={`cms1500-${patient.first_name}-${patient.last_name}.html`}
      />
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function StepIndicator({
  label,
  icon: Icon,
  status,
  isLast,
}: {
  label: string;
  icon: typeof ShieldCheck;
  status: StepStatus;
  isLast: boolean;
}) {
  const isComplete = status === 'complete';
  const isRunning = status === 'running';
  const isFailed = status === 'failed';
  const isBlocked = status === 'blocked';

  const bg = isComplete
    ? 'var(--color-success)'
    : isFailed
    ? 'var(--color-error)'
    : isRunning
    ? 'var(--color-accent)'
    : isBlocked
    ? 'var(--color-bg-tertiary)'
    : 'var(--color-bg-tertiary)';

  const color =
    isComplete || isFailed || isRunning
      ? '#fff'
      : isBlocked
      ? 'var(--color-text-tertiary)'
      : 'var(--color-text-secondary)';

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: bg, color }}
      >
        {isComplete ? (
          <Check size={14} strokeWidth={2.6} />
        ) : isRunning ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Icon size={12} strokeWidth={2} />
        )}
      </div>
      <span
        className="truncate text-caption font-medium"
        style={{
          color: isComplete
            ? 'var(--color-text-primary)'
            : isRunning
            ? 'var(--color-accent)'
            : 'var(--color-text-tertiary)',
        }}
      >
        {label}
      </span>
      {!isLast && (
        <div
          className="h-px flex-1"
          style={{
            background: isComplete ? 'var(--color-success)' : 'var(--color-separator)',
          }}
        />
      )}
    </div>
  );
}

function SectionBlock({
  title,
  description,
  visible,
  running,
  children,
}: {
  title: string;
  description: string;
  visible: boolean;
  running: boolean;
  children?: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="mb-6"
    >
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h3
            className="text-callout font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h3>
          {running && (
            <Loader2
              size={12}
              className="animate-spin"
              style={{ color: 'var(--color-accent)' }}
            />
          )}
        </div>
        <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          {description}
        </p>
      </div>
      {running && !children ? (
        <div
          className="rounded-[var(--radius-md)] p-6 text-center"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Loader2
            size={18}
            className="animate-spin"
            style={{ color: 'var(--color-text-tertiary)', margin: '0 auto' }}
          />
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}
