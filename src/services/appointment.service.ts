import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { CreateAppointmentInput } from '@/lib/schemas/appointment';

type Client = SupabaseClient<Database>;

export async function createAppointment(client: Client, orgId: string, input: CreateAppointmentInput) {
  const { data, error } = await client
    .from('appointments')
    .insert({
      patient_id: input.patient_id,
      provider_id: input.provider_id,
      start_time: input.start_time,
      end_time: input.end_time,
      appointment_type: input.appointment_type,
      notes: input.notes,
      recurring_rule: input.recurring_rule as Database['public']['Tables']['appointments']['Insert']['recurring_rule'],
      org_id: orgId,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create appointment: ${error.message}`);
  return data;
}

export async function getSchedule(
  client: Client,
  orgId: string,
  providerId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await client
    .from('appointments')
    .select('*, patients(first_name, last_name)')
    .eq('org_id', orgId)
    .eq('provider_id', providerId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`)
    .order('start_time');

  if (error) throw new Error(`Failed to get schedule: ${error.message}`);
  return data;
}

export async function checkAvailability(
  client: Client,
  orgId: string,
  providerId: string,
  startTime: string,
  durationMinutes: number
) {
  const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

  // Check for overlapping appointments
  const { data: conflicts, error } = await client
    .from('appointments')
    .select('id, start_time, end_time')
    .eq('org_id', orgId)
    .eq('provider_id', providerId)
    .eq('status', 'scheduled')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (error) throw new Error(`Failed to check availability: ${error.message}`);
  return { available: conflicts.length === 0, conflicts };
}
