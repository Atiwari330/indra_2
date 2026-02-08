import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getPatientContext } from '@/services/patient.service';

type Client = SupabaseClient<Database>;

export async function loadPatientContextForPrompt(
  client: Client,
  orgId: string,
  patientId: string
): Promise<string> {
  const ctx = await getPatientContext(client, orgId, patientId);
  const p = ctx.patient;

  const lines: string[] = [];
  lines.push(`Patient: ${p.first_name} ${p.last_name} (DOB: ${p.dob}, ${p.gender ?? 'unknown gender'})`);
  lines.push(`Status: ${p.status}`);

  if (ctx.diagnoses.length > 0) {
    lines.push('\nActive Diagnoses:');
    for (const d of ctx.diagnoses) {
      lines.push(`  - ${d.icd10_code}: ${d.description}${d.is_primary ? ' (PRIMARY)' : ''}`);
    }
  }

  if (ctx.medications.length > 0) {
    lines.push('\nCurrent Medications:');
    for (const m of ctx.medications) {
      lines.push(`  - ${m.name} ${m.dosage} ${m.frequency}`);
    }
  }

  if (ctx.recentNotes.length > 0) {
    lines.push('\nRecent Notes (last 3):');
    for (const n of ctx.recentNotes) {
      const content = n.content as Record<string, string>;
      const summary = content.assessment || content.data || Object.values(content)[0] || '';
      const truncated = summary.length > 200 ? summary.slice(0, 200) + '...' : summary;
      lines.push(`  - ${n.created_at?.split('T')[0]} [${n.note_type}]: ${truncated}`);
    }
  }

  if (ctx.treatmentPlan) {
    const goals = ctx.treatmentPlan.goals as Array<{ goal: string }> | null;
    if (goals && goals.length > 0) {
      lines.push('\nTreatment Plan Goals:');
      for (const g of goals) {
        lines.push(`  - ${g.goal}`);
      }
    }
  }

  if (ctx.upcomingAppointments.length > 0) {
    lines.push('\nUpcoming Appointments:');
    for (const a of ctx.upcomingAppointments) {
      lines.push(`  - ${a.start_time} (${a.appointment_type ?? 'appointment'})`);
    }
  }

  return lines.join('\n');
}

export async function loadEncounterContextForPrompt(
  client: Client,
  orgId: string,
  encounterId: string
): Promise<string> {
  const { data: encounter, error } = await client
    .from('encounters')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', encounterId)
    .single();

  if (error || !encounter) return '';

  return `Encounter: ${encounter.encounter_date} | Type: ${encounter.encounter_type} | Duration: ${encounter.duration_minutes ?? 'unknown'} min | Status: ${encounter.status}`;
}
