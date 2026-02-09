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

  // Diagnoses with onset dates
  if (ctx.diagnoses.length > 0) {
    lines.push('\nActive Diagnoses:');
    for (const d of ctx.diagnoses) {
      const onset = d.onset_date ? ` (onset: ${d.onset_date})` : '';
      lines.push(`  - ${d.icd10_code}: ${d.description}${d.is_primary ? ' (PRIMARY)' : ''}${onset}`);
    }
  }

  if (ctx.medications.length > 0) {
    lines.push('\nCurrent Medications:');
    for (const m of ctx.medications) {
      lines.push(`  - ${m.name} ${m.dosage} ${m.frequency}`);
    }
  }

  // Recent notes — structured clinical signals, not full content
  if (ctx.recentNotes.length > 0) {
    lines.push('\nRecent Notes (structured signals):');
    for (let i = 0; i < ctx.recentNotes.length; i++) {
      const n = ctx.recentNotes[i];
      const content = n.content as Record<string, string> | null;
      const planSection = content?.plan ?? null;
      const riskAssessment = n.risk_assessment as Record<string, unknown> | null;

      lines.push(`  [${n.created_at?.split('T')[0]} ${n.note_type}]`);

      // First note: clinical observations + assessment + plan + risk
      if (i === 0 && content) {
        // Clinical observations: DAP uses 'data', SOAP uses 'subjective' + 'objective'
        const observations = content.data ?? content.subjective ?? null;
        const objective = content.objective ?? null;
        if (observations) {
          lines.push(`    Clinical observations: ${observations.length > 400 ? observations.slice(0, 400) + '...' : observations}`);
        }
        if (objective) {
          lines.push(`    Objective: ${objective.length > 300 ? objective.slice(0, 300) + '...' : objective}`);
        }
        if (content.assessment) {
          lines.push(`    Assessment: ${content.assessment.length > 300 ? content.assessment.slice(0, 300) + '...' : content.assessment}`);
        }
        if (planSection) lines.push(`    Last session plan: ${planSection}`);
      } else {
        // 2nd/3rd notes: plan section only
        if (planSection) lines.push(`    Plan: ${planSection.length > 200 ? planSection.slice(0, 200) + '...' : planSection}`);
      }

      // Risk flags for all notes
      if (riskAssessment) {
        const flags: string[] = [];
        if (riskAssessment.suicidal_ideation) flags.push('SI');
        if (riskAssessment.homicidal_ideation) flags.push('HI');
        if (riskAssessment.self_harm) flags.push('SH');
        lines.push(`    Risk: ${flags.length > 0 ? flags.join(', ') : 'Denied SI/HI/SH'}`);
      }
    }
  }

  // Treatment plan — full structure
  if (ctx.treatmentPlan) {
    lines.push('\nTreatment Plan:');
    if (ctx.treatmentPlan.review_date) {
      lines.push(`  Review date: ${ctx.treatmentPlan.review_date}`);
    }
    const diagCodes = ctx.treatmentPlan.diagnosis_codes;
    if (Array.isArray(diagCodes) && diagCodes.length > 0) {
      lines.push(`  Diagnosis codes: ${diagCodes.join(', ')}`);
    }

    const goals = ctx.treatmentPlan.goals as Array<{ goal: string; target_date?: string }> | null;
    if (Array.isArray(goals) && goals.length > 0) {
      lines.push('  Goals:');
      for (const g of goals) {
        const target = g.target_date ? ` (target: ${g.target_date})` : '';
        lines.push(`    - ${g.goal}${target}`);
      }
    }

    const objectives = ctx.treatmentPlan.objectives as Array<{ objective: string; frequency?: string }> | null;
    if (Array.isArray(objectives) && objectives.length > 0) {
      lines.push('  Objectives:');
      for (const o of objectives) {
        const freq = o.frequency ? ` [${o.frequency}]` : '';
        lines.push(`    - ${o.objective}${freq}`);
      }
    }

    const interventions = ctx.treatmentPlan.interventions as Array<{ intervention: string; frequency?: string }> | null;
    if (Array.isArray(interventions) && interventions.length > 0) {
      lines.push('  Interventions:');
      for (const iv of interventions) {
        const freq = iv.frequency ? ` [${iv.frequency}]` : '';
        lines.push(`    - ${iv.intervention}${freq}`);
      }
    }
  }

  // Authorization status
  if (ctx.insurance.length > 0) {
    lines.push('\nAuthorization Status:');
    for (const ins of ctx.insurance) {
      const payer = (ins.insurance_payers as { name: string } | null)?.name ?? 'Unknown payer';
      const authorized = ins.authorized_sessions ?? 0;
      const used = ins.sessions_used ?? 0;
      const remaining = authorized - used;
      lines.push(`  - ${payer} (${ins.priority}): ${used}/${authorized} sessions used, ${remaining} remaining`);
      if (ins.copay_amount != null) {
        lines.push(`    Copay: $${ins.copay_amount}`);
      }
      if (remaining > 0 && remaining <= 4) {
        lines.push(`    ⚠ LOW AUTHORIZATION: Only ${remaining} sessions remaining — strengthen medical necessity documentation`);
      }
    }
  }

  // Recent session dates
  if (ctx.encounterHistory.length > 0) {
    lines.push('\nRecent Session Dates:');
    const dates = ctx.encounterHistory.map(e => `${e.encounter_date} (${e.encounter_type}, ${e.duration_minutes ?? '?'}min)`);
    for (const d of dates) {
      lines.push(`  - ${d}`);
    }
  } else {
    lines.push('\nSession History: First session (no prior encounters)');
  }

  if (ctx.upcomingAppointments.length > 0) {
    lines.push('\nUpcoming Appointments:');
    for (const a of ctx.upcomingAppointments) {
      lines.push(`  - ${a.start_time} (${a.appointment_type ?? 'appointment'})`);
    }
  }

  const result = lines.join('\n');
  const authAlert = ctx.insurance.some(ins => {
    const remaining = (ins.authorized_sessions ?? 0) - (ins.sessions_used ?? 0);
    return remaining > 0 && remaining <= 4;
  });
  console.log(`[context] Formatted prompt context: ${result.length} chars (~${Math.round(result.length / 4)} tokens), auth alert: ${authAlert ? 'yes' : 'no'}`);

  return result;
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
