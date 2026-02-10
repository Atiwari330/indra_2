import { tool } from 'ai';
import { z } from 'zod';

const DiagnosisEntry = z.object({
  icd10_code: z.string().describe('ICD-10 diagnosis code'),
  description: z.string().describe('Diagnosis description'),
  is_primary: z.boolean().describe('Whether this is the primary diagnosis'),
  onset_date: z.string().optional().describe('Date of onset if known'),
  current_status_summary: z.string().describe('Brief summary of current symptom status for this diagnosis'),
});

const TreatmentSummary = z.object({
  treatment_start_date: z.string().describe('Date treatment began'),
  session_frequency: z.string().describe('Current session frequency (e.g., "weekly", "biweekly")'),
  session_duration_minutes: z.number().describe('Typical session duration in minutes'),
  modality: z.string().describe('Treatment modality (e.g., "Individual Psychotherapy - CBT")'),
  interventions_used: z.array(z.string()).describe('List of therapeutic interventions used'),
  total_sessions_completed: z.number().describe('Total sessions completed to date'),
  summary_narrative: z.string().describe('Brief narrative summarizing treatment course so far'),
});

const ScoreTrend = z.object({
  measure_type: z.string().describe('Assessment measure (e.g., PHQ-9, GAD-7)'),
  scores: z.array(z.object({
    date: z.string().optional(),
    score: z.number(),
  })).describe('Chronological scores'),
  trend: z.enum(['improving', 'stable', 'worsening']).describe('Overall trend direction'),
  clinical_interpretation: z.string().describe('Clinical interpretation of the trend'),
});

const GoalProgress = z.object({
  goal: z.string().describe('Treatment plan goal text'),
  status: z.enum(['MET', 'APPROACHING', 'IN_PROGRESS', 'BASELINE']).describe('Current goal status'),
  evidence: z.string().describe('Evidence supporting this status assessment'),
  target_date: z.string().optional().describe('Target completion date'),
});

const RiskAssessmentSummary = z.object({
  current_risk_level: z.enum(['none', 'low', 'moderate', 'high']).describe('Current overall risk level'),
  risk_factors: z.array(z.string()).describe('Active risk factors'),
  protective_factors: z.array(z.string()).describe('Active protective factors'),
  safety_plan_status: z.string().describe('Status of safety plan (e.g., "in place and reviewed", "not indicated")'),
});

const MedicalNecessity = z.object({
  justification: z.string().describe('Overall medical necessity justification narrative'),
  functional_limitations: z.array(z.string()).describe('Current functional limitations requiring treatment'),
  consequences_without_treatment: z.string().describe('Expected consequences if treatment is discontinued'),
  clinical_rationale_for_frequency: z.string().describe('Why the current/requested session frequency is needed'),
});

const ContinuedTreatmentRecommendation = z.object({
  sessions_requested: z.number().describe('Number of additional sessions requested'),
  recommended_frequency: z.string().describe('Recommended session frequency'),
  treatment_goals_for_next_period: z.array(z.string()).describe('Goals for the next authorization period'),
  expected_outcomes: z.string().describe('Expected outcomes if treatment continues'),
  estimated_discharge_criteria: z.string().describe('Criteria that would indicate readiness for discharge'),
});

export function createGenerateUtilizationReviewTool(runId: string) {
  return tool({
    description: 'Generate a structured utilization review / authorization request document based on clinical data from the patient context. Patient demographics and authorization summary are auto-populated by the service layer — do NOT include them. Fill in only the clinical synthesis sections.',
    inputSchema: z.object({
      patient_id: z.string().describe('Patient UUID from find_patient'),
      review_type: z.enum(['initial', 'concurrent', 'retrospective']).default('concurrent')
        .describe('Type of review — usually concurrent for ongoing auth requests'),
      diagnoses: z.array(DiagnosisEntry).describe('Active diagnoses with current status'),
      treatment_summary: TreatmentSummary.describe('Summary of treatment course'),
      assessment_score_trends: z.array(ScoreTrend).optional()
        .describe('Standardized assessment score trends if available'),
      goal_progress: z.array(GoalProgress).describe('Progress on each treatment plan goal'),
      risk_assessment_summary: RiskAssessmentSummary.describe('Current risk assessment summary'),
      medical_necessity: MedicalNecessity.describe('Medical necessity justification'),
      continued_treatment_recommendation: ContinuedTreatmentRecommendation
        .describe('Recommendation for continued treatment'),
      assumptions_made: z.array(z.string())
        .describe('Assumptions made when compiling this review — be transparent'),
    }),
    execute: async ({
      patient_id,
      review_type,
      diagnoses,
      treatment_summary,
      assessment_score_trends,
      goal_progress,
      risk_assessment_summary,
      medical_necessity,
      continued_treatment_recommendation,
      assumptions_made,
    }) => {
      console.log(`[tool:generate_utilization_review] UR proposed for patient ${patient_id} | type: ${review_type} | diagnoses: ${diagnoses.length} | goals: ${goal_progress.length} | assumptions: ${assumptions_made.length}`);

      return {
        review_type,
        status: 'proposed',
        assumptions_made,
        message: 'Utilization review proposed. Provider must review and approve before submission to payer.',
        _proposed_action: {
          action_type: 'generate_utilization_review',
          target_table: 'utilization_reviews',
          payload: {
            patient_id,
            ai_run_id: runId,
            review_type,
            content: {
              diagnoses,
              treatment_summary,
              assessment_score_trends,
              goal_progress,
              risk_assessment_summary,
              medical_necessity,
              continued_treatment_recommendation,
            },
          },
        },
      };
    },
  });
}
