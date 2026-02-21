import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import * as noteService from './note.service';
import * as encounterService from './encounter.service';
import * as appointmentService from './appointment.service';
import * as billingService from './billing.service';
import * as urService from './ur.service';
import * as treatmentPlanService from './treatment-plan.service';

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
  orgId: string,
  patientId?: string | null
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
    console.log(`[commit.service] Executing action ${action.id} | type: ${action.action_type} | table: ${action.target_table} | payload keys: ${Object.keys(payload).join(', ')}`);

    // Resolve cross-references
    const resolvedPayload = resolveCrossRefs(payload, refs);

    try {
      const result = await executeAction(client, orgId, providerId, action.action_type, resolvedPayload, patientId);
      console.log(`[commit.service] Action ${action.action_type} SUCCESS | result id: ${result && typeof result === 'object' && 'id' in result ? (result as { id: string }).id : 'none'}`);

      // Store the created ID for cross-references
      if (result && typeof result === 'object' && 'id' in result) {
        refs[`${action.action_type}_id`] = (result as { id: string }).id;
        // Also store by target table
        refs[`${action.target_table}_id`] = (result as { id: string }).id;
      }

      // Mark action as committed
      const { error: updateError } = await client
        .from('ai_proposed_actions')
        .update({
          status: 'committed',
          committed_at: new Date().toISOString(),
          committed_by: providerId,
        })
        .eq('id', action.id);

      if (updateError) {
        console.error(`[commit.service] Failed to mark action ${action.id} as committed:`, updateError.message);
      }

      results.push({
        actionId: action.id,
        actionType: action.action_type,
        success: true,
        result,
      });
    } catch (err) {
      console.error(`[commit.service] Action ${action.action_type} FAILED:`, err instanceof Error ? err.message : err);
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
  const allSuccess = results.length > 0 && results.every((r) => r.success);
  console.log(`[commit.service] All actions done | count: ${results.length} | allSuccess: ${allSuccess}`);

  if (allSuccess) {
    const runId = actions[0].run_id;
    const { error: runUpdateError } = await client
      .from('ai_runs')
      .update({
        status: 'committed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (runUpdateError) {
      console.error(`[commit.service] Failed to update run ${runId} to committed:`, runUpdateError.message);
    } else {
      console.log(`[commit.service] Run ${runId} → committed`);
    }
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
  payload: Record<string, unknown>,
  runPatientId?: string | null
): Promise<unknown> {
  // Ensure patient_id is present — prefer payload, fall back to the run's patient_id
  const effectivePatientId = (payload.patient_id as string) ?? runPatientId;

  switch (actionType) {
    case 'create_encounter': {
      if (!effectivePatientId) throw new Error('create_encounter: missing patient_id');
      const result = await encounterService.resolveEncounter(
        client,
        orgId,
        effectivePatientId,
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
          undefined,
          payload.risk_assessment as Record<string, unknown> | undefined,
        );

        // Write standardized assessment scores if present
        const scores = payload.standardized_scores as Array<{ measure_type: string; score: number }> | undefined;
        if (scores && scores.length > 0) {
          try {
            await client
              .from('assessment_scores')
              .insert(
                scores.map(s => ({
                  encounter_id: encounterId,
                  patient_id: encounter.patient_id,
                  org_id: orgId,
                  measure_type: s.measure_type as Database['public']['Enums']['assessment_measure_type'],
                  score: s.score,
                  source: 'ai_tool' as Database['public']['Enums']['assessment_score_source'],
                }))
              );
          } catch (scoreErr) {
            console.error('[commit] Failed to insert assessment scores (non-fatal):', scoreErr);
          }
        }

        return clinicalNote;
      }

      return draft;
    }

    case 'create_appointment': {
      const apptPatientId = effectivePatientId;
      if (!apptPatientId) throw new Error('create_appointment: missing patient_id');
      validateRequiredFields(payload, 'create_appointment', ['start_time', 'end_time']);
      return appointmentService.createAppointment(client, orgId, {
        patient_id: apptPatientId,
        provider_id: providerId,
        start_time: payload.start_time as string,
        end_time: payload.end_time as string,
        appointment_type: payload.appointment_type as string | undefined,
        notes: payload.notes as string | undefined,
      });
    }

    case 'update_medication': {
      const medPatientId = effectivePatientId;
      if (!medPatientId) throw new Error('update_medication: missing patient_id');
      validateRequiredFields(payload, 'update_medication', ['name', 'dosage', 'frequency']);
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
          patient_id: medPatientId,
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
      const billingPatientId = effectivePatientId;
      if (!billingPatientId) throw new Error('suggest_billing: missing patient_id');
      validateRequiredFields(payload, 'suggest_billing', ['encounter_id', 'date_of_service', 'diagnoses', 'line_items']);
      return billingService.createClaim(client, orgId, {
        encounter_id: payload.encounter_id as string,
        patient_id: billingPatientId,
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

    case 'generate_utilization_review': {
      const urPatientId = effectivePatientId;
      if (!urPatientId) throw new Error('generate_utilization_review: missing patient_id');
      validateRequiredFields(payload, 'generate_utilization_review', ['content']);
      return urService.createUtilizationReview(client, orgId, providerId, {
        patient_id: urPatientId,
        ai_run_id: payload.ai_run_id as string | undefined,
        review_type: (payload.review_type as 'initial' | 'concurrent' | 'retrospective') ?? 'concurrent',
        content: payload.content as Record<string, unknown>,
      });
    }

    case 'create_treatment_plan': {
      const tpPatientId = effectivePatientId;
      if (!tpPatientId) throw new Error('create_treatment_plan: missing patient_id');
      validateRequiredFields(payload, 'create_treatment_plan', [
        'diagnosis_codes', 'goals', 'objectives', 'interventions', 'review_date',
      ]);
      return treatmentPlanService.createTreatmentPlan(client, orgId, providerId, {
        patient_id: tpPatientId,
        ai_run_id: payload.ai_run_id as string | undefined,
        diagnosis_codes: payload.diagnosis_codes as string[],
        goals: payload.goals as Array<{ goal: string; target_date?: string }>,
        objectives: payload.objectives as Array<{ objective: string; frequency?: string }>,
        interventions: payload.interventions as Array<{ intervention: string; frequency?: string }>,
        review_date: payload.review_date as string,
      });
    }

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
