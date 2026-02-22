/**
 * Static content definitions for intake paperwork:
 * - 3 Consent Documents (read-and-sign)
 * - 1 Client History Intake Form (7-section questionnaire)
 */

// ── Consent Documents ──────────────────────────────────────────

export interface ConsentDocument {
  key: string;
  title: string;
  summaryPoints: string[];
  fullText: string;
}

export const CONSENT_DOCUMENTS: ConsentDocument[] = [
  {
    key: 'informed_consent',
    title: 'Informed Consent to Treatment',
    summaryPoints: [
      'Therapy involves discussing personal thoughts, feelings, and behaviors to work toward your goals.',
      'Benefits may include improved coping, better relationships, and reduced symptoms, though outcomes vary.',
      'Confidentiality is maintained except where required by law (imminent danger, abuse, court order).',
      'You may discontinue treatment at any time. We recommend discussing this decision together first.',
      'Sessions missed or canceled with less than 24 hours\' notice may be subject to a fee.',
      'In case of emergency, call 911 or go to your nearest emergency room.',
    ],
    fullText: `INFORMED CONSENT TO TREATMENT

Purpose and Nature of Treatment
Psychotherapy is a collaborative process between you and your therapist. Sessions typically last 45-55 minutes and involve discussing your thoughts, feelings, behaviors, and life circumstances. Your therapist will work with you to develop treatment goals and a plan to address your concerns.

Potential Benefits and Risks
Therapy has been shown to have benefits for people who participate. These may include improved coping skills, better interpersonal relationships, reduction of specific symptoms, and greater self-understanding. However, results cannot be guaranteed. At times, therapy may involve discussing unpleasant aspects of your life, which may temporarily increase feelings of sadness, anxiety, anger, or frustration.

Confidentiality
Information shared in therapy is confidential and will not be disclosed without your written consent, except as required or permitted by law. Exceptions to confidentiality include:
- Imminent danger to yourself or others
- Suspected abuse or neglect of a child, elder, or dependent adult
- A valid court order or subpoena
- As otherwise required by applicable law

Your Rights
You have the right to ask questions about your treatment at any time. You have the right to refuse any suggested intervention. You have the right to request a referral to another therapist. You have the right to discontinue therapy at any time, though we encourage you to discuss this decision in session first.

Emergency Procedures
If you are experiencing a mental health emergency between sessions, please call 911, go to your nearest emergency room, or contact the 988 Suicide & Crisis Lifeline by calling or texting 988.

Cancellation Policy
Please provide at least 24 hours' notice when canceling or rescheduling an appointment. Late cancellations or no-shows may be charged the full session fee. Your therapist will discuss specific policies with you.`,
  },
  {
    key: 'hipaa_notice',
    title: 'HIPAA Notice of Privacy Practices',
    summaryPoints: [
      'Your health information (PHI) is used for treatment, payment, and healthcare operations.',
      'We will not share your information for marketing or sell it to third parties.',
      'You have the right to access, amend, and receive an accounting of disclosures of your health records.',
      'You may request restrictions on how your PHI is used or disclosed.',
      'We are required to notify you in the event of a breach of your health information.',
      'You may file a complaint with our office or the U.S. Department of Health and Human Services.',
    ],
    fullText: `NOTICE OF PRIVACY PRACTICES

This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.

Uses and Disclosures of Protected Health Information (PHI)
Your PHI may be used and disclosed for the following purposes:
- Treatment: To provide, coordinate, or manage your healthcare and related services.
- Payment: To bill and collect payment for services provided to you.
- Healthcare Operations: For quality assessment, credentialing, and other administrative activities.

Your PHI will not be used for marketing purposes or sold to any third party without your explicit written authorization.

Your Rights
You have the following rights regarding your health information:
- Right to Access: You may request to inspect or obtain copies of your health records.
- Right to Amend: You may request that we amend your health information if you believe it is incorrect or incomplete.
- Right to Accounting: You may request a list of certain disclosures we have made of your health information.
- Right to Restrict: You may request restrictions on certain uses and disclosures of your health information.
- Right to Confidential Communication: You may request that we communicate with you by alternative means or at an alternative location.
- Right to a Copy of This Notice: You may request a paper copy of this notice at any time.

Our Responsibilities
We are required by law to maintain the privacy of your PHI and to provide you with this notice of our legal duties and privacy practices. We are required to notify you if a breach occurs that may have compromised the privacy or security of your information. We will not use or disclose your PHI without your authorization, except as described in this notice.

Complaints
If you believe your privacy rights have been violated, you may file a complaint with our office or with the U.S. Department of Health and Human Services, Office for Civil Rights. You will not be penalized for filing a complaint.`,
  },
  {
    key: 'practice_policies',
    title: 'Practice Policies & Financial Agreement',
    summaryPoints: [
      'Standard session fee and accepted payment methods will be discussed at your first appointment.',
      'Payment is due at the time of service unless other arrangements have been made.',
      'Insurance: We will verify your benefits, but you are ultimately responsible for understanding your coverage.',
      'Cancellations require 24 hours\' notice. Late cancellations and no-shows may incur fees.',
      'Communication between sessions is for scheduling only. Clinical concerns should be addressed in session.',
      'A Good Faith Estimate of expected charges will be provided as required under the No Surprises Act.',
    ],
    fullText: `PRACTICE POLICIES & FINANCIAL AGREEMENT

Fee Structure
Your therapist will discuss their standard session fee with you prior to or at your first appointment. Fees may vary based on the type and length of service. A schedule of fees is available upon request.

Payment Terms
Payment is due at the time of service. We accept major credit cards, debit cards, HSA/FSA cards, and checks. If you are unable to pay at the time of service, please discuss payment arrangements with your therapist.

Insurance
If you plan to use insurance, we will verify your benefits prior to your first appointment when possible. However, you are responsible for understanding your insurance coverage, including deductibles, copays, and session limits. You are responsible for any charges not covered by your insurance.

Cancellation and No-Show Policy
Appointments that are canceled with less than 24 hours' notice or are missed without notice (no-show) may be charged the full session fee. Insurance does not cover missed appointment fees. If you need to cancel or reschedule, please contact us as soon as possible.

Communication Policy
Communication between sessions (phone, email, text, patient portal messaging) is generally limited to scheduling matters. If you have clinical concerns between sessions, please bring them up at your next appointment. In case of emergency, call 911 or the 988 Suicide & Crisis Lifeline.

Good Faith Estimate
Under the No Surprises Act, healthcare providers are required to provide patients who are uninsured or self-pay with a Good Faith Estimate of expected charges. You have the right to receive a Good Faith Estimate for the total expected cost of any healthcare services. If you are billed for more than the Good Faith Estimate, you may dispute the bill.

Termination of Treatment
Either you or your therapist may decide to end treatment at any time. If possible, we recommend discussing the decision to end treatment before the final session. Your therapist will provide referrals upon request.`,
  },
];

