import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PatientDetail } from './patient-detail';

export const dynamic = 'force-dynamic';

const DEV_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch patient
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, dob, status, email, phone, gender')
    .eq('id', id)
    .eq('org_id', DEV_ORG_ID)
    .single();

  if (patientError || !patient) {
    notFound();
  }

  // Fetch related data in parallel
  const [diagnosesRes, medicationsRes, notesRes, appointmentsRes] = await Promise.all([
    supabase
      .from('patient_diagnoses')
      .select('id, icd10_code, description, status, is_primary')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('status', 'active')
      .order('is_primary', { ascending: false }),

    supabase
      .from('medications')
      .select('id, name, dosage, frequency, status')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('status', 'active')
      .order('name'),

    supabase
      .from('clinical_notes')
      .select('id, note_type, status, created_at')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('appointments')
      .select('id, start_time, end_time, appointment_type, status')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(3),
  ]);

  return (
    <PatientDetail
      patient={patient}
      diagnoses={diagnosesRes.data ?? []}
      medications={medicationsRes.data ?? []}
      recentNotes={notesRes.data ?? []}
      upcomingAppointments={appointmentsRes.data ?? []}
    />
  );
}
