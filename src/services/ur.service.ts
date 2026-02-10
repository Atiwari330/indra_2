import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Client = SupabaseClient<Database>;

interface CreateUtilizationReviewInput {
  patient_id: string;
  ai_run_id?: string;
  review_type: 'initial' | 'concurrent' | 'retrospective';
  content: Record<string, unknown>;
}

export async function createUtilizationReview(
  client: Client,
  orgId: string,
  providerId: string,
  input: CreateUtilizationReviewInput,
) {
  // 1. Get patient demographics
  const { data: patient, error: patientErr } = await client
    .from('patients')
    .select('first_name, last_name, dob, gender')
    .eq('id', input.patient_id)
    .eq('org_id', orgId)
    .single();

  if (patientErr || !patient) {
    throw new Error(`Failed to load patient: ${patientErr?.message ?? 'not found'}`);
  }

  // 2. Get insurance + payer info
  const { data: insurance } = await client
    .from('patient_insurance')
    .select('*, insurance_payers(name, payer_id_number)')
    .eq('patient_id', input.patient_id)
    .eq('org_id', orgId)
    .eq('priority', 'primary')
    .single();

  // Build patient_demographics section (service-populated)
  const patientDemographics = {
    name: `${patient.first_name} ${patient.last_name}`,
    date_of_birth: patient.dob,
    gender: patient.gender,
  };

  // Build authorization_summary section (service-populated)
  const payer = insurance?.insurance_payers as { name: string; payer_id_number: string } | null;
  const authorizationSummary = insurance ? {
    payer_name: payer?.name ?? 'Unknown',
    payer_id: payer?.payer_id_number ?? null,
    member_id: insurance.member_id,
    group_number: insurance.group_number,
    authorization_number: insurance.authorization_number,
    sessions_authorized: insurance.authorized_sessions,
    sessions_used: insurance.sessions_used,
    sessions_remaining: (insurance.authorized_sessions ?? 0) - (insurance.sessions_used ?? 0),
    effective_date: insurance.effective_date,
    termination_date: insurance.termination_date,
  } : null;

  // 3. Merge service-populated data with AI-generated clinical sections
  const generatedContent = {
    patient_demographics: patientDemographics,
    authorization_summary: authorizationSummary,
    ...input.content,
  };

  // 4. Insert the utilization review
  const { data, error } = await client
    .from('utilization_reviews')
    .insert({
      patient_id: input.patient_id,
      provider_id: providerId,
      org_id: orgId,
      ai_run_id: input.ai_run_id ?? null,
      patient_insurance_id: insurance?.id ?? null,
      review_type: input.review_type,
      status: 'pending_review',
      authorization_period_start: insurance?.effective_date ?? null,
      authorization_period_end: insurance?.termination_date ?? null,
      sessions_authorized: insurance?.authorized_sessions ?? null,
      sessions_used: insurance?.sessions_used ?? null,
      sessions_requested: (input.content.continued_treatment_recommendation as { sessions_requested?: number })?.sessions_requested ?? null,
      generated_content: generatedContent,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create utilization review: ${error.message}`);
  return data;
}
