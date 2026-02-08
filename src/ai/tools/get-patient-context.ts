import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getPatientContext } from '@/services/patient.service';

export function createGetPatientContextTool(client: SupabaseClient<Database>, orgId: string) {
  return tool({
    description: 'Load full patient context including demographics, diagnoses, medications, recent notes, treatment plan, and upcoming appointments. Call this after identifying a patient.',
    inputSchema: z.object({
      patient_id: z.string().describe('The patient UUID returned by find_patient'),
    }),
    execute: async ({ patient_id }) => {
      const ctx = await getPatientContext(client, orgId, patient_id);
      const p = ctx.patient;

      return {
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
        })),
        medications: ctx.medications.map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
        })),
        recent_notes: ctx.recentNotes.map((n) => ({
          id: n.id,
          date: n.created_at?.split('T')[0],
          type: n.note_type,
          content_summary: summarizeContent(n.content as Record<string, string>),
        })),
        treatment_plan: ctx.treatmentPlan ? {
          goals: ctx.treatmentPlan.goals,
          status: ctx.treatmentPlan.status,
        } : null,
        upcoming_appointments: ctx.upcomingAppointments.map((a) => ({
          date: a.start_time,
          type: a.appointment_type,
        })),
      };
    },
  });
}

function summarizeContent(content: Record<string, string>): string {
  const assessment = content.assessment || '';
  const data = content.data || content.subjective || '';
  const summary = assessment || data;
  return summary.length > 150 ? summary.slice(0, 150) + '...' : summary;
}
