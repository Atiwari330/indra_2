import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { searchPatients } from '@/services/patient.service';

export function createFindPatientTool(client: SupabaseClient<Database>, orgId: string) {
  return tool({
    description: 'Search for a patient by name. Always call this first to identify the patient before any other actions.',
    inputSchema: z.object({
      query: z.string().describe('Patient name or partial name to search for'),
    }),
    execute: async ({ query }) => {
      const results = await searchPatients(client, orgId, query, 5);

      if (results.length === 0) {
        return { found: false, message: `No patients found matching "${query}"`, patients: [] };
      }

      if (results.length === 1) {
        return {
          found: true,
          patient_id: results[0].id,
          patient_name: `${results[0].first_name} ${results[0].last_name}`,
          patients: results.map((p) => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            dob: p.dob,
          })),
        };
      }

      return {
        found: true,
        ambiguous: true,
        message: `Multiple patients found matching "${query}". Please clarify.`,
        patients: results.map((p) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          dob: p.dob,
        })),
      };
    },
  });
}
