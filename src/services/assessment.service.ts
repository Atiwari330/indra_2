import type { AdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/types/database';
import { deriveSeverity } from '@/lib/data/assessment-questions';

type Json = Database['public']['Tables']['assessment_requests']['Row']['responses'];

// ── Create ──────────────────────────────────────────────────────

type MeasureType = Database['public']['Enums']['assessment_measure_type'];

export async function createAssessmentRequest(
  client: AdminClient,
  patientId: string,
  providerId: string,
  orgId: string,
  measureType: string
) {
  const { data, error } = await client
    .from('assessment_requests')
    .insert({
      patient_id: patientId,
      provider_id: providerId,
      org_id: orgId,
      measure_type: measureType as MeasureType,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create assessment request: ${error.message}`);
  return data;
}

// ── Read (Provider) ─────────────────────────────────────────────

export async function getAssessmentRequests(
  client: AdminClient,
  patientId: string,
  orgId: string
) {
  const { data, error } = await client
    .from('assessment_requests')
    .select('*')
    .eq('patient_id', patientId)
    .eq('org_id', orgId)
    .order('requested_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch assessment requests: ${error.message}`);
  return data ?? [];
}

// ── Read (Portal) ───────────────────────────────────────────────

export async function getPendingPortalAssessments(
  client: AdminClient,
  patientId: string,
  orgId: string
) {
  const { data, error } = await client
    .from('assessment_requests')
    .select('*')
    .eq('patient_id', patientId)
    .eq('org_id', orgId)
    .in('status', ['pending', 'in_progress'])
    .order('requested_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch pending assessments: ${error.message}`);
  return data ?? [];
}

// ── Progress ────────────────────────────────────────────────────

export async function startAssessment(client: AdminClient, requestId: string) {
  const { error } = await client
    .from('assessment_requests')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw new Error(`Failed to start assessment: ${error.message}`);
}

export async function saveAssessmentProgress(
  client: AdminClient,
  requestId: string,
  responses: Array<{ question_index: number; answer_value: number }>
) {
  const { error } = await client
    .from('assessment_requests')
    .update({ responses: responses as unknown as Json })
    .eq('id', requestId);

  if (error) throw new Error(`Failed to save assessment progress: ${error.message}`);
}

// ── Submit ──────────────────────────────────────────────────────

export async function submitAssessment(
  client: AdminClient,
  requestId: string,
  responses: Array<{ question_index: number; answer_value: number }>
) {
  // Fetch the request to get measure_type, patient_id, org_id
  const { data: request, error: fetchError } = await client
    .from('assessment_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) throw new Error('Assessment request not found');

  const totalScore = responses.reduce((sum, r) => sum + r.answer_value, 0);
  const severity = deriveSeverity(request.measure_type, totalScore);

  // Update the assessment request
  const { error: updateError } = await client
    .from('assessment_requests')
    .update({
      status: 'completed',
      responses: responses as unknown as Json,
      total_score: totalScore,
      severity,
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw new Error(`Failed to submit assessment: ${updateError.message}`);

  // Also insert into assessment_scores for historical tracking
  const { error: scoreError } = await client
    .from('assessment_scores')
    .insert({
      patient_id: request.patient_id,
      org_id: request.org_id,
      measure_type: request.measure_type,
      score: totalScore,
      source: 'client_portal' as const,
    });

  if (scoreError) {
    console.error('[assessment] Failed to insert assessment score (non-fatal):', scoreError);
  }

  return { totalScore, severity };
}

// ── Notifications (Provider) ────────────────────────────────────

export async function markAssessmentViewed(client: AdminClient, requestId: string) {
  const { error } = await client
    .from('assessment_requests')
    .update({ provider_viewed_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw new Error(`Failed to mark assessment viewed: ${error.message}`);
}

export async function getUnviewedCompletedCount(
  client: AdminClient,
  providerId: string,
  orgId: string
): Promise<number> {
  const { count, error } = await client
    .from('assessment_requests')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .is('provider_viewed_at', null);

  if (error) throw new Error(`Failed to count unviewed assessments: ${error.message}`);
  return count ?? 0;
}

export async function getUnviewedCompleted(
  client: AdminClient,
  providerId: string,
  orgId: string
) {
  const { data, error } = await client
    .from('assessment_requests')
    .select(`
      id,
      measure_type,
      total_score,
      severity,
      completed_at,
      patient_id,
      patients!inner(first_name, last_name)
    `)
    .eq('provider_id', providerId)
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .is('provider_viewed_at', null)
    .order('completed_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch unviewed assessments: ${error.message}`);
  return data ?? [];
}

// ── Single request detail ───────────────────────────────────────

export async function getAssessmentById(client: AdminClient, requestId: string) {
  const { data, error } = await client
    .from('assessment_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) throw new Error(`Assessment request not found: ${error.message}`);
  return data;
}
