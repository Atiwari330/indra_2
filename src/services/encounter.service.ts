import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { CreateEncounterInput } from '@/lib/schemas/encounter';

type Client = SupabaseClient<Database>;

export async function createEncounter(client: Client, orgId: string, input: CreateEncounterInput) {
  const { data, error } = await client
    .from('encounters')
    .insert({
      ...input,
      org_id: orgId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create encounter: ${error.message}`);
  return data;
}

export async function getEncounter(client: Client, orgId: string, encounterId: string) {
  const { data, error } = await client
    .from('encounters')
    .select('*, patients(first_name, last_name), providers(credentials, users(first_name, last_name))')
    .eq('org_id', orgId)
    .eq('id', encounterId)
    .single();

  if (error) throw new Error(`Failed to get encounter: ${error.message}`);
  return data;
}

export async function resolveEncounter(
  client: Client,
  orgId: string,
  patientId: string,
  providerId: string,
  date: string,
  encounterType: Database['public']['Enums']['encounter_type'] = 'individual_therapy'
) {
  // Look for an existing encounter for this patient+provider on this date
  const { data: existing } = await client
    .from('encounters')
    .select('*')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .eq('provider_id', providerId)
    .eq('encounter_date', date)
    .in('status', ['scheduled', 'in_progress', 'completed'])
    .limit(1)
    .maybeSingle();

  if (existing) return { encounter: existing, created: false };

  // Create new encounter
  const { data: created, error } = await client
    .from('encounters')
    .insert({
      patient_id: patientId,
      provider_id: providerId,
      org_id: orgId,
      encounter_date: date,
      encounter_type: encounterType,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create encounter: ${error.message}`);
  return { encounter: created, created: true };
}

export async function updateEncounterStatus(
  client: Client,
  orgId: string,
  encounterId: string,
  status: Database['public']['Enums']['encounter_status'],
  durationMinutes?: number
) {
  const update: Record<string, unknown> = { status };
  if (durationMinutes !== undefined) update.duration_minutes = durationMinutes;

  const { data, error } = await client
    .from('encounters')
    .update(update)
    .eq('org_id', orgId)
    .eq('id', encounterId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update encounter: ${error.message}`);
  return data;
}
