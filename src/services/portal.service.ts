import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Client = SupabaseClient<Database>;

// ============================================================
// Patient Profile (filtered — no clinical codes)
// ============================================================

export async function getPortalPatient(client: Client, orgId: string, patientId: string) {
  const { data, error } = await client
    .from('patients')
    .select('id, first_name, last_name, dob, status')
    .eq('org_id', orgId)
    .eq('id', patientId)
    .single();

  if (error) throw new Error(`Failed to get patient profile: ${error.message}`);
  return data;
}

/**
 * Get the primary provider for a patient.
 * Looks up the most recent appointment's provider, joining through users for names.
 */
export async function getPatientProvider(client: Client, orgId: string, patientId: string) {
  const { data } = await client
    .from('appointments')
    .select('provider_id, providers(id, credentials, specialty, users(first_name, last_name))')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.providers) return null;

  const p = data.providers as { id: string; credentials: string | null; specialty: string | null; users: { first_name: string; last_name: string } | null };
  return {
    id: p.id,
    first_name: p.users?.first_name ?? '',
    last_name: p.users?.last_name ?? '',
    credentials: p.credentials,
    specialty: p.specialty,
  };
}

// ============================================================
// Upcoming Appointments (filtered — no provider notes)
// ============================================================

export async function getUpcomingAppointments(
  client: Client,
  orgId: string,
  patientId: string,
  limit = 5
) {
  const { data, error } = await client
    .from('appointments')
    .select('id, start_time, end_time, appointment_type, status, provider_id, providers(credentials, users(first_name, last_name))')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .eq('status', 'scheduled')
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(limit);

  if (error) throw new Error(`Failed to get appointments: ${error.message}`);

  // Flatten the nested provider/user structure for the frontend
  return (data ?? []).map((apt) => {
    const prov = apt.providers as { credentials: string | null; users: { first_name: string; last_name: string } | null } | null;
    return {
      id: apt.id,
      start_time: apt.start_time,
      end_time: apt.end_time,
      appointment_type: apt.appointment_type,
      status: apt.status,
      provider: prov ? {
        first_name: prov.users?.first_name ?? '',
        last_name: prov.users?.last_name ?? '',
        credentials: prov.credentials,
      } : null,
    };
  });
}

// ============================================================
// Mood Check-ins
// ============================================================

export async function getMoodHistory(
  client: Client,
  orgId: string,
  patientId: string,
  limit = 30
) {
  const { data, error } = await client
    .from('mood_checkins')
    .select('id, mood, note, checked_in_at')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('checked_in_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get mood history: ${error.message}`);
  return data;
}

export async function getTodayMood(client: Client, orgId: string, patientId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await client
    .from('mood_checkins')
    .select('id, mood, note, checked_in_at')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .gte('checked_in_at', todayStart.toISOString())
    .order('checked_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to get today mood: ${error.message}`);
  return data;
}

export async function createMoodCheckin(
  client: Client,
  orgId: string,
  patientId: string,
  mood: string,
  note?: string
) {
  const { data, error } = await client
    .from('mood_checkins')
    .insert({
      patient_id: patientId,
      org_id: orgId,
      mood: mood as Database['public']['Enums']['mood_level'],
      note: note || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create mood check-in: ${error.message}`);
  return data;
}

// ============================================================
// Wellness Snapshot (filtered — patient-friendly labels only)
// ============================================================

const MEASURE_LABELS: Record<string, string> = {
  'PHQ-9': 'Depression Score',
  'GAD-7': 'Anxiety Score',
  'PCL-5': 'Trauma Score',
  'AUDIT-C': 'Alcohol Use Score',
  'CSSRS': 'Safety Screen',
};

/** Derive severity from score and measure type */
function deriveSeverity(measure: string, score: number): string {
  if (measure === 'PHQ-9') {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Moderately Severe';
    return 'Severe';
  }
  if (measure === 'GAD-7') {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
  }
  if (measure === 'PCL-5') {
    if (score < 31) return 'Below threshold';
    return 'Above threshold';
  }
  if (measure === 'AUDIT-C') {
    if (score <= 2) return 'Low risk';
    if (score <= 7) return 'Moderate risk';
    return 'High risk';
  }
  return '';
}

export async function getWellnessSnapshot(client: Client, orgId: string, patientId: string) {
  const { data, error } = await client
    .from('assessment_scores')
    .select('id, measure_type, score, administered_at')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('administered_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Failed to get wellness data: ${error.message}`);

  // Deduplicate: keep only the latest per measure
  const latestByMeasure = new Map<string, typeof data[number]>();
  for (const score of data) {
    if (!latestByMeasure.has(score.measure_type)) {
      latestByMeasure.set(score.measure_type, score);
    }
  }

  return Array.from(latestByMeasure.values()).map((s) => ({
    id: s.id,
    measure: MEASURE_LABELS[s.measure_type] ?? s.measure_type,
    score: s.score,
    severity: deriveSeverity(s.measure_type, s.score),
    date: s.administered_at,
  }));
}
