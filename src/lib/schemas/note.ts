import { z } from 'zod';

export const NoteType = z.enum(['SOAP', 'DAP', 'BIRP', 'intake', 'discharge']);
export const NoteStatus = z.enum(['draft', 'signed', 'amended', 'addended']);

const SOAPContent = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

const DAPContent = z.object({
  data: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

const BIRPContent = z.object({
  behavior: z.string(),
  intervention: z.string(),
  response: z.string(),
  plan: z.string(),
});

export const NoteContent = z.union([SOAPContent, DAPContent, BIRPContent]);
export type NoteContent = z.infer<typeof NoteContent>;

export const RiskAssessment = z.object({
  suicidal_ideation: z.boolean().default(false),
  homicidal_ideation: z.boolean().default(false),
  self_harm: z.boolean().default(false),
  details: z.string().optional(),
});

export const CreateNoteDraftInput = z.object({
  encounter_id: z.string().uuid().optional(),
  ai_run_id: z.string().uuid().optional(),
  source_transcript: z.string().optional(),
  note_type: NoteType,
  generated_content: NoteContent,
});
export type CreateNoteDraftInput = z.infer<typeof CreateNoteDraftInput>;

export const AcceptNoteDraftInput = z.object({
  draft_id: z.string().uuid(),
  provider_edits: NoteContent.optional(),
});
export type AcceptNoteDraftInput = z.infer<typeof AcceptNoteDraftInput>;

export const SignNoteInput = z.object({
  note_id: z.string().uuid(),
  provider_id: z.string().uuid(),
});

export const AmendNoteInput = z.object({
  note_id: z.string().uuid(),
  content: NoteContent,
  reason: z.string().min(1),
  provider_id: z.string().uuid(),
});
export type AmendNoteInput = z.infer<typeof AmendNoteInput>;
