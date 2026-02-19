import type { ProcessingStep, Clarification, ProposedAction } from '@/lib/types/ai-agent';

export interface MockScenario {
  id: string;
  triggerKeywords: string[];
  steps: { label: string; delayMs: number }[];
  clarifications: Clarification[];
  /** Steps to run after clarifications are answered (if any) */
  postClarificationSteps?: { label: string; delayMs: number }[];
  proposedActions: ProposedAction[];
  summary: string;
  tokenUsage: { input: number; output: number };
}

// ── Scenario 1: Progress Note (happy path) ──────────────────────
const progressNote: MockScenario = {
  id: 'progress-note',
  triggerKeywords: ['note', 'session', 'progress', 'soap', 'document'],
  steps: [
    { label: 'Loading patient context', delayMs: 800 },
    { label: 'Reviewing recent encounters', delayMs: 1000 },
    { label: 'Generating SOAP note', delayMs: 1500 },
    { label: 'Selecting billing codes', delayMs: 900 },
    { label: 'Preparing actions', delayMs: 600 },
  ],
  clarifications: [],
  proposedActions: [
    {
      id: 'action-encounter',
      actionType: 'encounter',
      description: 'Create encounter for today\'s session',
      payload: {
        type: 'individual_therapy',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: 50,
        provider: 'Sarah Chen, LCSW',
      },
    },
    {
      id: 'action-note',
      actionType: 'note',
      description: 'SOAP progress note for individual therapy session',
      payload: {
        format: 'SOAP',
        subjective: 'Patient reports improved sleep quality over the past week, averaging 7 hours per night compared to 4-5 hours previously. Continues to experience mild anxiety in social situations but has been practicing grounding techniques discussed in last session. Denies suicidal or homicidal ideation.',
        objective: 'Patient appears well-groomed, calm, and engaged. Affect is congruent with mood. Speech is normal in rate and rhythm. Thought process is linear and goal-directed.',
        assessment: 'Generalized Anxiety Disorder (F41.1) — showing incremental improvement with CBT techniques. Sleep hygiene interventions effective. Social anxiety remains a treatment target.',
        plan: 'Continue weekly individual therapy. Introduce gradual exposure hierarchy for social situations. Maintain current sleep hygiene protocol. Follow up on medication review with Dr. Rivera next week.',
      },
      assumptions: [
        'Session type: individual therapy (50 min)',
        'Primary diagnosis: Generalized Anxiety Disorder',
      ],
    },
    {
      id: 'action-billing',
      actionType: 'billing',
      description: 'Bill CPT 90834 — Individual psychotherapy, 45 min',
      payload: {
        cpt_code: '90834',
        description: 'Individual psychotherapy, 45 minutes',
        diagnosis_codes: ['F41.1'],
        units: 1,
      },
    },
  ],
  summary: 'Created encounter, SOAP progress note, and billing entry for today\'s individual therapy session with John Doe.',
  tokenUsage: { input: 2340, output: 1180 },
};

// ── Scenario 2: Medication Update (clarification flow) ──────────
const medicationUpdate: MockScenario = {
  id: 'medication-update',
  triggerKeywords: ['medication', 'med', 'prescri', 'dose', 'drug'],
  steps: [
    { label: 'Loading patient medications', delayMs: 800 },
    { label: 'Checking interaction database', delayMs: 1200 },
    { label: 'Reviewing clinical guidelines', delayMs: 1000 },
  ],
  clarifications: [
    {
      id: 'clarify-med-name',
      question: 'Which medication would you like to update?',
      options: ['Sertraline 50mg', 'Hydroxyzine 25mg', 'Melatonin 3mg'],
    },
    {
      id: 'clarify-change-type',
      question: 'What change would you like to make?',
      options: ['Increase dose', 'Decrease dose', 'Discontinue', 'Change frequency'],
    },
  ],
  postClarificationSteps: [
    { label: 'Validating dose change', delayMs: 900 },
    { label: 'Preparing medication order', delayMs: 700 },
  ],
  proposedActions: [
    {
      id: 'action-med-update',
      actionType: 'medication',
      description: 'Update Sertraline from 50mg to 100mg daily',
      payload: {
        medication: 'Sertraline',
        current_dose: '50mg daily',
        new_dose: '100mg daily',
        reason: 'Inadequate response at current dose after 8 weeks',
        prescriber: 'Michael Rivera, MD',
      },
      assumptions: [
        'No contraindicated drug interactions identified',
        'Patient has been on current dose for 8+ weeks',
      ],
    },
  ],
  summary: 'Updated Sertraline dosage from 50mg to 100mg daily for Jane Smith.',
  tokenUsage: { input: 1860, output: 920 },
};

