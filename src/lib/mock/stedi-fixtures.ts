// Canned Stedi-shaped responses keyed by patient ID. Used by the mock
// Stedi service to make the demo feel real and show scenario variety
// across patients. Shapes mirror src/lib/types/stedi.ts.

import type {
  EligibilityResponse,
  ClaimSubmissionResponse,
  ClaimAcknowledgment,
} from '@/lib/types/stedi';

export interface PatientScenario {
  patientId: string;
  patientName: string;
  // Eligibility
  payer: { name: string; stediPayerId: string };
  memberId: string;
  groupNumber: string;
  planName: string;
  active: boolean;
  copayAmount: number;
  deductibleAmount: number;
  deductibleRemaining: number;
  outOfPocketMax: number;
  outOfPocketRemaining: number;
  coinsurancePercent: number;
  inNetwork: boolean;
  mentalHealthCovered: boolean;
  priorAuthRequired: boolean;
  sessionsAuthorized: number;
  sessionsUsed: number;
  // Clinical integrity
  integrity: {
    passesIntegrity: boolean;
    missingChecks: string[]; // labels that should fail
    medicalNecessityQuote?: string;
  };
  // Async acknowledgment timing
  acknowledgmentDelayMs: number;
  acknowledgmentAccepted: boolean;
  acknowledgmentNote?: string;
  // Banner shown to salesperson during demo (not the customer)
  demoNote: string;
}

const JOHN = 'd0000000-0000-0000-0000-000000000001';
const JANE = 'd0000000-0000-0000-0000-000000000002';
const ROBERT = 'd0000000-0000-0000-0000-000000000003';
const MARIA = 'd0000000-0000-0000-0000-000000000004';
const DAVID = 'd0000000-0000-0000-0000-000000000005';

