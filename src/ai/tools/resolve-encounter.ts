import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { resolveEncounter } from '@/services/encounter.service';

export function createResolveEncounterTool(
  client: SupabaseClient<Database>,
  orgId: string,
  providerId: string
) {
  return tool({
    description: 'Find an existing encounter for a patient on a given date, or flag that one needs to be created. Call this before creating notes or billing.',
    inputSchema: z.object({
      patient_id: z.string().describe('Patient UUID'),
      date: z.string().describe('Encounter date in YYYY-MM-DD format. Use today if the session just happened.'),
      encounter_type: z.enum([
        'individual_therapy', 'group_therapy', 'family_therapy',
        'intake', 'crisis', 'telehealth', 'medication_management',
      ]).default('individual_therapy').describe('Type of encounter'),
    }),
    execute: async ({ patient_id, date, encounter_type }) => {
      const result = await resolveEncounter(
        client, orgId, patient_id, providerId, date, encounter_type
      );

      return {
        encounter_id: result.encounter.id,
        created: result.created,
        encounter_date: result.encounter.encounter_date,
        encounter_type: result.encounter.encounter_type,
        status: result.encounter.status,
      };
    },
  });
}