// ── Intake Questionnaire Definitions ────────────────────────────

export type FieldType = 'textarea' | 'select' | 'scale' | 'multi_select' | 'yes_no' | 'conditional_text';

export interface FieldOption {
  label: string;
  value: string;
}

export interface QuestionnaireField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];          // for select, multi_select
  scaleMin?: number;               // for scale
  scaleMax?: number;               // for scale
  scaleMinLabel?: string;          // for scale
  scaleMaxLabel?: string;          // for scale
  conditionalOn?: string;          // field key that must be 'yes' to show this field
  placeholder?: string;            // for textarea/conditional_text
}

export interface QuestionnaireSection {
  key: string;
  title: string;
  description: string;
  fields: QuestionnaireField[];
  isSafetyScreen?: boolean;        // triggers safety interstitial if any answer is 'yes'
}

export const INTAKE_QUESTIONNAIRE_SECTIONS: QuestionnaireSection[] = [
  {
    key: 'presenting_concerns',
    title: 'Presenting Concerns',
    description: 'Tell us why you\'re seeking therapy.',
    fields: [
      {
        key: 'reason',
        label: 'What brings you to therapy today?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe what you\'re experiencing or hoping to work on...',
      },
      {
        key: 'duration',
        label: 'How long have you been experiencing these concerns?',
        type: 'select',
        required: true,
        options: [
          { label: 'Less than 2 weeks', value: 'less_than_2_weeks' },
          { label: '2-4 weeks', value: '2_4_weeks' },
          { label: '1-3 months', value: '1_3_months' },
          { label: '3-6 months', value: '3_6_months' },
          { label: '6-12 months', value: '6_12_months' },
          { label: 'More than a year', value: 'more_than_year' },
        ],
      },
      {
        key: 'life_impact',
        label: 'How much are these concerns affecting your daily life?',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Minimally',
        scaleMaxLabel: 'Severely',
      },
    ],
  },
  {
    key: 'current_symptoms',
    title: 'Current Symptoms',
    description: 'Select any symptoms you\'ve been experiencing recently.',
    fields: [
      {
        key: 'symptoms',
        label: 'Check all that apply:',
        type: 'multi_select',
        options: [
          { label: 'Persistent sadness or low mood', value: 'sadness' },
          { label: 'Excessive worry or anxiety', value: 'anxiety' },
          { label: 'Difficulty sleeping or sleeping too much', value: 'sleep_issues' },
          { label: 'Loss of interest in activities', value: 'loss_of_interest' },
          { label: 'Irritability or anger', value: 'irritability' },
          { label: 'Difficulty concentrating', value: 'concentration' },
          { label: 'Panic attacks', value: 'panic' },
          { label: 'Changes in appetite', value: 'appetite' },
          { label: 'Fatigue or low energy', value: 'fatigue' },
          { label: 'Social withdrawal', value: 'withdrawal' },
          { label: 'Feelings of worthlessness or guilt', value: 'worthlessness' },
          { label: 'Restlessness or feeling on edge', value: 'restlessness' },
        ],
      },
    ],
  },
  {
    key: 'mental_health_history',
    title: 'Mental Health History',
    description: 'Help us understand your history with mental health care.',
    fields: [
      {
        key: 'prior_therapy',
        label: 'Have you been in therapy before?',
        type: 'yes_no',
      },
      {
        key: 'prior_therapy_details',
        label: 'Please describe your previous therapy experience.',
        type: 'conditional_text',
        conditionalOn: 'prior_therapy',
        placeholder: 'When, type of therapy, how long, etc.',
      },
      {
        key: 'prior_diagnoses',
        label: 'Have you ever been diagnosed with a mental health condition?',
        type: 'yes_no',
      },
      {
        key: 'prior_diagnoses_details',
        label: 'Which diagnoses?',
        type: 'conditional_text',
        conditionalOn: 'prior_diagnoses',
        placeholder: 'e.g., Depression, Anxiety, PTSD...',
      },
      {
        key: 'hospitalizations',
        label: 'Have you ever been hospitalized for mental health reasons?',
        type: 'yes_no',
      },
    ],
  },
  {
    key: 'medications',
    title: 'Medications',
    description: 'Tell us about any medications you\'re currently taking.',
    fields: [
      {
        key: 'taking_medications',
        label: 'Are you currently taking any medications?',
        type: 'yes_no',
      },
      {
        key: 'medication_list',
        label: 'Please list your current medications.',
        type: 'conditional_text',
        conditionalOn: 'taking_medications',
        placeholder: 'Name, dosage, and what it\'s prescribed for...',
      },
      {
        key: 'has_prescriber',
        label: 'Do you have a prescribing provider (psychiatrist, PCP)?',
        type: 'yes_no',
      },
    ],
  },
  {
    key: 'substance_use',
    title: 'Substance Use',
    description: 'This information helps your therapist provide the best care.',
    fields: [
      {
        key: 'alcohol_frequency',
        label: 'How often do you consume alcohol?',
        type: 'select',
        options: [
          { label: 'Never', value: 'never' },
          { label: 'Socially / occasionally', value: 'socially' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Daily', value: 'daily' },
        ],
      },
      {
        key: 'recreational_substances',
        label: 'Do you use any recreational substances?',
        type: 'yes_no',
      },
      {
        key: 'substance_details',
        label: 'Which substances?',
        type: 'conditional_text',
        conditionalOn: 'recreational_substances',
        placeholder: 'Please describe...',
      },
    ],
  },
  {
    key: 'family_social',
    title: 'Family & Social Background',
    description: 'Understanding your support system helps guide treatment.',
    fields: [
      {
        key: 'family_mh_history',
        label: 'Is there a history of mental health conditions in your family?',
        type: 'yes_no',
      },
      {
        key: 'family_mh_details',
        label: 'Please describe.',
        type: 'conditional_text',
        conditionalOn: 'family_mh_history',
        placeholder: 'e.g., parent with depression, sibling with anxiety...',
      },
      {
        key: 'living_situation',
        label: 'What is your current living situation?',
        type: 'select',
        options: [
          { label: 'Live alone', value: 'alone' },
          { label: 'Live with partner/spouse', value: 'partner' },
          { label: 'Live with family', value: 'family' },
          { label: 'Live with roommates', value: 'roommates' },
          { label: 'Other', value: 'other' },
        ],
      },
      {
        key: 'support_system',
        label: 'How would you describe your support system?',
        type: 'select',
        options: [
          { label: 'Strong — I have people I can rely on', value: 'strong' },
          { label: 'Some support — a few close people', value: 'some' },
          { label: 'Limited — I feel fairly isolated', value: 'limited' },
        ],
      },
    ],
  },
  {
    key: 'safety_screening',
    title: 'Safety Screening',
    description: 'These questions are asked of all new clients. Your honest answers help us keep you safe.',
    isSafetyScreen: true,
    fields: [
      {
        key: 'self_harm_thoughts',
        label: 'Are you currently having thoughts of harming yourself?',
        type: 'yes_no',
      },
      {
        key: 'harm_others_thoughts',
        label: 'Are you currently having thoughts of harming others?',
        type: 'yes_no',
      },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────

/** All items in an intake packet in the order they should be completed */
export const INTAKE_PACKET_ITEMS = [
  ...CONSENT_DOCUMENTS.map((doc, i) => ({
    item_key: doc.key,
    item_label: doc.title,
    item_type: 'consent_document' as const,
    sort_order: i,
  })),
  {
    item_key: 'client_history',
    item_label: 'Client History Intake Form',
    item_type: 'intake_questionnaire' as const,
    sort_order: CONSENT_DOCUMENTS.length,
  },
];

export function getTotalItemCount(): number {
  return INTAKE_PACKET_ITEMS.length;
}