export const SCENARIOS: Record<string, PatientScenario> = {
  [JOHN]: {
    patientId: JOHN,
    patientName: 'John Doe',
    payer: { name: 'Blue Cross Blue Shield', stediPayerId: 'BCBSIL' },
    memberId: 'BCBS-JD-12345',
    groupNumber: 'GRP-100',
    planName: 'BCBS PPO Gold',
    active: true,
    copayAmount: 25,
    deductibleAmount: 1500,
    deductibleRemaining: 420,
    outOfPocketMax: 6000,
    outOfPocketRemaining: 4200,
    coinsurancePercent: 20,
    inNetwork: true,
    mentalHealthCovered: true,
    priorAuthRequired: false,
    sessionsAuthorized: 24,
    sessionsUsed: 3,
    integrity: {
      passesIntegrity: true,
      missingChecks: [],
      medicalNecessityQuote:
        'Patient continues to meet criteria for ongoing psychotherapy due to active major depressive symptoms impacting work functioning and interpersonal relationships.',
    },
    acknowledgmentDelayMs: 8000,
    acknowledgmentAccepted: true,
    demoNote: 'Happy path — PPO in-network, clean submission, fast ack.',
  },
  [JANE]: {
    patientId: JANE,
    patientName: 'Jane Smith',
    payer: { name: 'Aetna', stediPayerId: '60054' },
    memberId: 'AET-JS-67890',
    groupNumber: 'GRP-200',
    planName: 'Aetna HealthSave HDHP',
    active: true,
    copayAmount: 0,
    deductibleAmount: 5000,
    deductibleRemaining: 3180,
    outOfPocketMax: 8000,
    outOfPocketRemaining: 6250,
    coinsurancePercent: 20,
    inNetwork: true,
    mentalHealthCovered: true,
    priorAuthRequired: false,
    sessionsAuthorized: 20,
    sessionsUsed: 2,
    integrity: {
      passesIntegrity: true,
      missingChecks: [],
      medicalNecessityQuote:
        'Patient demonstrates continued functional impairment from chronic PTSD requiring weekly trauma-focused therapy.',
    },
    acknowledgmentDelayMs: 9500,
    acknowledgmentAccepted: true,
    acknowledgmentNote: 'Patient responsibility applied toward deductible.',
    demoNote: 'HDHP — deductible gap visible in eligibility card, still submits clean.',
  },
  [ROBERT]: {
    patientId: ROBERT,
    patientName: 'Robert Johnson',
    payer: { name: 'UnitedHealthcare', stediPayerId: '87726' },
    memberId: 'UHC-RJ-11111',
    groupNumber: 'GRP-300',
    planName: 'UHC Choice Plus',
    active: true,
    copayAmount: 20,
    deductibleAmount: 2500,
    deductibleRemaining: 0,
    outOfPocketMax: 7000,
    outOfPocketRemaining: 3100,
    coinsurancePercent: 15,
    inNetwork: true,
    mentalHealthCovered: true,
    priorAuthRequired: true,
    sessionsAuthorized: 30,
    sessionsUsed: 5,
    integrity: {
      passesIntegrity: true,
      missingChecks: [],
      medicalNecessityQuote:
        'Continued treatment is medically necessary to support sobriety and manage co-occurring depressive symptoms; patient at elevated relapse risk without regular support.',
    },
    acknowledgmentDelayMs: 12000,
    acknowledgmentAccepted: true,
    demoNote: 'Slower async ack (12s) — demonstrates real-world payer timing.',
  },
  [MARIA]: {
    patientId: MARIA,
    patientName: 'Maria Garcia',
    payer: { name: 'Blue Cross Blue Shield', stediPayerId: 'BCBSIL' },
    memberId: 'BCBS-MG-22222',
    groupNumber: 'GRP-100',
    planName: 'BCBS PPO Silver',
    active: true,
    copayAmount: 35,
    deductibleAmount: 3000,
    deductibleRemaining: 1850,
    outOfPocketMax: 7500,
    outOfPocketRemaining: 5400,
    coinsurancePercent: 20,
    inNetwork: true,
    mentalHealthCovered: true,
    priorAuthRequired: false,
    sessionsAuthorized: 24,
    sessionsUsed: 8,
    integrity: {
      passesIntegrity: false,
      missingChecks: ['Medical necessity language not found in note body'],
    },
    acknowledgmentDelayMs: 8000,
    acknowledgmentAccepted: true,
    demoNote:
      'Integrity check BLOCKS submission. Shows Indra catching a would-be denial before it leaves the building.',
  },
  [DAVID]: {
    patientId: DAVID,
    patientName: 'David Williams',
    payer: { name: 'Aetna', stediPayerId: '60054' },
    memberId: 'AET-DW-33333',
    groupNumber: 'GRP-200',
    planName: 'Aetna Open Access',
    active: true,
    copayAmount: 30,
    deductibleAmount: 2000,
    deductibleRemaining: 1200,
    outOfPocketMax: 6500,
    outOfPocketRemaining: 4800,
    coinsurancePercent: 20,
    inNetwork: true,
    mentalHealthCovered: true,
    priorAuthRequired: false,
    sessionsAuthorized: 24,
    sessionsUsed: 4,
    integrity: {
      passesIntegrity: true,
      missingChecks: [],
      medicalNecessityQuote:
        'Patient requires ongoing psychiatric care for moderate ADHD and panic disorder; functional impairment at work documented.',
    },
    acknowledgmentDelayMs: 8500,
    acknowledgmentAccepted: true,
    demoNote: 'Clean submission — backup happy-path patient.',
  },
};

export function getScenario(patientId: string): PatientScenario {
  return SCENARIOS[patientId] ?? SCENARIOS[JOHN];
}

// Fallback billing profile for the organization — in production these
// would come from an org settings table. Hardcoded for the demo.
export const DEMO_BILLING_PROFILE = {
  organizationName: 'Indra Behavioral Health',
  taxId: '84-1234567',
  npi: '1234567893',
  taxonomyCode: '103TC0700X', // Psychologist, Clinical
  address: {
    address1: '100 Market Street',
    address2: 'Suite 400',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94103',
  },
  phone: '415-555-0100',
};

export const DEMO_RENDERING_PROVIDER = {
  npi: '1952372649',
  firstName: 'Sarah',
  lastName: 'Chen',
  taxonomyCode: '1041C0700X', // Clinical Social Worker
};

// ─── Response builders ─────────────────────────────────────────────

function formatYmd(iso: string): string {
  return iso.replace(/-/g, '');
}

function randomControlNumber(): string {
  return Math.floor(Math.random() * 900000000 + 100000000).toString();
}

function randomCorrelationId(): string {
  return `corr_${Math.random().toString(36).slice(2, 14)}`;
}

