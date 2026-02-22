import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PatientDetail } from './patient-detail';
import { getIntakePacket } from '@/services/intake-packet.service';

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
  const [diagnosesRes, medicationsRes, notesRes, appointmentsRes, ursRes, treatmentPlanRes, intakeNoteRes, latestTranscriptionRes, milestonesRes, completedEncountersRes, assessmentRequestsRes] = await Promise.all([
    supabase
      .from('patient_diagnoses')
      .select('id, icd10_code, description, status, is_primary')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .in('status', ['active', 'pending_review'] as unknown as ('active' | 'resolved' | 'ruled_out')[])
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
      .select('id, note_type, content, status, created_at, signed_at')
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

    supabase
      .from('utilization_reviews')
      .select('id, review_type, status, sessions_requested, created_at')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('treatment_plans')
      .select('id, version, status, diagnosis_codes, goals, review_date, signed_at, created_at')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('is_current', true)
      .maybeSingle(),

    // Check if intake note exists
    supabase
      .from('clinical_notes')
      .select('id')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('note_type', 'intake')
      .eq('is_current', true)
      .limit(1),

    // Latest completed transcription session
    supabase
      .from('transcription_sessions')
      .select('id')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
      .limit(1),

    // Patient milestones (consent toggle)
    supabase
      .from('patient_milestones')
      .select('milestone_type, completed_at, completed_by')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('milestone_type', 'consent_intake_forms')
      .maybeSingle(),

    // Completed encounter count
    supabase
      .from('encounters')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .eq('status', 'completed'),

    supabase
      .from('assessment_requests')
      .select('id, measure_type, status, total_score, severity, requested_at, completed_at, responses')
      .eq('patient_id', id)
      .eq('org_id', DEV_ORG_ID)
      .order('requested_at', { ascending: false }),
  ]);

  // Fetch intake packet status (separate due to untyped table)
  let intakePacketStatus: string | null = null;
  try {
    const packet = await getIntakePacket(supabase, id, DEV_ORG_ID);
    intakePacketStatus = packet?.status ?? null;
  } catch {
    // Table may not exist yet if migration hasn't been pushed
  }

  return (
    <PatientDetail
      patient={patient}
      diagnoses={diagnosesRes.data ?? []}
      medications={medicationsRes.data ?? []}
      recentNotes={notesRes.data ?? []}
      upcomingAppointments={appointmentsRes.data ?? []}
      recentURs={ursRes.data ?? []}
      hasIntakeNote={(intakeNoteRes.data ?? []).length > 0}
      latestTranscriptionSessionId={latestTranscriptionRes.data?.[0]?.id ?? null}
      treatmentPlan={treatmentPlanRes.data ? {
        id: treatmentPlanRes.data.id,
        version: treatmentPlanRes.data.version,
        status: treatmentPlanRes.data.status,
        diagnosis_codes: (treatmentPlanRes.data.diagnosis_codes ?? []) as string[],
        goals: (treatmentPlanRes.data.goals ?? []) as Array<{ goal: string; target_date?: string }>,
        review_date: treatmentPlanRes.data.review_date ?? '',
        signed_at: treatmentPlanRes.data.signed_at,
        created_at: treatmentPlanRes.data.created_at,
      } : null}
      consentMilestone={milestonesRes.data ? {
        completed_at: milestonesRes.data.completed_at,
        completed_by: milestonesRes.data.completed_by,
      } : null}
      completedEncounterCount={completedEncountersRes.count ?? 0}
      assessmentRequests={(assessmentRequestsRes?.data ?? []).map((r) => ({
        ...r,
        responses: r.responses as unknown as Array<{ question_index: number; answer_value: number }> | null,
      }))}
      intakePacketStatus={intakePacketStatus}
    />
  );
}
