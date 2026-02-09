import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getPatientContext } from '@/services/patient.service';

export function createGetPatientContextTool(client: SupabaseClient<Database>, orgId: string) {
  return tool({
    description: 'Load full patient context including demographics, diagnoses, medications, recent note signals (plan sections, risk assessments), full treatment plan with goals/objectives/interventions, insurance authorization status, and encounter history. Call this after identifying a patient.',
    inputSchema: z.object({
      patient_id: z.string().describe('The patient UUID returned by find_patient'),
    }),
    execute: async ({ patient_id }) => {
      const ctx = await getPatientContext(client, orgId, patient_id);
      const p = ctx.patient;

      const result = {
        patient: {
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          dob: p.dob,
          gender: p.gender,
          status: p.status,
        },
        diagnoses: ctx.diagnoses.map((d) => ({
          code: d.icd10_code,
          description: d.description,
          is_primary: d.is_primary,
          status: d.status,
          onset_date: d.onset_date,
        })),
        medications: ctx.medications.map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
        })),
        recent_notes: ctx.recentNotes.map((n, i) => {
          const content = n.content as Record<string, string> | null;
          const riskAssessment = n.risk_assessment as Record<string, unknown> | null;

          return {
            id: n.id,
            date: n.created_at?.split('T')[0],
            type: n.note_type,
            plan_section: content?.plan ?? null,
            clinical_observations: i === 0 ? (content?.data ?? content?.subjective ?? null) : undefined,
            objective_section: i === 0 ? (content?.objective ?? null) : undefined,
            assessment_section: i === 0 ? (content?.assessment ?? null) : undefined,
            risk_assessment: riskAssessment ?? null,
          };
        }),
        treatment_plan: ctx.treatmentPlan ? {
          goals: ctx.treatmentPlan.goals,
          objectives: ctx.treatmentPlan.objectives,
          interventions: ctx.treatmentPlan.interventions,
          diagnosis_codes: ctx.treatmentPlan.diagnosis_codes,
          review_date: ctx.treatmentPlan.review_date,
          status: ctx.treatmentPlan.status,
        } : null,
        insurance: ctx.insurance.map((ins) => {
          const payer = (ins.insurance_payers as { name: string } | null)?.name ?? 'Unknown payer';
          const authorized = ins.authorized_sessions ?? 0;
          const used = ins.sessions_used ?? 0;
          return {
            payer_name: payer,
            priority: ins.priority,
            authorized_sessions: authorized,
            sessions_used: used,
            remaining_sessions: authorized - used,
            copay_amount: ins.copay_amount,
            effective_date: ins.effective_date,
            termination_date: ins.termination_date,
          };
        }),
        encounter_history: ctx.encounterHistory.map((e) => ({
          date: e.encounter_date,
          type: e.encounter_type,
          duration_minutes: e.duration_minutes,
        })),
        upcoming_appointments: ctx.upcomingAppointments.map((a) => ({
          date: a.start_time,
          type: a.appointment_type,
        })),
      };

      console.log(`[tool:get_patient_context] Returning: ${result.diagnoses.length} diagnoses, ${result.recent_notes.length} notes (with plan sections), ${result.treatment_plan ? 'full treatment plan' : 'no treatment plan'}, ${result.insurance.length} insurance record(s), ${result.encounter_history.length} encounter dates`);

      return result;
    },
  });
}
