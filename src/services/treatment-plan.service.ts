import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Client = SupabaseClient<Database>;

interface CreateTreatmentPlanInput {
  patient_id: string;
  ai_run_id?: string;
  diagnosis_codes: string[];
  goals: Array<{ goal: string; target_date?: string }>;
  objectives: Array<{ objective: string; frequency?: string }>;
  interventions: Array<{ intervention: string; frequency?: string }>;
  review_date: string;
}

export async function createTreatmentPlan(
  client: Client,
  orgId: string,
  providerId: string,
  input: CreateTreatmentPlanInput,
) {
  // 1. Check for existing current treatment plan for this patient
  const { data: existing } = await client
    .from('treatment_plans')
    .select('id, version')
    .eq('patient_id', input.patient_id)
    .eq('org_id', orgId)
    .eq('is_current', true)
    .maybeSingle();

  const newVersion = existing ? (existing.version ?? 1) + 1 : 1;

  // 2. If existing current plan, mark it as no longer current
  if (existing) {
    await client
      .from('treatment_plans')
      .update({ is_current: false })
      .eq('id', existing.id);
  }

  // 3. Insert new treatment plan
  const { data, error } = await client
    .from('treatment_plans')
    .insert({
      patient_id: input.patient_id,
      provider_id: providerId,
      org_id: orgId,
      ai_run_id: input.ai_run_id ?? null,
      diagnosis_codes: input.diagnosis_codes,
      goals: input.goals,
      objectives: input.objectives,
      interventions: input.interventions,
      review_date: input.review_date,
      status: 'active',
      version: newVersion,
      is_current: true,
      previous_version_id: existing?.id ?? null,
      signed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create treatment plan: ${error.message}`);
  return data;
}

export async function getTreatmentPlan(
  client: Client,
  orgId: string,
  planId: string,
) {
  const { data, error } = await client
    .from('treatment_plans')
    .select('*')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`Treatment plan not found: ${error?.message ?? 'not found'}`);
  }

  return data;
}
