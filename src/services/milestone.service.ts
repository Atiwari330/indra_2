import type { SupabaseClient } from '@supabase/supabase-js';

export interface PatientMilestone {
  id: string;
  patient_id: string;
  org_id: string;
  milestone_type: string;
  completed_at: string;
  completed_by: string;
  created_at: string;
}

export async function getPatientMilestones(
  client: SupabaseClient,
  orgId: string,
  patientId: string
): Promise<PatientMilestone[]> {
  const { data, error } = await client
    .from('patient_milestones')
    .select('*')
    .eq('patient_id', patientId)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to fetch milestones: ${error.message}`);
  return data ?? [];
}

export async function toggleConsentMilestone(
  client: SupabaseClient,
  orgId: string,
  patientId: string,
  providerId: string,
  completed: boolean
): Promise<void> {
  if (completed) {
    const { error } = await client.from('patient_milestones').insert({
      patient_id: patientId,
      org_id: orgId,
      milestone_type: 'consent_intake_forms',
      completed_by: providerId,
    });
    if (error) throw new Error(`Failed to create milestone: ${error.message}`);
  } else {
    const { error } = await client
      .from('patient_milestones')
      .delete()
      .eq('patient_id', patientId)
      .eq('org_id', orgId)
      .eq('milestone_type', 'consent_intake_forms');
    if (error) throw new Error(`Failed to delete milestone: ${error.message}`);
  }
}
