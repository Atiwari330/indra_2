import { z } from 'zod';

export const IntentInput = z.object({
  text: z.string().min(1).max(10000),
  patient_id: z.string().uuid().optional(),
  encounter_id: z.string().uuid().optional(),
  idempotency_key: z.string().optional(),
});
export type IntentInput = z.infer<typeof IntentInput>;

export const IntentClassification = z.object({
  intent_type: z.enum([
    'create_progress_note',
    'schedule_appointment',
    'query_patient_info',
    'update_medication',
    'general_query',
  ]),
  patient_name: z.string().optional(),
  encounter_date: z.string().optional(),
  confidence: z.number().min(0).max(1),
});
export type IntentClassification = z.infer<typeof IntentClassification>;

export const ClarificationResponse = z.object({
  answer: z.string().min(1),
});
export type ClarificationResponse = z.infer<typeof ClarificationResponse>;

export const RunActionType = z.enum([
  'create_note_draft',
  'create_encounter',
  'suggest_billing',
  'update_medication',
  'create_appointment',
]);

export const ProposedAction = z.object({
  action_type: RunActionType,
  action_order: z.number().int(),
  target_table: z.string(),
  payload: z.record(z.string(), z.unknown()),
  confidence_score: z.number().min(0).max(1).optional(),
  assumptions: z.array(z.string()).optional(),
  requires_review: z.boolean().default(true),
});
export type ProposedAction = z.infer<typeof ProposedAction>;
