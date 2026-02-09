import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Client = SupabaseClient<Database>;

export async function getPatient(client: Client, orgId: string, patientId: string) {
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', patientId)
    .single();

  if (error) throw new Error(`Failed to get patient: ${error.message}`);
  return data;
}

export async function searchPatients(client: Client, orgId: string, query: string, limit = 10) {
  const terms = query.trim().split(/\s+/);

  let q = client
    .from('patients')
    .select('id, first_name, last_name, dob, status')
    .eq('org_id', orgId)
    .eq('status', 'active');

  if (terms.length >= 2) {
    q = q.or(`and(first_name.ilike.%${terms[0]}%,last_name.ilike.%${terms[1]}%),and(first_name.ilike.%${terms[1]}%,last_name.ilike.%${terms[0]}%)`);
  } else {
    q = q.or(`first_name.ilike.%${terms[0]}%,last_name.ilike.%${terms[0]}%`);
  }

  const { data, error } = await q.limit(limit);
  if (error) throw new Error(`Failed to search patients: ${error.message}`);
  return data;
}

export async function getPatientContext(client: Client, orgId: string, patientId: string) {
  const [patient, diagnoses, medications, recentNotes, treatmentPlan, upcomingAppointments, insurance, encounterHistory, assessmentScores] =
    await Promise.all([
      client
        .from('patients')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', patientId)
        .single(),
      client
        .from('patient_diagnoses')
        .select('*')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('is_primary', { ascending: false }),
      client
        .from('medications')
        .select('*')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .eq('status', 'active'),
      client
        .from('clinical_notes')
        .select('id, encounter_id, note_type, content, risk_assessment, signed_at, created_at')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(3),
      client
        .from('treatment_plans')
        .select('*')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .eq('is_current', true)
        .eq('status', 'active')
        .maybeSingle(),
      client
        .from('appointments')
        .select('*')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(5),
      client
        .from('patient_insurance')
        .select('*, insurance_payers(name)')
        .eq('org_id', orgId)
        .eq('patient_id', patientId),
      client
        .from('encounters')
        .select('id, encounter_date, encounter_type, status, duration_minutes')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('encounter_date', { ascending: false })
        .limit(10),
      client
        .from('assessment_scores')
        .select('*')
        .eq('org_id', orgId)
        .eq('patient_id', patientId)
        .order('administered_at', { ascending: false })
        .limit(20),
    ]);

  if (patient.error) throw new Error(`Failed to get patient: ${patient.error.message}`);

  console.log(`[context] Loaded context for ${patient.data.first_name} ${patient.data.last_name}: ${(diagnoses.data ?? []).length} diagnoses, ${(recentNotes.data ?? []).length} notes, ${(insurance.data ?? []).length} insurance, ${(encounterHistory.data ?? []).length} encounters, ${(assessmentScores.data ?? []).length} scores`);

  return {
    patient: patient.data,
    diagnoses: diagnoses.data ?? [],
    medications: medications.data ?? [],
    recentNotes: recentNotes.data ?? [],
    treatmentPlan: treatmentPlan.data,
    upcomingAppointments: upcomingAppointments.data ?? [],
    insurance: insurance.data ?? [],
    encounterHistory: encounterHistory.data ?? [],
    assessmentScores: assessmentScores.data ?? [],
  };
}