export function buildEligibilityResponse(
  patientId: string,
  subscriberDob: string, // YYYY-MM-DD
): EligibilityResponse {
  const s = getScenario(patientId);
  const controlNumber = randomControlNumber();
  return {
    controlNumber,
    tradingPartnerServiceId: s.payer.stediPayerId,
    reassociationKey: randomCorrelationId(),
    payer: {
      name: s.payer.name,
      payerIdentification: s.payer.stediPayerId,
    },
    provider: {
      providerName: DEMO_BILLING_PROFILE.organizationName,
      npi: DEMO_BILLING_PROFILE.npi,
    },
    subscriber: {
      memberId: s.memberId,
      firstName: s.patientName.split(' ')[0],
      lastName: s.patientName.split(' ')[1] ?? '',
      dateOfBirth: formatYmd(subscriberDob),
      groupNumber: s.groupNumber,
      groupDescription: s.planName,
    },
    planInformation: {
      planName: s.planName,
      planNumber: s.groupNumber,
      planCoverageDescription: s.mentalHealthCovered
        ? 'Mental Health — Outpatient Therapy Covered'
        : 'Mental Health Not Covered',
      planBeginDate: '20250101',
      planEndDate: '20251231',
    },
    benefitsInformation: [
      {
        code: '1',
        name: 'Active Coverage',
        serviceTypes: ['Health Benefit Plan Coverage'],
        inPlanNetwork: s.inNetwork ? 'Yes' : 'No',
      },
      {
        code: '1',
        name: 'Mental Health',
        serviceTypes: ['Mental Health'],
        inPlanNetwork: s.inNetwork ? 'Yes' : 'No',
      },
      {
        code: 'B',
        name: 'Copayment',
        serviceTypes: ['Mental Health'],
        benefitAmount: s.copayAmount,
        timeQualifier: 'Visit',
        coverageLevel: 'Individual',
      },
      {
        code: 'C',
        name: 'Deductible',
        serviceTypes: ['Health Benefit Plan Coverage'],
        benefitAmount: s.deductibleAmount,
        coverageLevel: 'Individual',
        timeQualifier: 'Calendar Year',
      },
      {
        code: 'A',
        name: 'Coinsurance',
        serviceTypes: ['Mental Health'],
        benefitPercent: s.coinsurancePercent,
        coverageLevel: 'Individual',
      },
    ],
    summary: {
      active: s.active,
      planName: s.planName,
      copayAmount: s.copayAmount,
      deductibleAmount: s.deductibleAmount,
      deductibleRemaining: s.deductibleRemaining,
      outOfPocketMax: s.outOfPocketMax,
      outOfPocketRemaining: s.outOfPocketRemaining,
      coinsurancePercent: s.coinsurancePercent,
      inNetwork: s.inNetwork,
      mentalHealthCovered: s.mentalHealthCovered,
      priorAuthRequired: s.priorAuthRequired,
      sessionsAuthorized: s.sessionsAuthorized,
      sessionsUsed: s.sessionsUsed,
    },
  };
}

export function buildSubmissionResponse(
  patientId: string,
  patientControlNumber: string,
): ClaimSubmissionResponse {
  const s = getScenario(patientId);
  const controlNumber = randomControlNumber();
  const correlationId = randomCorrelationId();
  return {
    controlNumber,
    transactionId: `tx_${Math.random().toString(36).slice(2, 14)}`,
    tradingPartnerId: s.payer.stediPayerId,
    claimReference: {
      correlationId,
      submitterId: DEMO_BILLING_PROFILE.npi,
      claimControlNumber: patientControlNumber,
    },
    status: 'Accepted',
    submittedAt: new Date().toISOString(),
  };
}

export function buildAcknowledgment(
  patientId: string,
  patientControlNumber: string,
  correlationId: string,
  totalCharge: number,
): ClaimAcknowledgment {
  const s = getScenario(patientId);
  return {
    controlNumber: randomControlNumber(),
    correlationId,
    payer: {
      name: s.payer.name,
      payerIdentification: s.payer.stediPayerId,
    },
    claimReference: {
      patientControlNumber,
      claimControlNumber: patientControlNumber,
    },
    claimStatus: s.acknowledgmentAccepted
      ? {
          statusCategoryCode: 'A2',
          statusCategoryDescription: 'Acknowledgment/Acceptance into adjudication system',
          statusCode: '20',
          statusDescription: 'Accepted for processing',
          effectiveDate: formatYmd(new Date().toISOString().slice(0, 10)),
        }
      : {
          statusCategoryCode: 'A3',
          statusCategoryDescription: 'Acknowledgment/Returned as unprocessable claim',
          statusCode: '21',
          statusDescription: s.acknowledgmentNote ?? 'Missing/invalid data',
          effectiveDate: formatYmd(new Date().toISOString().slice(0, 10)),
        },
    claimChargeAmount: totalCharge,
    acknowledgedAt: new Date().toISOString(),
  };
}
