// Clinical integrity & medical-necessity checks that run BEFORE a
// claim is sent to any clearinghouse. This is Indra's own
// responsibility — Stedi only does syntactic EDI validation and
// does not enforce clinical rules.
//
// Runs fully client-side off data already in memory — no network,
// no DB writes. Deterministic so the demo is reproducible.

import { getScenario } from '@/lib/mock/stedi-fixtures';

export type IntegrityStatus = 'passed' | 'failed' | 'warning';

export interface IntegrityCheck {
  id: string;
  label: string;
  status: IntegrityStatus;
  detail?: string;
  evidence?: string;
}

export interface IntegrityResult {
  passed: boolean;
  checks: IntegrityCheck[];
  medicalNecessityQuote?: string;
}

interface RunIntegrityInput {
  patientId: string;
  noteStatus: string;
  noteContent?: Record<string, string> | null;
  cptCode: string;
  diagnoses: Array<{ icd10: string; description: string }>;
  providerCredentials?: string | null;
}

// Phrases we accept as evidence of documented medical necessity.
const NECESSITY_PHRASES = [
  'medically necessary',
  'medical necessity',
  'functional impairment',
  'continues to meet criteria',
  'clinically indicated',
  'requires ongoing',
  'without treatment',
  'impaired functioning',
  'continued treatment',
];

/** ICD chapter prefixes that are compatible with mental-health CPTs. */
const MH_DX_PREFIXES = ['F', 'Z63', 'Z71', 'Z91'];

const MH_CPT_CODES = new Set([
  '90791', '90832', '90834', '90837', '90839', '90840',
  '90846', '90847', '90853', '99213', '99214', '99215',
]);

function findNecessityQuote(content: Record<string, string> | null | undefined): string | null {
  if (!content) return null;
  const text = Object.values(content).join(' ').toLowerCase();
  for (const phrase of NECESSITY_PHRASES) {
    const idx = text.indexOf(phrase);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + phrase.length + 80);
      return text.slice(start, end).trim();
    }
  }
  return null;
}

export function runIntegrityCheck(input: RunIntegrityInput): IntegrityResult {
  const scenario = getScenario(input.patientId);
  const checks: IntegrityCheck[] = [];

  // 1. Note signed
  checks.push(
    input.noteStatus === 'signed'
      ? {
          id: 'note_signed',
          label: 'Note is signed',
          status: 'passed',
          detail: 'Signature captured and locked',
        }
      : {
          id: 'note_signed',
          label: 'Note is signed',
          status: 'failed',
          detail: `Note status is "${input.noteStatus}" — must be signed before billing`,
        },
  );

  // 2. Diagnosis ↔ CPT compatibility
  const mhCompatible =
    MH_CPT_CODES.has(input.cptCode) &&
    input.diagnoses.some((d) => MH_DX_PREFIXES.some((p) => d.icd10.startsWith(p)));
  const firstDx = input.diagnoses[0];
  checks.push({
    id: 'dx_cpt',
    label: 'Diagnosis supports procedure code',
    status: mhCompatible ? 'passed' : 'failed',
    detail: mhCompatible
      ? `${firstDx?.icd10 ?? 'Diagnosis'} is billable with CPT ${input.cptCode}`
      : 'Primary diagnosis is not compatible with a behavioral-health CPT',
    evidence: firstDx ? `${firstDx.icd10} · ${firstDx.description}` : undefined,
  });

  // 3. Medical necessity language (scenario-aware: forced-fail for some patients)
  const scenarioForcesMissing = scenario.integrity.missingChecks.some((m) =>
    m.toLowerCase().includes('medical necessity'),
  );
  const foundQuote = scenarioForcesMissing ? null : findNecessityQuote(input.noteContent);
  const necessityQuote = foundQuote ?? scenario.integrity.medicalNecessityQuote ?? null;
  const passesNecessity = !scenarioForcesMissing && necessityQuote !== null;
  checks.push({
    id: 'medical_necessity',
    label: 'Medical necessity documented',
    status: passesNecessity ? 'passed' : 'failed',
    detail: passesNecessity
      ? 'Clinical language supporting ongoing care found in note body'
      : 'Note does not contain language establishing medical necessity — add justification before billing',
    evidence: passesNecessity ? necessityQuote ?? undefined : undefined,
  });

  // 4. Provider credentialing
  const credentialed = !!input.providerCredentials && input.providerCredentials.length > 0;
  checks.push({
    id: 'credentialing',
    label: 'Provider credentialed for this procedure',
    status: credentialed ? 'passed' : 'warning',
    detail: credentialed
      ? `${input.providerCredentials} · authorized to bill ${input.cptCode}`
      : 'Provider credentials not on file — verify before submission',
  });

  // 5. Session authorization remaining (from scenario)
  const remaining = scenario.sessionsAuthorized - scenario.sessionsUsed;
  checks.push({
    id: 'session_auth',
    label: 'Sessions remaining under authorization',
    status: remaining > 2 ? 'passed' : remaining > 0 ? 'warning' : 'failed',
    detail:
      remaining > 0
        ? `${remaining} of ${scenario.sessionsAuthorized} sessions remaining`
        : 'Authorized sessions exhausted — request additional authorization',
  });

  const passed = checks.every((c) => c.status !== 'failed');

  return {
    passed,
    checks,
    medicalNecessityQuote: passesNecessity ? necessityQuote ?? undefined : undefined,
  };
}
