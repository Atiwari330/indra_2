import { tool } from 'ai';
import { z } from 'zod';

export function createTreatmentPlanTool(runId: string) {
  return tool({
    description: 'Create a treatment plan for a patient with SMART goals tied to diagnoses, measurable objectives, and evidence-based interventions. Use active diagnoses from the patient context.',
    inputSchema: z.object({
      patient_id: z.string().describe('Patient UUID from find_patient'),
      diagnosis_codes: z.array(z.string()).describe('ICD-10 codes from active diagnoses'),
      goals: z.array(z.object({
        goal: z.string().describe('SMART goal tied to a diagnosis'),
        target_date: z.string().optional().describe('Target date for goal completion'),
      })).min(1).describe('Treatment goals — at least one required'),
      objectives: z.array(z.object({
        objective: z.string().describe('Measurable objective that operationalizes a goal'),
        frequency: z.string().optional().describe('Frequency of measurement or practice'),
      })).min(1).describe('Measurable objectives'),
      interventions: z.array(z.object({
        intervention: z.string().describe('Evidence-based intervention'),
        frequency: z.string().optional().describe('Frequency of intervention delivery'),
      })).min(1).describe('Therapeutic interventions'),
      review_date: z.string().describe('Plan review date — typically 90 days from today'),
      assumptions_made: z.array(z.string()).describe('Assumptions made when generating this plan'),
    }),
    execute: async ({
      patient_id,
      diagnosis_codes,
      goals,
      objectives,
      interventions,
      review_date,
      assumptions_made,
    }) => {
      console.log(`[tool:create_treatment_plan] Plan proposed for patient ${patient_id} | diagnoses: ${diagnosis_codes.length} | goals: ${goals.length} | objectives: ${objectives.length} | interventions: ${interventions.length}`);

      return {
        status: 'proposed',
        message: 'Treatment plan proposed. Provider must review and approve before it becomes active.',
        assumptions_made,
        _proposed_action: {
          action_type: 'create_treatment_plan',
          target_table: 'treatment_plans',
          payload: {
            patient_id,
            ai_run_id: runId,
            diagnosis_codes,
            goals,
            objectives,
            interventions,
            review_date,
          },
        },
      };
    },
  });
}
