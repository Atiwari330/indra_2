import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { suggestCptCode } from '@/services/billing.service';

export function createSuggestBillingCodesTool(
  client: SupabaseClient<Database>,
  orgId: string
) {
  return tool({
    description: 'Suggest CPT and ICD-10 billing codes based on encounter details and active diagnoses. Used to propose a billing claim draft.',
    inputSchema: z.object({
      encounter_id: z.string().describe('Encounter UUID'),
      patient_id: z.string().describe('Patient UUID'),
      encounter_type: z.string().describe('Type of encounter (e.g., individual_therapy)'),
      duration_minutes: z.number().describe('Session duration in minutes'),
      active_diagnoses: z.array(z.object({
        code: z.string(),
        description: z.string(),
        is_primary: z.boolean(),
      })).describe('Active diagnoses for the patient'),
      date_of_service: z.string().describe('Date of service YYYY-MM-DD'),
    }),
    execute: async ({ encounter_id, patient_id, encounter_type, duration_minutes, active_diagnoses, date_of_service }) => {
      const cptSuggestion = suggestCptCode(encounter_type, duration_minutes);

      // Get patient insurance
      const { data: insurance } = await client
        .from('patient_insurance')
        .select('id, payer_id, member_id, copay_amount')
        .eq('org_id', orgId)
        .eq('patient_id', patient_id)
        .eq('priority', 'primary')
        .maybeSingle();

      // Build diagnosis pointers (primary first)
      const sortedDx = [...active_diagnoses].sort((a, b) =>
        a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1
      );

      const diagnoses = sortedDx.map((dx, i) => ({
        sequence_number: i + 1,
        icd10_code: dx.code,
        description: dx.description,
      }));

      const lineItems = [{
        line_number: 1,
        cpt_code: cptSuggestion.code,
        cpt_description: cptSuggestion.description,
        diagnosis_pointers: diagnoses.map((_, i) => i + 1),
        units: 1,
        charge_amount: getBaseRate(cptSuggestion.code),
        service_date: date_of_service,
      }];

      return {
        suggested_claim: {
          encounter_id,
          patient_id,
          date_of_service,
          patient_insurance_id: insurance?.id,
          diagnoses,
          line_items: lineItems,
          copay: insurance?.copay_amount,
        },
        message: `Suggested ${cptSuggestion.code} (${cptSuggestion.description}) with ${diagnoses.length} diagnosis code(s).`,
        _proposed_action: {
          action_type: 'suggest_billing',
          target_table: 'claims',
          payload: {
            encounter_id,
            patient_id,
            date_of_service,
            patient_insurance_id: insurance?.id,
            place_of_service: '11',
            diagnoses,
            line_items: lineItems,
          },
        },
      };
    },
  });
}

function getBaseRate(cptCode: string): number {
  const rates: Record<string, number> = {
    '90791': 250.00,
    '90792': 300.00,
    '90832': 100.00,
    '90834': 150.00,
    '90837': 200.00,
    '90846': 175.00,
    '90847': 175.00,
    '90853': 75.00,
    '90839': 250.00,
    '90840': 125.00,
    '99213': 120.00,
    '99214': 175.00,
  };
  return rates[cptCode] ?? 150.00;
}
