import { tool } from 'ai';
import { z } from 'zod';

const SOAPContent = z.object({
  subjective: z.string().describe('What the patient reports — symptoms, concerns, progress'),
  objective: z.string().describe('Observable data — appearance, behavior, test scores, vitals'),
  assessment: z.string().describe('Clinical assessment — diagnosis status, progress, severity'),
  plan: z.string().describe('Treatment plan — next steps, interventions, follow-up'),
});

export function createProgressNoteTool(
  runId: string
) {
  return tool({
    description: 'Generate a structured SOAP progress note based on the provider\'s session description. The note will be saved as a draft for provider review, NOT directly to the medical record.',
    inputSchema: z.object({
      encounter_id: z.string().describe('Encounter UUID from resolve_encounter'),
      content: SOAPContent.describe('Structured SOAP note content'),
      risk_assessment: z.object({
        suicidal_ideation: z.boolean().default(false),
        homicidal_ideation: z.boolean().default(false),
        self_harm: z.boolean().default(false),
        details: z.string().optional(),
      }).optional().describe('Risk assessment if applicable'),
      assumptions_made: z.array(z.string()).describe('List of assumptions made when generating this note. Be transparent about what was inferred vs explicitly stated by the provider.'),
      session_duration_minutes: z.number().optional().describe('Session duration in minutes'),
    }),
    execute: async ({ encounter_id, content, assumptions_made, session_duration_minutes }) => {
      return {
        note_type: 'SOAP',
        status: 'proposed',
        assumptions_made,
        session_duration_minutes,
        message: 'Progress note proposed. Provider must review and approve before it becomes part of the medical record.',
        _proposed_action: {
          action_type: 'create_note_draft',
          target_table: 'note_drafts',
          payload: {
            encounter_id,
            ai_run_id: runId,
            note_type: 'SOAP',
            content,
          },
        },
      };
    },
  });
}