// ── Scenario 3: Treatment Plan ───────────────────────────────────
const treatmentPlan: MockScenario = {
  id: 'treatment-plan',
  triggerKeywords: ['treatment plan', 'treatment', 'goals'],
  steps: [
    { label: 'Loading patient context', delayMs: 800 },
    { label: 'Reviewing intake assessment', delayMs: 1000 },
    { label: 'Analyzing diagnoses', delayMs: 1200 },
    { label: 'Generating SMART goals', delayMs: 1400 },
    { label: 'Preparing treatment plan', delayMs: 800 },
  ],
  clarifications: [],
  proposedActions: [
    {
      id: 'action-treatment-plan',
      actionType: 'treatment_plan',
      description: 'Treatment plan for Generalized Anxiety Disorder and Insomnia',
      payload: {
        diagnosis_codes: ['F41.1', 'G47.00'],
        goals: [
          {
            goal: 'Reduce GAD-7 score from 14 (moderate) to below 10 (mild) through CBT-based anxiety management skills',
            target_date: '2026-05-18',
          },
          {
            goal: 'Improve sleep onset latency from 60+ minutes to under 30 minutes using sleep hygiene and stimulus control techniques',
            target_date: '2026-04-18',
          },
          {
            goal: 'Decrease avoidance behaviors in social situations by completing a graded exposure hierarchy of at least 5 steps',
            target_date: '2026-05-18',
          },
        ],
        objectives: [
          {
            objective: 'Patient will practice diaphragmatic breathing for 5 minutes when anxiety exceeds 5/10 on subjective distress scale',
            frequency: 'Daily',
          },
          {
            objective: 'Patient will complete a thought record identifying and challenging at least 3 cognitive distortions per week',
            frequency: '3x/week',
          },
          {
            objective: 'Patient will follow a consistent sleep-wake schedule within a 30-minute window 6 of 7 nights',
            frequency: 'Nightly',
          },
          {
            objective: 'Patient will attempt one step on the exposure hierarchy each week and report outcome in session',
            frequency: 'Weekly',
          },
        ],
        interventions: [
          {
            intervention: 'Cognitive Behavioral Therapy (CBT) — individual sessions targeting cognitive distortions, safety behaviors, and avoidance patterns',
            frequency: 'Weekly, 50 min',
          },
          {
            intervention: 'Psychoeducation on the anxiety cycle, fight-or-flight response, and the relationship between worry and sleep',
            frequency: 'As needed',
          },
          {
            intervention: 'Sleep hygiene protocol — stimulus control, sleep restriction, and relaxation training',
            frequency: 'Review weekly',
          },
          {
            intervention: 'Graded exposure therapy for social anxiety situations using collaboratively developed hierarchy',
            frequency: 'Weekly in-session + homework',
          },
        ],
        review_date: '2026-05-18',
      },
      assumptions: [
        'Primary diagnosis: Generalized Anxiety Disorder (F41.1)',
        'Secondary diagnosis: Insomnia, unspecified (G47.00)',
        'GAD-7 baseline score: 14 (moderate)',
      ],
    },
  ],
  summary: 'Created treatment plan with 3 SMART goals targeting anxiety reduction, sleep improvement, and social exposure for John Doe.',
  tokenUsage: { input: 2850, output: 1560 },
};

// ── Scenario 4: Patient Query (info only) ───────────────────────
const patientQuery: MockScenario = {
  id: 'patient-query',
  triggerKeywords: ['what', 'when', 'how', 'show', 'list', 'tell', 'find'],
  steps: [
    { label: 'Searching patient records', delayMs: 800 },
    { label: 'Compiling information', delayMs: 1000 },
    { label: 'Formatting response', delayMs: 600 },
  ],
  clarifications: [],
  proposedActions: [],
  summary: 'Robert Johnson is currently prescribed Lithium 600mg BID and Quetiapine 200mg QHS. Last medication review was on January 15, 2026 with Dr. Rivera. Next appointment is scheduled for February 20, 2026. No recent changes to medication regimen.',
  tokenUsage: { input: 1200, output: 480 },
};

// ── Exports ─────────────────────────────────────────────────────

export const MOCK_SCENARIOS: MockScenario[] = [progressNote, medicationUpdate, treatmentPlan, patientQuery];

/** Pick a scenario by matching keywords in the user's input */
export function matchScenario(input: string): MockScenario {
  const lower = input.toLowerCase();
  for (const scenario of MOCK_SCENARIOS) {
    if (scenario.triggerKeywords.some((kw) => lower.includes(kw))) {
      return scenario;
    }
  }
  // Default to patient query for unmatched inputs
  return patientQuery;
}
