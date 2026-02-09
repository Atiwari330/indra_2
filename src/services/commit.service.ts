import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import * as noteService from './note.service';
import * as encounterService from './encounter.service';
import * as appointmentService from './appointment.service';
import * as billingService from './billing.service';

type Client = SupabaseClient<Database>;

interface CommitResult {
  committed: number;
  results: Array<{
    actionId: string;
    actionType: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
}

/**
 * The trust boundary: AI proposed actions → clinical records.
 * All AI output goes through here before touching clinical tables.
 */
export async function commitActionGroup(
  client: Client,
  groupId: string,
  providerId: string,
  orgId: string
): Promise<CommitResult> {
  // Load all pending actions in this group, ordered by action_order
  const { data: actions, error } = await client
    .from('ai_proposed_actions')
    .select('*')
    .eq('action_group', groupId)
    .eq('status', 'pending')
    .order('action_order');

  if (error) throw new Error(`Failed to load actions: ${error.message}`);
  if (!actions || actions.length === 0) throw new Error('No pending actions in this group');

  const results: CommitResult['results'] = [];
  // Track cross-references (e.g., encounter_id created by a previous action)
  const refs: Record<string, string> = {};

  for (const action of actions) {
    const payload = (action.provider_modified_payload ?? action.payload) as Record<string, unknown>;

    // Resolve cross-references
    const resolvedPayload = resolveCrossRefs(payload, refs);

    try {
      const result = await executeAction(client, orgId, providerId, action.action_type, resolvedPayload);

      // Store the created ID for cross-references
      if (result && typeof result === 'object' && 'id' in result) {
        refs[`${action.action_type}_id`] = (result as { id: string }).id;
        // Also store by target table
        refs[`${action.target_table}_id`] = (result as { id: string }).id;
      }

      // Mark action as committed
      await client
        .from('ai_proposed_actions')
        .update({
          status: 'committed',
          committed_at: new Date().toISOString(),
          committed_by: providerId,
        })
        .eq('id', action.id);

      results.push({
        actionId: action.id,
        actionType: action.action_type,
        success: true,
        result,
      });
    } catch (err) {
      results.push({
        actionId: action.id,
        actionType: action.action_type,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      // Stop processing further actions on failure
      break;
    }
  }

  // Update the run status if all actions in the group's run were committed
  if (results.length > 0 && results.every((r) => r.success)) {
    const runId = actions[0].run_id;
    await client
      .from('ai_runs')
      .update({
        status: 'committed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
  }

  return {
    committed: results.filter((r) => r.success).length,
    results,
  };
}

export async function rejectAction(
  client: Client,
  actionId: string,
  userId: string,
  reason?: string
) {
  const { data, error } = await client
    .from('ai_proposed_actions')
    .update({ status: 'rejected' })
    .eq('id', actionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reject action: ${error.message}`);
  return data;
}

export async function rejectRun(
  client: Client,
  runId: string,
  userId: string,
  reason?: string
) {
  // Reject all pending actions in this run
  await client
    .from('ai_proposed_actions')
    .update({ status: 'rejected' })
    .eq('run_id', runId)
    .eq('status', 'pending');

  // Update run status
  const { data, error } = await client
    .from('ai_runs')
    .update({
      status: 'failed',
      error: reason ?? 'Rejected by provider',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reject run: ${error.message}`);
  return data;
}

function resolveCrossRefs(payload: Record<string, unknown>, refs: Record<string, string>): Record<string, unknown> {
  const resolved = { ...payload };
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === 'string' && value.startsWith('$ref:')) {
      const refKey = value.slice(5);
      if (refs[refKey]) {
        resolved[key] = refs[refKey];
      }
    }
  }
  return resolved;
}

function validateRequiredFields(
  payload: Record<string, unknown>,
  actionType: string,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((f) => payload[f] == null);
  if (missing.length > 0) {
    throw new Error(`${actionType}: missing required fields: ${missing.join(', ')}`);
  }
}

async function executeAction(
  client: Client,
  orgId: string,
  providerId: string,
  actionType: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  switch (actionType) {
    case 'create_encounter': {
      const result = await encounterService.resolveEncounter(
        client,
        orgId,
        payload.patient_id as string,
        providerId,
        payload.encounter_date as string,
        payload.encounter_type as Database['public']['Enums']['encounter_type'],
      );
      if (payload.duration_minutes && result.encounter.id) {
        await encounterService.updateEncounterStatus(
          client, orgId, result.encounter.id, 'completed', payload.duration_minutes as number
        );
      }
      return result.encounter;
    }

    case 'create_note_draft': {
      validateRequiredFields(payload, 'create_note_draft', ['encounter_id', 'note_type', 'content']);
      const draft = await noteService.createNoteDraft(client, orgId, {
        encounter_id: payload.encounter_id as string,
        ai_run_id: payload.ai_run_id as string | undefined,
        source_transcript: payload.source_transcript as string | undefined,
        note_type: payload.note_type as 'SOAP' | 'DAP' | 'BIRP' | 'intake' | 'discharge',
        generated_content: payload.content as { data: string; assessment: string; plan: string },
      });

      // Auto-accept: create a clinical_notes record so the note appears in the patient chart
      const encounterId = payload.encounter_id as string;
      const { data: encounter } = await client
        .from('encounters')
        .select('patient_id')
        .eq('id', encounterId)
        .single();

      if (encounter?.patient_id) {
        const clinicalNote = await noteService.acceptNoteDraft(
          client,
          orgId,
          draft.id,
          providerId,
          encounterId,
          encounter.patient_id,
        );
        return clinicalNote;
      }

      return draft;
    }

    case 'create_appointment': {
      validateRequiredFields(payload, 'create_appointment', ['patient_id', 'start_time', 'end_time']);
      return appointmentService.createAppointment(client, orgId, {
        patient_id: payload.patient_id as string,
        provider_id: providerId,
        start_time: payload.start_time as string,
        end_time: payload.end_time as string,
        appointment_type: payload.appointment_type as string | undefined,
        notes: payload.notes as string | undefined,
      });
    }

    case 'update_medication': {
      validateRequiredFields(payload, 'update_medication', ['patient_id', 'name', 'dosage', 'frequency']);
      // Discontinue old medication if specified
      if (payload.discontinue_medication_id) {
        await client
          .from('medications')
          .update({
            status: 'changed',
            end_date: new Date().toISOString().split('T')[0],
            change_reason: payload.change_reason as string ?? 'Updated via AI workflow',
          })
          .eq('id', payload.discontinue_medication_id as string);
      }

      // Create new medication record
      const { data, error } = await client
        .from('medications')
        .insert({
          patient_id: payload.patient_id as string,
          provider_id: providerId,
          org_id: orgId,
          name: payload.name as string,
          dosage: payload.dosage as string,
          frequency: payload.frequency as string,
          route: (payload.route as string) ?? 'oral',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create medication: ${error.message}`);
      return data;
    }

    case 'suggest_billing': {
      validateRequiredFields(payload, 'suggest_billing', ['encounter_id', 'patient_id', 'date_of_service', 'diagnoses', 'line_items']);
      return billingService.createClaim(client, orgId, {
        encounter_id: payload.encounter_id as string,
        patient_id: payload.patient_id as string,
        provider_id: providerId,
        patient_insurance_id: payload.patient_insurance_id as string | undefined,
        date_of_service: payload.date_of_service as string,
        place_of_service: (payload.place_of_service as string) ?? '11',
        diagnoses: payload.diagnoses as Array<{ sequence_number: number; icd10_code: string }>,
        line_items: payload.line_items as Array<{
          line_number: number;
          cpt_code: string;
          diagnosis_pointers: number[];
          units: number;
          charge_amount: number;
          service_date: string;
        }>,
      });
    }

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
