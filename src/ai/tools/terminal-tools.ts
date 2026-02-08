import { tool } from 'ai';
import { z } from 'zod';

export function createAskClarificationTool() {
  return tool({
    description: 'Ask the provider for clarification when information is missing or ambiguous. This pauses the workflow until the provider responds.',
    inputSchema: z.object({
      questions: z.array(z.object({
        question: z.string().describe('The question to ask'),
        context: z.string().optional().describe('Why this question is needed'),
        options: z.array(z.string()).optional().describe('Suggested answer options if applicable'),
      })).describe('Questions to ask the provider'),
    }),
  });
}

export function createSubmitResultsTool() {
  return tool({
    description: 'Complete the workflow and submit results. Call this ALWAYS as the final step — for action workflows include proposed_actions, for informational queries use an empty array and put the answer in the summary.',
    inputSchema: z.object({
      summary: z.string().describe('Human-readable summary of all proposed actions'),
      proposed_actions: z.array(z.object({
        action_type: z.enum([
          'create_note_draft', 'create_encounter', 'suggest_billing',
          'update_medication', 'create_appointment',
        ]),
        description: z.string().describe('Description of this action'),
        target_table: z.string().describe('Database table this action targets'),
        payload: z.record(z.string(), z.unknown()).describe('Full payload for this action'),
        confidence: z.number().min(0).max(1).describe('Confidence score'),
        assumptions: z.array(z.string()).optional().describe('Assumptions made'),
      })).describe('All proposed actions for provider review'),
    }),
  });
}
