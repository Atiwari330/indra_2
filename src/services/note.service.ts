import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { CreateNoteDraftInput, AmendNoteInput, NoteContent } from '@/lib/schemas/note';
import { createHash } from 'crypto';

type Client = SupabaseClient<Database>;

export async function createNoteDraft(client: Client, orgId: string, input: CreateNoteDraftInput) {
  const { data, error } = await client
    .from('note_drafts')
    .insert({
      org_id: orgId,
      encounter_id: input.encounter_id,
      ai_run_id: input.ai_run_id,
      source_transcript: input.source_transcript,
      note_type: input.note_type,
      generated_content: input.generated_content as unknown as Database['public']['Tables']['note_drafts']['Insert']['generated_content'],
      status: 'pending_review',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create note draft: ${error.message}`);
  return data;
}

export async function acceptNoteDraft(
  client: Client,
  orgId: string,
  draftId: string,
  providerId: string,
  encounterId: string,
  patientId: string,
  providerEdits?: NoteContent,
  riskAssessment?: Record<string, unknown>
) {
  // Get the draft
  const { data: draft, error: draftError } = await client
    .from('note_drafts')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', draftId)
    .single();

  if (draftError) throw new Error(`Failed to get draft: ${draftError.message}`);
  if (draft.status !== 'pending_review') throw new Error('Draft is not pending review');

  const content = providerEdits ?? draft.generated_content;

  // Create clinical note from draft
  const { data: note, error: noteError } = await client
    .from('clinical_notes')
    .insert({
      encounter_id: encounterId,
      patient_id: patientId,
      provider_id: providerId,
      org_id: orgId,
      note_type: draft.note_type,
      content: content as unknown as Database['public']['Tables']['clinical_notes']['Insert']['content'],
      risk_assessment: riskAssessment
        ? (riskAssessment as unknown as Database['public']['Tables']['clinical_notes']['Insert']['risk_assessment'])
        : undefined,
      status: 'draft',
    })
    .select()
    .single();

  if (noteError) throw new Error(`Failed to create clinical note: ${noteError.message}`);

  // Mark draft as accepted
  await client
    .from('note_drafts')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      provider_edits: providerEdits
        ? (providerEdits as unknown as Database['public']['Tables']['note_drafts']['Update']['provider_edits'])
        : undefined,
    })
    .eq('id', draftId);

  return note;
}

export async function signNote(client: Client, orgId: string, noteId: string, providerId: string) {
  // Get the note to verify it's a draft
  const { data: note, error: noteError } = await client
    .from('clinical_notes')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', noteId)
    .single();

  if (noteError) throw new Error(`Failed to get note: ${noteError.message}`);
  if (note.status !== 'draft') throw new Error(`Cannot sign note with status: ${note.status}`);

  const contentHash = createHash('sha256')
    .update(JSON.stringify(note.content))
    .digest('hex');

  // Update note status
  const { data: signed, error: signError } = await client
    .from('clinical_notes')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_by: providerId,
    })
    .eq('id', noteId)
    .select()
    .single();

  if (signError) throw new Error(`Failed to sign note: ${signError.message}`);

  // Create signature record
  const { error: sigError } = await client
    .from('note_signatures')
    .insert({
      clinical_note_id: noteId,
      signer_id: providerId,
      signature_type: 'author',
      content_hash: contentHash,
    });

  if (sigError) throw new Error(`Failed to create signature: ${sigError.message}`);

  return signed;
}

export async function amendNote(client: Client, orgId: string, input: AmendNoteInput) {
  // Get current note
  const { data: current, error: currentError } = await client
    .from('clinical_notes')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', input.note_id)
    .single();

  if (currentError) throw new Error(`Failed to get note: ${currentError.message}`);
  if (current.status !== 'signed') throw new Error('Can only amend signed notes');

  // Mark current as not current
  await client
    .from('clinical_notes')
    .update({ is_current: false, status: 'amended' })
    .eq('id', input.note_id);

  // Create new version
  const { data: amended, error: amendError } = await client
    .from('clinical_notes')
    .insert({
      encounter_id: current.encounter_id,
      patient_id: current.patient_id,
      provider_id: input.provider_id,
      org_id: orgId,
      note_type: current.note_type,
      version: current.version + 1,
      is_current: true,
      status: 'draft',
      content: input.content as unknown as Database['public']['Tables']['clinical_notes']['Insert']['content'],
      amendment_reason: input.reason,
      previous_version_id: current.id,
    })
    .select()
    .single();

  if (amendError) throw new Error(`Failed to amend note: ${amendError.message}`);
  return amended;
}

export async function getNoteHistory(client: Client, orgId: string, encounterId: string) {
  const { data, error } = await client
    .from('clinical_notes')
    .select('*')
    .eq('org_id', orgId)
    .eq('encounter_id', encounterId)
    .order('version', { ascending: true });

  if (error) throw new Error(`Failed to get note history: ${error.message}`);
  return data;
}
