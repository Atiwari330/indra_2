import { tool } from 'ai';
import { z } from 'zod';

const IntakeContent = z.object({
  chief_complaint: z.string().describe('The primary reason the patient is seeking treatment, in their own words when possible'),
  history_of_present_illness: z.string().describe('Detailed narrative of presenting concerns — onset, duration, severity, precipitating factors, and functional impact'),
  psychiatric_history: z.string().describe('Prior mental health treatment — therapy history, hospitalizations, medication trials, and responses'),
  social_history: z.string().describe('Living situation, employment, education, relationships, substance use, legal history, and cultural factors'),
  family_history: z.string().describe('Family psychiatric and medical history relevant to the presenting concerns'),
  mental_status_exam: z.string().describe('Appearance, behavior, speech, mood, affect, thought process, thought content, cognition, insight, and judgment'),
  risk_assessment_narrative: z.string().describe('Detailed risk assessment — suicidal ideation, homicidal ideation, self-harm, protective factors, and risk level determination'),
  diagnosis_formulation: z.string().describe('Clinical formulation tying presenting symptoms to diagnostic impressions with ICD-10 codes'),
  treatment_recommendations: z.string().describe('Recommended treatment modality, frequency, goals, and any referrals or additional assessments needed'),
});

export function createIntakeNoteTool(
  runId: string
) {
  return tool({
    description: 'Generate a structured intake assessment / initial evaluation note based on the intake session. The note will be saved as a draft for provider review, NOT directly to the medical record.',
    inputSchema: z.object({
      encounter_id: z.string().describe('Encounter UUID from resolve_encounter'),
      content: IntakeContent.describe('Structured intake assessment content'),
      risk_assessment: z.object({
        suicidal_ideation: z.boolean().default(false),
        homicidal_ideation: z.boolean().default(false),
        self_harm: z.boolean().default(false),
        details: z.string().optional(),
      }).describe('Risk assessment — REQUIRED. Document SI/HI/SH denial or presence with details.'),
      standardized_scores: z.array(z.object({
        measure_type: z.enum(['PHQ-9', 'GAD-7', 'PCL-5', 'AUDIT-C', 'CSSRS']),
        score: z.number(),
      })).optional().describe('Standardized assessment scores administered during the intake'),
      assumptions_made: z.array(z.string()).describe('List of assumptions made when generating this note. Be transparent about what was inferred vs explicitly stated.'),
    }),
    execute: async ({ encounter_id, content, risk_assessment, standardized_scores, assumptions_made }) => {
      const hasRisk = risk_assessment.suicidal_ideation || risk_assessment.homicidal_ideation || risk_assessment.self_harm;
      console.log(`[tool:create_intake_note] Intake note proposed for encounter ${encounter_id} | risk_assessment: yes (${hasRisk ? 'FLAGGED' : 'no SI/HI/SH'}) | assumptions: ${assumptions_made.length}`);

      return {
        note_type: 'intake',
        status: 'proposed',
        assumptions_made,
        message: 'Intake assessment proposed. Provider must review and approve before it becomes part of the medical record.',
        _proposed_action: {
          action_type: 'create_note_draft',
          target_table: 'note_drafts',
          payload: {
            encounter_id,
            ai_run_id: runId,
            note_type: 'intake',
            content,
            risk_assessment,
            standardized_scores,
          },
        },
      };
    },
  });
}
